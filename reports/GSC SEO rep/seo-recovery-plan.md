# SEO Recovery Plan

Source files:
- `reports/GSC SEO rep/gemini-report.md`
- `reports/GSC SEO rep/languagelineage.org-Performance-on-Search-2026-06-25/*.csv`

## GSC Baseline

- Top issue: page-one / near-page-one impressions with almost no clicks.
- Highest-impact queries:
  - `what is rust written in`: 108 impressions, 0 clicks, avg position 9.49
  - `what language is javascript written in`: 79 impressions, 0 clicks, avg position 9.75
  - `what is go written in`: 39 impressions, 0 clicks, avg position 8.69
  - `what language is java written in`: 31 impressions, 0 clicks, avg position 10.26
- Highest-impact pages:
  - `/languages/rust`: 898 impressions, 2 clicks
  - `/languages/javascript`: 467 impressions, 1 click
  - `/languages/go`: 283 impressions, 1 click
  - `/questions/what-is-rust-written-in`: 88 impressions, 0 clicks, avg position 10.1
- Device problem: mobile has 529 impressions and 0 clicks.

## Phase 1: Snippet And Canonical Triage

Goal: force SERP snippets to use the primary answer/content, not shared footer or global question-link modules.

Tasks:
- Add `data-nosnippet` to global footer link blocks.
- Add `data-nosnippet` to supplemental Discover More and related-link blocks.
- Keep related sections semantic with `aside` where possible.
- Fix question-page meta descriptions so they do not truncate mid-word.
- Normalize remaining SPA shell canonical/OG URLs to the `www` host.

Status: complete.

Implemented:
- Global generated footer blocks are wrapped with `data-nosnippet`.
- Generated related and Discover More blocks use `data-nosnippet`; node related links now render as semantic `aside` sections.
- Question-page meta descriptions now truncate on sentence or word boundaries instead of cutting mid-word.
- SPA shell OG, SearchAction, Dataset JSON-LD, robots sitemap, humans.txt, and generated static pages now use `https://www.languagelineage.org`.
- SEO validation now fails if `sitemap.xml` contains non-`www` URLs or if `robots.txt` points at the wrong sitemap host.

## Phase 2: Structured Data Hardening

Goal: improve eligibility for rich results and clarify page type.

Tasks:
- Audit generated FAQPage JSON-LD against visible FAQ content.
- Add or refine TechArticle schema for guides.
- Add SoftwareApplication / SoftwareSourceCode details where they are accurate and visible.
- Validate generated static pages with `npm run seo:validate`.

Status: complete for the first hardening pass.

Implemented:
- Existing language/tool pages continue to emit `TechArticle` and `SoftwareApplication` JSON-LD.
- Guide pages now emit `TechArticle` JSON-LD instead of generic `Article`.
- Guide pages now emit `BreadcrumbList` JSON-LD matching the visible breadcrumb.
- `npm run seo:validate` passes with 0 errors and 0 warnings.

## Phase 3: Priority Content Expansion

Goal: beat thin snippets and competitor pages for the highest-impression informational queries.

Priority pages:
- `/questions/what-is-rust-written-in`
- `/questions/what-is-javascript-written-in`
- `/questions/what-is-go-written-in`
- `/questions/what-is-java-written-in`
- `/questions/what-is-python-written-in`
- `/languages/rust`
- `/languages/javascript`
- `/languages/go`
- `/languages/java`
- `/languages/python`

Content requirements:
- State the direct answer in the first 1-2 sentences.
- Distinguish language specification from implementation/runtime.
- Explain compiler, runtime, bootstrap, and self-hosting terms when relevant.
- Link only to contextually relevant language/tool pages.

Status: complete.

Implemented:
- Added reusable priority answer overrides for Python, JavaScript, Rust, Go, and Java language pages.
- Added Quick Facts sections to those five language pages and their matching question pages.
- Expanded `/questions/what-is-python-written-in` with CPython vs language-spec nuance and an implementation-layer table.
- Expanded `/questions/what-is-javascript-written-in` with ECMAScript vs engine nuance and a V8/SpiderMonkey/JavaScriptCore table.
- Expanded `/questions/what-is-rust-written-in` with rustc, OCaml history, LLVM backend, and bootstrap-chain details.
- Expanded `/questions/what-is-go-written-in` with Go 1.5 self-hosting history and compiler/runtime layers.
- Expanded `/questions/what-is-java-written-in` with javac, HotSpot JVM, standard library, and bytecode layers.
- Corrected priority FAQ JSON-LD answers so JavaScript no longer reduces the modern answer to the historical C SpiderMonkey edge.

Validation:
- `npm run seo:validate` passes with 0 errors and 0 warnings.
- `npm run type-check` passes.
- `npm run build` passes; the only warning is the existing Cytoscape chunk-size warning.

## Phase 4: Crawl And Mobile Rendering Verification

Goal: make sure generated HTML is complete and fast before hydration.

Tasks:
- Confirm static HTML contains primary content, canonical tags, JSON-LD, and H1 before JS.
- Verify mobile viewport content and metadata with Playwright.
- Confirm sitemap uses only `https://www.languagelineage.org`.
- Check deployment-level redirects for non-www to www.

Status: complete for the first crawl/mobile verification pass.

Implemented:
- Fixed the landing-page mobile navbar so `Enter Graph` stays in the top-right row instead of wrapping below the nav links.
- Increased mobile hero top spacing so fixed navigation does not overlap the hero copy.
- Changed the tablet/mobile hero grid track to `minmax(0, 1fr)` so content can shrink cleanly on narrow screens.
- Tightened the small-phone hero padding and text constraints to prevent right-edge clipping at 320px.

Validation:
- Playwright mobile landing checks pass at 320px, 390px, and 768px: no horizontal overflow, `Enter Graph` is in the top navbar row, and hero title/subtitle fit within the viewport.
- Playwright no-JS mobile check on `/languages/rust/` confirms H1, canonical, primary text, and 3 JSON-LD blocks are present in static HTML before hydration.
- `npm run seo:validate` passes with 0 errors and 0 warnings.
- `npm run type-check` passes.
- `npm run build` passes; the only warning is the existing Cytoscape chunk-size warning.
- Live `https://languagelineage.org/` redirects once to `https://www.languagelineage.org/`.
- Live `https://www.languagelineage.org/` and `/sitemap.xml` return 200.

## Phase 5: Measurement Loop

Goal: turn GSC data into weekly iteration.

Tasks:
- Track CTR and average position for the top 20 query/page pairs.
- Compare `www` vs non-`www` page impressions after redirects/canonicals settle.
- Expand pages that reach positions 5-15 but remain below expected CTR.
- Add new question pages only when GSC shows repeated query demand.
