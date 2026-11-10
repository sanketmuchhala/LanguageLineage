# Growth execution plan

**Status:** living document. Created 2026-11-10 on branch `growth/research-execution`.
**Inputs:** [research/deep-research-report.md](../../research/deep-research-report.md) (strategy, treated as hypotheses), [research/CLAUDE_GROWTH_EXECUTION.md](../../research/CLAUDE_GROWTH_EXECUTION.md) (execution rules), the GSC export in `GSC data/languagelineage/` (2026-08-09 to 2026-11-08), and the checked-in code and dataset (ground truth).
**Companion files:** [WORKLOG.md](WORKLOG.md) · [OUTREACH_TRACKER.md](OUTREACH_TRACKER.md) · [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)
**Capacity:** one person, ~10 hours/week, ~40 hours per 30 days.

## 1. Diagnosis

The site is technically sound and already ranks on page one (average position ~8.6) for thousands of impressions, but most of those impressions are short factual questions ("is python written in c") that search engines now answer on the results page, so they convert at under 0.1%. Exploratory searches (family tree, map, graph of languages) convert at roughly 2.5–3% from the same positions, and the homepage converts at 4.6%. The site has never been launched or promoted, and the backlink count has not been measured from a real source (`MASTER_STATUS.md` records "~0" referring domains, inferred, not measured). Growth therefore depends on (a) making the exploratory destinations stronger and fully crawlable, (b) turning the cited dataset into artifacts other sites link to, and (c) a staged community launch. Definitional CTR is the last priority, because its ceiling is structurally low.

## 2. Audited baseline

### 2.1 Search Console (owner export, last 3 months, web search)

| Metric | Value | Source |
|---|---|---|
| Clicks | 169 (~1.8/day) | `GSC data/languagelineage/Chart.csv`, devices total |
| Impressions | 26,398 (~287/day) | same |
| CTR | 0.64% | derived |
| Average position | ~8.6 (weighted ~9.0 desktop, 8.2 mobile) | `Devices.csv` |
| Trend | ~1.3 clicks/day in Aug 9–31; ~2.1/day in Oct | `Chart.csv` |
| Position drift | 7–8 through Oct, 9–12.6 on Nov 2–8 | `Chart.csv`. Watch; cause unknown |
| Homepage | 74 clicks / 1,598 imp / 4.63% CTR / pos 7.9 | `Pages.csv` |
| Family-tree guide | 12 / 292 / 4.11% / 7.0 | `Pages.csv` |
| `/languages/python` | 14 / 7,972 / 0.18% / 8.0 | `Pages.csv` |
| `/languages/java` | 6 / 3,393 / 0.18% / 7.3 | `Pages.csv` |
| Bootstrapping guide | 6 / 1,293 / 0.46% / 11.4 | `Pages.csv` |

**Query categories.** GSC anonymizes most queries: the visible query rows account for 23 of 169 clicks and 8,835 of 26,398 impressions, so category numbers are lower bounds.

| Category (regex over `Queries.csv`, case-insensitive) | Impressions | Clicks | CTR |
|---|---:|---:|---:|
| Definitional "written in": `written\|coded\|built\|based\|made\|implemented` with a language name, plus `cpython`, `rustc` | ~7,000 | ~5 | ~0.07% |
| Exploratory: `tree\|map\|genealog\|family\|graph\|diagram\|chart\|infographic` | 580 | 15 | 2.59% |
| Bootstrapping: `bootstrap` | 313 | 2 | 0.64% |

The research report's figures (5,383 / 2 and 475 / 14) come from a narrower regex; the ratio is the same either way: exploratory converts roughly 30–80x better. Re-run the categorization with the same regexes on every pull (§8).

### 2.2 Repository (verified 2026-11-10)

| Item | Finding | Evidence |
|---|---|---|
| Stack | React 18 + TypeScript + Vite SPA (`/`, `/explore`, `/embed`) plus ~320 prerendered static pages from `scripts/generateSeoPages.ts` | `docs/ARCHITECTURE.md`, `package.json` |
| Gate | `npm run verify` = type-check, vitest, `seo:validate`, `seo:links`, build. Baseline green: 115 tests, 0 errors/warnings, 0 broken/orphans | baseline run in WORKLOG |
| Dataset | `dataset/v5/lineage_v5.json`: 171 nodes, 490 edges, 6 edge types, every edge has `evidence_source` + `confidence`; `start_year`/`end_year` give temporal data | file |
| Sitemap | 324 URLs; local build equals live sitemap (no URL loss) | compared 2026-11-10 |
| robots.txt | `User-agent: * Allow: /`, plus explicit GPTBot, ClaudeBot, PerplexityBot. OAI-SearchBot, Claude-SearchBot, Claude-User are allowed by the wildcard; live site returns 200 to each UA | `public/robots.txt`, curl |
| 404s | Real 404 for unknown paths | `curl /this-page-does-not-exist-xyz` → 404 |
| Homepage HTML | **Before this branch: empty `<div id="root">`** (no body text for non-JS crawlers); canonical set only by react-helmet-async, deliberately | `index.html`, `scripts/validateSeo.ts:149` |
| Structured data | WebSite JSON-LD on `/`, Dataset JSON-LD on `/dataset` only, FAQ/Speakable on question pages | validator |
| Analytics | Vercel Analytics + Speed Insights; `npm run gsc:analyze` compares exports against a 2026-06-25 baseline | `src/app/App.tsx`, `scripts/analyzeGsc.ts` |
| Embed | `/embed` route and `/embed-kit` page exist | `public/embed-kit` |
| Dataset distribution | JSON v1–v5, CC BY 4.0 license, README; **no CSV, no CITATION.cff, no DOI, not on Zenodo/HF/Kaggle** | `public/dataset/` |
| Source mix | 302 of 490 edges (62%) cite Wikipedia | dataset |
| Overlapping landing pages | `/programming-language-genealogy`, `/programming-language-evolution`, `/programming-language-graph`, `/what-are-programming-languages-written-in` are self-canonical and in the sitemap but received **zero** impressions in the export; `/programming-language-family-tree` canonicalizes to the guide | generated HTML, `Pages.csv` |
| Canonical strategy for question pages | Mixed: `/questions/what-is-{python,rust,roc,prolog}-written-in` canonicalize to the language page; others (e.g. Java) are self-canonical. Google ignores the Rust one (2,016 impressions on the question URL) | `QUESTION_CANONICAL_TO_LANG` in generator, `Pages.csv` |
| Stale docs | `GROWTH_MASTERPLAN.md` §0 says the checkout is 164 commits behind and LICENSE is missing; both are no longer true | file vs `git status`, `LICENSE` |

## 3. Gap matrix

`existing / verified` = present and checked. `existing / needs improvement` = present, worth upgrading. `not present` = gap.

| Research recommendation | Already exists? | Evidence in repo | Proposed change | Impact | Cost (h) | Risk | Priority |
|---|---|---|---|---|---|---|---|
| Substantive prerendered HTML for crawlers | Static pages: existing / verified. Homepage: **not present** | `index.html` root was empty | Static summary inside `#root`, hidden once JS runs (**WP-01, done**) | High: best-converting page, and AI search crawlers do not run JS | 2 | Low | P0 |
| Allow OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot | existing / verified (wildcard allow) | `public/robots.txt`; live UA checks return 200 | None. Training-bot policy unchanged (owner decision) | n/a | 0 | n/a | done |
| Visible edge-type legend: implemented in / compiles to / runs on / influenced | existing / needs improvement | Relationship pages and colors exist; family-tree guide only explained influence vs implementation | Relationship-kinds table with counts on the guide (**WP-02, done**). "Runs on" is not modeled; stated as a limit | Medium | 1 | Low | P1 |
| Historical vs current implementation | existing / needs improvement | `start_year`/`end_year` in data; not surfaced on the guide | Dated self-hosting table on the guide (**WP-02, done**) | High: the differentiator in one table | 3 | Low | P1 |
| Upgrade family-tree page, surprising example above the fold | existing / needs improvement | `/guides/programming-language-family-tree` | Concrete Rust/Go example in the answer box (**WP-02, done**). Poster/export later (WP-08) | High | incl. | Low | P1 |
| Source-quality label per relationship | not present | evidence URLs only | Derived label (primary docs / source repo / paper / Wikipedia) from URL host, no schema change (WP-06) | Medium (trust, launch criticism) | 4 | Low | P1 |
| Poster with permanent URL, SVG/PNG | not present | `public/og/` social cards only | `/posters/…` static SVG generated from data (WP-08) | High (linkbait, launch centerpiece) | 8 | Medium (accuracy, design) | P1 |
| Rust bootstrap page | existing / needs improvement | `/guides/how-rust-is-bootstrapped` (3 impressions) | Add dated chain table + sources (WP-10) | Medium | 3 | Low | P2 |
| Languages implemented in Rust | not present | 9 sourced targets in dataset | Data-driven page (WP-09) | Medium (This Week in Rust pitch) | 4 | Low | P2 |
| Languages implemented in Go / Zig | not present | only 2 sourced targets each | **Not now**: data ticket first | Low | — | Thin page | Later |
| JS engines comparison incl. LibJS | existing / needs improvement | `/guides/v8-vs-spidermonkey-vs-javascriptcore`, `/guides/how-javascript-engines-work`; LibJS not in dataset | Add dataset table; LibJS needs a cited node (data PR) | Medium | 3 | Low | P2 |
| Compiler bootstrapping visual guide | existing / needs improvement | `/guides/what-is-compiler-bootstrapping` (1,293 imp, pos 11.4) | Add the self-hosting table + chain diagram (WP-11) | Medium-high | 4 | Low | P2 |
| JVM languages, CPython vs PyPy, JVM vs CLR | partial (`/guides/graalvm-vs-hotspot`, `/guides/how-python-is-implemented`) | thin JVM coverage (4 Java-implemented targets) | Later, after data PRs | Medium | 4–6 each | Medium | Later |
| Timeline | existing / verified | `/timeline` | None now | — | 0 | — | — |
| `llms.txt` | existing / verified | `public/llms.txt` | No further investment (Google ignores it for Search) | — | 0 | — | Not doing |
| Dataset release: CSV, schema, data card, CITATION, changelog | partial (JSON + README + license) | `public/dataset/` | Generated CSV + CITATION.cff + data card (WP-07) | High (DOI-ready, Kaggle/HF) | 5 | Low | P2 |
| Zenodo DOI / HF / Kaggle | not present | — | Prepare packages only; publish needs owner approval | High | 2 (owner) | Low | P3 |
| Launch drafts (HN, Reddit, X, newsletters) | not present in repo | research report has drafts | Rewritten drafts + gates in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | High | 2 | Low | P3 |
| Outreach list | not present | research report table | [OUTREACH_TRACKER.md](OUTREACH_TRACKER.md), all `not contacted` | Medium | 1 | Low | P3 |
| Consolidate overlapping landing pages | not present | 4 root pages with 0 impressions | Evaluate with `gsc:analyze`, then canonicalize or improve (WP-05) | Medium | 2 | Medium (invariant in ARCHITECTURE.md) | Next |
| Consistent question/language canonical rule | existing / needs improvement | mixed rule, Google ignores Rust's | Per-slug decision from GSC data (WP-04) | Medium | 2 | Medium | Next |
| Measure referring domains from a real source | not present | — | Ahrefs Webmaster Tools (free) or GSC Links report export | Needed for KPI 1 | 1 (owner) | Low | Now |

## 4. Prioritization model

Score 1–5 per criterion; weighted total = 0.30·fit + 0.25·shareability + 0.20·data readiness + 0.15·time to ship + 0.10·low risk. Fit uses GSC evidence; keyword volumes in the research report are directional only.

| Candidate | Fit | Share | Data | Time | Risk | **Score** |
|---|---:|---:|---:|---:|---:|---:|
| WP-01 Crawlable homepage fallback | 5 | 2 | 5 | 5 | 5 | **4.25** |
| WP-02 Family-tree guide tables | 5 | 3 | 5 | 4 | 5 | **4.35** |
| WP-08 Implementation family-tree poster | 4 | 5 | 4 | 2 | 3 | **3.85** |
| WP-07 Dataset release package | 3 | 4 | 5 | 4 | 5 | **4.00** |
| WP-11 Bootstrapping guide upgrade | 4 | 3 | 5 | 4 | 5 | **4.05** |
| WP-06 Source-quality labels | 3 | 3 | 4 | 4 | 4 | **3.45** |
| WP-09 Languages implemented in Rust | 2 | 4 | 3 | 4 | 4 | **3.20** |
| WP-04 Question canonical rule | 3 | 1 | 4 | 4 | 2 | **2.80** |
| Go/Zig implementation pages | 1 | 3 | 1 | 4 | 3 | **2.15** |

WP-01 and WP-02 were the top two that fit one session; they are done (see WORKLOG).

## 5. Work packages (dependency-ordered)

Owner for all: solo maintainer. Verification for all code WPs: `npm run verify` green, plus the listed check.

- [x] **WP-01 Crawlable homepage fallback** (2h). Files: `index.html`, `scripts/growthPages.test.ts`. Acceptance: non-JS fetch of `/` shows an H1, explanatory text and ≥10 working internal links; JS users see the unchanged React page; no canonical added to `index.html`. Check: headless browser with JS on and off (WORKLOG).
- [x] **WP-02 Family-tree guide: relationship kinds + dated self-hosting table** (3h). Files: `scripts/generateSeoPages.ts`, generated `public/guides/programming-language-family-tree/index.html`, test. Acceptance: counts equal the dataset; every self-hosting transition in the data appears with years and its evidence URLs; no new facts typed by hand.
- [ ] **WP-03 Data review proposals** (1h, owner). Rust `lang:c → lang:rust` compiler edge (2006–2010) cites `github.com/iohub/rustboot`; rustboot is generally described as written in OCaml, so this edge may be wrong. Swift is shown as compiling itself since 2019 while C++ remains its main implementation language. Per AGENTS.md rule 3, propose corrections in a separate data PR with verified sources; do not edit in place.
- [ ] **WP-11 Bootstrapping guide upgrade** (4h). Reuse `buildSelfHostingTable` on `/guides/what-is-compiler-bootstrapping` plus a chain diagram from `bootstrap_written_in` edges. Acceptance: table + diagram in static HTML; title/description advertise the case studies. Why it beats a short answer: the SERP can define bootstrapping, it cannot show five dated real chains with sources.
- [ ] **WP-07 Dataset release package** (5h). Generate `public/dataset/v5/lineage_v5.csv` (nodes + edges), `CITATION.cff`, data card section (taxonomy, coverage limits, source mix, changelog) from the JSON in a new script wired into `seo:generate`. Acceptance: CSV row counts equal JSON; card states the Wikipedia share; no DOI claimed until minted.
- [ ] **WP-06 Source-quality label** (4h). Derive `primary docs / source repository / paper / Wikipedia / other` from evidence host at generation time (no schema change); show it next to each citation on language, question and relationship pages. Acceptance: every evidence link has a label; mapping covered by a unit test.
- [ ] **WP-08 Poster MVP** (8h, depends on WP-06 for labels). `/posters/programming-language-implementation-family-tree`: static SVG built from implementation edges for ~50 languages, separate styling from influence, footer with URL + dataset version, methodology, sources link, CC BY 4.0 reuse text, SVG download. PNG/PDF later. Acceptance: every drawn edge exists in the dataset (test), readable at 1200×630 crop for social preview.
- [ ] **WP-04 Question/language canonical rule** (2h). Run `npm run gsc:analyze` per slug as `docs/ARCHITECTURE.md` requires; decide per pair; document in `docs/DECISIONS.md`.
- [ ] **WP-05 Overlapping root landing pages** (2h). Decide improve vs canonicalize for the four zero-impression pages; update `generateSitemap.ts` in the same change.
- [ ] **WP-09 Languages implemented in Rust** (4h). Data-driven page from Rust-implemented edges (9 today), distinguished from "compiles to". Gate: only if a data PR brings it to ≥12 sourced entries, otherwise fold into WP-08.
- [ ] **WP-10 Rust bootstrap guide** (3h) and **JS engine table** (3h) upgrades.
- [ ] **WP-12 Measurement** (1h every 14 days). See §8.

## 6. 30 / 60 / 90 days

Targets are stretch goals from the research report, not forecasts. Judge SEO on rolling 28-day averages; record launch spikes separately.

| Window | Hours | Deliverables | Target (stretch) |
|---|---|---|---|
| Days 1–30 (to 2026-12-10) | ~40 | WP-01, WP-02 (done), WP-03, WP-11, WP-07, WP-06; owner measures referring domains; deploy after review | 3–4 clicks/day, 450–600 imp/day, 10–15 referring domains |
| Days 31–60 (to 2027-01-09) | ~40 | WP-08 poster; launch per [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) (HN first, Reddit staggered); Zenodo/HF publish after approval; first 10 outreach messages | 5–7 clicks/day, 700–1,000 imp/day, 25–40 referring domains |
| Days 61–90 (to 2027-02-08) | ~40 | WP-04, WP-05, WP-09/10 if data allows; follow-ups; iterate pages with high impressions and low CTR | 8–12 clicks/day, 1,200–1,800 imp/day, 50–75 referring domains |

## 7. Dataset, citation and temporal integrity checks

- Every generated table or poster edge must come from `lineage_v5.json`; tests recompute expected rows (pattern: `scripts/growthPages.test.ts`).
- Never edit an existing `evidence_source` or `confidence`; corrections go to a data PR description (AGENTS.md rule 3).
- Show year ranges whenever an edge has them; never present an ended edge as current.
- Keep "implemented in" (`compiler_written_in`, `runtime_written_in`, `rewritten_in`), "bootstrapped from" (`bootstrap_written_in`), "compiles to" (`transpiled_to`) and "influenced" visibly separate. "Runs on" is not modeled; say so where it matters.
- Before launch: `npm run check:evidence-links` and fix dead links via a data PR.
- Track the Wikipedia share (62% today) and prefer primary sources in new edges.

## 8. Measurement

Review every 14 days. Use `not available` rather than 0 when a number cannot be measured.

| Window | Clicks/day (7d / 28d) | Imp/day | CTR | Pos | Exploratory clicks / imp | Definitional clicks / imp | Referring domains (source) | AI referrals (utm_source=chatgpt.com etc.) | GitHub stars | Shipped |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-08-09 → 11-08 (baseline) | not available / ~1.8 | ~287 | 0.64% | ~8.6 | 15 / 580 | ~5 / ~7,000 | not available (not yet measured) | not available | not available | — |

How to fill a row: export GSC Performance (last 28 days) into `GSC data/<date>/`, run `npm run gsc:analyze -- --dir "GSC data/<date>"`, apply the §2.1 regexes to `Queries.csv`, read referring domains from the GSC Links report or Ahrefs Webmaster Tools, and AI referrals from Vercel Analytics referrers.

KPI order: (1) relevant referring domains, (2) exploratory organic clicks, (3) exploratory impressions, (4) AI citations/referrals, (5) dataset downloads, embeds, stars, (6) definitional CTR.

## 9. Now / Next / Later / Not doing

- **Now:** WP-01 and WP-02 (done, awaiting review), WP-03 data review, measure referring domains, deploy after review.
- **Next:** WP-11 bootstrapping guide, WP-07 dataset package, WP-06 source labels, WP-08 poster, then launch.
- **Later:** WP-04, WP-05, WP-09, WP-10, JVM/CLR and CPython-vs-PyPy comparisons once the data supports them.
- **Not doing:** more `llms.txt` work; mass-generated "what is X written in" pages; Go/Zig pages before data exists; title rewrites aimed only at definitional CTR; database, domain rename, AI-model lineage (settled in `docs/DECISIONS.md`); any posting, emailing or publishing without owner approval.
