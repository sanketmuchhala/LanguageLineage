# Route Inventory

Generated during the Compiler Systems Atlas redesign audit. Two rendering systems: a React SPA (interactive) and 153 pre-rendered static HTML pages (SEO), all served on Vercel with a rewrite fallback to `/index.html`.

## SPA routes (react-router-dom, `src/app/App.tsx`)

| Route | Component | Notes |
| --- | --- | --- |
| `/` | `LandingPage` (`src/ui/LandingPage.tsx`) | Homepage hero + marketing sections. Lazy. |
| `/explore` | `GraphExplorer` (`src/app/GraphExplorer.tsx`) | Cytoscape graph workspace. Lazy + Suspense loading state. |
| `/embed` | `EmbedGraph` (`src/app/EmbedGraph.tsx`) | Iframe-safe graph embed. |
| `*` | `NotFound` (`src/pages/NotFound.tsx`) | 404. |

States: Suspense loading fallback (`App.tsx`), graph loading state (`GraphExplorer.tsx`), empty/low-data graph states, error states.

## Static pre-rendered pages (`scripts/generateSeoPages.ts` to `public/{path}/index.html`)

Total: 153 `index.html` files. Linked CSS: `public/seo.css`. Shared `NAV_HTML` + `FOOTER_HTML` injected into every page.

| Template | Pattern | Count | Representative slugs |
| --- | --- | --- | --- |
| Keyword landing | `/{slug}` | 6 | `programming-language-graph`, `programming-language-family-tree`, `programming-language-evolution`, `what-are-programming-languages-written-in`, `programming-language-genealogy`, `compiler-runtime-bootstrap` |
| Languages index | `/languages` | 1 | |
| Language detail | `/languages/{slug}` | 98 | `python`, `javascript`, `rust`, `go`, `c`, `cxx`, `typescript` |
| Tools index | `/tools` | 1 | |
| Tool detail | `/tools/{slug}` | 14 | `v8`, `llvm`, `gcc`, `ghc`, `spidermonkey`, `roslyn` |
| Relationships index | `/relationships` | 1 | |
| Relationship type | `/relationships/{type-slug}` | 6 | `compiler-written-in`, `runtime-written-in`, `bootstrap-written-in`, `rewritten-in`, `influenced`, `transpiled-to` |
| Guides index | `/guides` | 1 | |
| Guide detail | `/guides/{slug}` | 10 | `what-is-compiler-bootstrapping`, `how-rust-is-bootstrapped`, `gcc-vs-llvm` |
| Questions index | `/questions` | 1 | |
| Question detail | `/questions/{slug}` | 13 | `what-is-python-written-in`, `what-is-javascript-written-in`, `what-is-compiler-bootstrapping` |
| Timeline | `/timeline` | 1 | |
| Dataset | `/dataset` | 1 | |
| Archive | `/archive` | 1 | content archive index |

## Generated non-HTML artifacts

`public/sitemap.xml` (156 URLs, `scripts/generateSitemap.ts`), `public/robots.txt`, `public/llms.txt` (`scripts/generateLlmsTxt.ts`), `public/og-image.{png,svg}`, `public/manifest.json`, `public/favicon.svg`, `public/humans.txt`.

## Redesign coverage requirement

Every template above plus the four SPA routes and all their states (loading, empty, error, mobile) must adopt the selected concept. The static templates are the highest-leverage surface: all 153 pages flow from one generator file.
