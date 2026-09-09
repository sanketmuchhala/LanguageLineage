/**
 * Stage 2.1 of IMPLEMENTATION_PLAN.md — the flagship story.
 *
 * Computes, does not transcribe: reverse PageRank and transitive descendant
 * counts over the `influenced` relationship, plus the C/C++ implementation
 * closure. Writes public/rankings/centrality.json, which
 * generateSeoPages.ts reads back in to render /rankings/most-influential —
 * one computation feeding both the page and the downloadable artifact, so
 * they cannot drift from each other.
 *
 * Run standalone: npm run rankings:compute
 * Runs automatically as the first step of: npm run seo:generate
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { reversePageRank, type Edge } from './centrality/pageRank.js';
import { transitiveDescendants } from './centrality/descendants.js';
import { implementationClosure } from './centrality/closures.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');
const OUTPUT_PATH = join(ROOT, 'public/rankings/centrality.json');

const DAMPING = 0.85;
const IMPLEMENTATION_TYPES = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);

interface Language {
  id: string;
  name: string;
}

interface Relationship {
  from_language: string;
  to_language: string;
  relationship: string;
}

interface Dataset {
  languages: Language[];
  relationships: Relationship[];
}

interface RankedEntry {
  id: string;
  name: string;
  pageRank: number;
  descendantCount: number;
  descendantPercent: number;
}

interface CentralityOutput {
  method: {
    algorithm: 'reverse-pagerank';
    damping: number;
    edgeType: 'influenced';
    nodeScope: 'lang: prefixed nodes only';
  };
  languageCount: number;
  influenceEdgeCount: number;
  ranking: RankedEntry[];
  implementationClosure: {
    roots: string[];
    rootNames: string[];
    memberCount: number;
    totalNodeCount: number;
    percent: number;
  };
}

function main() {
  const data: Dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8'));
  const nameOf = new Map(data.languages.map((l) => [l.id, l.name]));

  // Rankings scope to lang: nodes only. tool: nodes (compilers, runtimes)
  // don't participate in "influenced" edges in practice, but the filter is
  // explicit rather than assumed.
  const languageIds = data.languages.filter((l) => l.id.startsWith('lang:')).map((l) => l.id);
  const languageIdSet = new Set(languageIds);

  const influenceEdges: Edge[] = data.relationships
    .filter((r) => r.relationship === 'influenced')
    .filter((r) => languageIdSet.has(r.from_language) && languageIdSet.has(r.to_language))
    .map((r) => ({ from: r.from_language, to: r.to_language }));

  const pageRankScores = reversePageRank(influenceEdges, languageIds, DAMPING);
  const descendants = transitiveDescendants(influenceEdges, languageIds);

  const ranking: RankedEntry[] = languageIds
    .map((id) => {
      const descendantCount = descendants.get(id)?.size ?? 0;
      return {
        id,
        name: nameOf.get(id) ?? id,
        pageRank: pageRankScores.get(id) ?? 0,
        descendantCount,
        descendantPercent: (descendantCount / languageIds.length) * 100,
      };
    })
    .sort((a, b) => b.pageRank - a.pageRank);

  // C/C++ implementation closure: how much of the ENTIRE dataset (languages
  // and tools) traces an implementation chain back to either. Deliberately a
  // separate graph (implementation edges, not influence) and separate scope
  // (all 152 nodes, not just the 131 languages).
  const allNodeIds = data.languages.map((l) => l.id);
  const implementationEdges: Edge[] = data.relationships
    .filter((r) => IMPLEMENTATION_TYPES.has(r.relationship) && r.from_language !== r.to_language)
    .map((r) => ({ from: r.from_language, to: r.to_language }));

  const cId = data.languages.find((l) => l.name === 'C')?.id;
  const cxxId = data.languages.find((l) => l.name === 'C++')?.id;
  const roots = [cId, cxxId].filter((id): id is string => Boolean(id));
  const closureMembers = implementationClosure(implementationEdges, roots);

  const output: CentralityOutput = {
    method: {
      algorithm: 'reverse-pagerank',
      damping: DAMPING,
      edgeType: 'influenced',
      nodeScope: 'lang: prefixed nodes only',
    },
    languageCount: languageIds.length,
    influenceEdgeCount: influenceEdges.length,
    ranking,
    implementationClosure: {
      roots,
      rootNames: roots.map((id) => nameOf.get(id) ?? id),
      memberCount: closureMembers.size,
      totalNodeCount: allNodeIds.length,
      percent: (closureMembers.size / allNodeIds.length) * 100,
    },
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`Reverse PageRank over ${influenceEdges.length} influence edges, ${languageIds.length} languages, damping ${DAMPING}\n`);
  console.log('Rank  Language          PageRank  Descendants');
  for (const [i, entry] of ranking.slice(0, 15).entries()) {
    console.log(
      `${String(i + 1).padStart(4)}  ${entry.name.padEnd(16)} ${entry.pageRank.toFixed(4).padStart(7)}  ${entry.descendantCount} (${entry.descendantPercent.toFixed(0)}%)`
    );
  }
  console.log(
    `\nC/C++ implementation closure: ${closureMembers.size} of ${allNodeIds.length} nodes (${output.implementationClosure.percent.toFixed(0)}%)`
  );
  console.log(`\nWrote ${OUTPUT_PATH.replace(ROOT + '/', '')}`);
}

main();
