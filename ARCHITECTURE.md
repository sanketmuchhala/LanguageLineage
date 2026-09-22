# ARCHITECTURE.md

The code map, and the invariants that look like bugs but are not.

## The shape of the thing

One JSON file feeds two very different surfaces.

```
dataset/v5/lineage_v5.json
   |
   +--> scripts/  (build time)  --> public/**  static HTML, sitemap, llms.txt, OG images
   |
   +--> src/      (run time)    --> /explore   interactive Cytoscape graph
```

The static pages are what search engines and most visitors see. The React app is
the interactive graph at `/` and `/explore`. Both read the same dataset, so a
fact fixed once is fixed everywhere. Nothing about a language is written in HTML
by hand.

## Runtime: the React app

| Path | Role |
|---|---|
| `src/app/App.tsx` | Routes: `/`, `/explore`, `/embed`, 404. Also the SPA meta tags. |
| `src/app/GraphExplorer.tsx` | Loads, validates, normalizes and indexes the dataset, then mounts the graph and panels. |
| `src/data/loadDataset.ts` | Fetches `dataset/v5/lineage_v5.json` at runtime. |
| `src/data/validateDataset.ts` | Re-checks integrity in the browser: dangling endpoints, duplicate ids, missing fields, confidence below 0.8. |
| `src/data/normalizeDataset.ts` | Computes degree, resolves clusters and logo URLs. |
| `src/data/indexDataset.ts` | Incoming/outgoing edge maps used by lineage and path tracing. |
| `src/data/types.ts` | Runtime dataset types. `scripts/schema.ts` holds the Zod schemas. |
| `src/data/logoMap.ts`, `src/data/graphLogoAssets.ts` | Logo resolution. The second is generated; do not hand-edit. |
| `src/graph/` | Cytoscape: element building, stylesheet, layouts, selectors, tree view. |
| `src/store/useGraphStore.ts` | Zustand store: filters, selection, theme, trace mode. |
| `src/ui/` | Landing page, panels, drawer, legend, controls. |
| `src/seo/` | Head tags for the SPA routes. |

## Build time: the generators

24 scripts in `scripts/`. The ones that matter most:

| Script | npm script | Output |
|---|---|---|
| `generateSeoPages.ts` | `seo:generate` | Every static page in `public/`. The largest file in the repo. |
| `generateSitemap.ts` | (same) | `public/sitemap.xml`, canonical URLs only. |
| `generateLlmsTxt.ts` | (same) | `llms.txt`, `llms-full.txt`. |
| `generateRss.ts` | (same) | `public/rss.xml`. |
| `computeCentrality.ts` | `rankings:compute` | `public/rankings/centrality.json`. |
| `generateOgImages.ts` | `og:generate` | `public/og/*.png` social cards. |
| `renderGraphLogoAssets.ts` | `logos:graph` | `public/logos/graph/*.png` + the manifest. |
| `harvestWikimediaLogos.ts` | `logos:wikimedia` | Logo overrides + audit report. |
| `harvestWikipediaContent.ts` | `content:wikipedia` | `enrichment_v5.json`. |
| `validateSeo.ts` | `seo:validate` | Gate. Dataset integrity plus a full page audit. |
| `auditInternalLinks.ts` | `seo:links` | Gate. Broken links, crawl depth, orphans. |
| `checkEvidenceLinks.ts` | `check:evidence-links` | Network check of every citation. Read-only, never auto-fixes. |

`npm run build` is `seo:generate && tsc && vite build`, then a patch step for
the `/explore` page. So a build always regenerates the static site first: you
cannot ship app code against stale pages.

## Deployment

Vercel. `vercel.json` redirects the apex domain to `www`, rewrites `/explore`
and `/embed` to the SPA, and sets a one-hour browser cache with a one-year CDN
cache on `dataset/v*` files. `api/propose.ts` is a serverless function that files
a GitHub issue for corrections submitted from the site.

## Invariants

Things that are deliberate. Changing them needs a reason and approval.

- **Node size is degree-based.** Not fixed, not by age. Do not "fix" it.
- **The graph uses local PNG logos**, not the remote SVG URLs, because
  Cytoscape's canvas misrenders remote SVGs. `getGraphLogoUrl()` falls back to
  the canonical URL when a node has no rendered asset.
- **Edge direction is implementation-language first.** See `DATASET.md`.
- **The sitemap lists canonical URLs only.** If you make a page canonicalize
  elsewhere, remove it from `generateSitemap.ts` too.
- **Do not consolidate a `/languages/{slug}` and `/questions/what-is-{slug}-written-in`
  pair without checking `npm run gsc:analyze` first.** For roughly 85 slugs only
  one of the two ranks at all, and canonicalizing blindly removes the only
  indexed URL.
- **The design system is locked** (Section 1.6 of `SITE_IMPROVEMENT_PLAN.md`):
  semantic relationship colors, type scale, spacing. Changing it needs explicit
  approval.
- **Generated output is never hand-edited.** Fix the generator and rerun.
- **`prefers-reduced-motion` is respected**; test UI changes at 320, 390, 768
  and 1440px.

## Where the counts live

Node and relationship totals are written by hand in several places and go stale
silently. `scripts/siteCounts.test.ts` fails when they drift from the dataset:

`src/ui/LandingPage.tsx`, `src/ui/LandingGraphGlimpse.tsx`, `src/app/App.tsx`,
`index.html`, `README.md`, `dataset/index.html`, `dataset/README.md`,
`public/og-image.svg`.

`public/og-image.png` is rendered from `public/og-image.svg` and carries the
same numbers as pixels; re-render it when they change.
