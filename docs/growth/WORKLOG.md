# Growth worklog

Chronological. Only executed work is marked done. Plan: [GROWTH_EXECUTION_PLAN.md](GROWTH_EXECUTION_PLAN.md).

## 2026-11-10 — audit, plan, WP-01, WP-02

**Branch:** `growth/research-execution`, created from `main` at `fcee7fc1` (in sync with `origin/main`, 0 ahead / 0 behind). Pre-existing untracked files left untouched: `GSC data/`, `research/CLAUDE_GROWTH_EXECUTION.md`, `research/deep-research-report.md`.

### Audit
- Read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/TESTING.md`, `MASTER_STATUS.md`, `GROWTH_MASTERPLAN.md`, `DISTRIBUTION.md`, the generator, `index.html`, `vercel.json`, `public/robots.txt`, and the GSC CSVs.
- `npm run gsc:analyze -- --dir "GSC data/languagelineage"` ran against the export (output summarized in the plan, §2.1).
- Live checks: `/` HTML had an empty `<div id="root">`; unknown path returns 404; `/languages/rust` returns 200 to OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot and Googlebot user agents; `llms.txt` returns 200.
- Live sitemap (324 URLs) equals the local generated sitemap.

### Baseline gate (before any change)
`npm run verify` → exit 0. Tests: 9 files, 115 passed. `seo:validate`: 0 errors, 0 warnings. `seo:links`: 0 broken, 0 over-depth, 0 orphans. Build OK (expected Cytoscape chunk warning). Regeneration produced no diff.

### WP-01 Crawlable homepage fallback — done
- **Behavior:** `/` now ships a static summary inside `#root`: H1, what the site is, five dated implementation facts (Rust, Go, Zig, Python, Java, each matching dataset edges and existing page copy), the relationship kinds, and links to the main sections. An inline script adds `js` to `<html>` and a CSS rule hides the fallback, so JS users see the unchanged React page (React also replaces `#root` on mount). No canonical was added: `scripts/validateSeo.ts` documents that react-helmet-async owns it per route, and `index.html` also serves `/explore` and `/embed`.
- **Growth mechanism:** the best-converting page becomes readable to crawlers and AI retrieval systems that do not run JavaScript, and links the exploratory guides from the homepage HTML.
- **Files:** `index.html`, `scripts/growthPages.test.ts`.
- **Checks:** headless Chromium against `vite preview` of the built `dist/` at 390px: JS on → H1 from React, fallback hidden, one canonical (`https://www.languagelineage.org/`), no page errors, no horizontal scroll. JS off → fallback visible, H1 present, no horizontal scroll.

### WP-02 Family-tree guide tables — done
- **Behavior:** `/guides/programming-language-family-tree` gains (1) a relationship-kinds table: each of the six edge types, a one-line meaning, its count, and a link to its list, plus a sentence stating that "runs on" and compilation targets are not modeled as edges; (2) a new section "Compilers that learned to compile themselves" with a table generated from the dataset: Rust, Go, Kotlin, Swift and Zig, with earlier compiler languages and year ranges, self-hosting year, components still used, and numbered evidence links; (3) a concrete example in the opening answer box linking to that section. The figure caption's hard-coded "all 252" influence edges was stale (dataset has 263) and is now computed.
- **Growth mechanism:** the page that already converts best for exploratory intent now carries the site's differentiator (dated, sourced implementation history) in indexable HTML, which a results-page answer cannot replicate.
- **Files:** `scripts/generateSeoPages.ts` (`RELATIONSHIP_KIND_ROWS`, `buildRelationshipKindsTable`, `findSelfHostingTransitions`, `buildSelfHostingTable`, guide placeholders), regenerated `public/guides/programming-language-family-tree/index.html`, `public/sitemap.xml` and `scripts/page-dates.json` (lastmod for that page only), `public/rss.xml` (page entry), `scripts/growthPages.test.ts`.
- **Checks:** headless Chromium at 320px and 1440px: 6 relationship rows, 5 transition rows, no horizontal scroll, no page errors; visual check of the table at 1280px.

### Gate after changes
`npm run verify` → exit 0. Tests: 10 files, 124 passed (115 existing + 9 new). `seo:validate`: 0 errors, 0 warnings. `seo:links`: 0 broken, 0 over-depth, 0 orphans. Build OK. Sitemap: 324 URLs, none lost against live.

### Found, not changed (needs owner)
- Possible data error: `lang:c → lang:rust` `compiler_written_in` 2006–2010 cites `https://github.com/iohub/rustboot`; rustboot is generally described as written in OCaml. Not edited (AGENTS.md rule 3). Now visible in the new table, so review before launch (WP-03).
- Swift appears as "compiles itself since 2019" with C++ and LLVM still used; correct per data, but worth a sentence of context or a data review (WP-03).
- `GROWTH_MASTERPLAN.md` §0 is stale (claims the checkout is behind and LICENSE is missing). Not edited; consider marking it superseded by this plan.
- Four root landing pages have zero impressions (plan WP-05). Mixed question-page canonical rule (plan WP-04).
- An r/dataisbeautiful post linking the site (Sept 2026, per the research report) is unverified; check whether it was the owner's before reposting.

### Not done this session
No commits pushed, no deploys, no posts, no outreach, no third-party uploads.

### Next
1. WP-03 data review (1h, owner).
2. WP-11 bootstrapping guide upgrade (4h), reusing `buildSelfHostingTable`.
3. WP-07 dataset release package (5h).

## 2026-11-10 — session 2, Phase 1: bootstrapping guide (WP-11) — done

Owner asked for a phased session (bootstrapping guide, dataset release, source labels, poster + guides), one PR at the end, merged by the owner.

- **Behavior:** `/guides/what-is-compiler-bootstrapping` replaces its hand-drawn Rust/Go figure with a diagram generated from dated `compiler_written_in` edges (Rust, Go, Kotlin, Swift, Zig), and adds the same self-hosting table as the family-tree guide under "Every dated self-hosting transition". The old figure's caption claimed its arrows were `bootstrap_written_in` edges; they were not. Title and description now advertise the real chains: "What is Compiler Bootstrapping? Real Self-Hosting Chains | Language Lineage" (75 chars, at the validator limit).
- **Growth mechanism:** the page has 1,293 impressions at position 11.4; a results-page definition cannot show five dated, sourced chains.
- **Files:** `scripts/generateSeoPages.ts` (`buildSelfHostingDiagram`, placeholder), regenerated guide, guides index, directory, llms.txt, llms-full.txt, rss.xml, sitemap lastmod; `scripts/growthPages.test.ts` (+3 tests).
- **Checks:** `npm run verify` exit 0, 127 tests, seo:validate 0/0, seo:links 0/0/0, sitemap 324. Headless Chromium at 320px and 1280px: no page errors, no horizontal page scroll; the diagram has a minimum width and scrolls inside its own box on phones.
- **Data finding (confirmed):** the `lang:c → lang:rust` compiler edge (2006–2010) cites `https://github.com/iohub/rustboot`, whose GitHub description is "bootstrap rust compiler in ocaml" and whose language breakdown is OCaml 1,132,587 bytes, Rust 172,219, no C. The edge is not supported by its source. The new diagram now shows it, contradicting the guide's prose ("rustboot, was written in OCaml"). A separate data PR proposes the fix (see below).

## 2026-11-10 — session 2, Phase 2: dataset release package (WP-07) — done

- **Behavior:** `npm run seo:generate` now also runs `scripts/generateDatasetRelease.ts`, which writes `dataset/v5/lineage_v5_edges.csv` (490 rows), `lineage_v5_nodes.csv` (171 rows, logo fields excluded because logos carry third-party licenses) and `DATACARD.md` (Hugging Face front matter; counts, relationship types, temporal coverage, source mix including the 62% Wikipedia share, limitations, license). `public/dataset` is a symlink to `dataset/`, so all three are served at `/dataset/v5/`. Added `CITATION.cff` (type dataset, CC-BY-4.0, no DOI). The `/dataset` page links the CSVs, data card and citation file, and its Dataset JSON-LD lists all three downloads.
- **Validator change:** `scripts/validateSeo.ts` required `distribution` to be a single object with the JSON URL. It now accepts an array and still fails unless one entry has the JSON URL. Same guarantee, needed to list the CSVs.
- **Growth mechanism:** DOI-ready, analysis-friendly copies for Zenodo, Hugging Face and Kaggle (KPI 5), and Google Dataset Search sees CSV downloads.
- **Files:** `scripts/generateDatasetRelease.ts`, `scripts/datasetRelease.test.ts` (+4 tests, parses the CSVs and compares every row to the JSON), `package.json`, `scripts/generateSeoPages.ts`, `scripts/validateSeo.ts`, `dataset/README.md`, `CITATION.cff`, generated `dataset/index.html`, `dataset/v5/*.csv`, `DATACARD.md`; `docs/growth/DATASET_RELEASE.md` (owner publishing steps).
- **Checks:** `npm run verify` exit 0, 131 tests, seo:validate 0/0, seo:links 0/0/0, sitemap 324; `dist/dataset/v5/` contains both CSVs and the data card.
- **Not done:** no upload to Zenodo, Hugging Face or Kaggle; no DOI.
