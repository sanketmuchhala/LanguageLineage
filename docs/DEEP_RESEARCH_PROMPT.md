You are a senior SEO + growth strategist with deep research access. I need you to run a live-evidence research pass that will be folded directly into a master growth plan for a small technical reference website. Everything below is verified ground truth — do not re-derive it, do not contradict it, and do not spend effort re-answering the questions listed in "ALREADY SETTLED." Your entire job is to resolve the open questions in "RESEARCH BRIEF" using live sources, real competitor data, and real search-demand evidence, and to return your findings in the exact output format specified at the end.

Today's date is 3 September 2026. Prefer sources from the last 12 months; explicitly flag anything you cite that is older than 24 months.

═══════════════════════════════════════
PART 1 — PROJECT CONTEXT (verified, do not re-derive)
═══════════════════════════════════════

**Site:** https://www.languagelineage.org — deployed on Vercel, solo-owned, no revenue, no accounts, no backend, no database.

**Repo:** github.com/sanketmuchhala/LanguageLineage (renamed from ProgrammingLanguageGraph). 0 stars, no LICENSE file as of the last check.

**What it is:** An interactive graph + static reference site documenting programming language *lineage* — specifically three things nobody else structures together: what each language's compiler/runtime is actually written in, how compilers bootstrap themselves, and which languages influenced which. Every relationship carries an evidence_source URL and a confidence score.

**Stack:** Vite 5 + React 18 + TypeScript (SPA), Cytoscape.js 3.28 + cose-bilkent for the graph (canvas renderer), Zustand, react-router-dom 7, Zod validation. All content pages are static HTML generated at build time by a single ~6,000-line TypeScript file (scripts/generateSeoPages.ts) that writes raw HTML strings into public/. No CMS, no database, no API backend.

**Data (single JSON file is the entire source of truth):** 152 nodes (131 languages + 21 tools such as V8, LLVM, GCC, GHC, BEAM, Clang, Roslyn, SpiderMonkey, JavaScriptCore, mrustc), 443 relationships, 100% carrying an evidence_source URL and a confidence score (min 0.70, mean ~0.90). Edge types: influenced, compiler_written_in, runtime_written_in, bootstrap_written_in, transpiled_to, rewritten_in. Date range 1949–2023. 62% of evidence URLs point at en.wikipedia.org. Logos populated for 96/152. Licensed CC BY 4.0 on the /dataset page (but no LICENSE file in the repo).

**Content surface (~304 URLs, all statically generated):**
- CSR-only React routes (crawlers see a ~3KB empty shell): `/` (landing), `/explore` (the graph), `/embed`
- True static HTML: `/dataset`, `/languages` + 132 language pages, `/tools` + 21 tool pages, `/guides` + 14 guides, `/relationships` + 6, `/questions` + 117 question pages ("what is X written in", "is X compiled", etc.), plus SEO landing pages at `/programming-language-graph`, `/programming-language-family-tree`, `/programming-language-genealogy`, `/programming-language-evolution`, `/what-are-programming-languages-written-in`, `/compiler-runtime-bootstrap`, plus `/timeline`, `/how-it-works`, `/embed-kit`, `/directory`
- Infra: sitemap.xml (304 URLs), robots.txt, llms.txt, manifest, 191 OG images

**Page depth:** language pages currently run ~550–1,800 words (e.g. /languages/rust ≈ 1,679 words, /languages/python ≈ 1,439). Question pages average ~365 words and are machine-templated from one dataset, differing mainly by entity name. The 112-page corpus previously measured ~0.295 mean pairwise 5-gram Jaccard similarity.

**THE MEASURED PERFORMANCE PROBLEM (this is the crux — everything must be argued against these numbers):**
- Google Search Console is verified and has been driving the roadmap. Committed measurement log:
  - 2026-06-25 baseline: ~2,900 impressions / ~7 clicks per 28 days
  - 2026-09-01: **4,770 impressions / 30 clicks per 28 days, 0.63% sitewide CTR**
- **Query-class split (the single most important number): definitional queries — 2,613 impressions at 0.08% CTR. Exploratory queries — 103 impressions at 2.91% CTR. A 36x CTR gap.**
- The homepage — the 3KB CSR shell — ranks at position 7.3 with 1.85% CTR, the site's *best*-converting page. The fully static, deeply enriched /languages/rust sits at 0.22% CTR (898 impressions, 2 clicks).
- "what is rust written in" ranks position 9.49 with 108 impressions and **zero clicks**.
- **Mobile: 529 impressions, 0 clicks.** Total device-level conversion failure, unexplained.
- Two separate title/meta rewrite experiments (a full sitewide pass, then variant-B titles on the five highest-impression pages) failed to move definitional CTR.
- The site has **never been launched anywhere** — zero Hacker News submissions confirmed via the HN Algolia API, no Reddit posts, no inbound-link strategy, no community presence.

**Owner constraints:** one person, limited hours, cost-sensitive, Vercel Hobby tier, heavy Claude Code user who explicitly wants AI agents doing the ongoing work.

═══════════════════════════════════════
PART 2 — ALREADY SETTLED (do NOT research or re-argue these)
═══════════════════════════════════════

These were resolved with high-confidence evidence. Treat them as fixed constraints. If your research contradicts one, say so in a single clearly-marked line and move on — do not build recommendations around relitigating them.

1. **No database.** GeeksForGeeks was probed directly: headless WordPress behind Next.js and CloudFront with `s-maxage=54109` (~15h CDN TTL); their MySQL exists to run a paid contributor workflow (INR 50–100 per accepted edit) and moderation queue, not to serve pages. MDN runs 14,000+ pages with 23,230 forks on markdown-in-git with no DB. This site has one human contributor and zero per-user state. **Question closed.**
2. **Do not rename the site or buy defensive domains.** Domain migrations average ~523 days to recover; exact-match domains have been a near-zero ranking factor since 2012; branded search is not a meaningful acquisition channel here. **Question closed.**
3. **Do not build a Google Search Console MCP server.** At least eight exist; ahonn/mcp-server-gsc (MIT, npm, service-account auth, 25k-row search_analytics) is the pick. The remaining work is wiring the API into existing scripts, not building a server.
4. **Do not migrate frameworks.** Cytoscape renders into a `<canvas>`, so SSR / Astro / Next.js produce zero indexable text for /explore regardless. Static text layers are the fix, not a renderer change.
5. **Do not build an AI model lineage graph or teach AI.** Hugging Face's Model tree covers 2M+ models with base_model relation edges; Epoch AI publishes a daily-updated CC-BY CSV of 3,500+ notable models; AI education is owned by 3Blue1Brown, Karpathy and d2l.ai.
6. **Known infrastructure defects already identified** (do not re-find them): vercel.json's catch-all `/(.*)` → /index.html rewrite makes every unknown URL return HTTP 200 with the SPA shell (site-wide soft 404); all 304 sitemap lastmod values are identical build stamps; buildRelatedSection fails to filter relationships to the current node so ~100 pages emit an identical "Related Languages" block; 92 language pages ship FAQPage JSON-LD whose acceptedAnswer is the literal deflection "See the implementation section above for details and source references."

═══════════════════════════════════════
PART 3 — RESEARCH BRIEF (what I actually need)
═══════════════════════════════════════

Nine themes. Each names the specific evidence I want and the sources to hit. Where I ask for numbers, give numbers with a source and a stated confidence — do not give me qualitative reassurance in place of data.

───────────────
**THEME 1 — Is the definitional query class winnable at all, or is it structurally zero-click? (HIGHEST PRIORITY)**
───────────────

This determines whether the entire content strategy is salvageable or must be abandoned. 2,613 impressions at 0.08% CTR on queries like "what is python written in" / "what is rust written in" is the site's central failure.

1.1 Run live SERP checks (or cite recent SERP-feature studies) for these exact queries and report what occupies the result page above the first organic link: *what is python written in*, *what is rust written in*, *what language is javascript written in*, *what is the go compiler written in*, *is rust self hosting*, *what is v8 written in*, *what is llvm written in*. For each: is there an AI Overview? A featured snippet? A knowledge panel? How many pixels/results down is position ~9?

1.2 What is the current published evidence on organic CTR when an AI Overview is present? I want specific studies with numbers and dates — candidates: Ahrefs' AI Overview CTR studies, Amsive, Seer Interactive, Similarweb, Pew Research's 2025 click-behavior study, Search Engine Land / Search Engine Journal coverage, Google's own public statements. Is a 0.08% CTR at position ~9 on an AI-Overview query *normal* for this query class, or anomalously bad even by AIO standards?

1.3 Critically: **do the definitional impressions have any residual value?** If Google answers "what is Python written in" inline, is there evidence that being the *cited source inside* an AI Overview produces measurable traffic, brand exposure, or downstream benefit? What is the current best evidence on how a site becomes the cited source in an AI Overview / AI Mode / ChatGPT Search / Perplexity answer? Name specific, tested tactics with evidence, not GEO-vendor marketing copy.

1.4 Is there any way to *measure* AI-answer citation for a small site as of September 2026? Does GSC separate AI Mode / AI Overview impressions yet? What free or cheap tools actually track LLM citations (name them, with pricing)? What can be inferred from server logs / Vercel analytics about GPTBot, ClaudeBot, PerplexityBot, Google-Extended traffic, and is that worth instrumenting?

1.5 **Verdict I need:** should the site (a) keep the 117 question pages and optimize for AI citation, (b) consolidate/prune them, or (c) noindex them and redirect the intent into the language pages? Argue it from the evidence, and state what would change your answer.

───────────────
**THEME 2 — Where is the exploratory demand, and how big is it?**
───────────────

Exploratory queries convert at 2.91% but only produce 103 impressions per 28 days. The obvious strategy is to grow that class. But nobody has sized it.

2.1 Using whatever keyword-volume evidence you can access (Google Keyword Planner data quoted in public articles, Ahrefs/Semrush free tools and published data, Keywords Everywhere data cited in blogs, Reddit/HN/Stack Overflow question frequency as a demand proxy), estimate monthly search volume for these *exploratory/browse* patterns and rank them:
- "programming language family tree" / "programming language genealogy" / "history of programming languages"
- "timeline of programming languages" / "programming languages by year" / "programming languages of the 1970s"
- "self hosting compiler" / "list of self hosting languages" / "bootstrapping a compiler"
- "which languages are written in C" / "languages implemented in C"
- "how are programming languages made" / "how does a compiler compile itself"
- "functional programming languages list" / "languages by paradigm"
- "what language is [framework/tool] written in" (PyTorch, TensorFlow, CUDA, Ollama, llama.cpp, Postgres, SQLite, ClickHouse, DuckDB, Kubernetes, Docker)
Give ranges and state your confidence. If you cannot get real volume for a term, say so explicitly rather than guessing.

2.2 For the top ~8 exploratory terms you identify, who ranks 1–10 today and how strong are they? Specifically assess: levenez.com/lang (Éric Lévénez's static timeline), hopl.info, Wikipedia's "Timeline of programming languages" / "History of programming languages" / "Generational list of programming languages", pldb.io (5,145 concepts / 135k facts), programminglanguages.info (872 languages with /types/, /paradigms/, /timeline/ URL patterns), Rosetta Code, and any others you find. For each incumbent: last updated, does it have an evidence/citation layer, is it interactive, is it mobile-usable, does it have any obvious weakness a small evidence-cited competitor could exploit?

2.3 Is there a *specific, named* exploratory query where a small site with 443 evidence-cited edges could realistically reach top-3 within 6 months? Name it and justify.

2.4 The site has three existing exploratory-shaped surfaces already built and mostly unmeasured: /timeline, /explore (the graph), and /directory. Based on how incumbents in this space earn traffic, which of these formats actually attracts links and repeat visits, and which are dead ends?

───────────────
**THEME 3 — Adjacent scope expansion: which cluster has the most demand per unit of effort?**
───────────────

The scoping rule adopted is: expand along *edge types* (implementation provenance), never along topics. Candidate clusters, each of which terminates in nodes already in the dataset (C, C++, Python, Rust, Go, Fortran, LLVM):

3.1 **AI infrastructure** (PyTorch, TensorFlow, JAX, CUDA, cuBLAS, BLAS/LAPACK, llama.cpp, ggml, Ollama, vLLM, HF Transformers, Triton, XLA, MLIR). Verified: the SERPs for "what is chatgpt written in" / "what language is tensorflow written in" / "what is ollama written in" are Medium posts, Quora, a Hacker News comment, and FAQ content farms. But: is there real *volume*, and are these also AI-Overview-answered (i.e. the same 0.08% trap)?

3.2 **Database lineage** (Postgres=C, SQLite=C, DuckDB/ClickHouse=C++, CockroachDB=Go; Ingres→Postgres 1986, MySQL→MariaDB 2009). Zero fact-decay. Size the demand.

3.3 **Any cluster I have not considered** that fits the same rule and has better demand-per-effort. Be creative but rigorous.

3.4 Rank 3.1, 3.2 and anything from 3.3 by (estimated monthly demand) × (SERP weakness) ÷ (nodes needed to cover it credibly), and give a single recommended first cluster with a node count.

3.5 One verified, striking asset for launch: every modern AI training run traces through PyTorch → ATen/c10 (C++) → cuBLAS/cuDNN → nvcc (LLVM middle-end since 2011/12) → PTX → SASS, with the CPU path terminating in LAPACK/BLAS Fortran 77 from 1979/1992. **Verify every hop of that chain against primary sources and tell me where it is wrong, overstated, or would be torn apart by a Hacker News audience.** This is the single most important fact-check in this brief — the claim is intended as a launch headline.

───────────────
**THEME 4 — Distribution: realistic outcomes and the highest-leverage single move**
───────────────

The site has never been launched. Zero inbound links. This is likely the actual bottleneck, and every SEO recommendation compounds from zero authority.

4.1 Pull recent (2024–2026) Hacker News data for the closest comparables and give me actual point/comment counts and submission dates: anvaka's map-of-github, map-of-reddit, the notable-people birthplace map, "Interactive Map of the Linux Kernel", any programming-language-genealogy or compiler-bootstrapping submissions, and any "Show HN: I built a dataset of X" posts that did well. What is the *median* Show HN outcome in 2026, not the survivorship-biased top? What title patterns correlate with success in this specific niche?

4.2 What actually happens to a small site after a front-page HN day, in measurable terms? Find post-mortems with numbers: sessions, referring domains gained, and — critically — what fraction of traffic and links *persist* at 30 and 90 days. I want to know whether one HN post is worth more than three months of content work at this site's scale (30 clicks / 28 days).

4.3 **The embed widget question.** /embed?lang=python already renders and sets no X-Frame-Options, so it is embeddable today. The plan is to ship a copy-paste snippet on all 132 language pages with a visible `<a href>` attribution line. **Research Google's current position on widget/badge links** — I believe Google has explicitly warned that keyword-rich widget links are link-scheme violations. Find the current guidance, quote it, and tell me whether an attribution anchor inside an embed snippet is safe, borderline, or a penalty risk in 2026. What does the compliant version look like?

4.4 Do dataset mirrors actually produce discovery? Find evidence on whether publishing to **Hugging Face Datasets, Kaggle, and Zenodo (DOI)** produces measurable traffic, citations, or LLM-training-corpus inclusion for a small independent dataset. Is this a real channel or academic cosplay? Name concrete examples of small datasets that gained visibility this way.

4.5 Are there other distribution surfaces specific to this niche that nobody has named — specific subreddits and their current self-promotion rules, Lobsters, tildes.net, Console.dev-style newsletters that would actually accept a finished free reference site, visualization aggregator blogs (Google Maps Mania, GIGAZINE, FlowingData, Information is Beautiful), university compiler-course reading lists, or awesome-list targets beyond aalhour/awesome-compilers? For each, state realistic traffic and whether links are nofollow.

4.6 **Give me a ranked list of the top 5 distribution moves by expected sessions per hour of owner effort**, with explicit numbers and the reasoning.

───────────────
**THEME 5 — The mobile anomaly (529 impressions, 0 clicks)**
───────────────

5.1 What are the plausible mechanical explanations for a device class producing 11% of impressions and literally zero clicks over 28 days? Enumerate them: mobile SERP layout pushing position 9 below several screens of AI Overview + People Also Ask, mobile-specific rendering failure, title truncation on mobile, a Cytoscape canvas that is unusable on touch, Core Web Vitals failure on mobile, or something else.

5.2 How does mobile SERP real estate for developer/definitional queries differ from desktop as of 2026? Cite pixel-depth or scroll-depth studies if they exist.

5.3 What is the cheapest diagnostic that would distinguish between these causes? Be specific about what to check and what result implicates what.

───────────────
**THEME 6 — Google policy risk on the existing corpus**
───────────────

6.1 **FAQPage structured data:** 92 language pages carry FAQPage JSON-LD whose acceptedAnswer is a pointer ("See the implementation section above..."), not an answer. Confirm the current status of FAQ rich results (I believe they were restricted to government/health sites in August 2023) and Google's current structured-data guidance on answer completeness. Is this markup *risky*, or merely *useless*? Quote the guidance.

6.2 **Scaled content abuse:** 117 templated question pages averaging ~365 words, differing mainly by entity name, generated from one dataset. Find the current (March 2026 core update, August 2026 spam update) enforcement evidence and specific case studies. What distinguishes a penalized programmatic corpus from a surviving one? Is "unique structured data with citations" actually a documented survival factor or is that folklore?

6.3 **The consolidation question:** for a site with a set of thin templated pages and a small set of good pages, what does the current evidence say about pruning/merging versus enriching? Find case studies with before/after numbers. Given 30 clicks per 28 days, is deleting 100 URLs plausibly a *gain*?

6.4 **Sitemap lastmod:** confirm Google's current handling and the Gary Illyes "it's binary — we either trust it or we don't" statement with a source and date. Quantify, if anyone has, what a uniform build-stamp lastmod actually costs.

───────────────
**THEME 7 — What the comparable projects actually did to grow**
───────────────

Study the growth trajectory, not just the architecture, of the closest analogues. For each: how did they get their first 10,000 users, what is their traffic now, what do they monetize (if anything), and what is the single transferable lesson?

7.1 **roadmap.sh** (kamranahmedse) — graph/visual navigation reference, markdown-per-node + JSON graph dual representation.
7.2 **PLDB** (pldb.io / Breck Yunits) — 5,145 concepts, 135k facts, public domain. How does it get traffic? Does it?
7.3 **DevDocs** (freeCodeCamp) and **tldr-pages** — reference corpora with no DB.
7.4 **Éric Lévénez's language timeline** — the direct incumbent. How much traffic does a 20-year-old static poster page get, and where do its links come from?
7.5 **Any independently-built technical reference site that went from ~0 to meaningful traffic in the last 3 years.** This is the most useful thing you can find. I want the actual mechanism, not "they made good content."
7.6 Where possible, use Similarweb, Ahrefs' free tools, or publicly cited traffic figures — and label every traffic number as self-reported, third-party-estimated, or measured.

───────────────
**THEME 8 — Agent operations: cost, and what actually works**
───────────────

The owner wants AI agents doing the ongoing work. Prior analysis proposed a 10-agent roster and was cut to three (dataset-enricher, evidence-auditor, duplication-sentinel) on the grounds that a solo maintainer can review roughly 2–3 content PRs per week.

8.1 Find real, documented examples of solo maintainers or tiny teams running agent-driven content or dataset operations on a public site in 2025–2026. What broke? What was the actual review burden? Cite specific write-ups.

8.2 What is the current evidence on Google's treatment of AI-assisted content when it is (a) fact-checked and cited versus (b) bulk-generated? Has anything changed since the March/August 2026 updates? Quote current guidance.

8.3 **Evidence quality:** 62% of the 443 evidence URLs point at en.wikipedia.org. Is upgrading these to primary sources (language specs, compiler repo commits, release notes, mailing-list archives) worth the effort in terms of ranking, AI citation, or credibility? Is there evidence either way? What is the cheapest defensible way to derive confidence scores from source type rather than by feel?

8.4 Realistic monthly API cost for a loop that: pulls GSC weekly, enriches ~20 dataset cells/month, audits ~30 evidence URLs/month, and drafts one long-form piece per month. Use current published Anthropic pricing and state your token assumptions.

───────────────
**THEME 9 — Sustainability and the honest ceiling**
───────────────

9.1 Given everything above, what is the realistic 12-month traffic ceiling for this site if the owner executes well? Give a range with reasoning. Compare against the current 30 clicks / 28 days.

9.2 Is there a version of this project that gets meaningfully more users that is *not* a website — an npm package, a CLI, a VS Code extension, an MCP server serving the dataset to coding agents, a Wikipedia/Wikidata contribution, a recurring data-journalism byline elsewhere? Assess each honestly.

9.3 At what traffic level, if any, does any monetization become non-absurd for this niche, and what form (dataset licensing, sponsorship, none)? Do not pad this — "none, and here is why" is an acceptable answer.

9.4 **The kill question:** name the specific conditions under which the honest recommendation is to stop investing in SEO for this site and either pivot the format or accept it as a portfolio piece. Be willing to say it.

═══════════════════════════════════════
PART 4 — SOURCES TO PRIORITIZE
═══════════════════════════════════════

Hit these directly where relevant; do not rely on secondhand summaries when the primary is reachable:

- **Google primary:** developers.google.com/search (spam policies, structured data guidance, link schemes, sitemaps/lastmod), Google Search Central Blog, Google Search Status Dashboard, Search Off the Record
- **SEO research with data:** Ahrefs blog studies, Semrush studies, Seer Interactive, Amsive, Similarweb research, Sistrix, Search Engine Land, Search Engine Journal, Search Engine Roundtable, Zyppy, Aleyda Solis, Patrick Stox
- **AI search / GEO:** Pew Research click-behavior study, Ahrefs AI Overview CTR studies, Profound / Peec AI / Otterly published data (treat vendor claims skeptically), arXiv papers on generative-engine optimization
- **Competitors:** pldb.io, programminglanguages.info, levenez.com/lang, hopl.info, en.wikipedia.org/wiki/{Timeline,History,Generational list} of programming languages, rosettacode.org, roadmap.sh, devdocs.io, github.com/tldr-pages/tldr
- **Community data:** hn.algolia.com/api (use it for real point counts), Reddit subreddit rules pages for r/programming, r/ProgrammingLanguages, r/compilers, r/coding; lobste.rs/about; tildes.net
- **Distribution:** huggingface.co/datasets, kaggle.com/datasets, zenodo.org, github.com/aalhour/awesome-compilers
- **Fact-check for Theme 3.5:** llvm.org/docs/CompileCudaWithLLVM.html, docs.nvidia.com CUDA compiler documentation, netlib.org (BLAS/LAPACK history), pytorch.org and the pytorch/pytorch repo, GitHub's /repos/{owner}/{repo}/languages API
- **Pricing:** anthropic.com/pricing, vercel.com/docs/limits

═══════════════════════════════════════
PART 5 — REQUIRED OUTPUT FORMAT
═══════════════════════════════════════

Return your findings in exactly this structure. This output is going to be mechanically merged into an existing plan, so the headings and fields matter.

---

## 0. EXECUTIVE VERDICT
Six to ten sentences maximum. Lead with the single most decision-changing thing you found. State plainly whether the definitional query class is salvageable, and what the one highest-leverage move is. If your research contradicts anything in "ALREADY SETTLED," say so here in one line each.

## 1. THE DEFINITIONAL-QUERY VERDICT
- **Answer:** [salvageable via AI-citation / salvageable via consolidation / structurally dead — pick one]
- **Confidence:** [high / medium / low] + one sentence on why
- **Live SERP evidence table:** query | AI Overview present? | featured snippet? | knowledge panel? | first organic position | what occupies the top of the page
- **Published CTR-under-AIO evidence:** study | date | finding | sample size | source URL
- **Is 0.08% CTR normal for this class?** [yes/no] + evidence
- **AI-citation tactics that have actual evidence behind them:** ranked list, each with the evidence and its strength
- **How to measure AI citation on a budget:** concrete tools/methods with pricing
- **What would change this verdict:**

## 2. EXPLORATORY DEMAND MAP
Table: query pattern | est. monthly volume (with range) | volume-source confidence [measured / third-party-estimated / inferred / guessed] | current top-3 incumbents | incumbent weakness | realistic 6-month position for this site | recommended? [Y/N]

Followed by: **the single best exploratory target**, with a paragraph justifying it.

## 3. SCOPE EXPANSION RANKING
Table: cluster | est. demand | SERP weakness (1–5) | nodes needed | AI-Overview risk | demand-per-node score | verdict
Then: **recommended first cluster + node count + why**.
Then: **Theme 3.5 fact-check** — hop-by-hop verification of the PyTorch→…→Fortran chain, with a primary source per hop, and an explicit list of every hop that is wrong, overstated, or attackable.

## 4. DISTRIBUTION PLAYBOOK
- **HN comparables table:** submission | date | points | comments | title | what made it work
- **Median vs top-decile Show HN outcome in 2026:** with source
- **Post-HN persistence data:** sessions and referring domains at day 1 / 30 / 90, from real post-mortems
- **Widget/embed link risk verdict:** [safe / borderline / violation] + the exact Google guidance quoted + what the compliant snippet looks like
- **Dataset mirror verdict:** does HF/Kaggle/Zenodo produce discovery? Evidence, with named examples.
- **Top 5 moves by expected sessions per owner-hour:** ranked, with numbers and reasoning
- **Channels with nofollow vs dofollow marked explicitly**

## 5. MOBILE DIAGNOSIS
- Ranked hypotheses with the evidence for each
- The cheapest diagnostic sequence, in order, with what each result implicates

## 6. POLICY RISK ASSESSMENT
Table: item | risk level [none / cosmetic / real / urgent] | current Google guidance (quoted, with URL and date) | recommended action
Covering at minimum: the FAQPage deflection markup, the 117 templated question pages, sitemap lastmod, the soft-404 catch-all rewrite.
Then: **prune vs enrich verdict**, with case-study numbers.

## 7. COMPARABLE-PROJECT GROWTH MECHANISMS
For each of roadmap.sh, PLDB, DevDocs/tldr-pages, levenez.com, and at least two independent sites you find: how they got their first users | current traffic (labeled by source type) | monetization | **the one transferable lesson**.

## 8. AGENT OPS REALITY CHECK
- Documented solo/small-team agent-content case studies with what broke
- Current Google guidance on AI-assisted content, quoted
- Evidence-quality upgrade: worth it? [Y/N] + evidence
- Monthly API cost estimate with token assumptions shown

## 9. CEILING AND KILL CRITERIA
- 12-month traffic range with reasoning
- Non-website formats assessed (npm / CLI / VS Code ext / MCP server / Wikidata / guest data journalism): each with verdict and reasoning
- Monetization: verdict
- **Explicit kill/pivot conditions**

## 10. REVISED PRIORITY STACK
A single ranked list of at most 10 actions, in the order the owner should do them. Each row must carry:
`priority | action | effort (hours/days/weeks) | expected outcome (a NUMBER, measurable in GSC or analytics) | confidence | what would falsify this`

## 11. EVIDENCE LEDGER
Every non-obvious claim you made, as a table: claim | source URL | source date | source type [primary / study / vendor / anecdote] | confidence [high/med/low]

## 12. WHERE THE EVIDENCE IS THIN
An explicit list of every question in this brief you could NOT answer with real data, what you would have needed, and — critically — which of your own recommendations depend on those gaps. Do not skip this section. I would rather have five honest "unknown"s than twelve confident guesses.

═══════════════════════════════════════
PART 6 — RULES
═══════════════════════════════════════

1. **Cite everything.** Every number, every quote, every claim gets a source URL and a date. Uncited numbers will be discarded.
2. **Label traffic and volume figures** as measured / third-party-estimated / self-reported / inferred / guessed. Never present an estimate as a measurement.
3. **Quantify uncertainty.** Use explicit confidence levels. When you give a range, say what drives the spread.
4. **Flag thin evidence loudly** and in-line, not just in section 12. If a recommendation rests on one blog post, say "this rests on one blog post."
5. **Argue against the current plan where the evidence supports it.** The most valuable output is a finding that kills a planned workstream. The prior analysis already killed a database migration, a rename, a framework migration, and an AI-education pivot — killing more is a feature.
6. **Everything must be argued against the real baseline of 30 clicks per 28 days.** A recommendation that costs weeks of solo-maintainer time for a 10% relative gain on 30 clicks is a bad recommendation, and you should say so.
7. **Do not pad.** Ten evidenced findings beat thirty plausible ones. If a section has nothing real in it, write one line saying so.
8. **Prefer primary sources.** Vendor GEO marketing, SEO-agency listicles, and AI-generated blog spam are not evidence; if you must cite one, label it as such.
9. **No generic advice.** "Improve your content", "build backlinks", "focus on E-E-A-T" — anything that would apply to any website is worthless here. Every recommendation must be specific to a programming-language-lineage reference site with 443 evidence-cited relationships, 304 URLs, one maintainer, and 30 clicks a month.