/**
 * Dataset totals shown in the app's own copy (landing page, SPA meta descriptions).
 * vite.config.ts and vitest.config.ts inject them as __DATASET_COUNTS__ at build time,
 * so the React source never states a number that can go stale when the dataset grows.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export interface DatasetCounts {
  nodes: number;
  languages: number;
  tools: number;
  relationships: number;
  /** First release years of the oldest and newest languages (lang: nodes). */
  earliestYear: number;
  latestYear: number;
}

export function datasetCounts(root: string): DatasetCounts {
  const data = JSON.parse(readFileSync(join(root, 'dataset/v5/lineage_v5.json'), 'utf8'));
  const nodes = data.languages as Array<{ id: string; first_release_year?: number | null }>;
  const ids = nodes.map((n) => n.id);
  const years = nodes.filter((n) => n.id.startsWith('lang:') && n.first_release_year).map((n) => n.first_release_year!);
  return {
    nodes: ids.length,
    languages: ids.filter((id) => id.startsWith('lang:')).length,
    tools: ids.filter((id) => id.startsWith('tool:')).length,
    relationships: (data.relationships as unknown[]).length,
    earliestYear: Math.min(...years),
    latestYear: Math.max(...years),
  };
}
