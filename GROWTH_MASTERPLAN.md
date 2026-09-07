# Growth Master Plan — Language Lineage

**Status:** Living document. Last updated 2026-09-03.
**Full plan:** [docs/GROWTH_MASTERPLAN_FULL.md](docs/GROWTH_MASTERPLAN_FULL.md) (62 KB, the detailed 12-month plan)
**Deep research prompt:** [docs/DEEP_RESEARCH_PROMPT.md](docs/DEEP_RESEARCH_PROMPT.md) (paste into claude.ai for the open questions)

> **AI agent reading this cold:** read §0 FIRST — it will stop you from destroying the site.
> Then §1 (verdicts), §4 (task board). `PENDING` = unclaimed. `DONE` = verified shipped, don't redo.
> Update this file as you complete items.

---

## 0. ⚠️ STOP — READ BEFORE ANY BUILD OR DEPLOY

**The local checkout is 164 commits behind production.** Verified 2026-09-03:

```
$ git rev-list --left-right --count main...origin/main
0    164

local  main       7f2c9303  2026-05-11
origin main       118b7a49  2026-09-01
```

**Running `npm run build` from local `main` and deploying would delete ~148 live indexed URLs.**
Treat it as a destructive command until reconciled.

**First command, before anything else:**

```bash
git fetch && git checkout origin/main
```

Everything written about this repo before 2026-09-03 — including the earlier version of this
file — describes the stale tree and is wrong. Corrected table:

| | Stale local (v4) | **Production (`origin/main`, v5)** |
|---|---|---|
| Dataset | `dataset/v4/lineage_v4.json` | **`dataset/v5/lineage_v5.json`** |
| Nodes | 112 (98 lang + 14 tool) | **152 (131 lang + 21 tool)** ✅ verified |
| Relationships | 347 | **443** ✅ verified |
| Sitemap URLs | 156 | **304** ✅ verified |
| Question pages | 13 | **117** |
| Language pages | 98 | **132** |
| `logo_url` populated | 0 | **96 / 152** ✅ verified |
| `generateSeoPages.ts` | 2,872 lines | **5,982 lines** ✅ verified |
| `.github/workflows/` | `deploy.yml` present | **deleted upstream** ✅ verified |

Edge types on v5: `influenced` 252, `compiler_written_in` 96, `runtime_written_in` 67,
`bootstrap_written_in` 15, `transpiled_to` 11, `rewritten_in` 2.

Also already done upstream (do not re-propose): `robots.txt` points at the www sitemap ·
`vercel.json` has a permanent apex→www redirect · `llms-full.txt` exists · `/timeline` is
prerendered · Phases 1–11 and 13 of `SITE_IMPROVEMENT_PLAN.md` are complete.
`origin/database` was the **v5 data expansion**, not a data-layer migration — it is merged.

---

## 1. The verdicts

The owner asked four questions. All four are now decided, with evidence.

### Q1 — Database? **NO.**

Not now, not at 10× the content. MDN runs 14,000+ pages and 23,230 forks on markdown-in-git
with no database. GeeksForGeeks serves `x-powered-by: Next.js` behind CloudFront at
`s-maxage=54109` (~15h) — their MySQL powers a **paid contributor workflow** (₹50–100 per
accepted edit) and a moderation queue, not the read path. You have one human, zero accounts,
and a 268 KB read-only file queried once per build.

Git-diffable JSON is the one property that makes agent-authored data changes *reviewable* —
which is exactly what the "more AI agents" goal depends on.

**Revisit only when:** user accounts, outside-repo contributors, or >3 concurrent human editors.

### Q2 — Rename? **NO.**

~892 studied domain migrations average **~523 days to recover**; 17% never do. Exact-match
domains have been a near-zero ranking factor since 2012. GeeksForGeeks took its name from a
friend's Orkut handle and does 24.5M visits/month. Keep `languagelineage.org`. Don't buy
defensive domains either.

### Q3 — Expand into AI? **YES — in exactly one form.**

**Not** AI education (3Blue1Brown, Karpathy, d2l.ai own it). **Not** model lineage (Hugging
Face's Model tree covers 2M+ repos from `base_model:` metadata at source). **Not** model
trackers (Epoch AI publishes 3,500+ models as a CC-BY CSV, updated daily).

**Only implementation provenance of AI infrastructure** — PyTorch, CUDA, ggml, llama.cpp, BLAS
— as `tool:` nodes using the existing six edge types. **Zero schema change.**

> **The rule: expand along edge types, never along topics.**

### Q4 — Do first? **Reconcile the repo, then launch.**

`git fetch && git checkout origin/main`. Then within three weeks ship one data story and launch
it. At **30 clicks per 28 days**, distribution is the constraint. SEO is not.

---

## 2. The strategic thesis

Language Lineage is not a reference site people search for. It is **an evidence-cited graph of
software implementation provenance** — 443 relationships, 100% carrying a source URL and a
confidence score. Its readers *browse*: CS students, compiler-curious developers, PL
researchers, instructors, and machines needing a citable structured source.

Nobody else has this data. PLDB has 5,145 concepts but no cited directional implementation
edges. programminglanguages.info has 872 languages but no bootstrap chains. Lévénez's timeline
is a static poster. Wikipedia's *History of programming languages* has no genealogy diagram at all.

**The wedge is the graph and the evidence layer distributed as an artifact — embeddable,
downloadable, citable — not templated URLs competing for zero-click queries.**

### Why: two well-executed experiments already failed

| Experiment | Shipped | Result |
|---|---|---|
| **Phase 2** — full title/meta rewrite, 197 pages, 0 duplicates, all within length | 2026-07-02, PR #22 | Definitional CTR still **0.08%** |
| **Phase 4** — depth pass: rust 1,580 words, java 1,412, python 1,388 | 2026-07-02, PR #24 | `/languages/rust`: 898 impressions, **position 29.7, 2 clicks** |

And the query-class split (`SITE_IMPROVEMENT_PLAN.md:546`):

> **definitional 2,613 impressions @ 0.08% CTR · exploratory 103 impressions @ 2.91% CTR**

A **36× gap.** Better snippets didn't fix it. 5× more words didn't fix it. That is not a quality
problem — it's a query class where Google answers inline and there is no click to win.
`what is rust written in` sits at position 9.5, 108 impressions, **zero clicks**.

Meanwhile the homepage — a 3,153-byte client-rendered shell with **no body text** — ranks at
position 7.3 with **1.85% CTR, the best on the site.**

**Therefore: stop manufacturing definitional URLs. Harvest the exploratory class. Get an
audience that doesn't arrive through a SERP.**

---

## 3. Confirmed live defects

All verified by direct request on 2026-09-03. These are real, current, and fixable.

| # | Defect | Evidence | Status |
|---|---|---|---|
| **X1** | **Site-wide soft 404** — every unknown URL returns `200` | `curl /this-page-does-not-exist-xyz` → `200`, 3153 bytes ✅ | `PENDING` |
| **X2** | **`/explore` serves zero body text** — 3,153-byte shell on the product surface | `curl /explore` → `200`, 3153 bytes ✅ | `PENDING` |
| **X3** | **All 304 sitemap URLs share one `lastmod`** | `generateSitemap.ts:97` emits `${today}` for every entry | `PENDING` |
| **X4** | **268 KB dataset re-fetched every load** — `max-age=0, must-revalidate` | `vercel.json` has **no `headers` block at all** ✅ verified | `PENDING` |
| **X5** | **Internal linking is a star, not a graph** | `generateSeoPages.ts:1691` — `rels.forEach` has **no filter for the current node**, so `.slice(0,12)` returns the same 12 nodes on nearly every page. ~1,800 links → 12 destinations | `PENDING` |
| **X6** | **No LICENSE file** — on a repo whose entire value is a dataset | `ls LICENSE*` → no matches, on local **and** origin ✅ verified | `PENDING` |

**X7 — the "47 unspecified languages" is a display bug, not a data gap.** Of the 47, **43 already
have `compiler_written_in` / `runtime_written_in` / `bootstrap_written_in` edges in the same
file.** Only four genuinely lack them — Machine Code, Assembly, BCPL, Lazy ML — and the first two
are correctly root nodes. **A 30-minute backfill, not a contribution funnel.**

---

## 4. Task board

Legend: `DONE` · `IN PROGRESS` · `PENDING` · `BLOCKED`

### 4.1 Phase 1 — Reconcile and arm (weeks 1–2)

| ID | Item | Status |
|---|---|---|
| P1.1 | `git fetch && git checkout origin/main`; confirm local build reproduces the 304-URL sitemap | `PENDING` |
| P1.2 | Add the stale-tree warning to `CLAUDE.md` | `PENDING` |
| P1.3 | Fix X1 — real 404s (replace the blanket `vercel.json` catch-all rewrite) | `PENDING` |
| P1.4 | Fix X4 — add a `headers` block, `Cache-Control: public, max-age=31536000` on the dataset | `PENDING` |
| P1.5 | Fix X5 — filter `rels` by current node in `generateSeoPages.ts:1691` | `PENDING` |
| P1.6 | Fix X3 — per-URL `lastmod` from real content mtime | `PENDING` |
| P1.7 | Add LICENSE (X6) — gates the DOI, awesome-list PRs, and reuse | `PENDING` |
| P1.8 | Backfill the 4 genuinely-unspecified nodes (X7) | `PENDING` |
| P1.9 | Verify GSC Domain property; record baseline impressions/clicks/position | `PENDING` |

### 4.2 Phase 2 — Launch and distribute

| ID | Item | Status |
|---|---|---|
| P2.1 | Ship one data story — influence PageRank over the 189-edge subgraph (reproduced to the decimal by an independent critic) | `PENDING` |
| P2.2 | Launch: Show HN, r/ProgrammingLanguages, Lobsters. **Site has never launched anywhere** | `PENDING` |
| P2.3 | Embeddable widget (`src/app/EmbedGraph.tsx` exists; `/embed-kit` is live upstream) | `PENDING` |
| P2.4 | Dataset exports (CSV / GraphML / SQLite) + Zenodo DOI | `BLOCKED` on P1.7 |

### 4.3 Phase 3 — Content quality, not content volume

| ID | Item | Status |
|---|---|---|
| P3.1 | `scripts/contentQuality.ts` with **3** enforceable rules (word floor as a report-only ratchet: median 256, 106/153 under 300) | `PENDING` |
| P3.2 | Add `implementation_story` (150–250 words, cited) to `scripts/schema.ts`; enricher agent fills top ~40 languages, C first | `PENDING` |
| P3.3 | Fix FAQPage deflection — 95 pages emit FAQPage schema, **92 contain the literal string "See the implementation section above for details and source references"** (184 occurrences) | `PENDING` |
| P3.4 | **Do NOT** mass-generate new definitional pages — see §5 | `DONE` (decision) |

### 4.4 Phase 4 — Automation

| ID | Item | Status |
|---|---|---|
| P4.1 | GSC baseline pull before any MCP work — *how many impressions in the last 28 days?* | `PENDING` |
| P4.2 | GSC MCP connector — **check for existing servers before building** | `PENDING` |
| P4.3 | GSC-driven loop: impressions→CTR fixes, position 8–20 near-misses, content gaps | `BLOCKED` on P4.2 |
| P4.4 | `.claude/agents/*.md` roster (dataset-enricher, fact-checker, seo-analyst, page-auditor) | `PENDING` |
| P4.5 | Split `CLAUDE.md` into `.claude/rules/*.md` with `paths:` frontmatter — see §6 | `PENDING` |

### 4.5 AI expansion (Q3, scoped)

| ID | Item | Status |
|---|---|---|
| P5.1 | Add AI-infra `tool:` nodes — PyTorch, CUDA, ggml, llama.cpp, BLAS — existing 6 edge types, no schema change | `PENDING` |

---

## 5. What NOT to do

Killed by adversarial critique. **50 recommendations were killed across 8 dimensions.**

- ❌ **Don't migrate to a database.** §1/Q1.
- ❌ **Don't rename or buy domains.** ~523 days to recover; 17% never do.
- ❌ **Don't build AI tutorial content.** Owned by better-resourced incumbents.
- ❌ **Don't mass-generate `/compare/{a}-vs-{b}` or more definitional pages.** The 36× CTR gap
  says this class doesn't convert. Two experiments already proved it.
- ❌ **Don't build an elaborate freshness system.** Fix the `lastmod` bug; stop there.
- ❌ **Don't build a contributor funnel for the "47 unspecified" languages.** X7 — it's a 30-minute bug.
- ❌ **Don't write the GSC MCP server before pulling a baseline.** P4.1 before P4.2.
- ❌ **Don't ship 5 content-quality rules.** Three enforceable ones beat five aspirational ones.

---

## 6. Reference: multi-file CLAUDE.md

Files are **concatenated, not merged** — conflicting instructions resolve arbitrarily.

| Scope | Location | Loaded |
|---|---|---|
| User | `~/.claude/CLAUDE.md` | Every session, all projects |
| Project | `./CLAUDE.md` | At launch |
| Local | `./CLAUDE.local.md` | At launch (gitignored) |
| **Subdirectory** | `any/dir/CLAUDE.md` | **On demand** — only when files in that dir are read |

`.claude/rules/*.md` with `paths:` frontmatter load only when matching files are touched — better
token economics than `@` imports, which load at startup regardless. Max 4 levels of import recursion.

**Proposed layout (P4.5):**

```
CLAUDE.md                        # lean: existing rules + the §0 stale-tree warning
.claude/rules/dataset.md         # paths: dataset/**   — schema, evidence requirements
.claude/rules/seo-generation.md  # paths: scripts/**   — page-type conventions
.claude/rules/graph-ui.md        # paths: src/graph/** — 70px nodes, layout rules
```

---

## 7. Key files

| Path | What it is |
|---|---|
| [docs/GROWTH_MASTERPLAN_FULL.md](docs/GROWTH_MASTERPLAN_FULL.md) | **The full 12-month plan** — roadmap, priority table, metrics, first-week checklist |
| [docs/DEEP_RESEARCH_PROMPT.md](docs/DEEP_RESEARCH_PROMPT.md) | Ready-to-paste prompt for claude.ai deep research on the open questions |
| `dataset/v5/lineage_v5.json` | **Source of truth (on `origin/main`)** |
| `scripts/generateSeoPages.ts` | 5,982 lines; **line 1691 has the X5 linking bug** |
| `scripts/generateSitemap.ts` | **Line 97 has the X3 lastmod bug** |
| `SITE_IMPROVEMENT_PLAN.md` | On `origin/main` — phases 1–11, 13 done; **line 546 has the CTR split** |
| [vercel.json](vercel.json) | Has apex→www redirect; **no `headers` block (X4)**, blanket rewrite (X1) |
| [CLAUDE.md](CLAUDE.md) | Agent behavior rules |

---

## 8. Metrics

**Baseline (from the committed 2026-09-01 measurement log):**

| Metric | Value |
|---|---|
| Clicks / 28 days | **30** |
| Definitional queries | 2,613 impressions @ **0.08% CTR** |
| Exploratory queries | 103 impressions @ **2.91% CTR** |
| Best-performing page | Homepage — position 7.3, **1.85% CTR** |
| `/languages/rust` | 898 impressions, position 29.7, **2 clicks** |

Targets belong in [docs/GROWTH_MASTERPLAN_FULL.md](docs/GROWTH_MASTERPLAN_FULL.md).

---

## 9. Changelog

| Date | Change |
|---|---|
| 2026-09-03 | Created against the stale v4 tree. |
| 2026-09-03 | **Rewritten.** 18-agent research workflow (`wf_8d56f03b-ae2`, 1.29M tokens, 366 tool calls) landed. Discovered the 164-commit divergence; corrected all ground truth to v5; recorded 4 verdicts, 6 confirmed live defects, and 50 killed recommendations. Full plan + deep-research prompt written to `docs/`. |