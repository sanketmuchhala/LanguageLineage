/**
 * Hand-written totals must match the dataset.
 *
 * Node and relationship counts are typed into prose, meta tags, stat tiles and
 * the social image. They go stale silently every time the dataset grows, and a
 * wrong number on the landing page undermines the one thing this site sells:
 * that its numbers are checkable.
 *
 * When this fails, update the file it names. If the copy was reworded so a
 * pattern no longer matches, update the pattern here in the same PR.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

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
  // Landing page stat tiles
  { file: 'src/ui/LandingPage.tsx', pattern: /<span className="stat-number">(\d+)<\/span>\s*<span className="stat-label">Languages/, expect: 'nodes', label: 'stat tile: languages & tools' },
  { file: 'src/ui/LandingPage.tsx', pattern: /<span className="stat-number">(\d+)<\/span>\s*<span className="stat-label">Relationships/, expect: 'relationships', label: 'stat tile: relationships' },
  // Landing page prose
  { file: 'src/ui/LandingPage.tsx', pattern: /family tree of (\d+) languages and toolchains/, expect: 'nodes', label: 'hero copy' },
  { file: 'src/ui/LandingPage.tsx', pattern: /family tree of \d+ languages and toolchains and\s+(\d+) sourced/, expect: 'relationships', label: 'hero copy' },
  { file: 'src/ui/LandingPage.tsx', pattern: /(\d+) languages and toolchains, \d+\s*\n?\s*evidence-backed/, expect: 'nodes', label: 'section copy' },
  { file: 'src/ui/LandingPage.tsx', pattern: /between (\d+) programming languages and toolchains/, expect: 'nodes', label: 'closing copy' },
  { file: 'src/ui/LandingGraphGlimpse.tsx', pattern: /(\d+) nodes\. \d+ sourced edges\./, expect: 'nodes', label: 'graph glimpse caption' },
  { file: 'src/ui/LandingGraphGlimpse.tsx', pattern: /\d+ nodes\. (\d+) sourced edges\./, expect: 'relationships', label: 'graph glimpse caption' },
  // SPA meta descriptions
  { file: 'src/app/App.tsx', pattern: /Interactive graph of (\d+) languages and \d+ relationships/, expect: 'nodes', label: 'home meta description' },
  { file: 'src/app/App.tsx', pattern: /Interactive graph of \d+ languages and (\d+) relationships/, expect: 'relationships', label: 'home meta description' },
  { file: 'src/app/App.tsx', pattern: /relationships between (\d+) languages/, expect: 'nodes', label: 'explore meta description' },
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
