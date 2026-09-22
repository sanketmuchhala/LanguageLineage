/**
 * Dataset integrity, enforced in CI.
 *
 * These are the invariants an agent is most likely to break while expanding the
 * dataset: schema drift, dangling edges, duplicate records, uncalibrated
 * confidence, and missing evidence. `src/data/validateDataset.ts` checks a
 * subset of this in the browser; this file is the build-time gate.
 *
 * See DATASET.md for what each rule means and why it exists.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { DatasetSchema, LanguageSchema, RelationshipSchema } from './schema';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8');
const dataset = JSON.parse(raw);
const nodes = dataset.languages as Array<Record<string, any>>;
const edges = dataset.relationships as Array<Record<string, any>>;
const ids = new Set(nodes.map((n) => n.id));
const edgeKey = (e: Record<string, any>) => `${e.from_language}|${e.to_language}|${e.relationship}`;

describe('dataset schema', () => {
  it('parses against the Zod schema', () => {
    expect(() => DatasetSchema.parse(dataset)).not.toThrow();
  });

  it('has every node valid individually', () => {
    const bad = nodes.filter((n) => !LanguageSchema.safeParse(n).success).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('has every relationship valid individually', () => {
    const bad = edges.filter((e) => !RelationshipSchema.safeParse(e).success).map(edgeKey);
    expect(bad).toEqual([]);
  });

  it('keeps the file formatted as 2-space JSON with a trailing newline', () => {
    expect(raw).toBe(`${JSON.stringify(dataset, null, 2)}\n`);
  });
});

describe('node records', () => {
  it('uses unique ids', () => {
    expect(nodes.length).toBe(ids.size);
  });

  it('uses the lang:/tool: id convention with lowercase slugs', () => {
    const bad = nodes.filter((n) => !/^(lang|tool):[a-z0-9_]+$/.test(n.id)).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('gives every node a name and a release year', () => {
    const bad = nodes.filter((n) => !n.name?.trim() || typeof n.first_release_year !== 'number').map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('connects every node to at least one relationship', () => {
    const connected = new Set(edges.flatMap((e) => [e.from_language, e.to_language]));
    const isolated = nodes.filter((n) => !connected.has(n.id)).map((n) => n.id);
    expect(isolated).toEqual([]);
  });
});

describe('relationship records', () => {
  it('resolves every endpoint to a real node', () => {
    const dangling = edges.filter((e) => !ids.has(e.from_language) || !ids.has(e.to_language)).map(edgeKey);
    expect(dangling).toEqual([]);
  });

  it('has no duplicate from/to/type triples', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const e of edges) {
      const k = edgeKey(e);
      if (seen.has(k)) dupes.push(k);
      seen.add(k);
    }
    expect(dupes).toEqual([]);
  });

  it('cites evidence on every relationship', () => {
    const bad = edges.filter((e) => !/^https?:\/\/\S+$/.test(e.evidence_source ?? '')).map(edgeKey);
    expect(bad).toEqual([]);
  });

  it('never cites this site or a generated page as evidence', () => {
    const bad = edges.filter((e) => /languagelineage\.org/.test(e.evidence_source ?? '')).map(edgeKey);
    expect(bad).toEqual([]);
  });

  it('keeps confidence inside the hand-scored range, never 1.0', () => {
    // A batch of 1.0 scores is the signature of machine-generated edges and
    // destroys the calibration of the hand-scored corpus. See DATASET.md.
    const bad = edges.filter((e) => !(e.confidence > 0 && e.confidence <= 0.99)).map((e) => `${edgeKey(e)} @ ${e.confidence}`);
    expect(bad).toEqual([]);
  });

  it('orders year ranges correctly', () => {
    const bad = edges
      .filter((e) => typeof e.start_year === 'number' && typeof e.end_year === 'number' && e.end_year < e.start_year)
      .map(edgeKey);
    expect(bad).toEqual([]);
  });

  it('allows self-loops only where self-hosting makes sense', () => {
    const selfLoopTypes = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in', 'rewritten_in']);
    const bad = edges
      .filter((e) => e.from_language === e.to_language && !selfLoopTypes.has(e.relationship))
      .map(edgeKey);
    expect(bad).toEqual([]);
  });
});

describe('graph shape', () => {
  it('stays a single connected component', () => {
    const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
    for (const e of edges) {
      adjacency.get(e.from_language)!.push(e.to_language);
      adjacency.get(e.to_language)!.push(e.from_language);
    }
    const seen = new Set<string>([nodes[0].id]);
    const queue = [nodes[0].id];
    while (queue.length > 0) {
      for (const next of adjacency.get(queue.pop()!)!) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(nodes.filter((n) => !seen.has(n.id)).map((n) => n.id)).toEqual([]);
  });
});
