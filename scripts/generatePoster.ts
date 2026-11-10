/**
 * Writes the implementation family-tree poster from the dataset:
 *   public/posters/<slug>.svg      vector original
 *   public/posters/<slug>.png      full poster, 1600px wide
 *   public/og/posters-<slug>.png   1200x630 social preview (top of the poster)
 *
 * Run `npm run poster:generate` after a dataset change (like og:generate).
 * scripts/poster.test.ts fails when the committed SVG no longer matches the data.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';
import { buildPosterModel, buildPosterSvg, POSTER_SLUG, POSTER_WIDTH } from './posterData.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const model = buildPosterModel(data.languages, data.relationships);
const svg = buildPosterSvg(model, {
  datasetVersion: '5.0',
  url: `https://www.languagelineage.org/posters/${POSTER_SLUG}`,
  totalNodes: data.languages.length,
  totalEdges: data.relationships.length,
});

const fontFiles = [
  join(ROOT, 'scripts/assets/fonts/Fraunces-SemiBold.ttf'),
  join(ROOT, 'scripts/assets/fonts/JetBrainsMono-Regular.ttf'),
];
const render = (source: string, width: number) => new Resvg(source, {
  fitTo: { mode: 'width', value: width },
  font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'JetBrains Mono' },
}).render().asPng();

mkdirSync(join(ROOT, 'public/posters'), { recursive: true });
writeFileSync(join(ROOT, 'public/posters', `${POSTER_SLUG}.svg`), svg);
writeFileSync(join(ROOT, 'public/posters', `${POSTER_SLUG}.png`), render(svg, POSTER_WIDTH));

// Social card: the top 1600x840 of the poster (title plus the first row of cards), scaled to 1200x630.
const crop = svg.replace(/viewBox="0 0 (\d+) (\d+)" width="\d+" height="\d+"/, `viewBox="0 0 ${POSTER_WIDTH} 840" width="${POSTER_WIDTH}" height="840"`);
writeFileSync(join(ROOT, 'public/og', `posters-${POSTER_SLUG}.png`), render(crop, 1200));

console.log(`Poster: ${model.groups.length} groups + ${model.minor.length} other pairs, ${model.edgeCount} current edges`);
