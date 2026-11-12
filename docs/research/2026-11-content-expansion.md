# November 2026 language and AI content expansion

Owner request: expand programming-language coverage and add detailed AI content
informed by what people search for. Work is isolated in `languagelineage-codex`. The branch was rebased onto the
latest fetched main (`5a24c0b7`) before final regeneration, preserving other
agents’ explorer and governance updates. The baseline below uses that commit.
This is a review record, not a claim that the changes have been deployed.

## Delivered content and data

| Measure | Before | After |
| --- | ---: | ---: |
| Language nodes | 141 | 151 |
| Tool nodes | 35 | 40 |
| Total graph nodes | 176 | 191 |
| Cited lineage relationships | 504 | 527 |
| AI execution-path pages | 6 | 10 |
| Canonical sitemap URLs | 337 | 356 |

All 176 existing node records and all 504 existing relationships are preserved
exactly. No existing evidence or confidence value was changed. The six lineage
relationship types and both existing dataset schemas remain unchanged. AI
execution steps remain separate from implementation-provenance edges.

Language additions: AssemblyScript, Futhark, Hy, Janet, BQN, Uiua, CUE, Jsonnet,
Vyper and Slang. CUE and Jsonnet are identified as specialized configuration
languages rather than presented as general-purpose application languages.

Tool additions: TensorFlow, ONNX Runtime, Ollama, Keras and TensorRT-LLM. Each has
at least one implementation edge connected to an existing language, supported
by a primary source. Logos are intentionally absent for these new records;
letter badges are supported. No unverified logo or licensing claim was added.

Four new data-only execution pages and an expanded existing ONNX Runtime page
use the existing shared renderer. Another agent landed the ONNX page during
this task; its stages, steps, sources, provider controls and original sections
were preserved during rebase, and this task appended explanatory sections. There are
no new per-record components, template switches or schema fields. These pages
add detailed questions, conditional diagrams, step explanations, quoted
sources, scope limits and links to the existing execution-path collection.

## Demand research: measured evidence versus hypotheses

The available local Search Console export was read without changing it:
`GSC data/languagelineage/Queries.csv` in the original checkout. Its filter says
"Last 3 months" but does not include the absolute reporting window, so it must
not be treated as a fresh November baseline.

Examples in that snapshot:

| Query | Clicks | Impressions |
| --- | ---: | ---: |
| map of programming languages | 5 | 34 |
| programming language tree | 2 | 81 |
| what language is python written in | 1 | 520 |
| what is python written in | 1 | 369 |
| compiler bootstrapping | 1 | 92 |

No queries in that export matched the AI framework/engine terms examined.
That establishes the absence of a site-specific AI baseline in this export,
not absence of market demand.

Google's [AI search-trends collection](https://trends.withgoogle.com/trends/us/artificial-intelligence-search-trends/)
shows broad interest in AI and coding, including coding in its displayed
"best AI for" list. That is directional context, not evidence of monthly
search volume for ONNX Runtime or TensorRT-LLM. This expansion does not invent
keyword volumes, ranking promises or claims that these are Google's top AI
queries. Search results and official troubleshooting/architecture docs were
used to identify concrete answerable intents. Exact keyword demand remains a
hypothesis to measure after indexing.

## Query-to-page map

These are target query clusters, not new URLs for every variation. Multiple
related questions are answered on one substantive page to avoid competing
near-duplicate pages.

| Page | Target queries / questions | Distinct value |
| --- | --- | --- |
| `/ai/how-tensorflow-runs` | how TensorFlow works; TensorFlow eager vs graph; tf.function vs XLA; does TensorFlow run Python on GPU; TensorFlow CPU fallback; TensorFlow retracing | Separates eager dispatch, graph tracing, explicit compilation and device placement; 6 selectable mode/device combinations |
| `/ai/how-onnx-runtime-runs` | ONNX vs ONNX Runtime; how ONNX Runtime works; CUDAExecutionProvider CPU fallback; ONNX Runtime not using GPU; graph optimization; inference session startup; I/O binding | Preserves the existing CPU, CUDA and TensorRT provider choices and explains provider availability, operator coverage, startup and I/O binding |
| `/ai/how-keras-runs` | Keras vs TensorFlow; Keras 3 backends; KERAS_BACKEND; Keras JAX vs PyTorch; does model.compile compile machine code; Keras GPU execution | Routes one Python-facing API into three different runtime stacks; 6 selectable backend/device combinations |
| `/ai/how-ollama-runs` | how Ollama works; Ollama vs llama.cpp; Ollama CPU vs GPU; Ollama GGUF; Ollama MLX Apple silicon; is Ollama local; what is Ollama written in | Separates the Go service from compatible local engines and documents current MLX/GGUF boundaries; 3 scoped routes |
| `/ai/how-tensorrt-llm-runs` | how TensorRT-LLM works; TensorRT vs TensorRT-LLM; TensorRT-LLM PyTorch backend; trtllm-serve; inflight batching; TensorRT-LLM vs vLLM; trtllm-build migration | Documents current PyTorch execution and removed legacy backend, with 2 request-entry choices and explicit scheduling boundaries |

The AI collection now has 10 pages, each with a different framework or serving
path. The new sections link to existing PyTorch, JAX, llama.cpp, vLLM and MLX
pages rather than copying those pages or publishing generic comparisons.

## Source findings that changed the content

- [TensorFlow's API](https://www.tensorflow.org/api_docs/python/tf/function)
  separates graph tracing from explicit XLA compilation. An explicitly compiled
  unsupported function is not promised a silent eager fallback.
- [ONNX Runtime architecture](https://onnxruntime.ai/docs/reference/high-level-design.html)
  assigns graph portions to providers. A configured GPU provider does not
  establish complete GPU coverage for a model.
- [Ollama's GGUF announcement](https://ollama.com/blog/improved-performance-and-model-support-with-gguf)
  describes llama.cpp support alongside its MLX engine. The page does not
  assert that every model in every release uses llama.cpp.
- [TensorRT-LLM's migration guide](https://nvidia.github.io/TensorRT-LLM/latest/legacy/tensorrt-backend-removal.html)
  removes the old TensorRT engine backend. The new page describes the current
  PyTorch executor, not an obsolete mandatory engine-building workflow.
- [Jsonnet's original repository](https://github.com/google/jsonnet/blob/master/README.md)
  recommends the Go implementation while preserving its original C++ version.
  Both implementations are recorded as coexisting; no invented rewrite date
  or ended C++ edge was added.
- [Slang's original research page](https://graphics.cs.cmu.edu/projects/slang/)
  identifies the published Slang system in 2018. The 2017 shader-components
  paper used the earlier Spire language. The new record uses 2018 explicitly.
- [Futhark's author](https://www.futhark-lang.org/blog/2017-12-27-reflections-on-a-phd-accidentally-spent-on-language-design.html)
  distinguishes early language design from initial compiler work. The record
  uses 2013 for the initial compiler and explains this convention in its notes.
- [Hy's release history](https://github.com/hylang/hy/blob/master/NEWS.rst)
  documents development in 2013; the located [compiler talk](https://us.pycon.org/2014/schedule/presentation/192/)
  is from PyCon 2014, and the notes do not misdate that talk to 2013.

## Review batches and evidence

Keep the content in three batches of five nodes if opening data PRs. Do not
open more than two data PRs concurrently. This document groups review scope;
it does not authorize automatic merging.

1. AssemblyScript, Futhark, Hy, Janet, BQN: compiler front ends, self-hosting and
   embeddable/array execution. Review the BQN self-hosting edge and Futhark year
   convention in particular.
2. Uiua, CUE, Jsonnet, Vyper, Slang: array, configuration, contract and shader
   languages. Review coexisting Jsonnet implementations and Slang's publication
   year rather than assuming every origin date denotes a 1.0 release.
3. TensorFlow, ONNX Runtime, Ollama, Keras, TensorRT-LLM plus their execution
   pages: runtime layers, conditional backend routing and current version scope.

All 23 newly authored confidence values require human review. Values of 0.98
are used for explicit implementation statements or direct implementation
sources; values of 0.96–0.97 reflect source-code/architectural attribution that
still needs interpretation. Start years on the new edges are null: the cited
current source is not being used to invent a historical start date. Existing
source or confidence corrections remain proposals rather than edits.

The table below lists every new lineage claim and its citation.

| From | Relationship | To | Confidence | Source / supported claim |
| --- | --- | --- | ---: | --- |
| `lang:typescript` | `compiler_written_in` | `lang:assemblyscript` | 0.97 | [The compiler implementation is TypeScript source; this edge describes the compiler, not its WebAssembly output.](https://github.com/AssemblyScript/assemblyscript/blob/main/src/compiler.ts) |
| `lang:haskell` | `compiler_written_in` | `lang:futhark` | 0.98 | [The contributor guide explicitly identifies Haskell as the implementation language of the optimizing compiler.](https://futhark-lang.org/getinvolved.html) |
| `lang:futhark` | `transpiled_to` | `lang:c` | 0.98 | [The futhark c backend translates a program to sequential C; this does not describe the CUDA or OpenCL backends.](https://futhark.readthedocs.io/en/latest/man/futhark-c.html) |
| `lang:python` | `compiler_written_in` | `lang:hy` | 0.98 | [The Python HyASTCompiler implementation builds Python AST objects from Hy forms.](https://github.com/hylang/hy/blob/master/hy/compiler.py) |
| `lang:c` | `runtime_written_in` | `lang:janet` | 0.98 | [The project explicitly states that the language implementation is mostly standard C99.](https://janet-lang.org/) |
| `lang:c` | `compiler_written_in` | `lang:janet` | 0.97 | [Janet bytecode compiler implementation in C.](https://github.com/janet-lang/janet/blob/master/src/core/compile.c) |
| `lang:c` | `runtime_written_in` | `lang:bqn` | 0.98 | [CBQN is a BQN implementation in C; some runtime components remain written in BQN.](https://github.com/dzaima/CBQN) |
| `lang:bqn` | `compiler_written_in` | `lang:bqn` | 0.98 | [CBQN explicitly uses the self-hosted BQN compiler and documents how its precompiled bytecode is bootstrapped.](https://github.com/dzaima/CBQN#precompiled-bytecode) |
| `lang:apl` | `influenced` | `lang:bqn` | 0.98 | [The designer describes BQN as originating as a fixed APL and documents the array-language design background.](https://mlochbaum.github.io/BQN/commentary/history.html) |
| `lang:rust` | `runtime_written_in` | `lang:uiua` | 0.98 | [The Rust source explicitly identifies itself as the Uiua interpreter/runtime.](https://github.com/uiua-lang/uiua/blob/main/src/run.rs) |
| `lang:go` | `runtime_written_in` | `lang:cue` | 0.96 | [The Go CUE package implements the evaluation context for building and evaluating CUE values.](https://github.com/cue-lang/cue/blob/master/cue/context.go) |
| `lang:cxx` | `runtime_written_in` | `lang:jsonnet` | 0.98 | [Original C++ Jsonnet implementation; it coexists with go-jsonnet, rather than being a completed rewrite.](https://github.com/google/jsonnet/blob/master/README.md) |
| `lang:go` | `runtime_written_in` | `lang:jsonnet` | 0.98 | [The README explicitly describes a feature-complete implementation in pure Go.](https://github.com/google/go-jsonnet/blob/master/README.md) |
| `lang:python` | `compiler_written_in` | `lang:vyper` | 0.98 | [The Python compiler package drives Vyper compilation phases and emits contract bytecode and other formats.](https://github.com/vyperlang/vyper/blob/master/vyper/compiler/__init__.py) |
| `lang:cxx` | `compiler_written_in` | `lang:slang` | 0.97 | [Core compiler implementation in C++; official build documentation requires a C++17 compiler.](https://github.com/shader-slang/slang/blob/master/source/slang/slang-compiler.cpp) |
| `lang:slang` | `transpiled_to` | `lang:cxx` | 0.97 | [The CPU target can emit C++ kernel or host code; other targets emit other languages or intermediate forms.](https://github.com/shader-slang/slang/blob/master/README.md) |
| `lang:cxx` | `runtime_written_in` | `tool:tensorflow` | 0.98 | [C++ graph executor in TensorFlow core.](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/core/common_runtime/executor.cc) |
| `lang:python` | `runtime_written_in` | `tool:tensorflow` | 0.97 | [Python eager-context orchestration; numerical kernels are not implemented by this wrapper.](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/python/eager/context.py) |
| `lang:cxx` | `runtime_written_in` | `tool:onnx_runtime` | 0.98 | [The C++ InferenceSession implementation manages graph loading and execution.](https://github.com/microsoft/onnxruntime/blob/main/onnxruntime/core/session/inference_session.cc) |
| `lang:go` | `runtime_written_in` | `tool:ollama` | 0.98 | [Go server routes implement request handling and runner scheduling; this does not assign Go as the implementation language of every numerical kernel.](https://github.com/ollama/ollama/blob/main/server/routes.go) |
| `lang:python` | `runtime_written_in` | `tool:keras` | 0.98 | [Python backend-dispatch module imports and exposes the selected backend implementation.](https://github.com/keras-team/keras/blob/master/keras/src/backend/__init__.py) |
| `lang:python` | `runtime_written_in` | `tool:tensorrt_llm` | 0.97 | [Python PyExecutor coordinates the current TensorRT-LLM execution backend.](https://github.com/NVIDIA/TensorRT-LLM/blob/main/tensorrt_llm/_torch/pyexecutor/py_executor.py) |
| `lang:cxx` | `runtime_written_in` | `tool:tensorrt_llm` | 0.98 | [The architecture explicitly documents C++ bindings for the capacity scheduler, microbatch scheduler and KV-cache manager.](https://nvidia.github.io/TensorRT-LLM/latest/torch/arch_overview.html) |

## Verification and limitations

Final validation was performed after rebasing onto `5a24c0b7`. Both protected
HUMAN-ONLY blocks match upstream byte-for-byte, their checksum tests pass, and
the upstream ONNX diagram, sources, choices and original sections are unchanged.
The generated MANIFEST.json includes the final data and AI file digests.

- Schema/integrity analysis: valid, zero integrity errors, one connected graph,
  zero isolated nodes. The pre-existing CUDA scalar warning remains unchanged;
  this expansion did not rewrite unrelated records.
- Existing node and relationship records compared with the task baseline and
  preserved exactly.
- Full generation executed through Node's `--import tsx` loader because the
  sandbox blocks the `tsx` CLI's local IPC listener. The same configured
  generator sequence was used, including the poster dependency described below.
- Type check, all 351 tests, SEO validation, link audit and production compilation
  passed as individual gate stages. The test suite includes DOM execution of
  the actual page-selector script for every new page and selection, URL updates
  and keyboard selection, plus framework-specific architectural assertions.
  This is not a claim that the literal `npm run verify` command passed in this
  sandbox: its initial attempt caught the stale poster, and its `tsx` stages
  also require an environment that permits the CLI IPC listener.
- Sitemap: 19 added URLs relative to the latest fetched main, zero removed, 356 canonical URLs total. No deployment
  is included, so comparison with the live sitemap remains a pre-deploy check.
- All 49 distinct quotes in the four new AI records and preserved ONNX record were matched against 28
  live primary sources through connected web/GitHub retrieval. Exact quote
  checks normalize whitespace, typographic quotation marks and rendered link
  markers. Results and available GitHub blob SHAs are in
  [2026-11-expansion-quote-audit.json](2026-11-expansion-quote-audit.json).
- The native whole-site `check:ai-quotes` and `check:evidence-links` commands
  were attempted and failed because the shell cannot resolve external hosts.
  This is an environment failure, not evidence that 130 quotes or 293 URLs are
  actually missing. Existing content's live network audit remains outstanding;
  rerun the native checks with network access before publishing.
- Chromium launch was attempted but the sandbox denied its macOS Mach port.
  Full desktop/mobile visual inspection remains a preview check. Generated
  social cards were inspected locally; DOM tests verify behavior but cannot
  certify visual layout or browser accessibility.
- Generated CSV files intentionally use CRLF. The existing HTML template also
  emits indented blank lines on the new detail pages. These formatting-only
  whitespace findings are retained as deterministic generator output; source
  edits are checked separately rather than hand-cleaning generated artifacts.

A real dataset expansion revealed that the downloadable poster was outside
`seo:generate`: existing poster tests correctly rejected it as stale. A separate
infrastructure commit now runs `poster:generate` before social images and HTML.
No tests were removed or weakened. Global marketing counts and the global
social image were updated to 191 nodes and 527 relationships; per-page cards,
HTML, downloads, catalogs, rankings and poster artifacts were regenerated.

## Measurement after indexing

Capture a fresh dated Search Console baseline before attributing changes to
this expansion. After the new URLs have had time to be crawled, compare equal
28-day windows by page and query cluster. Track impressions, clicks, CTR and
position along with engagement on the path selectors, related-page navigation
and correction feedback. Distinguish indexation delay from lack of interest.

Use the existing canonical route for a query cluster. If a topic earns demand,
deepen its sources, examples and scope before making another adjacent URL.
Avoid interpreting Google Trends' normalized interest as monthly search volume
or promising a ranking based on the presence of a keyword in a title.

## Candidate next research batches

These are research candidates, not claims already admitted to the dataset:

- Browser AI: ONNX Runtime Web, WebGPU, WebAssembly and WGSL, with device and
  browser scope verified from current runtime documentation.
- Other AI execution stacks: OpenVINO, Apache TVM and IREE, after verifying
  implementation provenance and a distinct execution-path question.
- Serving mechanisms: a deeper cited treatment of KV-cache allocation,
  prefill/decode scheduling and GPU/CPU offload inside existing engine pages.
- Further languages: WebAssembly, GLSL, HLSL, WGSL, MiniZinc, Dhall, Nickel,
  OCaml-family variants and additional shader/array languages, admitted only
  after checking current implementation evidence and origin-year conventions.

Generic AI definitions, unsupported closed-model internals, benchmark rankings,
model genealogy and bulk keyword permutations are not part of this expansion.
