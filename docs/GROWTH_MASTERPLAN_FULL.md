# LANGUAGE LINEAGE — MASTER PLAN
### 12 months, one maintainer, agents doing the repetitive half

*Verified against `origin/main` (118b7a49, 2026-09-01) and the live site on 2026-09-03. Every number below was checked, not inherited.*

---

## THE VERDICT

**(a) Database — No.** Not now, not at 10x the content. MDN runs 14,000+ pages and 23,230 forks on markdown-in-git with no database. GeeksForGeeks serves `x-powered-by: Next.js` behind CloudFront at `s-maxage=54109` (~15h) — their MySQL runs a *paid contributor workflow* (₹50–100 per accepted edit) and a moderation queue, not the read path. You have one human, zero accounts, and a 268 KB read-only file queried once per build. Git-diffable JSON is the single property that makes agent-authored data changes reviewable, which is the thing your stated goal depends on most. Revisit only on: user accounts, outside-repo contributors, or >3 concurrent human editors.

**(b) Rename — No.** ~892 studied domain migrations average ~523 days to recover, 17% never do. Exact-match domains have been near-zero as a ranking factor since 2012. GeeksForGeeks took its name from a friend's Orkut handle and does 24.5M visits/month. Keep `languagelineage.org`. Don't buy defensive domains either.

**(c) Expand into AI — Yes, in exactly one form.** Not AI education (3Blue1Brown, Karpathy, d2l.ai own it). Not model lineage (Hugging Face's Model tree covers 2M+ repos from `base_model:` metadata at source). Not model trackers (Epoch AI publishes 3,500+ models as a CC-BY CSV, updated daily). **Only implementation provenance of AI infrastructure** — PyTorch, CUDA, ggml, llama.cpp, BLAS — as `tool:` nodes using the existing six edge types, zero schema change. The rule: **expand along edge types, never along topics.**

**(d) Do first:** `git fetch && git checkout origin/main`. Your local checkout is **164 commits behind production** and building from it would delete 148 live indexed URLs. Then, within three weeks, ship one data story and launch it. At **30 clicks per 28 days**, distribution is the constraint. SEO is not.

---

## STRATEGIC THESIS

Language Lineage is not a reference site that people search for. It is **an evidence-cited graph of software implementation provenance** — 443 relationships, 100% carrying a source URL and a confidence score, across 131 languages and 21 tools — and its readers are people who *browse*: CS students, compiler-curious developers, PL researchers, instructors, and machines that need a citable structured source. Nobody else has this data: PLDB has 5,145 concepts but no cited directional implementation edges; programminglanguages.info has 872 languages but no bootstrap chains; Lévénez's timeline is a static poster; Wikipedia's *History of programming languages* article contains no genealogy diagram at all. The wedge is **the graph and the evidence layer distributed as an artifact — embeddable, downloadable, citable — not as templated URLs competing for zero-click queries.**

This follows from a measurement the repo already made and then didn't act on. Two well-executed experiments have now failed:

| Experiment | Shipped | Result |
|---|---|---|
| **Phase 2** — full title/meta rewrite, 197 pages, 0 duplicates, all within length | 2026-07-02, PR #22 | Definitional CTR still **0.08%** |
| **Phase 4** — depth pass: rust 1,580 words, java 1,412, python 1,388, go 1,301, js 1,287 | 2026-07-02, PR #24 | `/languages/rust`: **898 impressions, position 29.7, 2 clicks** |

And the query-class split from the 2026-09-01 pull, recorded in `SITE_IMPROVEMENT_PLAN.md` line 546:

> **definitional 2,613 impressions @ 0.08% CTR · exploratory 103 impressions @ 2.91% CTR**

A **36x** gap. Better snippets didn't fix it. 5x more words didn't fix it. That is not a quality problem — it is a query class where Google answers inline and there is no click to win. `what is rust written in` sits at position 9.5 with 108 impressions and zero clicks. Meanwhile the homepage — a **3,153-byte client-rendered shell with no body text** — ranks at position 7.3 with **1.85% CTR, the best on the site.**

The strategy that follows: stop manufacturing definitional URLs, harvest the exploratory class, and go get an audience that doesn't arrive through a SERP.

---

## THE RECONCILIATION PROBLEM (read before touching anything)

```
$ git rev-list --left-right --count main...origin/main
0    164
```

Local `main` is `7f2c9303` (2026-05-11). `origin/main` is `118b7a49` (2026-09-01). Everything in the original brief describes the stale tree. Corrected ground truth:

| | Stale local (v4) | **Production (`origin/main`, v5)** |
|---|---|---|
| Dataset file | `dataset/v4/lineage_v4.json` | **`dataset/v5/lineage_v5.json`** |
| Nodes | 112 (98 lang + 14 tool) | **152 (131 lang + 21 tool)** |
| Relationships | 347 | **443** |
| Sitemap URLs | 156 | **304** |
| Question pages | 13 | **117** |
| Language pages | 98 | **132** |
| `logo_url` populated | 0 | **96 / 152** |
| `generateSeoPages.ts` | 2,872 lines | **5,982 lines** |
| Tracked files under `public/` | 163 | **592** (282 OG assets) |

Edge types on v5: `influenced` 252, `compiler_written_in` 96, `runtime_written_in` 67, `bootstrap_written_in` 15, `transpiled_to` 11, `rewritten_in` 2.

Also true and previously mis-stated: `robots.txt` already points at the www sitemap; `vercel.json` already has a **permanent** apex→www redirect; `llms-full.txt` already exists; `/timeline` is already prerendered at `public/timeline/index.html`; `.github/workflows/` no longer exists (the GitHub Pages deploy is gone); `origin/database` was **merged** — it was the v5 expansion, not a data-layer migration. Phases 1–11 and 13 of `SITE_IMPROVEMENT_PLAN.md` are complete. Phase 12 (accessibility) has not started.

**Treat `npm run build && deploy` from local `main` as a destructive command until reconciled.** Add this to `CLAUDE.md`.

### Four defects confirmed live on 2026-09-03

```
$ curl -o /dev/null -w '%{http_code} %{size_download}' /this-page-does-not-exist-xyz
200 3153          ← site-wide soft 404
$ curl -o /dev/null -w '%{http_code} %{size_download}' /explore
200 3153          ← zero body text on the product surface
$ grep -c '<lastmod>2026-09-01' public/sitemap.xml
304               ← every URL claims the same modification date
$ curl -sI /dataset/v5/lineage_v5.json | grep cache-control
cache-control: public, max-age=0, must-revalidate   ← 268 KB re-fetched every load
```

Plus, in `scripts/generateSeoPages.ts:1691`:

```ts
function buildRelatedSection(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  ...
  rels.forEach(r => {                                    // ← no filter for this node
    const other = r.from_language === id ? r.to_language : r.from_language;
```

Every relationship matches, so `.slice(0, 12)` returns the same first twelve nodes in dataset order for nearly every page. ~1,800 internal links all point at twelve destinations. The crawl graph is a star.

And one more, confirmed by computation rather than reading: **the "47 languages with unspecified implementation language" is a display bug, not a data gap.** Of the 47, **43 already have `compiler_written_in` / `runtime_written_in` / `bootstrap_written_in` edges in the same file.** Only four genuinely lack them — Machine Code, Assembly, BCPL, Lazy ML — and the first two are correctly root nodes. This is a 30-minute backfill, not a contribution funnel.

---

## PHASED ROADMAP

### Phase 1 — RECONCILE AND ARM · Weeks 1–2

**Goal:** make the repo safe to deploy from, close the five confirmed live defects, and make the launch assets legally shippable.

- `git fetch && git checkout origin/main`; confirm a local build reproduces the 304-URL sitemap exactly.
- **`vercel.json`**: replace `{"source":"/(.*)","destination":"/index.html"}` with explicit rewrites for `/explore` and `/embed` only; keep the apex→www permanent redirect untouched; emit a real `404.html`. Do **not** add `cleanUrls`/`trailingSlash` in the same commit — pages serve at `/languages/rust/` and canonical consolidation was deliberate Phase 1 work.
- **`vercel.json` headers**: `Cache-Control: public, max-age=31536000, immutable` on `/dataset/v5/(.*)`. Discipline that comes with it: never mutate `lineage_v5.json` in place; cut v6.
- **`generateSeoPages.ts:1691`**: `rels.filter(r => r.from_language === node.id || r.to_language === node.id)`. Add a tiered fallback (direct edge → 2-hop → same paradigm + nearest decade) so the low-degree nodes still reach 8+ links. Add an assertion in `validateSeo.ts` that no two pages emit an identical related block.
- **`generateSitemap.ts`**: derive per-URL `lastmod` from `git log -1 --format=%cs` on the source (`dataset/v5/lineage_v5.json` for data pages, the guide's own source for guides). Delete `changefreq` and `priority` — Google ignores both. Gary Illyes: lastmod trust is *"binary: we either trust it or we don't."*
- **Backfill the 47 `unspecified` scalars** from the implementation edges that already exist (43 of 47). Leave Machine Code, Assembly, BCPL, Lazy ML null.
- **Strip the deflection FAQ.** The generated `FAQPage` `acceptedAnswer` on language pages reads *"See the implementation section above for details and source references."* Google requires the answer to *be* the answer, and FAQ rich results have not displayed for non-gov/health sites since August 2023 — so this markup earns nothing and carries manual-action exposure. Delete the block or interpolate the real implementation chain.
- **`LICENSE`** (MIT, repo root) and **`dataset/LICENSE`** (CC BY 4.0). There is currently no license file anywhere on `origin/main`. This gates Zenodo, awesome-lists, and every commercial embed.
- **Repo metadata**: `gh repo edit sanketmuchhala/LanguageLineage --description "Interactive graph of what 152 programming languages and tools are actually written in — 443 relationships, every one with a source URL and a confidence score." --add-topic programming-languages --add-topic compilers --add-topic dataset --add-topic data-visualization --add-topic bootstrapping --add-topic open-data`. Current state: 0 stars, 0 topics, description *"idea is to make a tree what programming language from what programming language"*.
- **Link-check all 443 evidence URLs.** The evidence layer is the entire defense against "this is just a graph." Two 404s spotted by a commenter on launch day collapses it.
- **Write three decisions into `CLAUDE.md`**: no database (with revisit triggers), no rename (with the ~523-day figure so it isn't re-derived), and the scope rule (below).

**EXIT CRITERION:** `curl -w '%{http_code}' /this-page-does-not-exist-xyz` returns **404**; a local build's sitemap URL set differs from the live sitemap by **0 URLs**; `npm run seo:validate` and `npm run seo:links` report 0 errors / 0 broken / 0 orphans; **152 distinct** related-links blocks (currently ~12); sitemap carries **≥5 distinct** `lastmod` values; **0 dead** evidence URLs; `LICENSE` exists.

---

### Phase 2 — LAUNCH · Weeks 3–8

**Goal:** the first inbound links this project has ever had. HN Algolia returns `nbHits: 0` for "languagelineage" — the entire opportunity is unspent.

- **`scripts/computeCentrality.ts`, committed before the prose.** Computed on v5 today (damping 0.85, reversed influence subgraph):

  | Rank | Language | PageRank | Transitive descendants (of 131) |
  |---|---|---|---|
  | 1 | Lisp | 7.26% | 60 |
  | 2 | **ALGOL** | 6.02% | **65 (50%)** |
  | 3 | ML | 4.44% | 47 |
  | 4 | Haskell | 2.76% | 36 |
  | 5 | C | 2.72% | 49 |
  | 6 | Simula | 2.61% | 46 |
  | 7 | Pascal | 2.24% | 46 |

  Half of every language in the dataset descends from ALGOL, a language with effectively zero living users. That is the story. **Note the correction:** the v4-era research reported ALGOL at 7.63% leading Lisp; on the real v5 dataset Lisp leads. Ship the committed script so the numbers on the page are generated, not transcribed — that is also what makes the piece survive scrutiny.
- Publish **`/rankings/most-influential`** with the method in plain language, the script linked, and your own caveat stated first: *PageRank over a curated 252-edge influence graph partly measures my curation.* Saying it before a commenter does makes the piece more credible, not less.
- **RSS feed + one email capture line** on `/dataset` and the story pages. This is the plan's biggest structural gap: an HN front page sends 10–25k people and there is currently nothing to catch them. Static RSS from the existing `seo:generate` chain; a plain Buttondown or mailto line. Hours of work, and the difference between a spike and an audience.
- **Static text layer on `/explore`.** Cytoscape renders to `<canvas>`, so no SSR, Astro island, or Next.js migration produces indexable text there — that argument kills a 1–4 week framework migration and should be written down. Instead emit the 152 node names and 443 relationships as a semantic list plus a real `<h1>` and intro inside the page. Vercel serves static files ahead of the rewrite (this is exactly how `/timeline` works today at `public/timeline/index.html`), so no config change.
- **Prerender the landing copy** — but as hygiene, not as the transformative fix. The homepage is a 3,153-byte shell ranking at position 7.3 with 1.85% CTR, the site's best. Inject content into `index.html` *outside* `#root`, hidden by a class the app removes on mount. Ship after `/explore`.
- **`/api` page + CSV and GraphML exports.** The dataset is already live at `/dataset/v5/lineage_v5.json` with `access-control-allow-origin: *` — you already have a public API and nobody knows. Write `scripts/generateExports.ts` producing `public/api/languages.csv`, `relationships.csv`, `lineage.graphml`. **Skip SQLite** — a native build dependency for an audience already served by the live JSON. GraphML is load-bearing: it opens directly in Gephi and Cytoscape Desktop, which is what makes academic outreach a gift rather than a link request.
- **Zenodo DOI** via the GitHub release integration. Requires `LICENSE`. Test on sandbox.zenodo.org first; deposits are permanent.
- **Verify the embed anchor.** Phase 13 shipped `/embed-kit` and per-page embed blocks. Confirm the snippet carries a **visible `<a href>`** below the iframe — iframes pass zero link equity, so the anchor *is* the product. Add an explicit CSP `frame-ancestors` (currently unset by accident) and a distinct `utm_source` so adopters are countable.
- **Launch sequence, never same-day.** Day 1: r/ProgrammingLanguages, framed as *"I built this — tell me what's wrong with my edges."* They will find the errors HN would mock you for; fixing them is free rehearsal. Day 3–4: Hacker News, Tue/Wed 08:00–10:00 ET. Day 6: r/programming and r/compilers. **Drop Lobsters** — invite plus three weeks of seeding is an unschedulable dependency for 300–1,500 sessions.
- **Write the first HN comment before submitting**: why "influenced by" and "compiler written in" are different questions, the 443/443 evidence coverage at 0.887 mean confidence across 48 source domains, direct links to the raw JSON and the GraphML, and the three honest gaps. Then **fix edges live in the thread and reply with commit links** — that behavior converts critics into contributors and is the strongest signal available.
- Two awesome-list PRs (`aalhour/awesome-compilers`, `patrickporto/awesome-compilers-languages`), framed as a dataset with a DOI. 20 minutes, then forget it.

**Calibrate expectations honestly:** the median Show HN gets under 10 points. Plan for **under 30 points and ~500 sessions**; treat 200–500 points and 8,000–25,000 sessions as the good case. **Write the day-3 branch now, while unemotional:** if the post dies, resubmit in six months (anvaka's Map of GitHub scored 471 in 2023 and **717 on resubmission** 19 months later) and shift effort to embeds and exports.

**EXIT CRITERION:** ≥5 referring domains that are not search engines; ≥2,000 sessions from a single non-search referrer in one week; an email list exists with ≥50 subscribers, or a recorded decision to skip it; DOI resolves; GraphML downloadable.

---

### Phase 3 — DEEPEN THE MOAT · Months 3–6

**Goal:** make the pages worth the click they can actually win, and add the AI slice.

- **The prose field. This is the content lever, and it is not where anyone was looking.** The per-edge `notes` field on v5 has a **median of 6 words** (max 16). Everything else on a language page is nav, table headers, and template. Add `implementation_story` (150–250 words, cited) to `scripts/schema.ts`; fill it for the top 40 nodes by degree — C first at **75 relationships**, then C++ 38, Haskell 31, Python 29, Rust 28, Java 22. Simultaneously raise `notes` on the 252 influence edges from 6 words to 25–40. Because the generator interpolates these on every build, 40 nodes × 200 words moves the language-page median and drives pairwise similarity down mechanically. **Do not** fill `peak_year` or `current_users_estimate` — unsourceable judgment calls on a site whose entire claim is that every fact carries an evidence URL. Propose deleting `current_users_estimate` from the schema.
- **GitHub repository composition** (`scripts/fetchRepoLanguages.ts`) — the one genuinely novel idea in the research, but reframed. Not "makes thin pages thick" (they're already 500–1,700 words). Rather: byte-exact composition is a fact no competitor publishes, it is machine-refreshable forever, and it produces **rankings and charts — exploratory surfaces, the 2.91% class.** Verified live: `python/cpython` returns Python 41,916,999 bytes vs C 23,257,516; `rust-lang/rust` returns Rust 147,233,746 vs C 1,217,567 vs LLVM 144. Ship it behind **one** page first — a sortable `/how-languages-are-actually-built` — before threading it into 152 node pages. Label it "repository composition," never "the compiler is 36% C," and name the reference implementation on every page (CPython is *a* Python, not *the* Python). Linguist counts bytes, not significance; say so.
- **12 AI-infrastructure nodes, ~35 cited edges.** PyTorch, TensorFlow, JAX, NumPy, CUDA, cuBLAS, BLAS/LAPACK, llama.cpp, ggml, Ollama, vLLM, HF Transformers. Use `tool:` ids — there is no `kind` field and adding one means touching `schema.ts`, `types.ts`, `normalizeDataset.ts` and every node for zero benefit. Node count rises 152→164 (8%), so `/explore` density and the 70px uniform-node rule need no revisit. Verified compositions: PyTorch Python 64.9% / C++ 27.6% / CUDA 2.5%; TensorFlow C++ 55.4% / Python 25.2% / MLIR 6.6%; JAX Python 88.1%; llama.cpp C++ 56.1% / C 15.9%; **Ollama Go 71.0%** (not C++); **vLLM Python 84.4% / Rust 6.2%**; **Triton MLIR 40.8%**.
- **The flagship guide `/guides/what-modern-ai-is-written-in`**, 1,500+ words with a citation per hop, tracing: GPT-class training → PyTorch → ATen/c10 (C++) → cuBLAS/cuDNN → nvcc (LLVM middle-end since 2011/12) → PTX → SASS, with the CPU branch landing on LAPACK/BLAS in Fortran 77. *Every ChatGPT token is six hops from 1957 Fortran* — true, citable, renderable as a path through a graph you already own half of, and unavailable anywhere else. **This is launch #2.** Note the existing guides run ~220–240 words; a 240-word flagship dies instantly on HN.
- **`/bootstrap/{lang}` pilot — six pages, not 58.** rust, go, c, haskell, ocaml, typescript. Bootstrap chains are the only page type with no real competitor (the "self-hosting compiler list" SERP is Rosetta Code, Wikipedia, HandWiki, a personal blog), and 43 languages are self-hosting. But **resolve cannibalization first**: `/guides/how-rust-is-bootstrapped` and `/questions/is-rustc-written-in-rust` already exist and already rank. Declare `/bootstrap/{lang}` the canonical depth page and canonicalize or merge the others — this may mean deleting pages. Extend to the rest only if ≥4 of 6 clear 1% CTR at 28 days.
- **Exploratory browse hubs only**: `/decade/{d}` (7 usable buckets) and `/paradigm/{p}` (~10 with ≥3 members), recomputed on v5. **Not** `/written-in/{lang}` — that's definitional and duplicates the question corpus. Enforce a `minMembers` threshold per facet, asserted at build time in `validateSeo.ts`, and never relaxed to hit a URL count.
- **`scripts/contentQuality.ts` — three rules, not five.** (1) Word floor, **report-only with a ratchet**, failing only pages that regress below their own committed baseline, so the gate is green on day one and never gets disabled. (2) 5-gram Jaccard **< 0.40**, computed only against pages touched in the PR diff. (3) Internal-link floor ≥3 non-boilerplate inbound. Drop the "unique-fact minimum" — there is no reliable proper-noun detection in plain tsx and false positives kill the gate. **Zero LLM in the merge path.**
- **A demand gate, which matters more than the similarity gate**: no new page *type* ships unless its target query pattern has ≥10 impressions in the last GSC pull **and** is not in the definitional class. This single rule would have killed four of the research's ten pSEO recommendations.
- **Sitemap sharding** by type behind an index (`sitemap-languages.xml`, `-questions.xml`, `-guides.xml`, `-tools.xml`, `-relationships.xml`, `-landing.xml`). Not for the 50,000-URL limit — for attribution. 117 question pages and 132 language pages are indistinguishable in GSC's aggregate report, so nobody can answer *"did the 104 auto-generated question pages get indexed, and do they convert?"* — which is the question the whole strategy turns on. While in `generateSitemap.ts`, export `GUIDE_SLUGS`/`QUESTION_SLUGS` from one module so the generator and `validateSeo.ts` cannot silently drift.
- **Three agents, not ten.** `dataset-enricher` (one field per run, must cite a fetched source per value, leaves nulls when sources disagree, runs `npm run analyze:v4` before reporting). `evidence-auditor` (Sonnet, **no Write/Edit tools by design** — an agent asked to verify a claim must not be able to edit the claim to match; quotes the supporting sentence verbatim or writes NOT FOUND). `duplication-sentinel` (the adversary for every new page: PUBLISH / MERGE-INTO-EXISTING / REJECT, biased toward MERGE). Ten agents opening PRs against a 30-minute weekly review block is a queue that only grows. Enforce a WIP limit of **2** open `agent-content` PRs in CI, and budget 20–30 minutes per prose PR, not 5.
- **GSC API/MCP.** The property is already verified and `scripts/analyzeGsc.ts` already parses CSV exports — what's missing is that a human must download them first. Wire `ahonn/mcp-server-gsc` into `.mcp.json` (`npx -y mcp-server-gsc@<pinned>`), service-account auth, role **Full not Owner** — a Full account gets 403 on the Indexing API, making misuse structurally impossible rather than merely denied. Extend `analyzeGsc.ts` to emit the definitional/exploratory split and the device split as standing output.
- **Mobile.** 529 impressions, 0 clicks. A device class producing 11% of impressions and 0% of clicks. This is cheaper than any content work and has never been touched.

**EXIT CRITERION:** language-page median words 265 → **450+**; mean pairwise 5-gram Jaccard **< 0.20** across the 40 enriched pages; 6 bootstrap pages live with ≥4 clearing 1% CTR or 15 impressions/28d; exploratory-class impressions **103 → 400+** at ≥2% CTR; mobile clicks **> 0**.

---

### Phase 4 — COMPOUND · Months 7–12

**Goal:** turn the loop over without the owner inside it, and pick the second cluster.

- **Weekly `scripts/gsc/pull.ts`** committing snapshots to `seo/gsc/{YYYY-MM-DD}/` (queries, pages, query×page). Three POSTs, `startDate` T-31 / `endDate` T-3 (the 2–3 day lag), `rowLimit` 25000, `dataState: final`. GSC hard-deletes after 486 days; committed snapshots give unbounded, diffable, greppable history for free. **Skip BigQuery** — it requires billing and its value is escaping a 50,000-row/day export ceiling you will not approach for years.
- **A GitHub Actions cron that opens a PR containing only the snapshot** — no agent editing a 5,982-line file in CI on week one. Vercel Hobby crons run once daily with no build step; Claude Code scheduled agents need the laptop awake; Actions is the only option that holds the secret, runs the validators, and opens a PR. Add agent-authored edits only once four weeks of data prove the rules would have been right. Price the recurring token cost against stated cost sensitivity before enabling it.
- **Second data story + second launch**, from the pipeline: *60 of 131 languages (46%) transitively bottom out in C or C++* (29 directly). *43 languages compile themselves.* *C is the most connected node in software at 75 relationships.* Note the correction: the widely-quoted "48 of 98" does not reproduce — **compute the number with a committed script before it becomes a headline**, because a commenter recomputing it to a different value loses the thread.
- **Database lineage as cluster #2** — ~40 nodes, real lineage (Ingres→Postgres 1986, MySQL→MariaDB 2009), high "what is X written in" demand (Postgres = C, SQLite = C, DuckDB/ClickHouse = C++, CockroachDB = Go), all terminating in existing nodes, and **zero fact decay** — a better maintenance profile than AI infra. **Gated on the AI slice actually converting.** Two half-built clusters is the documented failure mode.
- **12 targeted professor emails**, not 50. Target course pages that **already link `levenez.com` or `hopl.info`** — those instructors have demonstrably wanted this resource and have a page that links out. Pitch the GraphML as a Gephi lab exercise, DOI as a footnote, never a link request. One send, no follow-up.
- **Phase 12 accessibility** (the one unstarted phase in the existing plan).

**EXIT CRITERION:** 200–800 clicks/28d (from 30); ≥20 referring domains; ≥3 embeds in the wild; exploratory CTR ≥2% sustained across two pulls; the weekly GSC snapshot lands without human action.

---

## CONSOLIDATED PRIORITY TABLE

Every surviving P0/P1 across all eight dimensions, deduplicated. **Reinforced by** shows where multiple independent investigations landed on the same item — those are the highest-confidence entries.

| # | Item | Origin dimension(s) | Effort | Impact | Expected outcome | Phase |
|---|---|---|---|---|---|---|
| 1 | `git checkout origin/main`; verify sitemap parity | naming, aiscope, arch, pseo *(4-way)* | 2–3 h | **Blocking** | Local build sitemap == live 304 URLs, 0 diff. Removes a 148-URL data-loss hazard | 1 |
| 2 | **Query-class decision**: stop building definitional pages; publish the rule | arch, pseo *(2-way)* | 1 afternoon | **Transformative** | A written "do not build" list + ranked exploratory patterns. Kills 4+ downstream projects | 1 |
| 3 | `vercel.json` → explicit SPA rewrites + real 404 | arch, gscmcp | 30 min | High | `/this-page-does-not-exist-xyz` returns 404, not `200 3153` | 1 |
| 4 | Fix `buildRelatedSection` filter (`generateSeoPages.ts:1691`) + tiered fallback | pseo, agentops | 2–4 h | High | ~1,800 links redistributed from 12 nodes to 152; 152 distinct blocks | 1 |
| 5 | Per-URL `lastmod` from git commit date; drop changefreq/priority | precedent, arch, agentops *(3-way)* | 2–3 h | High | ≥5 distinct lastmod values; unchanged pages hold dates across 3 deploys | 1 |
| 6 | `LICENSE` (MIT + CC BY 4.0) + repo description + topics | distribution | 1–2 h | **Blocking** | Unblocks Zenodo, awesome-lists, commercial embeds. Currently absent | 1 |
| 7 | Immutable cache on `/dataset/v5/*` | distribution | 15 min | Medium | Repeat loads served from cache; removes 268 KB re-fetch per pageview | 1 |
| 8 | Strip 92 deflection `FAQPage` answers | agentops | < 1 h | High | Removes the site's most concrete manual-action exposure | 1 |
| 9 | Backfill 47 `unspecified` impl scalars from existing edges | *(verified here)* | 30 min | Medium | 43 of 47 fixed from data already present. Only 4 remain genuinely unknown | 1 |
| 10 | Three decisions into `CLAUDE.md`: no DB, no rename, scope rule | precedent, arch, naming, aiscope *(4-way)* | 1–2 h | High | Zero future agent sessions relitigating settled questions | 1 |
| 11 | Link-check all 443 evidence URLs | distribution | 1 h | High | 0 dead sources before launch day scrutiny | 1 |
| 12 | `computeCentrality.ts` + `/rankings/most-influential` | distribution, aiscope | 1–2 days | **Transformative** | Verifiable headline (ALGOL: 65 of 131 descendants) + the launch asset | 2 |
| 13 | RSS feed + email capture | *(critique gap, all)* | 3–4 h | **Transformative** | The difference between a one-day spike and an audience | 2 |
| 14 | Static text layer on `/explore` | arch, precedent, aiscope, agentops *(4-way)* | 2–4 h | High | 0 → 500+ indexable words; 152 new internal links from a dead URL | 2 |
| 15 | Prerender landing copy (outside `#root`) | precedent, gscmcp, agentops | 1 day | Medium | Hygiene. It already ranks at 7.3 / 1.85% CTR as a shell | 2 |
| 16 | `/api` page + CSV + GraphML exports | distribution | 1 day | High | Turns an undocumented CORS-open endpoint into a linkable product | 2 |
| 17 | Zenodo DOI | distribution, pseo | 1 h | Medium | Credibility furniture for the awesome-list PR and academic outreach | 2 |
| 18 | Verify embed anchor + CSP + UTM | distribution | 2 h | High | The only dofollow, compounding channel in the plan | 2 |
| 19 | Launch sequence (r/PL → HN → r/programming) | distribution, aiscope | 1 day prep + 1 day live | **Transformative** | Base: 500 sessions. Good: 8k–25k + 5–20 referring domains | 2 |
| 20 | GSC MCP + API upgrade; emit query-class + device splits | gscmcp, arch, precedent, naming *(4-way)* | half day | High | Agents can pull rank data with no human in the loop | 3 |
| 21 | GitHub repo-composition enrichment + one hub page | pseo, aiscope *(2-way)* | 2 days | High | A refreshable fact nobody publishes; an exploratory-class surface | 3 |
| 22 | `implementation_story` field + `notes` expansion, 40 nodes | agentops | 1 day + ~$25 | **Transformative** | Median 265 → 450+ words; Jaccard 0.295 → < 0.20 | 3 |
| 23 | 12 AI-infra `tool:` nodes, ~35 cited edges | aiscope | 1–2 weeks | High | 12 new `/tools/` pages, zero generator changes, 152 → 164 nodes | 3 |
| 24 | Flagship guide `/guides/what-modern-ai-is-written-in` | aiscope | 3–5 days | High | Launch #2. A claim no competitor can make | 3 |
| 25 | `/bootstrap/{lang}` pilot — 6 pages + canonical decision | pseo | 2 days | Medium | Tests the moat hypothesis for 2 days instead of 2 weeks | 3 |
| 26 | `/decade/` + `/paradigm/` hubs (~17 URLs) with minMembers assertion | pseo | 1–2 days | Medium | Exploratory impressions 103 → 400+ | 3 |
| 27 | `contentQuality.ts` (3 rules) + demand gate in CI | agentops, arch *(2-way)* | 1–2 days | High | A 154th near-duplicate becomes unmergeable; $0/run | 3 |
| 28 | Sitemap sharding + slug registry dedupe | arch, precedent | half day | High | Per-template indexation visible in GSC within 2 weeks | 3 |
| 29 | Three agents + WIP limit of 2 in CI | agentops | half day | Medium | Review-queue overflow impossible by construction | 3 |
| 30 | Strip `\| Language Lineage` from 51 title constructions | naming | 1–2 h | Medium | 67 → 47 chars on `/languages/python`. Google strips it anyway | 3 |
| 31 | Audit the 117 question pages against per-URL impressions | naming, pseo *(2-way)* | 2–3 days | High | Merge or 301 the zero-impression tail into parent language pages | 3 |
| 32 | Mobile conversion fix | *(critique gap, 3 dimensions)* | 2–3 days | High | 529 impressions / 0 clicks → any clicks at all | 3 |
| 33 | Stop committing generated HTML (592 files) | precedent, arch *(2-way)* | half day | Medium | A one-fact fix diffs 3 lines, not 300+. Makes agent PRs reviewable | 4 |
| 34 | Weekly GSC pull committed + Actions cron (data only) | gscmcp, arch | 3–4 h | Medium | Unbounded diffable history; zero human effort | 4 |
| 35 | `og:site_name` sitewide (currently 0 occurrences in generator) | naming | 30 min | Low | Share cards show the brand instead of a bare host | 4 |

---

## THE EIGHT DIMENSIONS

### 1 · Precedent & the database question — **NO DATABASE**

The GeeksForGeeks answer, since you asked specifically: headless WordPress + Next.js behind CloudFront, `cache-control: s-maxage=54109` with `max-age=0`, 51 `wp-content` references still in the markup, a `buildId` timestamp indicating rebuilds measured in hours. Their read path is a CDN serving near-static HTML at 24.5M visits/month. Their MySQL exists for the *authoring* side: an "Improve Article" button that forks a published article into an editor, a staff review queue, per-edit attribution, and a contributor payment ledger at ₹50–100 per accepted improvement. You have none of those problems.

The counterexamples settle it. MDN: 14,000+ pages, 505 MB repo, 23,230 forks, 100+ commits in 30 days, markdown in git, static generation via Yari, no database. tldr-pages: 63,583 stars, 5,400 forks, pure markdown. roadmap.sh — the closest structural analogue — keeps one markdown file per graph node alongside structured JSON for rendering. The sites that genuinely need databases need them for concurrent writes and per-user state: Wikipedia at 1.37 billion edits, Stack Overflow at ~2 billion monthly pageviews of user-generated, voted, live-revised content on nine web servers and one SQL Server.

Build time will never be the constraint: generation benchmarks at **0.07 ms/page**, flat and linear — 10,000 pages in 716 ms, 50,000 in 4.3 s. The full `npm run build` today is 3.68 s. The thing that actually breaks first is *editing ergonomics* — `generateSeoPages.ts` is 5,982 lines with **21 separate `<!DOCTYPE html>` literals and no shared layout helper**. That is a templating problem, not a storage problem, and a database would leave all 21 shells exactly where they are.

**One nuance the research got wrong and worth correcting:** the GFG-style "refresh evergreen content on a rolling cadence" lesson does not transfer. The 132 language pages are deterministic renders of a fixed graph — there is nothing to refresh unless the dataset changes. GFG's staggered `dateModified` values are a *symptom* of a paid contributor army producing genuinely new text. You cannot copy the symptom without the cause. The real version of that lever is growing the dataset, which is a research task with a different shape and owner.

### 2 · Programmatic SEO — **STOP EXPANDING DEFINITIONAL SURFACE**

The sitemap already holds 304 URLs: 132 languages, 117 questions, 22 tools, 14 guides, 7 relationships. **Phase 3 already generated 104 auto question pages** (PR #23, sitemap 199 → 303). The measured return: definitional queries 2,613 impressions at 0.08% CTR. That is roughly two clicks per 2,600 impressions. Building more of them is the dimension's default instinct and it is wrong here.

**Kill list, with reasons:** 4,753 `/compare/{a}-vs-{b}` pages (only 252 pairs have a direct edge; median unique text per pair is ~7 words of edge notes; the SERP is JetBrains/StackShare/dev.to on commercial intent). `/company/{org}` (96 of 152 null). `/year/{y}` (26 of 52 years hold one language). `/cluster/{hint}` (37% of nodes are "other"). `/written-in/{lang}` (only 15 nodes implement ≥2 things — and it's definitional). `/who-created-{lang}` and `/is-{lang}-self-hosting` (knowledge-panel queries with zero click available).

**Build list:** exploratory browse hubs only, and the `/bootstrap/` pilot, both gated on the demand rule.

The genuinely underused asset is that `data-nosnippet` wrapper on the related-links section: it means the `buildRelatedSection` bug is a **crawl-equity and UX defect**, not a duplicate-content penalty risk. Get that framing right so the fix gets prioritized for the correct reason — 1,800 internal links pointing at 12 destinations is a star topology, and the site's best content is starved by it.

### 3 · Brand, naming, domain — **KEEP THE NAME, CLOSE THE QUESTION**

Do not rename. Do not buy `.com`/`.dev`/`.io`/`.ai` defensively — branded search is not a meaningful acquisition channel here, so $130/yr insures against type-in traffic that does not exist. Do not transfer the repo to an org or publish the JSON to npm; nobody discovers a reference site by browsing the npm registry.

Write the decision into `CLAUDE.md` **with the reasoning, not just the verdict**, so an agent cannot reopen it by re-deriving the same arguments:

> The domain is `languagelineage.org` and the brand is Language Lineage. Do not propose renames, alternative domains, or defensive domain purchases. Researched and closed: domain migration averages ~523 days to recover across ~892 studied migrations with 17% never recovering; exact-match domains have been a near-zero ranking factor since 2012; branded search is not a meaningful acquisition channel here.

Two corrections to the naming research worth recording so they aren't re-found: the "131 programming languages" claim on `/programming-language-family-tree` is **correct** — production runs 131 language nodes; the "112" in the original brief describes the stale tree. And `/programming-language-family-tree` **already self-canonicalizes** at `generateSeoPages.ts:1031–1056` and **is already in the sitemap** at priority 0.85. The real, smaller defect is that *both* it and `/guides/programming-language-family-tree` are emitted as 200 pages with self-canonicals and both appear in the sitemap — a self-inflicted duplicate. Keep the short URL (it holds the ranking), remove the guide slug from `generateSitemap.ts`, and add a permanent redirect.

The trademark thread is closed: "Language Lineage" faces no conflict with NCSoft's LINEAGE II (different class, different goods) or LineageOS. Don't leave it dangling as FUD.

Actionable brand work, total: strip the suffix from 51 title constructions, add `og:site_name` (currently **0 occurrences** in a 5,982-line generator), and check whether `/og-image.png` is legible at Slack thumbnail size or is one generic image across 304 URLs — that matters more than the meta tag.

### 4 · AI scope — **PROVENANCE ONLY, ENFORCED BY A RULE**

Append to `CLAUDE.md`:

> **## Scope boundary**
> **ADMIT** a node only if (1) it has an implementation-provenance edge terminating in a node already in the dataset, **and** (2) its implementation-language fact is stable year over year.
> **REJECT**, with the incumbent named so it isn't re-litigated:
> - AI model lineage graphs → Hugging Face Model tree, 2M+ repos, owns the data at source via `base_model:` metadata
> - Model / benchmark / parameter trackers → Epoch AI (3,500+ models, CC-BY, daily CSV); Artificial Analysis (index v4.1.1)
> - AI tutorials and "AI explained" → 3Blue1Brown, Karpathy, d2l.ai
> - Ingesting Epoch's or HF's datasets → derivative table, zero differentiation, imports their daily-refresh burden onto one person
> - OS lineage → Lévénez, Spinellis `unix-history-repo`
> - Paper/citation lineage → Connected Papers, Semantic Scholar
> Next candidate cluster: **databases**, gated on the AI slice converting.

The reason this works: scoping by *topic* makes the boundary arbitrary (languages vs AI — where's the line?). Scoping by *edge type* makes it mechanical, and an agent can apply it without judgment. It also happens to be exactly the line Google's site-reputation-abuse policy draws between deepening a cluster and exploiting authority for unrelated content.

**The naming question resolves here too, and should be settled rather than left open:** because every *answer* is a language, "Language Lineage" survives the expansion — but only if AI infrastructure lives under `/tools/` and is framed as "what the AI stack is written in." Make that a constraint, not an open question.

Don't build the CI job that auto-writes edges from GitHub's languages API. The dataset has no `repo` field (15 keys, none of them `repo`), Linguist counts bytes rather than architectural significance, and injecting machine edges at a flat confidence 1.0 destroys the calibration that makes the confidence score mean anything across 443 hand-scored edges. If any version survives, it is a GitHub Action that **opens an issue** when a repo's composition shifts more than 5 points across ~20 hand-picked repos. That's an hour, not days.

### 5 · Architecture for scale — **THE DIMENSION IS THE WRONG QUESTION**

At 30 clicks / 4,770 impressions per 28 days, impressions are not scarce — clicks are. 10x-ing page count against a 0.63% conversion rate produces roughly 47,000 impressions and ~300 clicks in the best case, and far more likely dilutes a domain already struggling to convert. The real architectural conclusions are three:

**Cytoscape renders to `<canvas>`.** SSR, `vite-react-ssg`, Astro islands and Next.js all produce identical zero-text output for `/explore`. Write this down so a 1–4 week framework migration is not re-proposed. The fix is a static text layer, cost ~2–4 hours.

**Vercel's real limits are not where you'd think.** Build cap is 45 minutes on all plans — at 0.07 ms/page that's ~38 million pages. Output-file counts cause slowdowns at 100,000+. The 15,000-file cap applies to CLI uploads, **not** git-integration builds. The one config limit that bites: 2,048 routes per deployment, so never enumerate pages in `vercel.json` — rely on filesystem routing. Hobby's 100 GB Fast Data Transfer at 268 KB/dataset-load is ~373,000 fetches, which the immutable-cache fix makes moot.

**The 592 committed files under `public/` are a workflow problem, not a storage problem.** Every `seo:generate` rewrites all of them, so a one-word fact correction produces a 300+ file diff — genuinely corrosive to reviewing agent-authored PRs, which is exactly the workflow you want. Defer to Phase 4 because the migration is riskier than it looks: the vite dev middleware reads from `public/`, and `validateSeo`, `auditInternalLinks`, `analyzeGsc` and the Playwright suites all assume that path.

### 6 · GSC MCP + the automation loop — **DON'T BUILD A SERVER**

At least eight GSC MCP servers already exist. Install `ahonn/mcp-server-gsc` (261 stars, MIT, npm, service-account auth, one `search_analytics` tool with 25,000-row support and regex filters) pinned to an exact version at project scope. Skip `Suganthan-Mohanadasan/Suganthans-GSC-MCP` — adopting a 29-tool server whose write tools you then have to deny is worse than not adopting it.

**Hard API facts that constrain the design.** Search Analytics: 16 months / 486 days of history, 25,000 rows per request with `startRow` pagination against a ~50,000-row/day/site export ceiling, 1,200 QPM per site, 2–3 day lag (so a Monday run ends its window at T-3). URL Inspection: **2,000 QPD and 600 QPM per site** — at 304 URLs a full daily index-coverage sweep costs 15% of quota, which makes weekly sweeps free. **The Indexing API is off the table entirely**: since May 2025 Google enforces JobPosting/BroadcastEvent only and revokes access for misuse. The structural mitigation is to give the CI service account role **Full**, not Owner — a Full user gets 403 on Indexing, so misuse becomes impossible rather than merely forbidden.

**Do not build the seven-rule opportunity engine.** Every threshold in it was invented before a single GSC row was pulled, and at 100 impressions per 28 days a page's observed CTR carries a 95% CI of roughly ±3.4 points — wider than any plausible title-rewrite effect. Detecting a 3% → 4.5% lift at p<0.05 needs thousands of impressions per page. Nothing here except the homepage has that. For the same reason, **skip the 42-day experiment ledger**: an A/B log that can only ever return "neutral" is worse than none, because it blocks edits for six weeks while producing noise.

Skip IndexNow (accelerates discovery for crawlers that can already find 304 sitemapped URLs; Bing+Yandex+Naver+Seznam is a low-single-digit share of an English developer audience). Skip BigQuery bulk export (needs billing; solves a row-ceiling you won't hit).

**Write a kill criterion now:** if after 8 weekly pulls the loop has produced no change that moved aggregate CTR, delete `scripts/gsc/` and spend the hours on distribution.

### 7 · Agent operations — **THREE AGENTS, DETERMINISTIC GATES**

The repo is unusually well-suited to agent work for one reason: generated HTML is committed, so an agent PR that rewrites a guide shows a literal before/after prose diff on GitHub. No CMS, no database, no preview deploy needed for review. That property is worth protecting — it is the strongest single argument against a database.

**The binding constraint is review minutes, not dollars.** API cost lands at $20–45/month steady state plus ~$25 one-time for the prose sweep (Opus 5 at $5/$25 per MTok; Batch API halves it; put the 268 KB dataset behind a cache breakpoint for ~0.1x reads on repeated per-language sessions). But 5 minutes to review a 900-word PR with six external citations is fiction — verifying the citations alone exceeds it. Real cost is 20–30 min per prose PR, which makes the sustainable rate roughly **one substantive content PR per week**. Cap open `agent-content` PRs at **2** in CI via `gh pr list --label agent-content --state open --json number | jq 'length'`.

**Spend LLM money only where a script can verify the output.** Never run an LLM page-auditor over 304 pages weekly (~$32/month) to produce checks `contentQuality.ts` performs deterministically for $0.

**The single best agent design decision in all the research:** give `evidence-auditor` no Write or Edit tools at all. An agent asked to verify a claim must not be able to edit the claim to match what it found.

**Non-negotiable boundaries, in `CLAUDE.md` *and* the deny list** (prompt guardrails erode across runs; deny lists don't): never edit `dataset/v5/lineage_v5.json` relationships, `evidence_source`, or `confidence` values without human review — 443/443 evidence coverage is the site's only real differentiator and the only thing an LLM cannot cheaply fabricate. Never touch `robots.txt`, canonical tags, or `generateSitemap.ts`. Never call any `submit_url` tool. Never push to `main`. Never rewrite more than 5 titles in one run.

**Path-scoped rules** (`.claude/rules/*.md` with `paths:` frontmatter) are worth exactly one edit, not a six-file restructure: the root `CLAUDE.md` currently says *"Don't modify the dataset structure,"* which directly contradicts every dataset agent in this plan. Fix that contradiction; skip the rest.

### 8 · Distribution — **THE ACTUAL CONSTRAINT**

HN Algolia returns `nbHits: 0` for "languagelineage." The project has never been launched anywhere. `DISTRIBUTION.md` exists on `origin/main` with a launch checklist, `/embed-kit` shipped 2026-09-01, the dataset page carries CC BY 4.0 and a citation block — **the site is packaged for distribution and has not been distributed.** At 30 clicks per 28 days, one HN front page outweighs every SEO item in this plan combined.

**Correct one piece of link-equity folklore before it misallocates hours:** Wikipedia external links, Reddit links, HN links, and GitHub README links (awesome-lists included) are **all `rel="nofollow"`**. The only channels in this plan that can produce a dofollow link are **the embed snippet's visible `<a href>`** and **`.edu` course pages**. Everything else earns referral traffic and credibility. Say this once so activity isn't mistaken for SEO.

**Wikipedia is a trap here.** 312 of 443 evidence URLs (**70.4%**) point at en.wikipedia.org — up from 62% on v4. Citing yourself back on Wikipedia is WP:CIRCULAR on top of WP:COI and WP:ELNO#4, and it risks the domain being blacklisted. **Wikidata** is the correct target and maps 1:1 onto the schema (P737 "influenced by" ↔ the 252 influence edges; P277 "programmed in" ↔ the 180 implementation edges) — but note it produces zero attribution and zero backlink by design, so treat it as altruism, not acquisition, and don't let it consume launch hours.

The realistic press targets are aggregator blogs that publish daily and actively want this format — GIGAZINE and Google Maps Mania both covered Map of GitHub. Not TechCrunch.

---

## WHAT NOT TO DO

**Do not migrate to a database, Supabase, or Postgres.** Weeks of work, a backend to secure, a new failure mode, hosting cost, and it destroys the git-diffable review that makes agent PRs possible. The GFG comparison does not transfer: their DB serves a paid contributor workflow and moderation queue, not the read path.

**Do not rename or buy defensive domains.** ~523-day average recovery; 17% never recover; EMD is near-zero since 2012; branded search is negligible here. `$130/yr` insures against type-in traffic that does not exist.

**Do not add more `/questions/` pages.** 117 are already live. The class they compete in converts at 0.08%. This is the single recommendation most in need of killing because it is the default instinct.

**Do not build 4,753 `/compare/{a}-vs-{b}` pages.** Only 252 pairs have a direct edge; median unique text per pair is ~7 words; head terms are owned by commercial-intent incumbents; and the fallback ("win *rust vs c++ implementation*") is definitional — the 0.08% class.

**Do not run another title/description CTR pass.** Phase 2 did it across 197 pages (0 duplicates, all within length) and definitional CTR stayed at 0.08%. Variant-B titles shipped on the five money pages on 2026-09-01. Two iterations, no movement. That query class has no click to win at any snippet quality.

**Do not do another generic depth pass on definitional pages.** Phase 4 took the five highest-impression pages to 1,287–1,580 words. `/languages/rust` still gets 2 clicks on 898 impressions. Depth is worth doing for *uniqueness* (item 22), not as a CTR lever on this class.

**Do not split prose into per-language markdown files "like roadmap.sh."** The premise is false: the `notes` field is ~81 chars per node and edge notes have a median of **6 words**. There is no long-form prose to relocate. The bottleneck is that it was never *written*, not that it's stored wrong.

**Do not build a `/gaps` page around the 47 "unspecified" languages.** 43 of 47 already have implementation edges. Publishing "we don't know what these 47 are written in" would be publicly, checkably wrong in front of the exact audience most likely to check.

**Do not build the seven-rule GSC opportunity engine or the 42-day experiment ledger.** Statistically unreadable at this traffic level; thresholds invented before any data was pulled; the ledger blocks edits for six weeks while returning "neutral."

**Do not build a GSC MCP server.** Eight exist. Days of work for zero differentiation.

**Do not build a 10-agent roster or six slash commands.** Ten agents opening PRs against a 2-PR WIP limit is a queue that only grows, and wrapping `npm run seo:generate` in a markdown file is ceremony for an audience of one. Four of the proposed ten were thin wrappers over deterministic scripts.

**Do not attempt the AI model lineage graph, model trackers, or AI tutorials.** HF Model tree (2M+ repos, owns the data at source), Epoch AI (daily CC-BY CSV), 3Blue1Brown/Karpathy/d2l.ai. Each is a losing fight with a named, funded incumbent.

**Do not migrate frameworks to fix `/explore`.** Cytoscape renders to `<canvas>`; every renderer produces zero text. A static text layer costs 2–4 hours and captures the entire benefit.

**Do not seed Lobsters.** Invite plus three weeks of genuine commenting for 300–1,500 sessions is the worst hours-per-session ratio available, and it makes the launch date hostage to a dependency you don't control.

**Do not extract the full route-module registry from `generateSeoPages.ts` yet.** 5,982 lines, weeks of golden-file-gated porting, zero traffic movement — and 14 phases already shipped through the monolith. Do the one-hour slug-registry dedupe (which fixes a real drift bug) and revisit the rest only when a specific page type is blocked on it.

---

## METRICS

Everything routes through `npm run gsc:analyze` (extended to emit the query-class and device splits) plus Vercel Analytics. The measurement log in `SITE_IMPROVEMENT_PLAN.md` §5 is the ledger — keep appending to it.

### Weekly (15 minutes, Monday)
| Metric | Source | Watch for |
|---|---|---|
| Clicks / impressions / CTR, 28d | GSC | The headline number. Currently 30 / 4,770 / 0.63% |
| **Definitional vs exploratory CTR** | `analyzeGsc.ts` (add this) | The gate on every content decision. Currently 0.08% / 2.91% |
| **Device split** | `analyzeGsc.ts` (add this) | Mobile is 529 impressions / **0 clicks** |
| Referring domains (non-search) | GSC Links / Vercel referrers | The only number that matters pre-launch. Currently ~0 |
| Open `agent-content` PRs | `gh pr list` | Must stay ≤ 2 |

### Monthly (60 minutes, first of the month)
| Metric | Target trajectory |
|---|---|
| Indexed / submitted, **per sharded sitemap** | ≥90% on languages and guides; the questions shard is the diagnostic |
| Language-page median word count | 265 → 450 (M6) |
| Mean pairwise 5-gram Jaccard | 0.295 → <0.20 across enriched nodes |
| Wikipedia share of evidence URLs | **70.4% → below 55%** at ~30 edges/month via `evidence-auditor` |
| Dead evidence URLs | 0, always |
| Embeds detected in the wild | via the embed `utm_source` |
| Email subscribers | Phase 2 onward |

### Targets — base case / good case

| | Today | 3 months | 6 months | 12 months |
|---|---|---|---|---|
| Search clicks / 28d | 30 | 50 / 120 | 100 / 300 | **200 / 800** |
| Impressions / 28d | 4,770 | 6,000 / 10,000 | 9,000 / 20,000 | 15,000 / 45,000 |
| Sitewide CTR | 0.63% | 0.8% / 1.2% | 1.1% / 1.5% | 1.3% / 1.8% |
| **Exploratory impressions / 28d** | 103 | 250 / 500 | 500 / 1,200 | 1,000 / 3,000 |
| Referring domains (non-search) | ~0 | 5 / 20 | 12 / 35 | **20 / 60** |
| Total sessions / month | — | 3,000 / 25,000¹ | 1,500 / 6,000 | 3,000 / 15,000 |
| Mobile clicks / 28d | **0** | 5 / 20 | 20 / 60 | 40 / 150 |
| Embeds live | 0 | 0 / 3 | 2 / 8 | 3 / 20 |

¹ Month 3 includes the launch spike, which decays. Do not read the post-launch drop as failure — read the new *baseline*, which should sit meaningfully above 30 clicks/28d.

**A 13–27x on search clicks over 12 months is aggressive but achievable from a 30-click base with real inbound links.** It is not achievable by adding URLs; every point of it is downstream of the launch and the depth work.

---

## THE FIRST WEEK

**Monday — reconcile (2–3 h).** This is the loaded gun.
```bash
cd /Users/sanketmuchhala/Documents/GitHub/ProgrammingLanguageGraph
git fetch --all && git checkout origin/main && git switch -C main origin/main
npm ci && npm run build
grep -c '<loc>' public/sitemap.xml           # must be 304
npm run seo:validate && npm run seo:links    # must be 0/0/0
```
Confirm the Vercel project's deploy source is `main`. Read `SITE_IMPROVEMENT_PLAN.md` §5 (the measurement log) and §4 before writing any code.

**Monday afternoon — three decisions into `CLAUDE.md` (1 h).** Append: (1) *"Production has diverged from this repo before — verify the deployed commit matches main before running `npm run build` and deploying."* (2) The no-rename paragraph with the ~523-day reasoning. (3) The `## Scope boundary` section from §4 above, including the named reject list. (4) The no-database decision with its three revisit triggers. Also fix the existing contradiction: *"Don't modify the dataset structure"* must become *"Field VALUES may be enriched with a cited source; schema SHAPE changes require their own PR."*

**Tuesday — the four live defects, one PR each (4–5 h).**
1. `vercel.json`: explicit rewrites for `/explore` and `/embed`, keep the apex redirect, emit `404.html`. Verify: `curl -w '%{http_code}' https://www.languagelineage.org/this-page-does-not-exist-xyz` → **404**.
2. `scripts/generateSeoPages.ts:1691`: add the node filter + tiered fallback. Verify: 152 distinct related blocks; `/languages/lua/` and `/languages/ada/` no longer byte-identical.
3. `scripts/generateSitemap.ts`: git-derived per-URL `lastmod`; delete `changefreq` and `priority`. Verify: ≥5 distinct lastmod values.
4. `vercel.json` headers: immutable cache on `/dataset/v5/(.*)`.

**Wednesday — data hygiene + legal (3–4 h).**
5. Backfill the 43 recoverable `unspecified` implementation scalars from existing edges. Leave Machine Code, Assembly, BCPL, Lazy ML null. Run `npm run analyze:v4`.
6. Delete the `FAQPage` deflection block. Verify: `grep -rl 'See the implementation section above' public/ | wc -l` → **0**.
7. `LICENSE` (MIT) at root, `dataset/LICENSE` (CC BY 4.0), one-line `dataset/README.md` with the attribution string you want.
8. `gh repo edit sanketmuchhala/LanguageLineage --description "..." --add-topic programming-languages --add-topic compilers --add-topic dataset --add-topic data-visualization --add-topic bootstrapping --add-topic open-data`

**Thursday — evidence integrity + the query-class decision (4 h).**
9. Write a 20-line link checker over the 443 unique `evidence_source` URLs. Fix or replace any 4xx. This is launch insurance.
10. Pull a fresh 28-day GSC export into `reports/GSC SEO rep/`, run `npm run gsc:analyze`, and **classify every query with ≥10 impressions** as definitional (`^(what|is|who|when|does)\b`, or containing `written in|compiled|self.hosting`) vs exploratory. Append the row to the measurement log. Then write the gate into `SITE_IMPROVEMENT_PLAN.md`: *no new programmatic page type ships unless it targets the exploratory class, or definitional CTR has risen above 0.5%.*

**Friday — start the launch asset (4–6 h).**
11. Write and commit `scripts/computeCentrality.ts` (reverse PageRank over the 252 influence edges, damping 0.85; transitive descendant counts; C/C++ implementation closure). Print the table. **Do not transcribe numbers into prose — generate them.**
12. Draft `/rankings/most-influential` around ALGOL's 65-of-131 descendants and Lisp's 7.26% PageRank, with the method in plain language, your own curation caveat stated first, and the script linked.

**Weekend or next Monday — the capture mechanism.** RSS feed from the existing `seo:generate` chain + one email signup line on `/dataset` and the story page. **Do not submit anything anywhere until this exists** — an HN front page with nothing to catch it is a one-day spike you cannot repeat.

---

## RISKS

**1 · Deploying from the stale tree deletes 148 indexed URLs.**
`npm run build` on local `main` produces 156 sitemap URLs against 304 live. It would remove 33 language pages and 103 question pages from the index in one deploy, and Google's recovery from mass deindexation is measured in months. *Mitigation:* Monday's reconciliation is item #1 in the first-week list; the `CLAUDE.md` warning makes it survivable across agent sessions; verify a local build's sitemap URL set matches the live set at 0 diff before any deploy.

**2 · The launch flops and the plan has no plan B.**
The median Show HN gets under 10 points, and the entire Phase 2 exit criterion routes through one submission. *Mitigation:* write the day-3 branch now, before the emotion. If the post dies: resubmit in six months (Map of GitHub scored 471 in 2023, **717 on resubmission** in 2024) and reallocate to embeds, exports, and the DOI — channels whose payoff doesn't route through a single thread. Rehearse on r/ProgrammingLanguages first so the dataset errors surface before HN sees them. And ship the second story (`/guides/what-modern-ai-is-written-in`) as an independent second shot rather than a dependent follow-up.

**3 · The evidence moat erodes while nobody watches.**
70.4% of evidence URLs are en.wikipedia.org, up from 62% on v4 — the concentration is *growing* as the dataset grows. Confidence scores cluster at 0.887 mean with a 0.65 floor and no low-confidence tail, which suggests scores were assigned by feel. Add AI-infra nodes at speed and this gets worse. If a commenter spot-checks five sources on launch day and two are circular or dead, the "this isn't just a graph" defense collapses in public. *Mitigation:* link-check before launch (Thursday item 9); run `evidence-auditor` at ~30 edges/month with a hard Wikipedia cap of 0.90 confidence; consider deriving confidence mechanically from source type (Wikipedia ≤0.85, primary docs 0.95, source commit 0.99) so all 443 scores become reproducible; and set a rule that no new node ships without at least one non-Wikipedia source.

**4 · Review capacity collapses and agents produce an unreviewed backlog.**
The realistic sustainable rate is one substantive prose PR per week at 20–30 minutes each. Three agents plus a content pipeline can generate faster than that, and the failure mode — rubber-stamping — is how a site ends up with hundreds of unreviewed AI pages and a classifier problem, on a corpus already at ~0.295 mean pairwise Jaccard. *Mitigation:* the WIP limit of 2 enforced in CI, not in willpower; `contentQuality.ts` as a deterministic merge gate with zero LLM in the path; the `duplication-sentinel` biased toward MERGE-INTO-EXISTING; and a hard stop written into `CLAUDE.md` — *if 2 agent-content PRs are open, agents may only do dataset and internal-linking work until the queue drains.*

**5 · Scope creep re-opens settled questions and burns months.**
The owner has already spent cycles on "should I use a database," "should I rename," and "should I teach AI." Thirteen remote branches exist. Every fresh agent session with an empty context will re-derive the same debates unless the reasoning — not just the verdict — is committed. *Mitigation:* all three decisions go into `CLAUDE.md` on Monday with their evidence, so an agent cannot reopen them by re-deriving the same arguments. The `## Scope boundary` rule makes admission mechanical rather than a matter of taste. Databases are named as cluster #2 and explicitly gated on the AI slice converting, so impatience has a defined outlet instead of an undefined one. And a written kill criterion for the automation loop (8 pulls with no aggregate CTR movement → delete `scripts/gsc/`) prevents maintenance overhead from masquerading as progress.