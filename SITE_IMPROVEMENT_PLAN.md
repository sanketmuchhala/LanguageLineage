# Language Lineage: Master Improvement Plan

Status: authored 2026-07-01. Supersedes and extends `reports/GSC SEO rep/seo-recovery-plan.md` (its phases 1 through 9 are complete and shipped).

This document is written for ANY coding agent (Claude Code, Codex, Antigravity, or a human). It assumes zero prior conversation context. Everything you need is in Section 1. Do not skip Section 1 or Section 3.

How to use this file:

1. Read Sections 1 to 3 completely before touching any code.
2. Pick ONE phase from Section 4 (they are ordered by impact and dependency, work top to bottom unless told otherwise).
3. Run the Phase 0 preflight first, every time, in a fresh session.
4. Complete the phase's tasks, meet every acceptance criterion, run every validation command.
5. Commit on a feature branch, open a PR to `main`. Never push directly to `main` (Vercel deploys `main` to production immediately).
6. Mark the phase done by editing its `Status:` line in this file in the same PR.

---

## Section 1: Project context pack

### 1.1 What this site is

Language Lineage (https://www.languagelineage.org) is an evidence-backed atlas of programming language implementation: which language every compiler, runtime, and toolchain is written in, plus design-influence lineage. The product framing is "compiler systems atlas", NOT "family tree" or "genealogy" (that framing was deliberately retired; do not reintroduce ancestry/DNA metaphors in copy).

Two halves, one deploy:

1. A React SPA: `/` (landing), `/explore` (the interactive Cytoscape graph), `/embed` (iframe-able graph, accepts `?lang=` query param), plus a 404 route.
2. Roughly 199 pre-rendered static HTML pages generated at build time into `public/` and served as-is: `/languages/{slug}`, `/tools/{slug}`, `/relationships/{type}`, `/questions/{slug}`, `/guides/{slug}`, `/timeline`, `/dataset`, and 6 keyword landing pages at root level.

### 1.2 Stack

- Vite 5, React 18, TypeScript 5, react-router-dom 7, react-helmet-async
- Cytoscape.js 3.28 with cose-bilkent 4.1 layout (loaded as a lazy chunk, roughly 520 kB, keep it lazy)
- Zustand 4 for state (`src/store/useGraphStore.ts`)
- Plain CSS with custom properties. No CSS framework. No Tailwind.
- Playwright (`@playwright/test`) is a devDependency, available for verification scripts
- Hosting: Vercel. Production domain `https://www.languagelineage.org` (non-www 308-redirects to www via `vercel.json`). `main` branch = production.

### 1.3 Dataset and edge semantics (memorize this)

Active dataset: `dataset/v5/lineage_v5.json`

- 152 nodes in the `languages` array: 131 languages (`lang:` id prefix) and 21 tools (`tool:` prefix, e.g. `tool:v8`, `tool:llvm`)
- 443 edges in the `relationships` array across 6 types: `influenced`, `compiler_written_in`, `runtime_written_in`, `bootstrap_written_in`, `transpiled_to`, `rewritten_in`

EDGE DIRECTION, the single most common mistake: `from_language` is the implementation language, `to_language` is the thing being implemented. An edge `from: lang:c, to: lang:python, type: runtime_written_in` reads "Python's runtime is written in C". Therefore "what is X written in" = all edges where `to_language === X` and type is one of the three `*_written_in` types.

Companion file: `dataset/v5/enrichment_v5.json`. Shape: `{ policy: {...}, enrichment: { "lang:python": {...}, ... } }`. Holds Wikidata-sourced facts per node (designers, developers, license, website, file extensions, influenced-by, wikidata_id, wikipedia_title, CC0 description tagline). Currently 144 of 152 nodes covered.

The dataset is fetched at runtime through a symlink: `public/dataset` points to `../dataset`. Vite copies it into `dist/` at build.

Do not change the dataset schema/structure. Adding nodes or edges is fine when a phase calls for it; changing field names or nesting is not.

### 1.4 Command reference

```
npm run dev                # Vite dev server (SPA only; static pages served from public/)
npm run build              # seo:generate, then tsc, then vite build. MUST pass before any PR.
npm run type-check         # tsc --noEmit
npm run seo:generate       # regenerates ALL static pages + sitemap + llms.txt
npm run seo:validate       # SEO validation suite. MUST report 0 errors, 0 warnings.
npm run content:wikipedia  # re-harvests Wikidata facts into dataset/v5/enrichment_v5.json
npm run logos:wikimedia    # harvests logo candidates from Wikimedia
npm run dataset:v5         # regenerates lineage_v5.json from v4 input plus logo metadata
npm run analyze:v5         # dataset stats and integrity report
npm run gsc:analyze        # Phase 14 measurement loop: analyzes GSC CSV exports vs baseline
```

### 1.5 File map (what to edit for what)

| Concern | File(s) |
|---|---|
| Static page HTML (ALL of it: titles, meta, JSON-LD, body content) | `scripts/generateSeoPages.ts` (roughly 4100 lines) |
| Sitemap | `scripts/generateSitemap.ts` |
| llms.txt | `scripts/generateLlmsTxt.ts` |
| SEO validation rules | `scripts/validateSeo.ts` |
| Wikidata harvest | `scripts/harvestWikipediaContent.ts` |
| SPA landing page | `src/ui/LandingPage.tsx` + `LandingPage.css` |
| Landing live graph section | `src/ui/LandingGraphGlimpse.tsx` |
| Explore page shell | `src/app/GraphExplorer.tsx` |
| Graph rendering | `src/graph/GraphView.tsx`, `style.ts`, `buildElements.ts`, `layouts.ts`, `selectors.ts` |
| Graph state | `src/store/useGraphStore.ts` |
| Dataset loading/normalizing | `src/data/loadDataset.ts` and neighbors in `src/data/` |
| SPA design tokens | `src/styles/tokens.css` |
| Static page styles | `public/seo.css` (tokens are MIRRORED here by hand; keep both in sync) |
| SPA shell head (fonts, robots meta) | `index.html` |
| Redirects/headers | `vercel.json` |

CRITICAL RULE: everything under `public/languages/`, `public/tools/`, `public/questions/`, `public/guides/`, `public/relationships/`, `public/timeline/`, `public/dataset/`, the root keyword landing dirs, `public/sitemap.xml`, and `public/llms.txt` is GENERATED output that happens to be committed. Never hand-edit those files; your edits will be silently overwritten by the next `npm run seo:generate`. Always edit the generator scripts, then regenerate, then commit both the script change and the regenerated output.

### 1.6 Design system (locked decisions, do not relitigate)

These were chosen by the site owner after extensive comparison rounds. Treat them as brand constants.

Type:
- Display: Fraunces (Google Fonts, `opsz,wght@9..144`, weights 400/500/600, optical sizing auto). Hero weight 600, line-height 1.1, letter-spacing -0.01em. Static page h1: Fraunces 48px/600.
- Body/UI: Geist.
- Data/code/captions: JetBrains Mono.
- Loaded via Google Fonts in `index.html` and in the `FONTS_HEAD` constant inside `generateSeoPages.ts`.

Color (dark, the default):
- Background pure black `#000000`. Surfaces `#0e0e0e`, elevated/hover `#161616`, node chip `#1c1c1c`.
- Text `#fafafa` primary, `#9a9a9a` secondary, `#5a5a5a` faint.
- Borders `rgba(255,255,255,.10)` and `.18`.
- Accent (brand, interactive): signal green `#4ade80`, hover `#86efac`, light-mode equivalent `#15803d`.
- HARD RULE: no blue or cyan tint on dark surfaces, no colored canvas glows, keep blacks neutral.

Semantic relationship colors (used in the graph, legends, page relationship maps; NEVER change these and never confuse them with the brand accent):
- `compiler_written_in` amber, `runtime_written_in` `#34d399` green, `bootstrap_written_in` violet, `influenced` blue, `transpiled_to` cyan `#22d3ee`, `rewritten_in` rose.
- When sweeping for stray cyan, do NOT touch the `transpiled_to` cyan.

Tokens live in `src/styles/tokens.css` (SPA) and are mirrored in `public/seo.css` (static pages). Any token change must be applied to both.

Brand mark: the "directed triad" SVG (green source node plus two directed edges to two white target nodes, viewBox 0 0 32 32). Exists in `LandingPage.tsx` (nav and footer), `BRAND_MARK` in `generateSeoPages.ts`, and `public/favicon.svg`. Wordmark is Geist, not Fraunces.

Design principles for any new UI (condensed from the design direction this site follows):
- One signature element per page; keep everything around it quiet. On language pages the signature is the relationship map at the top. Do not add competing decorative elements.
- Structure must encode information. No decorative numbering, no ornamental dividers.
- Copy is design material: plain verbs, sentence case, direct and specific, written from the reader's side. A button says what it does.
- Quality floor on everything new: responsive to 320px, visible keyboard focus, `prefers-reduced-motion` respected.
- Restraint beats decoration. When unsure, remove the extra element.

### 1.7 Writing style rules (apply to ALL copy, docs, commits, and this file)

- No emojis. Anywhere.
- No em-dashes. Use commas, colons, parentheses, or separate sentences.
- No ASCII arrows in prose or docs.
- Direct answer first: the first one or two sentences of any page or section must contain the actual answer, then elaborate.
- Distinguish language SPECIFICATION from IMPLEMENTATION whenever the topic is "what is X written in" (JavaScript the spec is not written in anything; V8 is C++).
- Never claim certainty the dataset cannot back. Cite Wikipedia/Wikidata links where facts come from enrichment.

### 1.8 Content licensing (legal, non-negotiable)

- Wikidata structured facts are CC0: safe to store and render.
- Wikipedia ARTICLE PROSE is CC BY-SA: NEVER paste, closely paraphrase, or store it. All on-page narrative must be synthesized original prose from structured facts.
- Logos: prefer Devicon and Wikimedia files with clear licenses; store `logo_source`, `logo_license`, `logo_kind` metadata as the existing nodes do.

### 1.9 Git and deployment workflow

- Branch per phase, named after the phase (e.g. `seo-titles`, `question-expansion`). PR to `main`. `main` deploys to production via Vercel automatically.
- Commit style, small and frequent, matching history: `feat(pages): ...`, `fix(ui): ...`, `data(v5): ...`, `seo: ...`, `polish: ...`.
- No "Co-Authored-By" lines in commit messages.
- `reports/` is gitignored (that is why this plan lives at repo root instead).
- Remote `origin` points at `ProgrammingLanguageGraph.git`; GitHub redirects it to the renamed `LanguageLineage` repo. Pushes work; ignore the rename.

### 1.10 Known gotchas

- `generateSeoPages.ts` has a `PRIORITY_CONTENT` map: 17 hand-authored nodes (python, javascript, rust, go, java, c, cxx, typescript, ruby, haskell, csharp, swift, kotlin, and tools v8, spidermonkey, beam, plus one more; check the map). These render hand-written content INSTEAD of the auto-enriched content. When changing enriched templates, verify priority pages did not regress, and vice versa.
- Wikidata label resolution: `wbgetentities` sometimes returns an EMPTY `labels.en` for orgs and people. The harvest script falls back to the enwiki sitelink title (stripping any trailing parenthetical). Keep that behavior.
- `LandingGraphGlimpse.tsx`: the mount effect must NOT depend on a phase value it sets itself, or React cleanup destroys the Cytoscape instance on ready. It uses a `startedRef` guard and destroys only on unmount. Preserve this pattern if you touch it.
- Cytoscape style code uses mapper functions and `as any` casts for non-standard properties. Follow the existing pattern.
- If the site owner reports "it looks the same" after a deploy, suspect Vercel deploy lag or browser cache before debugging; hard refresh first.
- `CLAUDE.md` in this repo says "only make changes explicitly requested". This plan document IS the explicit request for the phase you are executing. It also says all nodes must be 70px; that rule was later overridden by the owner in favor of degree-based sizing, which is the current shipped behavior. Do not "fix" node sizing back.

---

## Section 2: Evidence baseline (why these phases, in this order)

Google Search Console export dated 2026-06-25 lives at `reports/GSC SEO rep/languagelineage.org-Performance-on-Search-2026-06-25/` (Queries.csv, Pages.csv, Devices.csv, and friends).

The core finding, unchanged across two measurement rounds: the site RANKS but does not get CLICKED.

Top queries (impressions, avg position, CTR):

| Query | Imp | Pos | CTR |
|---|---|---|---|
| rust language | 122 | 56.4 | 0% |
| what is rust written in | 108 | 9.5 | 0% |
| what language is python written in | 85 | 35.3 | 0% |
| what language is javascript written in | 79 | 9.8 | 0% |
| what is javascript written in | 54 | 9.7 | 0% |
| rust language release date | 50 | 53.7 | 0% |
| what is go written in | 39 | 8.7 | 0% |
| is javascript written in c | 31 | 9.5 | 0% |
| what language is java written in | 31 | 10.3 | 0% |
| bootstrapping compiler (cluster of variants) | ~42 | 37 to 48 | 0% |

Top pages: `/languages/rust` 898 imp, pos 29.7, 2 clicks. `/languages/javascript` 467 imp, 1 click. `/languages/go` 283 imp, 1 click. `/languages/python` 259 imp, 0 clicks. Mobile: 529 impressions, 0 clicks.

Two distinct diagnoses:

1. Queries at position 8 to 12 with 0% CTR: the SNIPPET is losing the click. Titles and meta descriptions are not compelling or answer-forward enough, and no rich results have appeared yet. This is cheap to fix (Phase 2).
2. Queries at position 25 to 56 with high impressions (rust brand queries, release-date queries, bootstrapping cluster): the CONTENT is not strong enough to rank. This needs depth (Phases 4 and 5).

Coverage gaps found in a repo audit on 2026-07-01:

- Enrichment: 148/152 after Phase 1 (2026-07-02). Permanent exceptions with no Wikidata entry: `tool:mrustc`, `lang:odin`, `lang:wren`, `tool:swc`.
- Logos: 96/152 after Phase 1 (2026-07-02). The remaining 56 have no P154 in Wikidata and no Devicon entry; they are old/niche languages without widely published logos.
- Question pages: only 17 exist, while roughly 100 more languages have the implementation edges to support one.
- `/explore` has no deep linking (no URL params), so static pages cannot link to a focused graph view. `/embed` already accepts `?lang=`.
- One global OG image for every page.

---

## Section 3: Standing rules for every phase

1. PREFLIGHT (Phase 0) runs at the start of every working session. No exceptions.
2. Validation gate before every commit: `npm run type-check`, `npm run seo:validate` (0 errors, 0 warnings), `npm run build` (the only acceptable warning is the pre-existing Cytoscape chunk-size warning).
3. Never hand-edit generated files under `public/` (see Section 1.5).
4. When you add or remove a page: update `generateSitemap.ts`, update `validateSeo.ts` expectations, regenerate, and confirm the sitemap URL count changed by exactly the number you expect. All sitemap URLs use `https://www.languagelineage.org`.
5. Scope discipline: do exactly what the phase says. If you discover an adjacent problem, note it at the bottom of this file under "Discovered work", do not fix it inline.
6. Copy rules from Section 1.7 apply to everything you write, including commit messages.
7. If a fact is not in the dataset or enrichment, do not assert it on a page. Look it up, add it to the dataset or enrichment via the proper script, then render it.
8. Design tokens and locked decisions from Section 1.6 are not up for debate within a phase.
9. Each phase ends with: update this file's phase `Status:` line, PR opened with a one-paragraph summary and validation output pasted in.

---

## Section 4: Phases

Legend: Impact and Effort are rated low / medium / high. Dependencies name phases that must land first.

---

### Phase 0: Preflight and baseline (run every session)

Status: recurring, never "done".
Impact: n/a. Effort: 5 minutes. Dependencies: none.

1. `git fetch origin && git status`. Confirm a clean tree. Never start work on `main`; create or check out the phase branch.
2. `npm install` if `node_modules` is missing.
3. Run `npm run type-check` and `npm run seo:validate`. Both must pass BEFORE you change anything; if they fail on a clean checkout, stop and report, do not fix drive-by.
4. Record the current numbers if you are starting a new phase: sitemap URL count (`grep -c "<url>" public/sitemap.xml`), node count, relationship count (`npm run analyze:v5`).
5. Skim the phase text below end to end before editing anything.

Baseline as of 2026-07-01: 199 sitemap URLs, 152 nodes, 443 relationships, enrichment 144/152, logos 77/152, 17 question pages, 10 guides.

---

### Phase 1: Dataset completeness for all 152 nodes

Status: complete (2026-07-02). Enrichment 148/152, logos 96/152.
Impact: high (fixes thin content on the 40 newest node pages). Effort: medium. Dependencies: none.

Why: the dataset grew from 112 to 152 nodes AFTER the last enrichment and logo harvests. 8 nodes lack enrichment entirely and 75 lack logos, so their pages render without the Quick Facts panel, sourced overview, and visual identity that the other pages have.

Tasks:

1. Run `npm run content:wikipedia`. Diff `dataset/v5/enrichment_v5.json` and confirm new coverage. Target: every node except `tool:mrustc` (documented permanent exception; it has no Wikipedia page).
2. For any node the harvester still misses (`lang:roc`, `lang:odin`, `lang:hare`, `lang:wren`, `lang:move`, `tool:quickjs`, `tool:swc` are the suspects), open `scripts/harvestWikipediaContent.ts`, find how it resolves Wikipedia titles or Wikidata ids, and add explicit id overrides (all seven have Wikidata entities; find them by searching wikidata.org for the language name plus "programming language"). Re-run until covered.
3. Run `npm run logos:wikimedia`, then whatever merge step the repo uses to fold logos into `lineage_v5.json` (read `scripts/generateV5Dataset.ts` first; it reads v4 as input, so understand the flow before regenerating, and do NOT lose the 40 new nodes that may only exist in v5). If the script would regress v5, add logos directly via a small targeted script instead. Target: raise logo coverage from 77 to at least 110 of 152. Only accept files with clear licenses; record `logo_source`, `logo_license`, `logo_kind`.
4. `npm run seo:generate`. Spot-check 10 previously-missing node pages in `public/languages/` and `public/tools/` for a rendered Quick Facts panel, overview narrative, and correct source links.
5. Verify no page renders an empty section or "undefined" anywhere: `grep -ril "undefined" public/languages public/tools public/questions | head` should return nothing.

Acceptance criteria:
- Enrichment coverage is at least 151/152 with `tool:mrustc` as the only documented exception.
- Logo coverage at least 110/152.
- `npm run seo:validate` 0 errors 0 warnings; `npm run build` passes.
- No "undefined" strings or empty fact panels in generated HTML.

---

### Phase 2: SERP title and meta description CTR pass

Status: complete (2026-07-02). PR #22 merged. All 197 pages: 0 duplicate titles, 0 duplicate descriptions, all titles within 75 chars, all descriptions 75-180 chars. Question pages now include direct answer in title via titleHook. Language pages separated to "Implementation, History, and Lineage" pattern. Relationship pages quantified. truncateMetaDescription fixed for mid-word periods. Validator extended with full uniqueness+length sweep.
Impact: highest of the whole plan (fixes 0% CTR at positions 8 to 12). Effort: medium. Dependencies: none.

Why: Section 2 shows queries sitting on page 1 to 2 with zero clicks. Ranking is not the problem; the snippet is.

Tasks:

1. Audit: extract every generated `<title>` and `<meta name="description">` by grepping the templates in `generateSeoPages.ts`. Write the current formula for each page type into the PR description (before/after table for at least 10 pages).
2. Rewrite the templates per page type with these formulas (adapt lengths per node; hard bounds: title 60 chars max, description 120 to 165 chars):
   - Question pages: title = the exact question plus the differentiating answer hook. Example: `What Is Rust Written In? Rust Itself, via OCaml and LLVM`. Description = the direct answer in one sentence, then the depth hook: `Rust's compiler rustc is written in Rust, bootstrapped from an original OCaml implementation, with an LLVM backend. See the full toolchain lineage.`
   - Language pages: title = `{Name}: What It's Written In, History, and Lineage` (shorten for long names). Description leads with the tagline plus release year plus the implementation answer.
   - Tool pages: title = `{Name}: The {category} Behind {host language}` pattern where accurate (e.g. `V8: The Engine Behind Chrome and Node.js, Written in C++`).
   - Guide pages: promise the outcome, not the topic (`Compiler Bootstrapping, Explained with Real Language Chains`).
   - Relationship pages: quantify (`78 Compilers and What They're Written In`), pulling counts from the dataset at generation time so they never go stale.
3. Ensure every title and description is UNIQUE sitewide. Add a check to `validateSeo.ts` that fails on duplicate titles, duplicate descriptions, titles over 60 chars, and descriptions outside 90 to 175 chars.
4. Regenerate and re-validate.

Acceptance criteria:
- All roughly 199 pages have unique, bounded titles and descriptions.
- The five worked examples (rust, python, javascript, go, java question pages) match the answer-first formula exactly.
- New validator checks are in `validateSeo.ts` and pass.

---

### Phase 3: Question page expansion (programmatic, quality-gated)

Status: complete (2026-07-02). PR #23 merged. 104 auto question pages generated via buildAutoQuestionPage(). Quality gate: incoming impl edges + enrichment entry. Each page has direct answer, impl table, context section, FAQPage/Article/BreadcrumbList JSON-LD, rel="alternate" cross-reference. Sitemap grew from 199 to 303 URLs. 0 errors, 0 warnings.
Impact: high (multiplies the site's proven winning format). Effort: medium-high. Dependencies: Phase 1 (enrichment), Phase 2 (title formulas).

Why: "what is X written in" is the site's proven format (page-1 rankings). Only 17 question pages exist; the dataset can authoritatively answer this for every language with implementation edges.

Tasks:

1. In `generateSeoPages.ts`, generate `/questions/what-is-{slug}-written-in/` for every LANGUAGE node (skip tools) that satisfies the quality gate:
   - has at least one incoming edge of type `compiler_written_in`, `runtime_written_in`, or `bootstrap_written_in` (edges where `to_language` is the node), AND
   - has an enrichment entry, AND
   - the rendered unique body (excluding nav, footer, related links) would exceed 150 words.
   Keep existing hand-authored question pages exactly as they are; the generator must not overwrite pages that have priority overrides.
2. Page structure (reuse the existing question-page shell): direct answer paragraph (answer in sentence one), implementation table (relationship type, implementation language as a link, source/note fields if the edge has them), a bootstrap or self-hosting note when `bootstrap_written_in` edges exist, a spec-vs-implementation clarifier where relevant (interpreted languages), FAQPage JSON-LD mirroring the visible answer, `<link rel="alternate">` cross-links between the question page and its language page (the pattern already exists for the original 17).
3. Update `generateSitemap.ts` and `validateSeo.ts`. Expect roughly 80 to 100 new URLs; count the exact number and assert it in the validator.
4. Add an internal-link resolution check to `validateSeo.ts` if not already present: every `href` starting with `/` in generated HTML must correspond to a generated file or SPA route.

Acceptance criteria:
- Every generated question page passes the 150-word unique-body gate (validator-enforced, not eyeballed).
- Zero broken internal links sitewide.
- Sitemap count grew by exactly the number of new pages; validator asserts the new total.
- Spot-check 5 random new pages: answer correctness against the dataset edges (remember edge direction, Section 1.3).

---

### Phase 4: Rescue high-impression, poor-position pages

Status: complete (2026-07-02). PR #24 merged. All 5 priority pages exceed 1200 words (rust 1580, java 1412, python 1388, go 1301, javascript 1287), each with 4+ sections and anchored #release-date. Bootstrapping guide has SVG bootstrap chain diagram (violet arrows, green self-hosting border), detailed Rust-via-OCaml and Go-via-C-1.5 chain walkthroughs, glossary (bootstrapping/self-hosting/cross-compilation/trusting trust), and FAQPage JSON-LD. Validation: 0 errors, 0 warnings.
Impact: high. Effort: high (this is a writing phase). Dependencies: Phase 2.

Why: `/languages/rust` has 898 impressions at position 29.7. "rust language" (122 imp, pos 56), "rust language release date" (50 imp, pos 53), and the bootstrapping query cluster (roughly 42 imp, pos 37 to 48) all show demand the current content is too thin to win.

Tasks:

1. Expand `/languages/rust` (in the `PRIORITY_CONTENT` map) into the definitive Rust implementation record, targeting 1200 or more words of substantive content: origin timeline (2006 Graydon Hoare personal project, Mozilla sponsorship 2009, 1.0 in 2015), the OCaml-to-self-hosted bootstrap story with dataset citations, rustc architecture (rustc front end in Rust, LLVM backend, and mrustc as the alternative bootstrap path), edition system, a "release history" section with an anchor id (`#release-date`) that directly answers the release-date queries, and the Foundation era. Every claim sourced or dataset-backed.
2. Apply the same treatment (proportional to their query demand) to python, javascript, go, and java priority pages. Each gets a "release history" anchored section.
3. Strengthen `/guides/what-is-compiler-bootstrapping`: add an original SVG diagram of a bootstrap chain using the semantic relationship colors (violet for bootstrap edges), walk two real chains from the dataset (Rust via OCaml; Go via C at version 1.5), add a short glossary (bootstrapping, self-hosting, cross-compilation, trusting trust), and an FAQ block with FAQPage JSON-LD.
4. Add the FAQ question "When was {X} first released?" answer text to the release-history anchor so FAQ JSON-LD and visible content stay consistent (a per-node release FAQ already exists from earlier work; link it to the new anchors).

Acceptance criteria:
- The five priority language pages each exceed 1200 words of body content with at least 4 distinct sections and an anchored release-history section.
- The bootstrapping guide contains the SVG diagram, two dataset-backed chains, glossary, and FAQ JSON-LD that validates (test at validator.schema.org or with a JSON-LD parse in the validator script).
- Validation gate passes.

---

### Phase 5: New pillar content, comparisons and chains

Status: complete (2026-07-02). PR #25 merged. 3 new guide pages: typescript-vs-javascript-implementation (~981 words), graalvm-vs-hotspot (~1057 words), the-c-bootstrap-chain (~987 words, chains computed from dataset BFS over *_written_in edges). 13 guides total, 306 sitemap URLs. 0 errors, 0 warnings.
Impact: medium-high. Effort: high. Dependencies: Phases 1 and 2.

Why: the site's unique asset is computable implementation lineage. Nobody else can generate "the full chain from Rust back to machine code" from data. Comparisons and chain pillars capture adjacent query demand the current page types cannot.

Tasks:

1. Comparison guides (only where BOTH sides are dataset nodes and the angle is implementation/toolchain, never "which should I learn"):
   - `typescript-vs-javascript-implementation` (tsc in TypeScript, swc in Rust, esbuild in Go; the transpile relationship)
   - `graalvm-vs-hotspot`
   - `cpython-vs-pypy` ONLY if PyPy is added to the dataset first (it currently is not; add it with proper edges if you take this one)
   - `gcc-vs-llvm` and `v8-vs-spidermonkey-vs-javascriptcore` already exist; review them against the Phase 2 title formulas instead of rebuilding.
2. One chain pillar guide: `the-c-bootstrap-chain` (working title: how modern languages trace their toolchains back to C and assembly). Compute real paths from the dataset at generation time (BFS over `*_written_in` edges) and render 5 to 8 named chains as styled lists plus one SVG overview diagram. This page should be the canonical internal-link target whenever any page mentions a chain.
3. Each new guide: TechArticle JSON-LD with dates, BreadcrumbList, the Phase 2 title formula, and at least 900 words of original content.
4. Update sitemap and validator counts.

Acceptance criteria:
- At least 3 new guide pages live, each meeting the JSON-LD, length, and formula requirements.
- The chain pillar's chains are generated from the dataset (verifiable in the generator code), not hand-typed.
- Validation gate passes.

---

### Phase 6: Internal linking architecture and crawl-depth audit

Status: DONE (2026-07-02). PR #27 merged.
Impact: medium. Effort: medium. Dependencies: Phases 3 and 5 (link targets exist).

Why: link equity currently pools in footers and ad-hoc related blocks. With roughly 300 pages after Phase 3, deliberate hub-and-spoke linking decides which pages rank.

Tasks:

1. Write a small audit script (`scripts/auditInternalLinks.ts`, add an npm script `seo:links`): crawl all generated HTML in `public/`, build the internal link graph, and report (a) pages not reachable within 3 clicks from `/`, (b) orphan pages with fewer than 2 inbound links, (c) broken internal links. Output a markdown report to stdout.
2. Fix the findings structurally in `generateSeoPages.ts`, not with link stuffing:
   - Language pages link to: their question page, every implementation-language and implemented-thing node page (already largely present via the relationship map), the relevant relationship hub pages, and at most 2 contextually relevant guides.
   - Question pages link back to their language page and the chain pillar when a bootstrap edge exists.
   - Guides link to every node page they mention.
   - The `/languages/` and `/tools/` index pages must list all nodes grouped in a scannable way (by decade or by paradigm, pick one and encode it as real structure).
3. Keep every related-links block inside `<aside data-nosnippet>` (the pattern exists; preserve it, it prevents snippet cannibalization).
4. Re-run the audit until clean, then wire `seo:links` into `seo:validate` or document why not.

Acceptance criteria:
- Audit script exists, runs via npm, and reports zero orphans, zero over-depth pages, zero broken links.
- No page gained more than roughly 15 new outbound in-content links (guard against link stuffing).

---

### Phase 7: Per-page social images (OG cards)

Status: DONE (2026-07-02). PR #26 merged. 191 OG images generated (3.9 MB), one per language/tool page.
Impact: medium (social CTR, Discover eligibility). Effort: medium. Dependencies: Phase 1 (logos).

Why: every page currently shares one generic OG image. Per-page cards make shares and SERP thumbnails distinctive.

Tasks:

1. Add a build-time generator `scripts/generateOgImages.ts` (npm script `og:generate`). Recommended approach: `satori` (JSX to SVG, works in plain Node with font files) plus `@resvg/resvg-js` (SVG to PNG). Avoid headless-browser screenshot approaches; they are flaky in CI.
2. Card design (follow Section 1.6 exactly): 1200 by 630, pure black background, Fraunces 600 title (the node name or question), JetBrains Mono eyebrow with the page type, the node's logo when `logo_kind` is not `none`, a small directed-triad brand mark bottom-left, and for node pages a minimal 3-node relationship motif using the correct semantic edge colors. No gradients, no glows.
3. Scope control: generate for the top 40 pages by GSC impressions FIRST (list them from `reports/GSC SEO rep/.../Pages.csv`), plus all guides and question pages created in Phases 3 to 5. Full 300-page coverage only if total added weight stays under 20 MB (keep each PNG under 120 kB; reduce colors or dimensions if needed).
4. Write to `public/og/{type}-{slug}.png` and wire `og:image`, `og:image:width/height`, and `twitter:card=summary_large_image` into `generateSeoPages.ts` with a fallback to the existing global image.
5. Fonts for satori: download the exact Fraunces and JetBrains Mono weights as TTF/OTF into `scripts/assets/fonts/` (check their licenses permit this; both are OFL).

Acceptance criteria:
- Cards render correctly (open 5 PNGs and look at them; if your environment cannot view images, ask the owner to review a sample before generating all).
- Every covered page's meta points at its card; uncovered pages fall back cleanly.
- Total repo weight added under 20 MB; each image under 120 kB.
- Validation gate passes.

---

### Phase 8: Static page UI/UX editorial pass

Status: DONE (2026-07-02). PR #29.
Impact: medium (dwell time, perceived quality, mobile CTR). Effort: medium. Dependencies: Phase 4 (long pages exist to style).

Why: content phases will make pages much longer; the reading experience has to keep up, especially on mobile where GSC shows 529 impressions and 0 clicks.

Tasks:

1. Reading rhythm on `public/seo.css`: measure line lengths (target 60 to 75 characters per line for body text), vertical rhythm between sections, and consistent Fraunces/Geist/Mono role separation per Section 1.6.
2. Table of contents: for any generated page whose body exceeds 1500 words (the Phase 4 priority pages and long guides), render a compact TOC after the intro, links to section anchors, JetBrains Mono, no decoration. Generate it from the section headings in the generator, never hand-maintain.
3. Tables on mobile: wrap all generated tables in an overflow-x container; verify at 320px and 390px that nothing forces horizontal page scroll.
4. Figure treatment: a consistent style for the SVG diagrams added in Phases 4 and 5 (hairline border `rgba(255,255,255,.10)`, surface `#0e0e0e`, caption in Mono, `#9a9a9a`).
5. The signature element rule: on language pages the top relationship map is the signature; audit that nothing added in Phases 4 to 7 competes with it (no second hero-weight element per page).
6. Verify with Playwright at 320, 390, 768, 1440 widths on 5 representative pages: no horizontal overflow, TOC anchors work, tables scroll internally.

Acceptance criteria:
- Playwright viewport checks pass on the 5 representative pages at all 4 widths.
- TOC appears only on pages over 1500 words and is generated, not hardcoded.
- No CSS token drift: any new values must reference the existing custom properties in `seo.css`.

---

### Phase 9: Explore app upgrades (deep links, trace mode, accessible table)

Status: DONE (2026-07-02). PR #30.
Impact: high for product usefulness. Effort: high. Dependencies: none technically, but do it after the SEO phases; it is SPA-only and invisible to crawlers.

Why: the graph is the product's soul, but it is currently a dead end: not linkable, not accessible, and it cannot answer "how do these two connect", which is the most natural question a graph invites.

Tasks:

1. Deep linking. Support `/explore?node={id}` (e.g. `?node=lang:rust`): on load, wait for layout ready, then select and center that node with the existing focus/highlight behavior (`selectors.ts` classes `.highlighted` and `.faded`). Selecting a node updates the URL via `history.replaceState` (do not push history entries per click). Add a "Copy link" affordance in the existing side drawer. Read the param with react-router's `useSearchParams` in `GraphExplorer.tsx`; store the pending focus in the Zustand store so `GraphView` can act on it after layout settles.
2. Static-to-SPA bridging: in `generateSeoPages.ts`, make every language/tool page's existing "open in graph" link (add one near the relationship map if absent) point to `/explore?node={id}`.
3. Trace mode. A "Trace" toggle in the control panel: user picks node A then node B; compute the shortest path with BFS over the normalized edges (treat edges as undirected for pathfinding but preserve and display real direction in the result), restricted to the currently active relationship-type filters; highlight the path with `.highlighted`, fade the rest with `.faded`; render the chain as text in the side drawer ("C, which Python's runtime is written in, ..."), with each hop labeled by its relationship type in its semantic color. Escape or a clear button exits trace mode. If no path exists under active filters, say exactly that and offer to include all relationship types.
4. Accessible relationship table: an "As table" view (visually hidden skip-link target or a drawer tab) listing the focused node's relationships as a real `<table>` with proper headers. This also serves keyboard users who cannot operate the canvas.
5. Mobile check: drawer, trace mode, and copy-link work at 390px; pinch and pan still work.

Acceptance criteria:
- `/explore?node=lang:rust` loads focused on Rust; copy-link reproduces the state; `/embed?lang=` behavior unchanged.
- Trace between `lang:python` and `lang:rust` renders a correct, direction-accurate chain (verify hops against the dataset by hand).
- The relationship table is reachable by keyboard alone and announced sensibly by VoiceOver (or document the exact markup pattern used: `caption`, `th scope`, etc.).
- `npm run type-check` and `npm run build` pass; no regression in default explore behavior (load, filter, layouts, timeline controls).

---

### Phase 10: Homepage conversion pass

Status: DONE (2026-07-02). PR #31.
Impact: medium. Effort: low-medium. Dependencies: Phase 9 (deep links make the featured section far stronger).

Why: the homepage ranks (position 7.3, 1.85% CTR, the site's best) but sends visitors only to `/explore`. It should also route people and link equity to the records and guides.

Tasks:

1. Add one section to `LandingPage.tsx` between the existing hero/atlas sections and the footer: "Field records" (or similar plain name), a quiet grid of 6 entries: rust, python, javascript, go, java language pages plus the bootstrapping guide. Each entry: node name in Fraunces, one dataset-backed fact in Geist (pull from the dataset/enrichment at build or import time, not hardcoded strings), relationship-colored tick for its dominant edge type, link to the static page. No images, no cards with shadows; hairline borders per the design system.
2. Do NOT touch the approved hero, the atlas glimpse section, or the nav. This is one added section.
3. Keep LCP intact: the section is below the fold; no new fonts, no new images, and it must not import the dataset in a way that grows the initial JS bundle (a small build-time constant or a JSON import of just 6 entries is fine; verify chunk sizes in the build output).

Acceptance criteria:
- Six entries render with real facts and working links at all breakpoints down to 320px.
- Landing JS bundle size within 5 kB of its pre-phase size (compare `vite build` output).
- The owner-approved hero and atlas sections are pixel-untouched.

---

### Phase 11: Performance and Core Web Vitals

Status: DONE (2026-07-02). PR #32.
Impact: medium (CWV is a ranking signal; mobile 0% CTR partly reflects experience). Effort: medium. Dependencies: Phases 7, 8, 10 (measure after the additive phases so wins stick).

Tasks:

1. Baseline: run Lighthouse (mobile emulation) on `/`, `/languages/rust/`, `/questions/what-is-rust-written-in/`, `/explore`. Record LCP, CLS, INP, and the performance score in the PR.
2. Fonts: three Google Fonts families is the heaviest static-page cost. Self-host the exact subsets (Fraunces 400/500/600 with opsz, Geist 400/500/600, JetBrains Mono 400/500/600) as woff2 in `public/fonts/`, `font-display: swap`, preload only the two files used above the fold, and update both `index.html` and `FONTS_HEAD` in `generateSeoPages.ts`. Both faces are OFL, self-hosting is permitted. Remove the Google Fonts stylesheet links and preconnects once verified.
3. Images: every generated `<img>` (logos) gets explicit `width`/`height` and `loading="lazy"` below the fold. Check the OG pipeline did not accidentally get referenced as on-page images.
4. Static CSS: check `public/seo.css` size; if over roughly 30 kB, split print/rare rules; do not inline-critical unless measurements demand it.
5. Confirm the Cytoscape chunk stays lazy (only loaded on `/explore`, `/embed`, and when the landing glimpse scrolls into view) by checking the network panel or build chunk names.
6. Targets: LCP under 2.5s and CLS under 0.1 on mobile emulation for the three static pages; explore is exempt from LCP but must not regress.

Acceptance criteria:
- Before/after Lighthouse numbers in the PR; targets met on the three static pages.
- Zero requests to fonts.googleapis.com or fonts.gstatic.com from any page.
- Validation gate passes.

---

### Phase 12: Accessibility sweep

Status: not started.
Impact: medium. Effort: medium. Dependencies: Phase 9 (the graph table exists).

Tasks:

1. Contrast audit against WCAG AA. Known suspect: faint text `#5a5a5a` on `#000000` is roughly 4.0:1, which FAILS AA for normal-size body text. Audit every use; where it carries meaning (not decoration), bump to at least `#767676` on black (4.5:1) or restrict to large text. Apply in both `tokens.css` and `seo.css`.
2. Keyboard: visible focus rings (green accent, 2px offset) on every interactive element in both the SPA and static pages; a skip-to-content link on static pages; logical tab order in the explore control panel and side drawer.
3. Screen readers: alt text for every logo image (pattern: `{Name} logo`); `aria-label`s on icon-only controls; heading hierarchy audit (exactly one h1 per page, no skipped levels) added as a `validateSeo.ts` check.
4. Reduced motion: `prefers-reduced-motion` disables the landing hero effects (`HeroFx.tsx`), graph layout animations, and any scroll reveals. Verify, do not assume.
5. Run axe (via `@axe-core/playwright` or the axe CLI) on 6 representative pages; fix everything above "minor".

Acceptance criteria:
- axe reports zero serious or critical issues on the 6 pages.
- Heading-hierarchy check lives in the validator and passes sitewide.
- Contrast fixes applied in both token files; no visual identity drift (spot-check screenshots).

---

### Phase 13: Distribution, embeds, and citability

Status: DONE (2026-09-01). Per-page embed blocks, the dataset page's CC BY 4.0 license, citation block, version, counts and download already shipped 2026-07-02; this pass added the public `/embed-kit` guide (live iframe, snippet, the one `lang` parameter, sizing, attribution), linked it from every language page's embed block and the footer, and added `DISTRIBUTION.md` with the launch checklist. Link audit: 0 broken, 0 over-depth, 0 orphans.
Impact: medium (this is the backlink phase; links need artifacts worth linking). Effort: medium. Dependencies: Phases 1 and 9.

Tasks:

1. Embed kit: on the `/dataset` page and each language page's graph link area, add an "Embed this graph" block with a copy-paste iframe snippet pointing at `/embed?lang={slug}` (the param already works), fixed height, plus one sentence of attribution guidance. Test the snippet in a plain HTML file.
2. Citable dataset: upgrade the `/dataset` page into a proper artifact page: Dataset JSON-LD (verify what the SPA shell already emits and consolidate to one source of truth), version string, node/edge counts generated from the data, an explicit license statement (CHECK whether the repo declares a dataset license; if none exists, STOP and ask the owner which license to apply rather than inventing one), a direct download link to the JSON, and a suggested citation block in Mono.
3. Refresh `generateLlmsTxt.ts` so `llms.txt` covers all post-Phase-5 pages with one-line descriptions, and add `llms-full.txt` if page count makes the short file useless.
4. README refresh for GitHub discovery: what the site is, the dataset stats, a screenshot, links to the live site and dataset page. (The repo is public-facing surface area; treat it as a landing page.)

Acceptance criteria:
- The iframe snippet works from a file:// test page.
- Dataset page shows license, version, counts, download, and citation; JSON-LD validates.
- `llms.txt` regenerates deterministically and lists every indexable page.

---

### Phase 14: Measurement loop (continuous)

Status: recurring, never "done".
Impact: compounds everything. Effort: low per iteration. Dependencies: at least Phases 2 to 4 shipped.

Cadence: every 2 to 4 weeks after a content phase ships.

Tasks per iteration:

1. Export fresh GSC data (Performance report, last 28 days, compare to previous period) into `reports/GSC SEO rep/` with the date in the folder name (gitignored, fine).
2. Compare against the Section 2 baseline and the previous iteration. Track, at minimum: CTR and position for the 10 baseline queries, impressions/clicks for the top 10 pages, mobile clicks, and Search Appearance (watch for FAQ or Article rich results appearing).
3. Decision rules:
   - A query at position 10 or better with CTR under 1% after 3 or more weeks: iterate that page's title/description (write variant B, note the date, wait another cycle).
   - A page climbing through positions 15 to 25: expand its content (Phase 4 treatment).
   - New query patterns with 10 or more impressions and no dedicated page: add to a candidates list; build only when a pattern repeats across pulls (avoid chasing noise).
   - Rich results appeared: verify eligibility on similar pages and replicate the exact JSON-LD pattern.
4. Append one row to the log table below.

Measurement log:

| Date | Sitemap URLs | Total clicks (28d) | Total impressions (28d) | Notes |
|---|---|---|---|---|
| 2026-06-25 | 199 | ~7 | ~2900 | Baseline. Rankings fine, CTR broken. |
| 2026-09-01 | 304 | 30 | 4770 | 28d to Aug 29 vs prior 28d (20 / 4085). CTR 0.49% -> 0.63%. Query-class split: definitional 2613 impr @ 0.08%, exploratory 103 @ 2.91%. Shipped this date: static-page analytics, canonical consolidation, variant-B titles on the five money pages, family-tree figure. Compare these five on the next pull before iterating again. |

---

## Section 5: Discovered work (parking lot)

Agents: when you notice out-of-scope problems during a phase, add one line here instead of fixing them inline.

- (empty)

---

## Section 6: Definition of done for the whole plan

- Every query in the Section 2 baseline table has CTR above 1% or a documented iteration in the measurement log.
- All 152 nodes have complete pages (enrichment, logo where one exists, question page where the data supports it).
- The graph is linkable (`?node=`), traceable (path mode), and accessible (table view).
- Lighthouse mobile: 90+ performance on the three benchmark static pages.
- axe: zero serious issues on representative pages.
- The site can be cited (dataset page) and embedded (iframe kit) by third parties.
