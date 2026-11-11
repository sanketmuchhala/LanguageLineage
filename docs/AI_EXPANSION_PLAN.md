# AI infrastructure expansion plan

**Status:** living document, created 2026-11-10 on branch `ai/pytorch-execution-path`.
**Inputs:** `some more plans/LANGUAGELINEAGE_AI_EXPANSION_RESEARCH.md` (product reference, treated as hypotheses), the owner's brief for this session, `docs/growth/GROWTH_EXECUTION_PLAN.md`, `docs/DECISIONS.md`, and the code and data on `main` at `0e7aa5f5`.
**Progress log:** [AI_EXPANSION_WORKLOG.md](AI_EXPANSION_WORKLOG.md).
**Positioning:** "Trace AI from Python to GPU: the programming languages and compilers behind modern machine learning." Inside Language Lineage, one brand, one atlas. Not an AI tutorial site, model tracker or news portal.

## 1. Current-state audit

### What the research assumed vs what exists

The research says it was written without a code audit. Several of its assumptions are wrong:

| Research assumption | Actual state on `main` | Evidence |
|---|---|---|
| An `ai_ecosystem` graph mode exists | No AI mode or AI filter exists | `grep -ri ai_ecosystem src scripts` finds nothing |
| `useGraphStoreV6`, `EntitySchema` with entity kinds | Store is `src/store/useGraphStore.ts`; nodes are only `lang:` / `tool:` ids with free-text `cluster_hint` | `src/store/`, `scripts/schema.ts` |
| Atlas covers TensorFlow, MLIR, Triton, ONNX | AI-adjacent nodes are only `tool:pytorch`, `tool:cuda`, `tool:ggml`, `tool:llama_cpp`, `tool:blas`, `tool:llvm`, `lang:mojo` | `dataset/v5/lineage_v5.json` |
| Relationship types can be added freely | Exactly six types, enforced by schema and tests; new types need their own reviewed PR | `AGENTS.md` rules 4–5, `scripts/dataset.test.ts` |

Existing AI edges (all `*_written_in` or `influenced`): PyTorch ← C++ (ATen), Python, CUDA; ggml ← C, C++, CUDA; llama.cpp ← C, C++; CUDA ← LLVM (NVVM); BLAS ← Fortran; Mojo ← C++, LLVM.

### Constraints from settled decisions

`docs/DECISIONS.md` ("AI infrastructure: implementation provenance only") allows AI tools as `tool:` nodes along the six existing edge types, with a ceiling of about 12 tools and 35 relationships, and rejects "AI explained" content and model lineage. The owner's brief asks for an execution-path explainer and suggests new relationship types. This plan reconciles the two without breaking the lineage dataset:

- **The lineage dataset is unchanged.** No schema change, no new relationship type. "Lowers to", "dispatches to" and "compiled by" describe execution, not implementation provenance, so they do not belong in `lineage_v5.json`.
- **Execution paths live in their own small, cited file**, `dataset/ai/pytorch_execution_paths.json`, with its own schema (`scripts/aiPaths.ts`), tests, and a quote for every claim. Stages link to lineage nodes through `lineage_id`, so the two datasets connect without merging.
- **What remains rejected:** model lineage, model or benchmark tracking, generic "what is AI" tutorials, guessed facts about closed systems.
- The amendment is recorded in `docs/DECISIONS.md` ("AI execution paths") for the owner's review.

### Reusable pieces

Static page generator and templates (`scripts/generateSeoPages.ts`), source-type labels (`scripts/sourceType.ts`), OG card generator, sitemap/links/SEO gates, `.table-wrap` mobile tables, `seo.css` tokens. The Cytoscape explorer (`src/graph/`) is built for the force-directed atlas; the PyTorch path is a small layered pipeline, so the first slice uses a server-rendered SVG with a 4 KB script instead (crawlable, no 520 KB Cytoscape bundle on a text-first page). Reusing Cytoscape is right for the later cross-framework AI mode (ticket AI-07).

## 2. Goals and non-goals

**Goals.** Answer, with sources: what AI frameworks are built with; what happens between Python and the hardware; how frameworks connect to compilers and runtimes. Keep every claim checkable. Reach AI-infrastructure and compiler audiences without diluting the original atlas.

**Non-goals.** AI news, model rankings, benchmark numbers, model family trees, "AI explained" tutorials, any claim about closed products' internals, using GitHub language percentages as evidence of what executes.

## 3. User experience (first slice, shipped on this branch)

`/ai/how-pytorch-runs` — "What Actually Happens When You Run a PyTorch Model?"

- Answer box in plain language (eager vs torch.compile, CPU vs GPU).
- Explorer: Mode (Eager / torch.compile) and Device (CPU / NVIDIA GPU) radio controls; a layered diagram with stages colored by kind (Python, PyTorch core, compiler, IR, kernel, hardware); arrows typed by step (dashed = fallback some operations take); select any stage or arrow for a detail panel with its quoted sources; "Copy link to this path" (URL `?mode=&device=&stage=` or `&step=`).
- "The selected path, step by step" list, "Where Python ends", every stage with quotes, every step in a table with a "When" column, scope limits, and how the page is checked.
- Works without JavaScript (default path shown, all content present), on phones (diagram scrolls to the selected path), and by keyboard (stages and arrows are focusable buttons).

## 4. Data and ontology

One file per page, `dataset/ai/<slug>.json` (currently `how-pytorch-runs.json` and `how-llama-cpp-runs.json`), validated by `scripts/aiPaths.ts` (Zod, strict). Each file declares its own page text, choices (`dimensions`), diagram positions and sections; the generator, sitemap, OG cards and quote checker loop over all files.

- **Stage kinds:** `application`, `programming_language`, `runtime`, `framework_component`, `compiler`, `intermediate_representation`, `model_format`, `kernel_language`, `kernel`, `machine_code`, `hardware`. Model files appear only as a format (GGUF), never as a model family.
- **Step kinds:** `runs_in`, `calls`, `loads`, `builds`, `dispatches_to`, `executes_on`, `launches_on`, `intercepted_by`, `captures`, `compiled_by`, `compiles_for`, `generates`, `written_in`, `falls_back_to`, `lowers_to`, `translated_to`.
- **Conditions:** each step has `when: {dimension: [values]}`; a dimension it omits applies to every value. A selection's path is everything reachable from the first stage along applicable steps.
- **Evidence:** every stage and step has `{source, quote}` pairs; sources have URL and title; `verified_on` and `verified_against` at file level. `npm run check:ai-quotes` re-fetches all sources and checks each quote.

Lineage-dataset additions (Triton, MLIR, XLA, etc. as `tool:` nodes) follow the existing admission rule and go in separate data PRs of ≤5 nodes (AI-04).

## 5. Tickets (dependency-ordered)

Effort in hours. "Gate" = `npm run verify` green plus the listed check.

| ID | Ticket | Est. | Depends | Acceptance | Status |
|---|---|---:|---|---|---|
| AI-01 | Audit + this plan + DECISIONS amendment | 2 | — | Plan reviewed by owner | done |
| AI-02 | Execution-path data file, schema, quote checker | 4 | AI-01 | 0 missing quotes live; schema + semantics tests | done |
| AI-03 | `/ai/how-pytorch-runs` page, explorer, shareable URLs, OG card, links from PyTorch/CUDA/LLVM/Python pages | 6 | AI-02 | Gate; JS on/off, 320/390/1280px, keyboard, deep links checked in a browser | done |
| AI-00 | Fix the unsupported `C → Rust` lineage edge (growth WP-03) | 1 | — | Data PR merged | PR #44, awaiting review |
| AI-04 | Data PR: admit `tool:triton` (and possibly `tool:mlir`) to the lineage dataset with non-Wikipedia sources | 2 | owner review | Admission rule met; ≤5 nodes | `tool:triton` in PR #45 (stacked on #44) |
| AI-05 | `/ai/what-is-pytorch-written-in` as a section of the explainer or of `/tools/pytorch` (not a separate page, see §7) | 2 | AI-03 | No new competing URL | next |
| AI-06 | Second path file: llama.cpp (CPU / CUDA / Metal backends) from its README and build docs | 5 | AI-02 | Same schema, tests, quote check | done (`/ai/how-llama-cpp-runs`) |
| AI-07 | AI mode in the Cytoscape explorer: filter to AI-tagged lineage nodes + overlay of path files | 8 | AI-04, AI-06 | Existing modes unaffected (tree-view and graph tests green) | later |
| AI-08 | JAX/OpenXLA path (StableHLO, XLA, PJRT) | 6 | AI-02 | Same as AI-06 | done (`/ai/how-jax-runs`) |
| AI-09 | Inference engines comparison (vLLM, llama.cpp, TensorRT-LLM, MLX) | 8 | AI-06 | Each engine row sourced; no model families | later |
| AI-10 | Expert review: ask PyTorch/Triton maintainers for corrections where welcome | 2 | AI-03 deployed | Feedback logged in worklog | later, owner |

## 6. Risks

| Risk | Mitigation |
|---|---|
| Upstream docs change (PyTorch moves fast) | Versioned doc URLs where available; `check:ai-quotes`; `verified_on` shown on the page |
| Over-generalizing ("all PyTorch runs through Triton") | Conditions on every step; scope section; fallbacks drawn as dashed |
| Name collision: OpenAI Triton vs NVIDIA Triton Inference Server | Page only refers to the Triton language/compiler with its own docs; inference server out of scope |
| Settled-decision drift (AI tutorials) | DECISIONS amendment scopes what is allowed; every page must be a cited path or provenance view |
| Time: 10 h/week shared with the growth plan | §8 split; AI work pauses if launch milestones slip |

## 7. SEO and internal linking

- The explainer is a full static page: crawlable answer, stages, step table, TechArticle and BreadcrumbList JSON-LD (with `citation` URLs), OG card, canonical, sitemap entry.
- Inbound links: `/tools/pytorch`, `/tools/cuda`, `/tools/llvm`, `/languages/python` ("Discover more"). Outbound: lineage pages for each stage's `lineage_id`.
- **Future pages, evaluated against cannibalization:**

| Candidate | Decision |
|---|---|
| `/ai/what-is-pytorch-written-in` | Do not create; intent is already served by `/tools/pytorch` (implementation table). Strengthen that page and link to the explainer (AI-05). |
| `/ai/python-to-gpu` | Do not create now; same intent as `/ai/how-pytorch-runs`. Revisit only as a cross-framework hub once AI-06 and AI-08 exist. |
| `/ai/triton-compiler-lineage` | Fold into a `tool:triton` lineage page after AI-04. |
| `/ai/llama-cpp` | Build as a path page (AI-06); `/tools/llama-cpp` stays the provenance page. |
| `/ai/ai-compiler-map` | Later, as the Cytoscape AI mode (AI-07), not a static list. |

## 8. 30/60/90 days, reconciled with the growth plan

Budget: about 10 hours a week **in total**. Until the growth launch (growth plan days 31–60) the split is **6 h growth / 4 h AI**; after launch, re-split from data.

| Window | AI hours | AI deliverables | Growth deliverables (from `docs/growth/GROWTH_EXECUTION_PLAN.md`) |
|---|---:|---|---|
| Days 1–30 | ~16 | AI-01–03 (done this session), AI-00, AI-04, AI-05 | Deploy growth work, data fix, referring-domain baseline, launch prep |
| Days 31–60 | ~16 | AI-06 (llama.cpp), AI-10 expert review | Show HN and staggered launch; the PyTorch explainer is a second, independent launch shot (r/MachineLearning, r/CUDA, compiler communities) a week after HN |
| Days 61–90 | ~16 | AI-07 or AI-08, chosen from GSC and engagement on `/ai/` | Iterate on pages with impressions and low CTR |

Measure `/ai/` pages separately in the growth plan's measurement table (impressions, clicks, path changes and stage selections if analytics events are added, source-link clicks).

## 9. Testing strategy

- `scripts/aiPaths.test.ts`: schema, unknown-source rejection, every source cited, `lineage_id` resolves, layout covers every stage, hardware stages are sinks, each configuration reaches only its own hardware, eager has no compiler stages, compile-GPU follows the documented order, compile-CPU uses C++/OpenMP with ATen only as fallback, generated page matches data (all stages, steps, default path, quotes, sources, canonical, sitemap, OG, script).
- `npm run check:ai-quotes` (network) before publishing data changes.
- Browser checks per release: JS on/off, 320/390/1280px, keyboard selection, deep links, invalid parameters.
- Existing gate unchanged and green.
