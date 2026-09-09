# Language Lineage Implementation Plan

**Prepared:** 2026-09-03  
**Source:** `GROWTH_MASTERPLAN.md` and `docs/GROWTH_MASTERPLAN_FULL.md`  
**Planning horizon:** First launch plus 12 months  
**Current state:** Stage 0 and Stage 1 (all 9 items) complete. Work now lands directly on `main`.

## Progress log

### 2026-09-03 — Stage 0 complete

- Preserved the research in safety commit `6698d564` on `preserve-claude-research-2026-09-03`.
- Fetched the remote and confirmed local `main` had been 164 commits behind.
- Created `implementation-2026-09-03` from `origin/main` at `118b7a49` and cherry-picked the research documents.
- Confirmed the latest public Vercel production deployment reports SHA `118b7a49`.
- Ran `npm ci` successfully. Audit reported 10 dependency vulnerabilities (2 low, 2 moderate, 6 high); remediation is a separate reviewed task and must not use `--force` casually.
- Ran the production build successfully: it generated 152 language/tool pages and a 304-URL sitemap.
- Ran `npm run seo:validate`: 0 errors and 0 warnings.
- Ran `npm run seo:links`: 0 broken links, 0 over-depth pages, and 0 orphans.
- Compared the exact local and live sitemap URL sets: 304 on each with zero differences.
- Restored build-generated HTML/date churn after verification; the tracked worktree contains only the planning commit.
- Left `.claude/settings.local.json` and the stale-v4 `bench.mjs` untracked and excluded from the implementation branch.

### 2026-09-04 — Stage 1 items 1–2 complete

- Replaced the blanket SPA rewrite with explicit `/explore` and `/embed` rewrites plus a static noindex 404 page; API, static, and Vercel system routes remain outside the SPA catch-all.
- Corrected generated related-page cards so they are derived only from relationships incident to the current node, deduplicated, and limited to 12.
- Added a documented same-cluster fallback that runs only for isolated nodes.
- Added SEO validation for duplicate/unrelated related-page cards and the prior Lua/Ada identical-output regression.
- Regenerated all 152 language/tool pages. The production build, SEO validator, and internal-link audit pass with 0 validation warnings, 0 broken links, 0 over-depth pages, and 0 orphans.

### 2026-09-07 — Stage 1 item 3 complete

- Replaced the two build stamps—`generateSitemap.ts`'s `new Date()` and `generateSeoPages.ts`'s `BUILD_DATE`—with a single stable per-page date. Both had to go together: `BUILD_DATE` rewrote every page's bytes on every build, which would have defeated any content-based scheme.
- Added `scripts/pageDates.ts` and a committed hash manifest at `scripts/page-dates.json` mapping each URL to its last-written content hash and the date that content first appeared. Pages render a `__LASTMOD__` placeholder, so the date is never part of its own hash; `writeFile` resolves and substitutes it at the single write choke point.
- Added `scripts/seedPageDates.ts` (`npm run seo:seed-dates`), a one-shot pass that backdates the manifest from git history—per-node pickaxe against `dataset/v5/lineage_v5.json`, per-slug against the generator source.
- Removed `changefreq` and `priority` from the sitemap; Google ignores both.
- Result: 6 distinct `lastmod` values across 304 URLs, up from 1. Verified idempotent—two consecutive `seo:generate` runs leave all 307 HTML files byte-identical with an unchanged sitemap and manifest.
- Verified targeted propagation: changing one node's `first_release_year` re-dated exactly the 4 URLs that render it, leaving 305 untouched.
- Added four validator checks (distinct-value floor, ISO/non-future dates, no `changefreq`/`priority`, no unsubstituted placeholder) so a build-stamp regression fails the gate.
- Known limitation: `/` and `/explore` are SPA routes with no generated file, so nothing rehashes them. They are seeded from git and pinned via `PRESERVED_URLS`; their dates will go stale if the SPA shell changes. Stage 2's static `/explore` text layer would fix this automatically.
- The commit carries a one-time 285-file `public/` re-date as pages move off the build stamp. Type-check, SEO validator, link audit, and production build all pass.

### 2026-09-07 — Stage 1 item 4 complete

- Added a Cache-Control header scoped to `/dataset/:version(v\d+)/:path*` in `vercel.json`: `public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400`.
- Deliberately not `immutable`, despite the plan's original wording. v5 files are edited in place within the version—Stage 4 alone plans ~40 enrichment edits—and a year-long browser TTL cannot be busted by a deploy the way the CDN cache can. A one-hour browser TTL removes the revalidation round-trip on the 268 KB dataset fetch while keeping edits visible within the hour, with no version-bump process required.
- The rule covers v1–v5 and any future v6 automatically; `/dataset` (the HTML page) is untouched and still returns `max-age=0, must-revalidate`.
- Extended `validateSeo.ts` with three checks: the rule must exist, must be public with a non-zero max-age, and must not be `immutable`; no rule may cache the bare `/dataset` page. Verified each check actually fails by injecting the fault it guards against.
- Merged to `main` as a fast-forward (`2cc03ff2`) and pushed; the header itself can only be confirmed on the live deploy since `vercel dev` hangs on this project.

### 2026-09-07 — Stage 1 item 9 complete (pulled forward)

- Rewrote `CLAUDE.md`'s canonical-plan pointer from `SITE_IMPROVEMENT_PLAN.md` to this file, noting the former's 13 phases are complete except Phase 12 (accessibility).
- Added a production-parity preflight section: fetch and compare against `origin/main` before any deploy-intending build, and check the built sitemap's URL count against the live one. Cites the concrete number that makes it real — the stale tree would have produced 156 sitemap URLs against 304 live, deindexing 136 pages.
- Wrote the three settled decisions (no database, no rename, AI-infrastructure scope boundary) with their reasoning and revisit triggers, not just the verdict, plus the admit/reject rule with each rejected direction's incumbent named.
- Fixed a real contradiction: `CLAUDE.md` said "do not change the dataset schema or field names," which blocked the Stage 4 enrichment work already planned. It now distinguishes field values (enrichable with a cited source) from schema shape (needs a dedicated PR), and adds an explicit human-review requirement on `evidence_source`/`confidence`.
- Merged to `main` as a fast-forward (`d3dde3cd`) and pushed.

### 2026-09-07 — Stage 1 item 5 complete

- Confirmed ownership with the user: the dataset was compiled via Claude-assisted synthesis from structured sources (Wikidata, official documentation, primary sources) with agent cross-checking, not copied prose — consistent with the Wikidata-facts-yes/Wikipedia-prose-never rule already in `SITE_IMPROVEMENT_PLAN.md` §1.8.
- Added `LICENSE` (MIT, copyright Sanket Muchhala), `dataset/LICENSE` (CC BY 4.0 short-form notice), and `dataset/README.md`. This formalized a license that was already publicly stated in three places in agreement — the `/dataset` page's License section and JSON-LD, root `README.md`, and §1.8 — rather than deciding a new one.
- `dataset/README.md`'s citation block is copied verbatim from `dataset/index.html` so there is exactly one canonical citation string.
- Added `"license": "MIT"` to `package.json`.
- Extended `validateSeo.ts` with three checks; verified each fails on the fault it guards against (missing file, wrong license text, drifted citation) before confirming the real files pass.
- Merged to `main` as a fast-forward (`0405abe4`) and pushed.
- **Not done here, requires `gh` CLI which isn't installed in this environment:** the paired GitHub repo description/topics update. Manual command for the user:
  ```
  gh repo edit sanketmuchhala/LanguageLineage \
    --description "..." \
    --add-topic programming-languages --add-topic compilers \
    --add-topic dataset --add-topic data-visualization \
    --add-topic bootstrapping --add-topic open-data
  ```

### 2026-09-08 — Stage 1 item 6 complete

- Added `scripts/repairImplementationScalars.ts` (`npm run dataset:repair-scalars`), a one-shot script that back-fills `current_primary_implementation_language` from each node's qualifying `compiler_written_in`/`runtime_written_in`/`bootstrap_written_in` edge.
- Repaired exactly the 43 recoverable nodes; left Machine Code, Assembly, BCPL, and Lazy ML untouched (no qualifying edge exists). `lang:s` was the one node with two candidates (C and Fortran); resolved with the same tie-break rule already used in `src/graph/tree/buildHierarchy.ts` for primary-parent selection, so both places in the codebase agree.
- Diff is exactly 43 changed values in one file — 86 lines, 43 insertions + 43 deletions, nothing else.
- Verified empirically, not assumed: ran `npm run seo:generate` and a full `npm run build` before and after, and confirmed zero files changed under `public/`. `generateSeoPages.ts` only reads this scalar as a fallback for nodes with no implementation edges, and all 43 repaired nodes already have edges, so their generated prose was already correct.
- Added a regression guard to `scripts/analyzeDataset.ts` (§3.5): flags any node reading "unspecified" while having a cited implementation edge. Verified it actually fails by re-introducing the bug on one node and confirming the guard caught it, before restoring the fix.
- Merged to `main` as a fast-forward (`4c6bc492`) and pushed.

### 2026-09-09 — Stage 1 item 7 complete

- Removed the deflection clause at its single source (`generateSeoPages.ts:1653`). The remaining sentence — "{Name} is primarily implemented in X." — was already a complete, correct answer sourced from the same edges the implementation section renders from; nothing needed to be added, only the "see above" filler removed. The 16 hand-authored `PRIORITY_CONTENT` overrides were never affected.
- Regenerated and traced the full diff: 118 HTML pages + `sitemap.xml` (lastmod correctly advances for genuinely changed content) + the `page-dates.json` hash manifest. Confirmed exactly 118 sitemap `lastmod` lines changed, matching the 118 pages fixed, nothing else moved.
- Added a `validateSeo.ts` check so the phrase can't reappear silently. Verified it actually fails by reintroducing the phrase on one page and confirming the check caught it, before restoring the fix.
- Merged to `main` as a fast-forward (`33d44752`) and pushed.
- **Not done, deliberately out of scope:** the sibling deflection "See the influence section above for the full list." (same code file, different FAQ entry) is the same defect class but wasn't named by item 7's text, so it was left untouched rather than assumed into scope.

### 2026-09-09 — Stage 1 item 8 complete — Stage 1 fully closed

- Added `scripts/checkEvidenceLinks.ts` (`npm run check:evidence-links`): HEAD each of the 218 unique `evidence_source` URLs with a 10s timeout, GET fallback for hosts that reject HEAD, retry with backoff on transient/5xx failures, 8-way concurrency (~15s for the full set).
- Deliberately not wired into `npm run seo:validate` — that gate must stay green with no network and must never fail on a source site's transient 503. This depends on the live internet and is meant to be run periodically and reviewed by a human, per the plan's own instruction to review and fix manually rather than auto-rewrite.
- Read-only with respect to `dataset/v5/lineage_v5.json`; writes a dated report to `reports/` (already gitignored, same convention as the existing GSC exports) plus a console summary with every failure mapped to the relationships it supports.
- Ran it against production: **207 OK, 6 benign redirects, 11 genuine failures** (10x 404, 1x 403). Spot-checked several failures with a real browser User-Agent via `curl` before trusting the result — confirmed genuinely dead, not an artifact of the checker's own bot User-Agent.
- The 11 failures were reviewed and fixed in a follow-up (`4d4a1434`), not left open — see below.
- Merged to `main` as a fast-forward (`e538d956`) and pushed.

### 2026-09-09 — Dead evidence links fixed (9 of 10; `vlang.io` was a checker bug, not a real failure)

- Researched and verified a replacement for each dead URL before using it — fetched every candidate and confirmed it explicitly states the specific claim it needs to support: Odin's FAQ (4 edges), SWC's README, Racket's real blog subdomain, the actual Dotty bootstrap post (dated 2015-10-23, not the 2016-11-11 the dataset cited — a transcription error), Wren's README, Unison's FAQ, and Hudak/Hughes/Peyton Jones/Wadler's "A History of Haskell" for GHC's 1989 Lazy ML prototype.
- Two deliberate compromises, noted rather than hidden: Hare's bootstrap citation uses a SlackBuilds package page rather than the official repo, because the official host (`git.sr.ht`) runs a JS bot-challenge explicitly aimed at "AI companies scraping" — a citation this checker itself could never verify. GNAT's self-hosting fact uses Wikipedia after three AdaCore/GNU pages failed to state it explicitly despite it being the true source.
- **Content correction, not a citation swap:** the dataset claimed "Roc's compiler is written in Rust," which is no longer current — Roc's compiler was rewritten to Zig starting 2025. Handled historically: the Rust edge keeps its citation and gains an `end_year`, a new Zig edge starts where it ends, and `lang:roc`'s `current_primary_implementation_language` scalar was updated to match (same defect class as item 6, triggered by this edit).
- **Left deliberately unfixed:** Haskell's claimed influence on Roc. No reliable source confirms it, and one primary source (a Feldman interview) arguably cuts against it. Flagged rather than given a citation that doesn't support the claim — still a known dead link.
- Fixed a real bug in `checkEvidenceLinks.ts` found while verifying `vlang.io`: it only retried GET when HEAD returned 403/405/501, missing a Cloudflare-fronted host returning a bare 404 on HEAD while GET succeeds. `vlang.io` was never actually dead — it dropped the failure count from 11 to 10 real failures.
- Fixed a second, more concerning bug this exposed in `validateSeo.ts`'s item-5 citation check: it compared `dataset/README.md` against a citation string **hardcoded at write time** ("443 relationships"), so it silently stopped being a real check the moment this edit moved the count to 444 — it would have reported "OK" forever after that regardless of drift. Now extracts the citation dynamically from `dataset/index.html`'s own generated content.
- Re-ran the checker after: 221 OK, 6 benign redirects, exactly the 1 expected remaining failure (Haskell→Roc, left flagged above).
- Merged to `main` as a fast-forward (`4d4a1434`) and pushed.

**Stage 1 is now fully closed (9 of 9).**

### 2026-09-09 — Stage 2.1 complete: flagship centrality ranking page

- Added `scripts/centrality/` (`pageRank.ts`, `descendants.ts`, `closures.ts`), pure functions with no file I/O, 17 unit tests on toy graphs (line, diamond, cycle, self-loop, isolated nodes). Widened `vitest.config.ts` to cover `scripts/**/*.test.ts`.
- `scripts/computeCentrality.ts` runs as the new first step of `seo:generate`, writes `public/rankings/centrality.json` once; `generateSeoPages.ts` reads that file back in to render `/rankings/most-influential` — one computation, two consumers, so the page and the downloadable artifact cannot drift apart. Fails loudly if the file is missing rather than rendering an empty page.
- Verified before shipping, not after: descendant counts reproduce the documented research benchmark exactly (ALGOL 65/131, Lisp 60, C 49, Simula 46, Pascal 46, ML 47 — byte-identical to `docs/GROWTH_MASTERPLAN_FULL.md:125-132`), confirming the `influenced` edge set hasn't changed since that research. PageRank rank order matches exactly; percentages run a few tenths of a point higher throughout, attributable to convergence/dangling-node handling differences between independent implementations, not a data change — the page's methodology section says this plainly. The C/C++ implementation closure (92 of 152 nodes, 61%) is the page's second, independently strong stat.
- Added to `FOOTER_HTML` (present on all ~305 pages) as a peer to the existing "Programming language graph" link. This legitimately re-dated 303 of 305 pages under the item-3 date system — a real one-time sitewide content change, not a regression.
- That exposed a real miscalibration in item 3's own validator: it required "5+ distinct lastmod values," a threshold set from one observed day rather than the actual defect signature. Fixed to test for what `BUILD_DATE` actually looked like — a single value shared by every URL, unconditionally, forever — verified by forcing that exact fault and confirming it still fails, then confirming idempotence holds across two consecutive full builds.
- Caught two other things before they shipped: a `generatedAt` timestamp in the JSON artifact that would have made it churn every build regardless of content (same defect class as `BUILD_DATE`, removed before commit); and mid-verification, a `git checkout --` used to undo a fault-injection test restored from `HEAD` instead of the fault alone, wiping the real in-progress sitemap — caught immediately and recovered by re-running `seo:generate` rather than trusting git to hand back uncommitted work.
- Merged to `main` as a fast-forward (`7e3cad38`) and pushed.

**Next task:** Stage 2.2 — retention before traffic. RSS feed in the `seo:generate` chain, one email signup on `/dataset` and the rankings page, privacy/consent check. The plan is explicit: **do not submit this anywhere (HN, Reddit) until this exists** — an audience with nothing to catch it is a spike, not a readership.

## 1. Executive direction

Language Lineage should become the evidence-cited graph of programming-language and software implementation provenance. The product advantage is the graph, its cited relationships, and reusable data—not a growing collection of generic definition pages.

The implementation order is:

1. Preserve the research and reconcile the stale checkout with production.
2. Remove launch-blocking correctness, crawl, caching, legal, and evidence defects.
3. Build one reproducible data story and a way to retain visitors.
4. Launch and distribute the existing graph, dataset, and embed.
5. Deepen the evidence/content moat using deterministic quality gates.
6. Add narrow AI-infrastructure provenance only after the core launch.
7. Automate measurement only when traffic is sufficient to make it useful.

Decisions that are closed unless the stated trigger occurs:

- Keep JSON-in-git. Reconsider a database only for user accounts, outside-repo contributors, or more than three concurrent human editors.
- Keep `languagelineage.org` and do not buy defensive domains.
- Do not add generic AI education, model-lineage, or model-tracker products.
- Do not mass-generate more definition, question, or comparison pages.
- Expand into AI only through implementation-provenance nodes and the existing edge types.

## 2. Ground truth and work already completed

The local `main` checkout is stale at `7f2c9303`. The currently recorded `origin/main` is `118b7a49`, 164 commits ahead. All implementation must be based on a freshly fetched production branch, not the present local tree.

Already shipped on `origin/main`:

- Dataset v5: 152 nodes (131 languages and 21 tools), 443 cited relationships.
- 304 sitemap URLs, including 132 language/tool pages and 117 question pages.
- 96 populated logo URLs.
- SEO/site-improvement phases 1–11 and 13, except the defects below.
- Permanent apex-to-`www` redirect.
- Correct sitemap URL in `robots.txt`.
- `/timeline` prerendering.
- `llms-full.txt`.
- Dataset/citation page and CC BY 4.0 presentation on the site.
- `/embed-kit` and `src/app/EmbedGraph.tsx`; this needs verification and promotion, not a rebuild.
- Vercel Analytics on static pages.
- A correction-proposal API/form, pending production token/configuration verification.
- Two completed SEO experiments: title/meta rewriting and long-form enrichment of high-impression pages. Neither fixed the weak definitional-query CTR.

Research baseline recorded on 2026-09-01:

- 30 clicks and 4,770 impressions per 28 days; sitewide CTR 0.63%.
- Definitional queries: 2,613 impressions at 0.08% CTR.
- Exploratory queries: 103 impressions at 2.91% CTR.
- Mobile: 529 impressions and zero clicks.

This makes distribution and exploratory content the near-term constraint, not URL volume.

## 3. Stage 0 — Preserve and reconcile (first session, 2–3 hours)

This stage blocks every code or deployment task.

### Tasks

1. Preserve the current uncommitted research before switching branches:
   - `GROWTH_MASTERPLAN.md`
   - `docs/GROWTH_MASTERPLAN_FULL.md`
   - `docs/DEEP_RESEARCH_PROMPT.md`
   - this implementation plan
   - `.claude/settings.local.json` only if it is intentionally shareable
   - assess `bench.mjs` and the modified `public/sitemap.xml`; do not carry generated/stale artifacts forward by default
2. Put the research on a dedicated branch or commit so the untracked files cannot be lost.
3. Fetch the remote, create/reset the implementation branch from the freshly fetched `origin/main`, and bring only the research documents forward.
4. Confirm the Vercel production project deploys from `main` and note the deployed commit.
5. Install from lockfile and build.
6. Verify the generated sitemap contains exactly the same URL set as production (currently expected: 304), then run the SEO validator and internal-link audit.

### Acceptance criteria

- Worktree implementation base equals the freshly fetched production commit.
- Research documents are committed or otherwise recoverable.
- `npm ci`, `npm run build`, `npm run seo:validate`, and `npm run seo:links` pass.
- Local and live sitemap URL sets have zero difference.
- No deployment has occurred from the stale v4 tree.

## 4. Stage 1 — Launch blockers and integrity (week 1)

Implement as small, reviewable PRs. Do not combine dataset edits, hosting changes, and generated-page changes in one PR.

| Order | Work | Implementation notes | Verification |
|---|---|---|---|
| 1 | Real 404 behavior | Replace the blanket SPA catch-all with explicit application rewrites and a generated/static 404. Preserve API and Vercel system routes. | A random unknown path returns 404; `/explore`, `/embed`, static pages, `/api/propose`, and analytics assets still work on preview. |
| 2 | Fix related-page links | In `buildRelatedSection`, first filter relationships to edges where the current node is an endpoint, then deduplicate and apply a documented fallback only when necessary. | Related blocks differ by node; Lua and Ada are not byte-identical; all links resolve; SEO link audit passes. |
| 3 | Correct sitemap dates | Derive stable per-URL dates from the content/input responsible for each generated page. Remove `changefreq` and `priority`. | At least five distinct `lastmod` values; unchanged pages retain dates on repeated builds/deploys. |
| 4 | Cache immutable v5 data | Add a narrowly scoped cache header for versioned `/dataset/v5/*` assets. | Repeat request has the intended long-lived public cache header; HTML and unversioned resources are unaffected. |
| 5 | Add explicit licenses | Root code license: MIT. Dataset license: CC BY 4.0, plus exact attribution text in `dataset/README.md`. Confirm ownership before committing. | GitHub detects the code license; dataset reuse terms and attribution are unambiguous; Zenodo is no longer blocked. |
| 6 | Repair implementation display data | For the 47 `unspecified` scalar fields, copy 43 values deterministically from existing implementation edges. Leave Machine Code, Assembly, BCPL, and Lazy ML unchanged unless new cited evidence is added. | Dataset analysis passes; no schema change; diff contains only intended scalar values. |
| 7 | Remove FAQ deflection | Remove generated FAQ answers containing “See the implementation section above…” rather than publishing non-answers in structured data. | The phrase occurs zero times in generated output; structured-data validation passes. |
| 8 | Evidence link check | Add a deterministic checker for all unique `evidence_source` URLs with timeout/retry/report behavior. Review redirects and failures manually; do not rewrite evidence automatically. | Zero unexplained dead sources before launch; failures are reported without mutating claims. |
| 9 | Agent guardrails | Update `CLAUDE.md` with production-parity preflight, settled strategic decisions, scope boundary, and corrected dataset rule: values may be enriched with cited sources; schema-shape changes require a dedicated PR and human review. | A fresh agent session sees the warnings; instructions do not contradict dataset enrichment work. |

### Human-only checks during Stage 1

- Verify the GSC Domain property and record a fresh 28-day baseline.
- Verify the Vercel `GITHUB_TOKEN` is repository-scoped with Issues read/write only.
- On preview, test the correction form, rate limiting, analytics asset, and an actual tracked pageview.
- Confirm code/dataset licensing choices before merging license files.

## 5. Stage 2 — Build the launch package (weeks 2–3)

### 5.1 Reproducible flagship story

Build `scripts/computeCentrality.ts` against v5. It should compute, not transcribe:

- reverse PageRank over `influenced` edges with damping 0.85;
- transitive descendant counts;
- selected implementation closures such as the C/C++ chain;
- stable machine-readable and human-readable output.

Use this output to generate `/rankings/most-influential`. The page must explain the method, lead with the curation caveat, link to the calculation/source data, and contain no manually copied ranking values that can drift.

Verification:

- Unit-test the algorithm on a small fixture.
- Reproduce the research benchmark values or document why current v5 inputs change them.
- Ensure all displayed values come from generated results.
- Add the page to internal navigation/sitemap only after quality checks pass.

### 5.2 Retention before traffic

Before submitting the launch anywhere:

- Add an RSS feed generated in the existing SEO build chain.
- Add one restrained email signup on the dataset and flagship story pages.
- Confirm privacy/consent behavior and successful signup delivery.
- Establish UTM conventions for every launch channel.

### 5.3 Product-surface readiness

- Add a useful static/indexable text layer to `/explore`, with links into the language/tool graph. Do not replace Cytoscape or migrate frameworks.
- Verify the existing embed has a visible attribution anchor, compatible CSP behavior, responsive sizing, and UTM attribution.
- Verify `/embed-kit` documentation by embedding it on a blank external test page.
- Publish CSV and GraphML exports and a small `/api` or data-access documentation page. SQLite is optional after the first two formats.
- Archive a release with Zenodo and add the DOI/citation once licensing is explicit.

### Stage 2 exit criteria

- Flagship story works from generated data and passes build/SEO/link checks.
- RSS and email capture work in production.
- Evidence checker reports no unexplained failures.
- Embed works outside the site and preserves attribution.
- Dataset is downloadable in JSON, CSV, and GraphML with a license and citation.
- Analytics and per-channel attribution are verified.

## 6. Stage 3 — Launch and distribute (weeks 3–8)

Launch only after Stage 2 exits. The owner should make posts and answer comments; agents may prepare copy, screenshots, fact sheets, and response notes.

### Sequence

1. Rehearse with `r/ProgrammingLanguages` or `r/compilers`, using the evidence/data angle and asking for corrections.
2. Fix credible dataset or presentation issues uncovered there.
3. Submit Show HN Tuesday–Thursday morning Eastern, linking to the homepage or flagship story.
4. Follow with `r/programming` and carefully selected language communities only when the linked page is genuinely relevant.
5. Pitch embed/data-story coverage to appropriate visualization/programming aggregators and directly contact a small set of compiler/PL educators.
6. Do not make a Lobsters invitation a launch dependency. Do not attempt self-promotional Wikipedia links.

Track sessions, engaged visits, email/RSS conversions, correction submissions, embeds, and referring domains by channel. Treat most community links as referral/credibility channels, not guaranteed ranking links.

### Launch branches

- If the launch performs: spend the next two weeks on corrections, embed outreach, exports, and one follow-up story—not more generic pages.
- If it dies quickly: record the result, improve the package based on comments, continue embed/educator outreach, ship the AI-infrastructure guide as a second independent story, and consider a resubmission no earlier than six months.

## 7. Stage 4 — Deepen the moat (months 3–6)

### Deterministic quality gate first

Add `scripts/contentQuality.ts` with exactly three enforced rules:

1. Citation/evidence integrity for factual implementation claims.
2. Duplicate/near-duplicate prose threshold across generated pages.
3. Required-content completeness for enriched/story pages.

Keep word count report-only initially and ratchet it from the observed baseline; do not block merges on an arbitrary 300-word threshold.

### Content enrichment

- Add `implementation_story` to the schema in a dedicated PR.
- Enrich approximately 40 high-value languages, beginning with C and pages selected by exploratory demand and graph importance.
- Each story should be 150–250 original words with primary sources where possible.
- Sustain no more than one substantive prose PR per week and no more than two open agent-content PRs.
- Run a read-only evidence audit at roughly 30 edges per month, prioritizing replacement of Wikipedia sources with primary documentation. Never let the auditing agent edit the claims it audits.

### Exploratory pilots—not mass generation

Run each as a limited experiment with an explicit measurement gate:

- Six `/bootstrap/{language}` pages.
- Decade and paradigm hubs only when member-count/content assertions pass.
- One refreshable GitHub repository-composition analysis/hub.
- Audit the existing 117 question pages and merge/redirect the zero-value tail rather than adding more.

Do not scale a template until it earns impressions or meaningful engagement in the exploratory class.

## 8. Stage 5 — Narrow AI-infrastructure expansion (months 3–6)

Start only after the core dataset has launched and the evidence/quality gates exist.

Pilot five nodes first: PyTorch, CUDA, ggml, llama.cpp, and BLAS. If the pilot is coherent and cited, expand toward the researched ceiling of roughly 12 tools and 35 relationships.

Rules:

- Use `tool:` nodes and only the six existing relationship types.
- No schema change for the expansion.
- Every new node requires at least one non-Wikipedia source.
- Prefer source repositories, official architecture documentation, papers, and release documentation.
- Cover implementation provenance only: what compilers, runtimes, libraries, and infrastructure are written in or transpiled to.
- Reject model genealogy, benchmark tracking, prompt/tutorial content, and general AI education.

The second flagship guide may be `/guides/what-modern-ai-is-written-in`, generated from these cited edges.

## 9. Stage 6 — Measurement and careful automation (months 4–12)

### Measurement cadence

Weekly, append:

- 28-day clicks, impressions, CTR, and average position;
- definitional versus exploratory query split;
- desktop versus mobile split;
- launch/referral traffic and referring domains;
- open agent-content PR count.

Monthly, record:

- indexed/submitted pages by sitemap/page type;
- median content depth and near-duplicate score;
- Wikipedia share and dead evidence URLs;
- detected embeds and subscribers.

### Automation order

1. Pull a fresh manual GSC baseline first.
2. Inspect existing read-only GSC connectors before adopting one; do not build a custom server.
3. Extend `scripts/analyzeGsc.ts` to emit query-class and device splits.
4. Add a weekly data-only pull after credentials, least privilege, and output redaction are verified.
5. Consider sitemap sharding when per-template indexation is needed for decisions.

Do not build a seven-rule opportunity engine or a 42-day per-page experiment ledger at this traffic level. If eight weekly pulls produce no action that moves aggregate CTR, remove or stop maintaining the automation and return the time to distribution.

## 10. Definition of done by horizon

### By end of week 1

- Production-aligned branch; stale checkout hazard eliminated.
- Real 404s, correct related links, stable sitemap dates, and versioned data caching.
- Explicit licenses and repaired display scalars.
- FAQ deflection removed and evidence links checked.
- Fresh GSC baseline recorded.

### By end of week 3

- Reproducible flagship ranking story.
- Working RSS/email capture.
- Verified embed and external dataset exports.
- Analytics and launch attribution tested.

### By end of month 2

- Initial community/HN launch completed and documented.
- Corrections resolved.
- DOI/citation and at least one active embed/educator outreach campaign.
- Decision made from evidence on the next story, not on additional generic pages.

### By end of month 6

- Deterministic content-quality gate in CI.
- Approximately 40 priority implementation stories underway or complete at the sustainable review rate.
- AI-infrastructure pilot published with non-Wikipedia evidence.
- At least one exploratory page pilot measured before expansion.

### By end of month 12

- Base target: 200 search clicks/28 days, 1,000 exploratory impressions/28 days, 20 non-search referring domains, and 3 live embeds.
- Good target: 800 search clicks/28 days, 3,000 exploratory impressions/28 days, 60 non-search referring domains, and 20 live embeds.
- Reassess targets using post-launch baselines; do not interpret the decay from a launch spike as failure.

## 11. Work that should not enter the backlog

- Database/Supabase/Postgres migration.
- Domain rename or defensive-domain purchase.
- More generic question pages or thousands of comparison pages.
- Another sitewide title/meta or generic word-count pass.
- AI tutorials, model-lineage graphs, or model trackers.
- A custom GSC MCP server, Indexing API integration, IndexNow, or BigQuery export at current scale.
- A ten-agent roster, broad autonomous write access, or LLM page auditing where scripts suffice.
- Framework migration to make the canvas graph indexable.
- Full extraction/refactor of the 5,982-line generator without a concrete blocked feature.
- Wikipedia backlink seeding.

## 12. Next action

The next implementation session should perform only Stage 0. Once production parity and a clean baseline are proven, open the Stage 1 PRs in the listed order. Nothing should be deployed from the current stale checkout.
