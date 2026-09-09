/**
 * Stage 2.3 of IMPLEMENTATION_PLAN.md — the other half of the static
 * /explore page. See buildExplorePage() in generateSeoPages.ts for why this
 * exists: that script runs before `vite build`, so it cannot know the real,
 * content-hashed script/link tags Vite will emit for the app's entry bundle.
 * It writes a `<!--VITE_ENTRY_TAGS-->` placeholder instead.
 *
 * This script runs after `vite build` (see the `build` script in
 * package.json), when the real tags exist in dist/index.html. It splices
 * them into dist/explore/index.html, replacing the placeholder.
 *
 * Deliberately operates only on dist/ (gitignored build output), never on
 * public/ (the committed source) - the placeholder must stay in git, since
 * the real hashes are different on every build and there is nothing
 * meaningful to commit in their place.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PLACEHOLDER = '<!--VITE_ENTRY_TAGS-->';

function main() {
  const indexPath = join(DIST, 'index.html');
  const explorePath = join(DIST, 'explore', 'index.html');

  if (!existsSync(indexPath)) {
    throw new Error(`Missing ${indexPath} - this script must run after vite build.`);
  }
  if (!existsSync(explorePath)) {
    throw new Error(`Missing ${explorePath} - expected buildExplorePage() in generateSeoPages.ts to have written it before vite build ran.`);
  }

  const builtIndex = readFileSync(indexPath, 'utf8');

  // Vite's entry tags, in whatever order and quantity it emitted them for
  // this build: the module script, any modulepreload links for eagerly
  // needed chunks, and the stylesheet link. A first version of this pattern
  // matched any <link rel="stylesheet"> regardless of origin, which also
  // caught index.html's own hand-authored `/fonts/fonts.css` link -
  // duplicating it into the patched page. Vite always marks its own
  // generated tags with crossorigin (needed for cross-origin module/asset
  // loading); nothing hand-authored in this codebase does, so requiring it
  // is what actually narrows this to Vite's output rather than "everything
  // that looks like a stylesheet tag."
  const tagPattern = /<script type="module"[^>]*\bcrossorigin\b[^>]*><\/script>|<link rel="(?:modulepreload|stylesheet)"[^>]*\bcrossorigin\b[^>]*>/g;
  const entryTags = builtIndex.match(tagPattern);

  if (!entryTags || entryTags.length === 0) {
    throw new Error('Found no script/link tags in dist/index.html to extract - Vite\'s output shape may have changed.');
  }

  const explorePage = readFileSync(explorePath, 'utf8');
  if (!explorePage.includes(PLACEHOLDER)) {
    throw new Error(`dist/explore/index.html does not contain ${PLACEHOLDER} - already patched, or buildExplorePage() changed.`);
  }

  const patched = explorePage.replace(PLACEHOLDER, entryTags.join('\n    '));
  writeFileSync(explorePath, patched, 'utf8');

  // Self-verify rather than trust the replace succeeded silently: this is
  // the one script that runs after a real build, so it is the only place
  // that can catch "the patch produced a page with no way to boot the app"
  // before that ships. seo:validate cannot do this - it runs standalone,
  // without a preceding vite build, and must not depend on dist/ existing.
  if (patched.includes(PLACEHOLDER)) {
    throw new Error('Placeholder still present after patching - the replace did not take effect.');
  }
  if (!patched.includes('<script type="module"') || !patched.includes('id="root">')) {
    throw new Error('Patched dist/explore/index.html is missing an app entry script or #root - it would not boot.');
  }

  console.log(`Patched dist/explore/index.html with ${entryTags.length} entry tag(s) from dist/index.html`);
}

main();
