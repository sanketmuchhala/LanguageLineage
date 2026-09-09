# Language Lineage — Master Status

**Consolidated:** 2026-09-06
**Branch:** `implementation-2026-09-03` (based on `origin/main` @ `118b7a49`)
**Consolidates:** `GROWTH_MASTERPLAN.md`, `docs/GROWTH_MASTERPLAN_FULL.md`, `docs/DEEP_RESEARCH_PROMPT.md`, `IMPLEMENTATION_PLAN.md`, `SITE_IMPROVEMENT_PLAN.md`

Every status marker below was **verified against the working tree on 2026-09-06**, not copied from the source documents' own `Status:` lines. Where a source document claimed completion that the tree contradicts, the tree wins and the discrepancy is noted.

**Legend:** ✅ DONE · 🟡 PARTIAL · ⬜ PENDING · ♻️ RECURRING

---

## 1. Headline

| | |
|---|---|
| Site-improvement phases (old plan) | **12 of 13 done** — only Phase 12 (accessibility) open |
| Implementation Stage 1 (active plan) | **9 of 9 done — Stage 1 fully closed** |
| Consolidated priority items (35) | **12 done, 2 partial, 21 pending** |
| The constraint | **Distribution, not SEO.** 30 clicks / 28 days |

The two plans are not sequential. `SITE_IMPROVEMENT_PLAN.md` is largely complete but its *strategy* partly failed; `IMPLEMENTATION_PLAN.md` is the re-plan that replaced it. Work the second one.

---

## 2. Verified baseline (2026-09-01 GSC pull)

| Metric | Value |
|---|---|
| Clicks / 28d | **30** (prior 28d: 20) |
| Impressions / 28d | **4,770** (prior: 4,085) |
| Sitewide CTR | **0.63%** (prior 0.49%) |
| Definitional queries | 2,613 impressions @ **0.08%** CTR |
| Exploratory queries | 103 impressions @ **2.91%** CTR |
| Mobile | 529 impressions / **0 clicks** |
| Referring domains (non-search) | ~0 |

**The 36x gap between definitional and exploratory CTR is the single most important number in this document.** Everything downstream follows from it.

### Dataset / site scale (production, v5)

| | Value |
|---|---|
| Nodes | 152 (131 languages + 21 tools) |
| Relationships | 444, all cited (443 at last full count, +1 from the Rust→Zig split on Roc, 2026-09-09) |
| Sitemap URLs | 305 (304 at last full count, +1 for `/rankings/most-influential`, 2026-09-09) |
| Question pages / language pages | 117 / 132 |
| `logo_url` populated | 96 / 152 |
| `generateSeoPages.ts` | 5,982 lines |
| Edge types | `influenced` 252, `compiler_written_in` 96, `runtime_written_in` 67, `bootstrap_written_in` 15, `transpiled_to` 11, `rewritten_in` 2 |

---

## 3. Closed decisions — do not relitigate

| Question | Verdict | Reasoning | Revisit trigger |
|---|---|---|---|
| **Database?** | **NO** | MDN runs 14,000+ pages on markdown-in-git. GFG's MySQL serves a *paid contributor workflow*, not the read path. Git-diffable JSON is what makes agent PRs reviewable. | User accounts, outside-repo contributors, or >3 concurrent human editors |
| **Rename / new domain?** | **NO** | ~892 studied migrations average ~523 days to recover; 17% never do. EMD near-zero as a ranking factor since 2012. | None |
| **Expand into AI?** | **YES — one form only** | Implementation provenance of AI infrastructure as `tool:` nodes, existing six edge types, zero schema change. Not AI education, not model lineage, not model trackers. | None |
| **Do first?** | **Reconcile, then launch** | At 30 clicks/28d distribution is the constraint. | None |

**The governing rule: expand along edge types, never along topics.**

---

## 4. Live defects — status

Confirmed live 2026-09-03; re-verified 2026-09-06.

| # | Defect | Status | Evidence on 2026-09-06 |
|---|---|---|---|
| 1 | Site-wide soft 404 (`200 3153` on unknown paths) | ✅ **DONE** | `public/404.html` exists with noindex; explicit rewrites in `vercel.json` (commit `3325a623`) |
| 2 | `buildRelatedSection` no node filter — ~1,800 links pointing at 12 nodes | ✅ **DONE** | Commit `e8ce0cfe`; validator now checks duplicate/unrelated cards |
| 3 | Every URL claims the same `<lastmod>` | ✅ **DONE** | 6 distinct lastmod values; `changefreq`/`priority` removed. Hash manifest at `scripts/page-dates.json` |
| 4 | `/dataset/v5/*` re-fetched every load (268 KB) | ✅ **DONE** | 1-hour browser TTL, 1-year CDN TTL, not immutable (v5 is edited in place). Validator-enforced |
| 5 | 47 `unspecified` implementation scalars (43 recoverable from existing edges) | ✅ **DONE** | 43 repaired via `scripts/repairImplementationScalars.ts`; regression guard in `analyzeDataset.ts` §3.5 |
| 6 | FAQ deflection answers in structured data | ✅ **DONE** | Removed at the source; validator-enforced. Sibling "influence section above" deflection left untouched (out of item 7's stated scope) |
| 7 | `/explore` serves zero body text | ⬜ **PENDING** | No `public/explore/index.html` |

---

## 5. SITE_IMPROVEMENT_PLAN.md — 12 of 13 done

| Phase | Status | Notes |
|---|---|---|
| 0 · Preflight and baseline | ♻️ RECURRING | Run every session |
| 1 · Dataset completeness | ✅ DONE | 2026-07-02. Enrichment 148/152, logos 96/152 |
| 2 · SERP title/meta CTR pass | ✅ DONE | PR #22. **Outcome: failed** — definitional CTR stayed 0.08% |
| 3 · Question page expansion | ✅ DONE | PR #23. 104 auto pages; sitemap 199 → 303 |
| 4 · Rescue poor-position pages | ✅ DONE | PR #24. **Outcome: failed** — `/languages/rust` 898 impr → 2 clicks |
| 5 · New pillar content | ✅ DONE | PR #25. 3 guides, 13 total |
| 6 · Internal linking / crawl depth | ✅ DONE | Commit `f5043030` — *doc cites PR #27, which does not exist (rebased)* |
| 7 · Per-page OG images | ✅ DONE | Commit `f3f54394`. **191 PNGs verified in `public/og/`** — *doc cites PR #26, which does not exist* |
| 8 · Static page UI/UX pass | ✅ DONE | PR #29 |
| 9 · Explore app upgrades | ✅ DONE | PR #30 |
| 10 · Homepage conversion | ✅ DONE | PR #31 |
| 11 · Performance / CWV | ✅ DONE | PR #32. Self-hosted fonts |
| **12 · Accessibility sweep** | ⬜ **PENDING** | **The only open phase.** Blocks the plan's own definition of done |
| 13 · Distribution and embeds | ✅ DONE | 2026-09-01. `/embed-kit`, `DISTRIBUTION.md` |
| 14 · Measurement loop | ♻️ RECURRING | Log at §5 of that file |

### Phase 12 scope (the open one)

- ⬜ WCAG AA contrast audit. Known failure: `#5a5a5a` on `#000000` ≈ 4.0:1 — fails AA for body text. Fix in `tokens.css` **and** `seo.css`
- ⬜ Visible focus rings (green accent, 2px offset) on every interactive element, both surfaces
- ⬜ Skip-to-content link on static pages
- ⬜ Alt text on every logo (`{Name} logo`); `aria-label` on icon-only controls
- ⬜ Heading-hierarchy check added to `validateSeo.ts`
- ⬜ Verify `prefers-reduced-motion` disables `HeroFx.tsx`, graph layout animation, scroll reveals
- ⬜ axe on 6 representative pages; zero serious/critical

---

## 6. IMPLEMENTATION_PLAN.md — the active plan

### Stage 0 — Preserve and reconcile ✅ COMPLETE (2026-09-03)

- ✅ Research preserved on `preserve-claude-research-2026-09-03` (`6698d564`)
- ✅ Confirmed local `main` was 164 commits behind production
- ✅ `implementation-2026-09-03` created from `origin/main` @ `118b7a49`
- ✅ `npm ci`, production build, `seo:validate` (0/0), `seo:links` (0/0/0) all pass
- ✅ Local and live sitemap URL sets: 304 each, zero difference
- ⚠️ `npm audit` reported 10 vulnerabilities (2 low, 2 moderate, 6 high) — **deferred, not resolved**

### Stage 1 — Launch blockers and integrity · **9 of 9 — CLOSED**

| # | Work | Status | Verification state on 2026-09-06 |
|---|---|---|---|
| 1 | Real 404 behavior | ✅ **DONE** | `3325a623`. Static noindex 404; API/static/Vercel routes preserved |
| 2 | Fix related-page links | ✅ **DONE** | `e8ce0cfe`. Node-filtered, deduped, capped at 12, same-cluster fallback for isolated nodes |
| 3 | Correct sitemap dates | ✅ **DONE** | 6 distinct lastmod values; idempotent across runs; `BUILD_DATE` retired |
| 4 | Cache dataset assets | ✅ **DONE** | `public, max-age=3600, s-maxage=31536000`. Deliberately not immutable — v5 is edited in place |
| 5 | Add explicit licenses | ✅ **DONE** | MIT (code) + CC BY 4.0 (dataset), copyright Sanket Muchhala. Formalized what was already publicly stated on `/dataset`, README, and §1.8 |
| 6 | Repair implementation display scalars | ✅ **DONE** | 43 of 47 repaired; diff exactly 43 changed values, 0 files under `public/` changed |
| 7 | Remove FAQ deflection | ✅ **DONE** | 118 pages fixed at the source; diff traced end to end, 0 files carry the phrase |
| 8 | Evidence link check | ✅ **DONE** | `scripts/checkEvidenceLinks.ts` + follow-up fix (`4d4a1434`). 9 of 10 dead links replaced with verified sources; 1 (Haskell→Roc influence) left flagged, no reliable source found. Also caught a stale Roc fact (compiler rewritten Rust→Zig, corrected historically) and a self-inflicted validator bug (hardcoded citation check) |
| 9 | Agent guardrails in `CLAUDE.md` | ✅ **DONE** | Production-parity preflight, three settled decisions with reasoning, scope boundary, dataset schema/value distinction fixed |

**Human-only checks (none done):**
- ⬜ Verify GSC Domain property; record fresh 28-day baseline
- ⬜ Verify Vercel `GITHUB_TOKEN` is repo-scoped, Issues read/write only
- ⬜ On preview: correction form, rate limiting, analytics asset, a real tracked pageview
- ⬜ Confirm code/dataset licensing ownership before merging

### Stage 2 — Build the launch package · **2 of 3 groups**

**2.1 Reproducible flagship story** — ✅ **DONE** (`7e3cad38`, 2026-09-09)
- ✅ `scripts/computeCentrality.ts`: reverse PageRank over 252 `influenced` edges, damping 0.85; transitive descendant counts; C/C++ implementation closure. Runs as the first step of `seo:generate`, writes `public/rankings/centrality.json`
- ✅ `/rankings/most-influential` live. Headline: ALGOL 65/131 descendants (50%), Lisp 7.73% PageRank (percentages differ a few tenths from the 7.26% research figure — attributable to convergence/dangling-node handling, not data drift; descendant counts match the research benchmark exactly)
- ✅ 17 unit tests on toy graphs (`scripts/centrality/*.test.ts`); page reads numbers from the generated JSON, never transcribes; verified idempotent across repeated builds

**2.2 Retention before traffic** — ✅ **DONE** (`c8e917ca`, 2026-09-09) — scope reduced by user decision
- ✅ RSS feed live at `/rss.xml`, 14 items (13 guides + rankings page), wired into `seo:generate`
- ❌ **Email signup dropped, not built.** Asked the user how it should work (Buttondown vs mailto vs custom backend) before touching PII/account decisions; answer was "no newsletter" — scope reduced, not deferred to a placeholder
- N/A UTM conventions — was scoped to the email channel, moot once email capture was dropped
- ⚠️ **Gate note:** the plan's "do not submit anywhere until capture exists" referred to email capture specifically. With that explicitly declined by the user, RSS is the retention mechanism this project has; the gate is satisfied on the user's own terms, not fully met against the plan's original intent

**2.3 Product-surface readiness** — ⬜ PENDING
- ⬜ Static indexable text layer on `/explore` (2–4 h; do **not** migrate off Cytoscape)
- ⬜ Verify embed attribution anchor, CSP, responsive sizing, UTM
- ⬜ Verify `/embed-kit` by embedding on a blank external page
- ⬜ CSV + GraphML exports and an `/api` docs page (none exist)
- ⬜ Zenodo DOI — **blocked on Stage 1 item 5**

### Stage 3 — Launch and distribute (weeks 3–8) · ⬜ NOT STARTED

Owner posts and answers comments; agents prepare copy, screenshots, fact sheets.

1. ⬜ Rehearse on `r/ProgrammingLanguages` or `r/compilers`, evidence angle, ask for corrections
2. ⬜ Fix issues surfaced there
3. ⬜ Show HN, Tue–Thu morning Eastern
4. ⬜ `r/programming` + selected language communities, only where genuinely relevant
5. ⬜ Pitch embed/data-story coverage; contact compiler/PL educators
6. ⬜ **Not** a Lobsters dependency. **No** self-promotional Wikipedia links

**Write the day-3 branch before the emotion:** if it dies, record it, improve the package, continue embed/educator outreach, ship the AI-infra guide as an independent second shot, resubmit no earlier than six months. (Map of GitHub: 471 points in 2023, **717 on resubmission** in 2024.)

### Stage 4 — Deepen the moat (months 3–6) · ⬜ NOT STARTED

- ⬜ `scripts/contentQuality.ts` with exactly three enforced rules: citation integrity, near-duplicate threshold, required-content completeness. Word count report-only at first
- ⬜ Add `implementation_story` to the schema in a dedicated PR
- ⬜ Enrich ~40 high-value languages, 150–250 original words each, primary sources
- ⬜ Cap: one substantive prose PR/week, max two open agent-content PRs
- ⬜ Evidence audit ~30 edges/month, replacing Wikipedia with primary docs. **The auditing agent must never edit the claims it audits**
- ⬜ Pilots only: six `/bootstrap/{language}` pages; decade/paradigm hubs behind a member-count assertion; one GitHub repo-composition hub
- ⬜ Audit the 117 question pages; merge/redirect the zero-value tail

### Stage 5 — Narrow AI-infrastructure expansion (months 3–6) · ⬜ NOT STARTED

Pilot five nodes: **PyTorch, CUDA, ggml, llama.cpp, BLAS.** If coherent, expand toward ~12 tools / ~35 relationships.

- `tool:` nodes, six existing edge types, **no schema change**
- Every new node needs ≥1 non-Wikipedia source
- Implementation provenance only — reject model genealogy, benchmarks, tutorials, general AI education
- Second flagship: `/guides/what-modern-ai-is-written-in`

### Stage 6 — Measurement and careful automation (months 4–12) · ⬜ NOT STARTED

1. ⬜ Fresh manual GSC baseline first
2. ⬜ Inspect existing read-only GSC connectors — **do not build a custom server** (eight already exist)
3. ⬜ Extend `scripts/analyzeGsc.ts` to emit query-class and device splits
4. ⬜ Weekly data-only pull after credentials, least privilege, output redaction are verified
5. ⬜ Sitemap sharding when per-template indexation is needed

**Kill criterion:** if eight weekly pulls produce no action that moves aggregate CTR, stop maintaining the automation and return the time to distribution.

---

## 7. Consolidated priority table — 12 done, 2 partial, 21 pending

*"Reinforced by" counts in the source mark items where multiple independent investigations converged — highest confidence.*

| # | Item | Status | Effort | Impact | Phase |
|---|---|---|---|---|---|
| 1 | `git checkout origin/main`; sitemap parity *(4-way)* | ✅ DONE | 2–3 h | Blocking | 1 |
| 2 | Query-class decision: stop building definitional pages | 🟡 PARTIAL | 1 afternoon | **Transformative** | 1 |
| 3 | Explicit SPA rewrites + real 404 | ✅ DONE | 30 min | High | 1 |
| 4 | Fix `buildRelatedSection` filter + tiered fallback | ✅ DONE | 2–4 h | High | 1 |
| 5 | Per-URL `lastmod`; drop changefreq/priority *(3-way)* | ✅ DONE | 2–3 h | High | 1 |
| 6 | `LICENSE` (MIT + CC BY 4.0) + repo description/topics | ✅ DONE | 1–2 h | **Blocking** | 1 |
| 7 | Immutable cache on `/dataset/v5/*` | ✅ DONE (as a 1hr/1yr split, not true immutable) | 15 min | Medium | 1 |
| 8 | Strip 92 deflection `FAQPage` answers | ✅ DONE (118, not 92 — recount at fix time) | <1 h | High | 1 |
| 9 | Backfill 47 `unspecified` impl scalars | ✅ DONE | 30 min | Medium | 1 |
| 10 | Three decisions into `CLAUDE.md` *(4-way)* | ✅ DONE | 1–2 h | High | 1 |
| 11 | Link-check all 443 evidence URLs | ✅ DONE — 10 real dead links found (1 was a checker false positive); 9 fixed, 1 flagged unfixed | 1 h | High | 1 |
| 12 | `computeCentrality.ts` + `/rankings/most-influential` | ✅ DONE | 1–2 d | **Transformative** | 2 |
| 13 | RSS feed + email capture | 🟡 RSS done; email dropped by user decision | 3–4 h | **Transformative** | 2 |
| 14 | Static text layer on `/explore` *(4-way)* | ⬜ PENDING | 2–4 h | High | 2 |
| 15 | Prerender landing copy outside `#root` | ⬜ PENDING | 1 d | Medium | 2 |
| 16 | `/api` page + CSV + GraphML exports | ⬜ PENDING | 1 d | High | 2 |
| 17 | Zenodo DOI | ⬜ PENDING | 1 h | Medium | 2 |
| 18 | Verify embed anchor + CSP + UTM | ⬜ PENDING | 2 h | High | 2 |
| 19 | Launch sequence (r/PL → HN → r/programming) | ⬜ PENDING | 2 d | **Transformative** | 2 |
| 20 | GSC API upgrade; query-class + device splits *(4-way)* | ⬜ PENDING | half day | High | 3 |
| 21 | GitHub repo-composition enrichment + hub page *(2-way)* | ⬜ PENDING | 2 d | High | 3 |
| 22 | `implementation_story` + `notes`, 40 nodes | ⬜ PENDING | 1 d + ~$25 | **Transformative** | 3 |
| 23 | 12 AI-infra `tool:` nodes, ~35 cited edges | ⬜ PENDING | 1–2 wk | High | 3 |
| 24 | `/guides/what-modern-ai-is-written-in` | ⬜ PENDING | 3–5 d | High | 3 |
| 25 | `/bootstrap/{lang}` pilot — 6 pages | ⬜ PENDING | 2 d | Medium | 3 |
| 26 | `/decade/` + `/paradigm/` hubs (~17 URLs) | ⬜ PENDING | 1–2 d | Medium | 3 |
| 27 | `contentQuality.ts` (3 rules) + demand gate in CI *(2-way)* | ⬜ PENDING | 1–2 d | High | 3 |
| 28 | Sitemap sharding + slug registry dedupe | ⬜ PENDING | half day | High | 3 |
| 29 | Three agents + WIP limit of 2 in CI | ⬜ PENDING | half day | Medium | 3 |
| 30 | Strip `\| Language Lineage` from 51 titles | ⬜ PENDING | 1–2 h | Medium | 3 |
| 31 | Audit 117 question pages vs per-URL impressions *(2-way)* | ⬜ PENDING | 2–3 d | High | 3 |
| 32 | Mobile conversion fix (529 impr / 0 clicks) | ⬜ PENDING | 2–3 d | High | 3 |
| 33 | Stop committing generated HTML *(2-way)* | ⬜ PENDING | half day | Medium | 4 |
| 34 | Weekly GSC pull + Actions cron (data only) | ⬜ PENDING | 3–4 h | Medium | 4 |
| 35 | `og:site_name` sitewide | ⬜ PENDING | 30 min | Low | 4 |

**Verified counts backing the pending markers:** 51 `| Language Lineage` title constructions in the generator; 0 `og:site_name` occurrences; 306 generated `index.html` files tracked in git; 61 `"unspecified"` values in v5.

---

## 8. What NOT to do

Each of these was investigated and explicitly rejected. Reopening one costs weeks.

| Rejected | Why |
|---|---|
| Database / Supabase / Postgres migration | Destroys git-diffable review, the thing agent PRs depend on. GFG's DB serves a paid contributor workflow, not the read path |
| Rename or defensive domains | ~523-day average recovery, 17% never recover, EMD near-zero since 2012 |
| **More `/questions/` pages** | 117 live already, competing in the 0.08% class. *The recommendation most in need of killing, because it is the default instinct* |
| 4,753 `/compare/{a}-vs-{b}` pages | Only 252 pairs have a direct edge; median unique text ~7 words; head terms owned by commercial incumbents |
| Another title/description CTR pass | Phase 2 did 197 pages, then variant-B on the money pages. Two iterations, no movement |
| Another generic depth pass | Phase 4 took 5 pages to 1,287–1,580 words. Rust still gets 2 clicks on 898 impressions |
| Per-language markdown files "like roadmap.sh" | Premise false: `notes` is ~81 chars/node, edge notes median **6 words**. Nothing to relocate |
| A `/gaps` page around the 47 unspecified | 43 of 47 already have edges. Would be publicly, checkably wrong in front of the audience most likely to check |
| Seven-rule GSC opportunity engine / 42-day ledger | Statistically unreadable at this traffic; thresholds invented before any data was pulled |
| Custom GSC MCP server | Eight exist. Days of work, zero differentiation |
| Indexing API / IndexNow / BigQuery export | Google enforces JobPosting/BroadcastEvent only since May 2025 and revokes for misuse |
| 10-agent roster + six slash commands | Ten agents against a 2-PR WIP limit is a queue that only grows |
| AI model lineage / trackers / tutorials | HF Model tree (2M+ repos), Epoch AI (daily CC-BY CSV), 3Blue1Brown/Karpathy/d2l.ai |
| Framework migration to fix `/explore` | Cytoscape renders to `<canvas>`; every renderer produces zero text. Static layer costs 2–4 h |
| Seed Lobsters | Worst hours-per-session ratio available; makes the launch date hostage to a dependency you don't control |
| Full extraction of `generateSeoPages.ts` | 5,982 lines, weeks of golden-file porting, zero traffic movement. 14 phases already shipped through the monolith |
| Wikipedia backlink seeding | Self-promotional; policy risk |

---

## 9. Metrics

### Weekly (15 min, Monday)

| Metric | Source | Watch for |
|---|---|---|
| Clicks / impressions / CTR, 28d | GSC | Currently **30 / 4,770 / 0.63%** |
| Definitional vs exploratory CTR | `analyzeGsc.ts` *(⬜ split not yet emitted)* | The gate on every content decision. **0.08% / 2.91%** |
| Device split | `analyzeGsc.ts` *(⬜ not yet emitted)* | Mobile **529 impressions / 0 clicks** |
| Referring domains (non-search) | GSC Links / Vercel | The only pre-launch number that matters. **~0** |
| Open `agent-content` PRs | `gh pr list` | Must stay ≤ 2 |

### Monthly (60 min, first of month)

| Metric | Target trajectory |
|---|---|
| Indexed/submitted per sharded sitemap | ≥90% languages and guides; questions shard is the diagnostic |
| Language-page median word count | 265 → 450 by M6 |
| Mean pairwise 5-gram Jaccard | 0.295 → <0.20 across enriched nodes |
| Wikipedia share of evidence URLs | **70.4% → below 55%** at ~30 edges/month |
| Dead evidence URLs | 0, always |
| Embeds detected in the wild | via embed `utm_source` |
| Email subscribers | Stage 2 onward |

### Targets — base / good

| | Today | 3 mo | 6 mo | 12 mo |
|---|---|---|---|---|
| Search clicks / 28d | 30 | 50 / 120 | 100 / 300 | **200 / 800** |
| Impressions / 28d | 4,770 | 6,000 / 10,000 | 9,000 / 20,000 | 15,000 / 45,000 |
| Sitewide CTR | 0.63% | 0.8% / 1.2% | 1.1% / 1.5% | 1.3% / 1.8% |
| Exploratory impressions / 28d | 103 | 250 / 500 | 500 / 1,200 | 1,000 / 3,000 |
| Referring domains | ~0 | 5 / 20 | 12 / 35 | **20 / 60** |
| Sessions / month | — | 3,000 / 25,000¹ | 1,500 / 6,000 | 3,000 / 15,000 |
| Mobile clicks / 28d | **0** | 5 / 20 | 20 / 60 | 40 / 150 |
| Embeds live | 0 | 0 / 3 | 2 / 8 | 3 / 20 |

¹ Month 3 includes the launch spike, which decays. Read the new *baseline*, not the drop.

**13–27x on search clicks over 12 months is achievable from a 30-click base with real inbound links. It is not achievable by adding URLs.**

### Analytics tooling decision (2026-09-06)

⬜ **No change.** Vercel Analytics + Speed Insights already cover both surfaces (`App.tsx:65-66` for the SPA; `ANALYTICS_HEAD` in `generateSeoPages.ts:25` for the 306 static pages). At 30 clicks/28d the site uses <0.2% of the 50k/month Hobby cap, and behavioral analytics has no statistical power at n≈30. **Revisit PostHog at ~500 clicks/28d, or when a specific decision is blocked on data GSC cannot provide.** If added: proxy through `vercel.json` (dev audience, high ad-block rate) and keep it off the static pages to protect CWV.

---

## 10. Risks

| # | Risk | Mitigation | Status |
|---|---|---|---|
| 1 | **Deploying from the stale tree deletes 148 indexed URLs.** Local build produced 156 sitemap URLs against 304 live | Reconciliation done; the `CLAUDE.md` warning makes it survive across agent sessions | ✅ Both done — reconciled and the preflight is written (`d3dde3cd`) |
| 2 | **Launch flops with no plan B.** Median Show HN gets <10 points; the whole Stage 2 exit routes through one submission | Write the day-3 branch now. Rehearse on r/PL first. Ship the AI guide as an independent second shot | ⬜ Branch not written |
| 3 | **Evidence moat erodes unwatched.** 61.5% of evidence URLs are Wikipedia (verified 2026-09-06, revising the 70.4% figure carried from earlier research). Confidence scores cluster at 0.887 mean, 0.65 floor, no low tail — assigned by feel | Link-check before launch; cap Wikipedia confidence at 0.90; derive confidence mechanically from source type (Wikipedia ≤0.85, primary docs 0.95, source commit 0.99); no new node without a non-Wikipedia source | 🟡 Link-check done (2026-09-09, 11 dead links found and awaiting fix). Confidence-scoring mechanization not started |
| 4 | **Review capacity collapses into an unreviewed agent backlog.** Sustainable rate is ~1 substantive prose PR/week; corpus already at 0.295 mean Jaccard | WIP limit of 2 **enforced in CI, not willpower**; `contentQuality.ts` as a deterministic gate with no LLM in the path | ⬜ None done |
| 5 | Scope creep reopens settled questions | §3 of this file + `CLAUDE.md` scope boundary | ✅ Written into `CLAUDE.md` 2026-09-07 (`d3dde3cd`) |
| 6 | 10 npm vulnerabilities (6 high) carried from Stage 0 | Separate reviewed task; **do not `--force`** | ⬜ Deferred |

---

## 11. Next actions, in order

1. ~~**Stage 1 item 3 — sitemap dates.**~~ ✅ Done 2026-09-07. 6 distinct values, idempotent, validator-enforced.
2. ~~**Stage 1 item 4 — cache dataset assets.**~~ ✅ Done 2026-09-07. Pushed to `main` (`2cc03ff2`); header only confirmable on the live deploy.
3. ~~**Pull Stage 1 item 9 forward.**~~ ✅ Done 2026-09-07. `CLAUDE.md` now points at `IMPLEMENTATION_PLAN.md`, carries the preflight and settled decisions, and no longer contradicts the Stage 4 enrichment plan.
4. ~~**Stage 1 item 5 — licenses.**~~ ✅ Done 2026-09-08 (`0405abe4`). Ownership confirmed by the user; the last Blocking item is closed. Repo description/topics also done — `gh` CLI was installed and authenticated mid-session; global git identity was also fixed at the same time.
5. ~~**Stage 1 item 6 — repair implementation scalars.**~~ ✅ Done 2026-09-08 (`4c6bc492`). 43 of 47 repaired; regression guard added.
6. ~~**Stage 1 item 7 — remove FAQ deflection.**~~ ✅ Done 2026-09-09 (`33d44752`). 118 pages fixed at the source.
7. ~~**Stage 1 item 8 — evidence link check.**~~ ✅ Done 2026-09-09 (`e538d956`). **Stage 1 is now fully closed, all 9 items.**
8. ~~**Fix the dead evidence links.**~~ ✅ Done 2026-09-09 (`4d4a1434`). 9 of 10 replaced with verified sources; 1 (Haskell→Roc) left flagged — no reliable source found, one primary source arguably contradicts it. Bonus: fixed a checker false-positive (`vlang.io`) and a validator bug where the item-5 citation check compared against a value hardcoded at write time instead of the live page.
9. ~~**Stage 2.1 — flagship centrality ranking.**~~ ✅ Done 2026-09-09 (`7e3cad38`).
10. ~~**Stage 2.2 — retention before traffic.**~~ ✅ Done 2026-09-09 (`c8e917ca`) — RSS shipped, email capture dropped per user decision (no newsletter).
11. **Stage 2.3 — product-surface readiness.** Static text layer on `/explore`, embed verification, CSV/GraphML exports, `/api` page, Zenodo DOI.
12. Fresh GSC baseline before Stage 2 finishes.

### Validation gate — run before every commit

```
npm run type-check        # must pass
npm run seo:validate      # 0 errors, 0 warnings
npm run seo:links         # 0 broken, 0 over-depth, 0 orphans
npm run build             # must pass (Cytoscape chunk-size warning expected)
```

`api/` is outside `tsconfig.json`. Check one locally with:
`npx esbuild api/propose.ts --bundle --platform=node --format=esm --outfile=/dev/null`

`vercel dev` hangs on this project — verify API routes on a preview deploy per `DISTRIBUTION.md`.
