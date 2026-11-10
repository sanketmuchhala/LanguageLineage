/**
 * The CSV copies and data card are generated from dataset/v5/lineage_v5.json by
 * scripts/generateDatasetRelease.ts. They are what Kaggle, Hugging Face and
 * Zenodo users will download, so they must match the JSON exactly.
 *
 * When this fails after a dataset change, run `npm run seo:generate`.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

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
});
