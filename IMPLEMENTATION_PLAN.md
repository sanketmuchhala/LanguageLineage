# Language Lineage Implementation Plan

**Prepared:** 2026-09-03  
**Source:** `GROWTH_MASTERPLAN.md` and `docs/GROWTH_MASTERPLAN_FULL.md`  
**Planning horizon:** First launch plus 12 months  
**Current state:** Planning only; no implementation in this document is marked complete unless it is already present on `origin/main` or explicitly recorded as shipped.

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
