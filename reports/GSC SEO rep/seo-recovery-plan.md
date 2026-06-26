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

## Phase 4: Crawl And Mobile Rendering Verification

Goal: make sure generated HTML is complete and fast before hydration.

Tasks:
- Confirm static HTML contains primary content, canonical tags, JSON-LD, and H1 before JS.
- Verify mobile viewport content and metadata with Playwright.
- Confirm sitemap uses only `https://www.languagelineage.org`.
- Check deployment-level redirects for non-www to www.

## Phase 5: Measurement Loop

Goal: turn GSC data into weekly iteration.

Tasks:
- Track CTR and average position for the top 20 query/page pairs.
- Compare `www` vs non-`www` page impressions after redirects/canonicals settle.
- Expand pages that reach positions 5-15 but remain below expected CTR.
- Add new question pages only when GSC shows repeated query demand.
