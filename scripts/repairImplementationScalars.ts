/**
 * One-shot repair for Stage 1 item 6 of IMPLEMENTATION_PLAN.md.
 *
 * 47 language nodes in dataset/v5/lineage_v5.json have
 * current_primary_implementation_language: "unspecified". This is a display
 * bug, not a data gap: 43 of the 47 already have a real compiler_written_in /
 * runtime_written_in / bootstrap_written_in edge in the same file that names
 * their implementer. This script back-fills the scalar from that edge.
 *
 * The 4 nodes with no qualifying edge (Machine Code, Assembly, BCPL, Lazy ML)
 * are left untouched — they genuinely have no cited implementation source.
 *
 * Tie-break for a node with more than one qualifying edge (only lang:s, of
 * the current 47) mirrors src/graph/tree/buildHierarchy.ts's primary-parent
 * rule, so the two places in the codebase that answer "who's the primary
 * implementer" agree: highest confidence, then still-active (no end_year),
 * then most recent start_year, then alphabetical by parent id.
 *
 * Run once: npx tsx scripts/repairImplementationScalars.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');

const IMPL_TYPES = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);

interface Language {
  id: string;
  name: string;
  current_primary_implementation_language: string;
}

interface Relationship {
  from_language: string;
  to_language: string;
  relationship: string;
  confidence: number;
  start_year: number | null;
  end_year: number | null;
}

interface Dataset {
  languages: Language[];
  relationships: Relationship[];
}

function pickPrimary(candidates: Relationship[]): Relationship {
  return [...candidates].sort((a, b) => {
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    const aActive = a.end_year === null ? 1 : 0;
    const bActive = b.end_year === null ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    const aStart = a.start_year ?? -Infinity;
    const bStart = b.start_year ?? -Infinity;
    if (aStart !== bStart) return bStart - aStart;
    return a.from_language.localeCompare(b.from_language);
  })[0];
}

function main() {
  const raw = readFileSync(DATASET_PATH, 'utf8');
  const data: Dataset = JSON.parse(raw);
  const languageMap = new Map(data.languages.map((l) => [l.id, l]));

  const candidatesByChild = new Map<string, Relationship[]>();
  for (const rel of data.relationships) {
    if (!IMPL_TYPES.has(rel.relationship)) continue;
    if (rel.from_language === rel.to_language) continue; // self-hosting, not an implementer
    const list = candidatesByChild.get(rel.to_language) ?? [];
    list.push(rel);
    candidatesByChild.set(rel.to_language, list);
  }

  const changed: Array<{ id: string; from: string; to: string; via: string }> = [];
  const skippedNoEdge: string[] = [];

  for (const lang of data.languages) {
    if (lang.current_primary_implementation_language !== 'unspecified') continue;

    const candidates = candidatesByChild.get(lang.id);
    if (!candidates || candidates.length === 0) {
      skippedNoEdge.push(lang.id);
      continue;
    }

    const winner = candidates.length === 1 ? candidates[0] : pickPrimary(candidates);
    const parent = languageMap.get(winner.from_language);
    if (!parent) {
      // Should not happen: every edge in v5 resolves to a known node. Skip
      // rather than write a bad value if it ever does.
      skippedNoEdge.push(lang.id);
      continue;
    }

    changed.push({ id: lang.id, from: lang.current_primary_implementation_language, to: parent.name, via: winner.relationship });
    lang.current_primary_implementation_language = parent.name;
  }

  writeFileSync(DATASET_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Repaired ${changed.length} node(s):\n`);
  for (const c of changed) {
    console.log(`  ${c.id.padEnd(28)} unspecified -> ${c.to}  (via ${c.via})`);
  }
  console.log(`\nSkipped ${skippedNoEdge.length} node(s) with no qualifying edge (expected: 4):`);
  for (const id of skippedNoEdge) console.log(`  ${id}`);
}

main();
