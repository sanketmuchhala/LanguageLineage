/**
 * The CSV copies and data card are generated from dataset/v5/lineage_v5.json by
 * scripts/generateDatasetRelease.ts. They are what Kaggle, Hugging Face and
 * Zenodo users will download, so they must match the JSON exactly.
 *
 * When this fails after a dataset change, run `npm run seo:generate`.
 */
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { sourceKind } from './sourceType';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'dataset/v5');
const data = JSON.parse(readFileSync(join(DIR, 'lineage_v5.json'), 'utf8'));

// Minimal RFC 4180 parser: quoted fields, doubled quotes, CRLF records.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r' && text[i + 1] === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function records(file: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(readFileSync(join(DIR, file), 'utf8'));
  return rows.map((r) => {
    expect(r.length).toBe(header.length);
    return Object.fromEntries(header.map((h, i) => [h, r[i]]));
  });
}

const str = (v: unknown) => (v === null || v === undefined ? '' : Array.isArray(v) ? v.join(';') : String(v));

describe('dataset release CSVs', () => {
  it('edges CSV has one row per relationship, in order, with identical values', () => {
    const rows = records('lineage_v5_edges.csv');
    expect(rows.length).toBe(data.relationships.length);
    data.relationships.forEach((e: Record<string, unknown>, i: number) => {
      const r = rows[i];
      expect(r.from_id).toBe(e.from_language);
      expect(r.to_id).toBe(e.to_language);
      expect(r.relationship).toBe(e.relationship);
      expect(r.start_year).toBe(str(e.start_year));
      expect(r.end_year).toBe(str(e.end_year));
      expect(r.confidence).toBe(str(e.confidence));
      expect(r.evidence_source).toBe(e.evidence_source);
      expect(r.source_type).toBe(sourceKind(String(e.evidence_source)));
      expect(r.notes).toBe(str(e.notes));
    });
  });

  it('nodes CSV has one row per node with identical values and no logo fields', () => {
    const rows = records('lineage_v5_nodes.csv');
    expect(rows.length).toBe(data.languages.length);
    expect(Object.keys(rows[0]).some((k) => k.startsWith('logo'))).toBe(false);
    data.languages.forEach((n: Record<string, unknown>, i: number) => {
      const r = rows[i];
      expect(r.id).toBe(n.id);
      expect(r.name).toBe(n.name);
      expect(r.kind).toBe(String(n.id).startsWith('tool:') ? 'tool' : 'language');
      expect(r.paradigm).toBe(str(n.paradigm));
      expect(r.notes).toBe(str(n.notes));
    });
  });

  it('data card states the current counts and license', () => {
    const card = readFileSync(join(DIR, 'DATACARD.md'), 'utf8');
    expect(card).toMatch(/^---\nlicense: cc-by-4.0\n/);
    expect(card).toContain(`| \`lineage_v5_edges.csv\` | ${data.relationships.length} |`);
    expect(card).toContain(`| \`lineage_v5_nodes.csv\` | ${data.languages.length} |`);
  });

  it('CITATION.cff exists and declares the dataset license', () => {
    const cff = join(ROOT, 'CITATION.cff');
    expect(existsSync(cff)).toBe(true);
    const text = readFileSync(cff, 'utf8');
    expect(text).toContain('cff-version: 1.2.0');
    expect(text).toContain('license: CC-BY-4.0');
    expect(text).not.toMatch(/doi:/i);
  });

  it('MANIFEST.json tracks exact counts and SHA-256 digests of all dataset and AI path files', () => {
    const manifestPath = join(DIR, 'MANIFEST.json');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.schema_version).toBe('1.0');
    expect(manifest.license).toBe('CC-BY-4.0');
    expect(manifest.counts.nodes.total).toBe(data.languages.length);
    expect(manifest.counts.relationships.total).toBe(data.relationships.length);
    expect(manifest.ai_paths.length).toBe(manifest.counts.ai_execution_paths.total);
    expect(manifest.ai_paths.length).toBeGreaterThanOrEqual(6);

    for (const entry of [...manifest.files, ...manifest.ai_paths]) {
      const buf = readFileSync(join(ROOT, entry.path));
      const actualSha = createHash('sha256').update(buf).digest('hex');
      expect(actualSha, `SHA-256 drift in ${entry.path} — run npm run seo:generate`).toBe(entry.sha256);
      expect(buf.byteLength, `Byte size drift in ${entry.path}`).toBe(entry.bytes);
    }
  });
});

describe('repository & multi-agent governance invariants', () => {
  const PINNED_HUMAN_ONLY_BLOCKS: Record<string, string[]> = {
    'AGENTS.md': ['0f27abdca64b082e37ddcb5ed74440e7433c9ce563736367e475049369a0f801'],
    'docs/DECISIONS.md': ['01ebadbdee3ec0facce427f43bf9d737799a016007e66464edcc9f606713a628'],
  };

  it('HUMAN-ONLY blocks in AGENTS.md and docs/DECISIONS.md are intact and unmodified', () => {
    for (const [relPath, expectedHashes] of Object.entries(PINNED_HUMAN_ONLY_BLOCKS)) {
      const text = readFileSync(join(ROOT, relPath), 'utf8');
      const blocks = text.match(/^<!-- HUMAN-ONLY:START -->\n[\s\S]*?\n<!-- HUMAN-ONLY:END -->$/gm) ?? [];
      const actualHashes = blocks.map((b) => createHash('sha256').update(b).digest('hex'));
      expect(
        actualHashes,
        `Protected HUMAN-ONLY block in ${relPath} was modified! Agents must never edit HUMAN-ONLY sections.`,
      ).toEqual(expectedHashes);
    }
  });

  it('required GitHub governance, contribution, changelog, and release files exist', () => {
    const requiredFiles = [
      'AGENTS.md',
      'CLAUDE.md',
      'CONTRIBUTING.md',
      'CHANGELOG.md',
      'CITATION.cff',
      '.github/CODEOWNERS',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/config.yml',
      '.github/ISSUE_TEMPLATE/dataset-correction.yml',
      '.github/ISSUE_TEMPLATE/new-node-or-edge.yml',
      '.github/ISSUE_TEMPLATE/ai-execution-path.yml',
      '.github/workflows/verify.yml',
      '.github/workflows/release.yml',
    ];
    for (const relPath of requiredFiles) {
      const fullPath = join(ROOT, relPath);
      expect(existsSync(fullPath), `Missing governance file: ${relPath}`).toBe(true);
      expect(readFileSync(fullPath, 'utf8').trim().length, `Empty governance file: ${relPath}`).toBeGreaterThan(50);
    }
  });
});
