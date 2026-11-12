/**
 * Hand-written totals must match the dataset.
 *
 * Node and relationship counts are typed into prose, meta tags, stat tiles and
 * the social image. They go stale silently every time the dataset grows, and a
 * wrong number on the landing page undermines the one thing this site sells:
 * that its numbers are checkable.
 *
 * The React app (src/) has no entries here: it reads build-time totals (see the last
 * describe block). When this fails, update the file it names. If the copy was reworded so a
 * pattern no longer matches, update the pattern here in the same PR.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { datasetCounts } from './datasetCounts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataset = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const nodes = dataset.languages as Array<{ id: string }>;
const edges = dataset.relationships as unknown[];

const EXPECTED = {
  nodes: nodes.length,
  languages: nodes.filter((n) => n.id.startsWith('lang:')).length,
  tools: nodes.filter((n) => n.id.startsWith('tool:')).length,
  relationships: edges.length,
};

type Check = { file: string; pattern: RegExp; expect: keyof typeof EXPECTED; label: string };

const CHECKS: Check[] = [
  // Static shells
  { file: 'index.html', pattern: /Interactive graph of (\d+) languages and \d+ relationships/, expect: 'nodes', label: 'index.html meta' },
  { file: 'index.html', pattern: /Interactive graph of \d+ languages and (\d+) relationships/, expect: 'relationships', label: 'index.html meta' },
  // Social card source
  { file: 'public/og-image.svg', pattern: /fill="#4ade80">(\d+)<\/text><text[^>]*>languages/, expect: 'nodes', label: 'og-image stat' },
  { file: 'public/og-image.svg', pattern: /fill="#4ade80">(\d+)<\/text><text[^>]*>sourced relationships/, expect: 'relationships', label: 'og-image stat' },
  // Dataset page and citation
  { file: 'dataset/index.html', pattern: /Open dataset of (\d+) programming languages/, expect: 'nodes', label: 'dataset meta' },
  { file: 'dataset/index.html', pattern: /Open dataset of \d+ programming languages with (\d+)/, expect: 'relationships', label: 'dataset meta' },
  { file: 'dataset/index.html', pattern: /v5\.0\. (\d+) nodes and \d+ relationships/, expect: 'nodes', label: 'dataset citation' },
  { file: 'dataset/index.html', pattern: /v5\.0\. \d+ nodes and (\d+) relationships/, expect: 'relationships', label: 'dataset citation' },
  { file: 'dataset/README.md', pattern: /v5\.0\. (\d+) nodes and \d+ relationships/, expect: 'nodes', label: 'dataset README citation' },
  { file: 'dataset/README.md', pattern: /v5\.0\. \d+ nodes and (\d+) relationships/, expect: 'relationships', label: 'dataset README citation' },
  // Repository README
  { file: 'README.md', pattern: /across (\d+) nodes:/, expect: 'nodes', label: 'README summary' },
  { file: 'README.md', pattern: /across \d+ nodes: (\d+) programming languages/, expect: 'languages', label: 'README summary' },
  { file: 'README.md', pattern: /across \d+ nodes: \d+ programming languages and (\d+) compiler\/runtime tools/, expect: 'tools', label: 'README summary' },
  { file: 'README.md', pattern: /^- (\d+) nodes: \d+ languages \+ \d+ tools/m, expect: 'nodes', label: 'README dataset section' },
  { file: 'README.md', pattern: /^- \d+ nodes: (\d+) languages \+ \d+ tools/m, expect: 'languages', label: 'README dataset section' },
  { file: 'README.md', pattern: /^- \d+ nodes: \d+ languages \+ (\d+) tools/m, expect: 'tools', label: 'README dataset section' },
  { file: 'README.md', pattern: /^- (\d+) relationships, each with confidence/m, expect: 'relationships', label: 'README dataset section' },
];

describe('hand-written counts match the dataset', () => {
  it.each(CHECKS)('$file — $label ($expect)', ({ file, pattern, expect: key }) => {
    const source = readFileSync(join(ROOT, file), 'utf8');
    const match = source.match(pattern);
    expect(match, `pattern not found in ${file}: ${pattern}. Update the copy or this pattern.`).toBeTruthy();
    expect(Number(match![1]), `${file} states ${match![1]}, dataset has ${EXPECTED[key]}`).toBe(EXPECTED[key]);
  });
});

// The React app states no totals of its own: the landing page and SPA meta descriptions
// read __DATASET_COUNTS__, which vite.config.ts computes from the dataset at build time.
const APP_FILES = ['src/ui/LandingPage.tsx', 'src/ui/LandingGraphGlimpse.tsx', 'src/app/App.tsx'];

describe('app copy uses build-time dataset counts', () => {
  it('computes the injected totals from the dataset', () => {
    const years = (nodes as Array<{ id: string; first_release_year?: number | null }>)
      .filter((n) => n.id.startsWith('lang:') && n.first_release_year).map((n) => n.first_release_year!);
    const expected = { ...EXPECTED, earliestYear: Math.min(...years), latestYear: Math.max(...years) };
    expect(datasetCounts(ROOT)).toEqual(expected);
    expect(__DATASET_COUNTS__).toEqual(expected);
  });

  it.each(APP_FILES)('%s reads __DATASET_COUNTS__ instead of hand-written totals', (file) => {
    const source = readFileSync(join(ROOT, file), 'utf8');
    expect(source).toContain('__DATASET_COUNTS__');
    // Phrases that used to carry a typed number must not carry one again.
    for (const phrase of [/\b\d{3} (?:programming )?languages(?: and toolchains)?\b/, /\b\d{3} (?:sourced )?(?:relationships|edges)\b/, /\b\d{3} nodes\b/, /\bAll \d+ (?:languages|tools)\b/, /stat-number">\d+</]) {
      expect(source, `${file} has a hand-written total: ${phrase}`).not.toMatch(phrase);
    }
  });
});
