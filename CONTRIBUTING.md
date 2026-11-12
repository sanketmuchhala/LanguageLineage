# Contributing to Language Lineage

Language Lineage (`https://www.languagelineage.org`) is an evidence-cited graph of programming-language and AI-infrastructure implementation provenance. Every node, directed relationship, and execution-path step is backed by primary sources and verified by deterministic build and test gates.

Before making any change—whether you are a human contributor or an AI coding agent—read **[`AGENTS.md`](AGENTS.md)** first.

---

## 1. Repository Governance & Human-Eyes-Only Boundaries

To protect the integrity of the hand-scored citation corpus, this repository enforces a strict separation between **autonomous agent work** and **human curatorial authority**:

1. **Surgical Scope ("Only Touch Necessary Files"):**
   - Every pull request must address a single concern and touch only the files strictly necessary for that task.
   - Never run broad formatting sweeps, unrequested refactors, or file renames across unrelated parts of the codebase.
   - Stage explicit file paths (`git add <file>`) rather than `git add .` so untracked or out-of-scope files are never committed.
2. **Human-Eyes-Only (`HUMAN-ONLY`) Zones:**
   - Sections wrapped in `<!-- HUMAN-ONLY:START -->` … `<!-- HUMAN-ONLY:END -->` inside [`AGENTS.md`](AGENTS.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md) are locked by SHA-256 digests in [`scripts/datasetRelease.test.ts`](scripts/datasetRelease.test.ts). AI agents must never modify them.
   - Existing `evidence_source` and `confidence` values in [`dataset/v5/lineage_v5.json`](dataset/v5/lineage_v5.json) are immutable to agents. If an existing source or score needs updating, open a **[Dataset Correction issue](.github/ISSUE_TEMPLATE/dataset-correction.yml)** or propose it in the PR description for the repository owner (`@sanketmuchhala`) to review.
3. **Multi-Worktree Isolation:**
   - When multiple agents operate in parallel git worktrees, each agent must work strictly inside its own worktree directory, rebase onto `origin/main` before generating static/release outputs (`npm run seo:generate`), and verify `git diff --stat origin/main...HEAD` before opening a PR.

---

## 2. Architecture & Source of Truth

| Artifact | Role | Hand-Edited or Generated? |
|---|---|---|
| [`dataset/v5/lineage_v5.json`](dataset/v5/lineage_v5.json) | Canonical graph of languages (`lang:*`), tools (`tool:*`), and cited relationships | **Hand-curated source of truth** |
| [`dataset/v5/enrichment_v5.json`](dataset/v5/enrichment_v5.json) | Structured Wikidata enrichment per node | **Curated / scripted enrichment** |
| [`dataset/ai/*.json`](dataset/ai/) | Step-by-step AI execution-path explainers with verbatim source quotes | **Hand-curated source of truth** |
| [`dataset/v5/lineage_v5_nodes.csv`](dataset/v5/lineage_v5_nodes.csv) | RFC 4180 node table (excludes third-party logo fields) | **Generated** (`npm run seo:generate`) |
| [`dataset/v5/lineage_v5_edges.csv`](dataset/v5/lineage_v5_edges.csv) | RFC 4180 relationship table with derived `source_type` | **Generated** (`npm run seo:generate`) |
| [`dataset/v5/DATACARD.md`](dataset/v5/DATACARD.md) | Hugging Face / Kaggle / Zenodo compatible dataset card | **Generated** (`npm run seo:generate`) |
| [`dataset/v5/MANIFEST.json`](dataset/v5/MANIFEST.json) | Deterministic release manifest with SHA-256 checksums and exact counts | **Generated** (`npm run seo:generate`) |
| `public/**` (except `seo.css`, `fx.js`, `hw-fx.js`) | Static HTML pages, OG images, `sitemap.xml`, `llms.txt`, `rss.xml` | **Generated** (`npm run seo:generate`) |

Detailed manuals live in [`docs/`](docs/):
- [`docs/DATASET.md`](docs/DATASET.md) — Node/edge schema, relationship directionality, confidence calibration, and logo harvesting.
- [`docs/CONTENT_PIPELINE.md`](docs/CONTENT_PIPELINE.md) — Dataset-driven publishing workflow and shared discovery (`scripts/contentPages.ts`).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Interactive React/Cytoscape explorer and static SEO generator architecture.
- [`docs/TESTING.md`](docs/TESTING.md) — Verification gate and test invariants.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — Settled product and architectural decisions.

---

## 3. Verification Gate

Every PR must pass the full verification gate locally and in GitHub Actions (`.github/workflows/verify.yml`):

```bash
npm install
npm run seo:generate     # if dataset/ or scripts/ generators changed
npm run verify           # runs type-check + test + seo:validate + seo:links + build
```

If you add or modify an AI execution path in `dataset/ai/*.json`, also run the live quote verifier:

```bash
npm run check:ai-quotes
```

---

## 4. Dataset Versioning & Releases

1. **In-Place Minor/Patch Updates:**
   - Within `v5`, node and edge additions update `dataset/v5/lineage_v5.json` in place.
   - Running `npm run seo:generate` automatically updates `lineage_v5_nodes.csv`, `lineage_v5_edges.csv`, `DATACARD.md`, and `MANIFEST.json` (recording exact node/edge/AI-path counts and SHA-256 file digests).
   - Hand-written counts in `index.html`, `README.md`, `dataset/index.html`, and `dataset/README.md` are checked against `lineage_v5.json` by `scripts/siteCounts.test.ts`.
2. **Tagged Releases (`v*.*.*`):**
   - Bump `version` in `package.json`, update `CITATION.cff` (`version` and `date-released`), and record the milestone in [`CHANGELOG.md`](CHANGELOG.md).
   - Push a signed or annotated git tag (`git tag v5.2.0 && git push origin v5.2.0`) or trigger `.github/workflows/release.yml` to publish a GitHub Release with `SHA256SUMS.txt` and all dataset artifacts attached.
