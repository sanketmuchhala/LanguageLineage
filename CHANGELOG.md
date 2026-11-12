# Changelog

All notable changes to the **Language Lineage** platform, canonical dataset (`dataset/v5/`), and AI execution-path corpus (`dataset/ai/`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Dataset checksums and exact record counts are tracked deterministically in [`dataset/v5/MANIFEST.json`](dataset/v5/MANIFEST.json).

## [5.2.0] - 2026-11-11

### Added
- **Repository & Multi-Agent Governance:**
  - Codified surgical-diff discipline, multi-worktree isolation rules, and `<!-- HUMAN-ONLY:START -->` … `<!-- HUMAN-ONLY:END -->` protected governance blocks in [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), and [`docs/DECISIONS.md`](docs/DECISIONS.md), enforced by SHA-256 checksum tests in [`scripts/datasetRelease.test.ts`](scripts/datasetRelease.test.ts).
  - Added [`.github/CODEOWNERS`](.github/CODEOWNERS), [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md), structured GitHub Issue templates (`.github/ISSUE_TEMPLATE/`), [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CHANGELOG.md`](CHANGELOG.md), and automated dataset release packaging ([`.github/workflows/release.yml`](.github/workflows/release.yml)).
- **Deterministic Dataset Release Manifest (`dataset/v5/MANIFEST.json`):**
  - Extended [`scripts/generateDatasetRelease.ts`](scripts/generateDatasetRelease.ts) to emit `dataset/v5/MANIFEST.json` recording dataset and citation versions, node/relationship/enrichment/AI-path counts, and SHA-256 digests across all release files (`lineage_v5.json`, `enrichment_v5.json`, `wikimedia_logo_overrides.json`, CSV exports, `DATACARD.md`, and `dataset/ai/*.json`).
- **AI Execution-Path Corpus (`dataset/ai/*.json`) & Graph Overlay:**
  - Added six source-quoted end-to-end execution paths verified by `npm run check:ai-quotes`:
    - [`how-pytorch-runs.json`](dataset/ai/how-pytorch-runs.json) (`/ai/how-pytorch-runs`) — PyTorch 2 (`eager` & `torch.compile` / TorchInductor)
    - [`how-jax-runs.json`](dataset/ai/how-jax-runs.json) (`/ai/how-jax-runs`) — JAX (`jit` → Jaxpr → StableHLO → XLA PJRT)
    - [`how-vllm-runs.json`](dataset/ai/how-vllm-runs.json) (`/ai/how-vllm-runs`) — vLLM V1 engine & PagedAttention
    - [`how-llama-cpp-runs.json`](dataset/ai/how-llama-cpp-runs.json) (`/ai/how-llama-cpp-runs`) — `llama.cpp` GGUF & `ggml` backend scheduler
    - [`how-mlx-runs.json`](dataset/ai/how-mlx-runs.json) (`/ai/how-mlx-runs`) — MLX lazy compute graph & Apple silicon unified-memory Metal/Accelerate dispatch
    - [`how-onnx-runtime-runs.json`](dataset/ai/how-onnx-runtime-runs.json) (`/ai/how-onnx-runtime-runs`) — ONNX Runtime graph partitioning & GetCapability Execution Provider dispatch
  - Added interactive AI infrastructure preset and execution-path overlay to the Cytoscape graph explorer (`/explore`).
- **Lineage Dataset v5 Expansion (`176` nodes, `504` cited relationships):**
  - Expanded AI infrastructure tool coverage (`35` tools alongside `141` programming languages), adding `tool:onnx_runtime`, `tool:openblas`, `tool:cutlass`, `tool:flashattention`, `tool:ray`, `tool: safetensors`, `tool:sentencepiece`, `tool:tokenizers`, `tool:cudnn`, `tool:nccl`, `tool:xla`, `tool:mlx`, `tool:vllm`, `tool:tvm`, and `tool:mojo` (`lang:mojo`).
- **Dataset-Driven Publishing Pipeline:**
  - Consolidated shared route and static-page discovery in [`scripts/contentPages.ts`](scripts/contentPages.ts) (`docs/CONTENT_PIPELINE.md`).

## [5.0.0] - 2026-04-12

### Added
- Released **Programming Language Lineage Dataset v5.0** (`dataset/v5/lineage_v5.json`) with 100% evidence-cited relationships (`evidence_source` + hand-calibrated `confidence`), six strict implementation/influence relationship types, Wikidata enrichment (`enrichment_v5.json`), license-tracked Wikimedia/Devicon logos, downloadable RFC 4180 CSV tables, `DATACARD.md`, and `CITATION.cff`.
- Launched static SEO pages (`/languages/*`, `/tools/*`, `/relationships/*`, `/questions/*`, `/guides/*`, `/timeline/*`, `/compare/*`) and `llms.txt` generated deterministically from `lineage_v5.json`.
