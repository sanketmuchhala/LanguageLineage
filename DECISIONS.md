# DECISIONS.md

Questions that are already answered. Each was researched with sources and
numbers, not opinion. Do not reopen one without new evidence of the kind named
in its revisit trigger: re-deriving these from an empty context wastes a session
on a settled question, and every agent that starts fresh is tempted to.

## No database

JSON in git stays.

**Why.** Git-diffable JSON is what makes agent-authored data changes reviewable.
A database removes that property for no benefit at the current scale: one
maintainer, zero user accounts, a 268 KB read-only file queried once per build.

**Revisit if.** User accounts appear, contributors from outside the repo appear,
or more than three humans edit concurrently.

## No rename, no defensive domains

The domain is `languagelineage.org` and the brand is Language Lineage. Do not
propose renames, alternative domains, or defensive `.com`/`.dev`/`.io`/`.ai`
purchases.

**Why.** Domain migrations average about 523 days to recover across roughly 892
studied migrations, and 17% never recover. Exact-match domains have been a
near-zero ranking factor since 2012. Branded search is not a meaningful
acquisition channel for this site.

**Revisit if.** A trademark conflict forces it.

## AI infrastructure: implementation provenance only

The dataset may expand to cover AI-infrastructure implementation provenance
(PyTorch, CUDA, ggml, llama.cpp, BLAS-class tools), but only along the existing
edge types, and never by topic.

**Admit** a node when it has an implementation-provenance edge terminating in a
node already in the dataset and its implementation-language fact is stable year
over year. Use `tool:` ids, the six existing relationship types, no schema
change, and at least one non-Wikipedia source per new node.

**Reject**, with the incumbent named so it is not re-litigated:

| Direction | Who already owns it |
|---|---|
| AI model lineage graphs | Hugging Face model tree, via `base_model:` metadata across 2M+ repos |
| Model, benchmark, parameter trackers | Epoch AI, Artificial Analysis |
| AI tutorials, "AI explained" content | 3Blue1Brown, Karpathy, d2l.ai |
| Ingesting Epoch or Hugging Face datasets wholesale | Not ours to republish |
| OS lineage | Lévénez, Spinellis `unix-history-repo` |
| Paper and citation lineage | Connected Papers, Semantic Scholar |

**Revisit if.** The pilot nodes earn engagement and the ceiling of roughly 12
tools and 35 relationships proves too low.

## No machine-generated edges

Do not build a job that writes edges automatically from GitHub's languages API,
Linguist, or any similar source.

**Why.** The dataset has no `repo` field, byte-counting is not architectural
significance, and machine-generated edges at confidence 1.0 destroy the
calibration of the hand-scored corpus. `scripts/dataset.test.ts` rejects 1.0
scores for this reason.

**Revisit if.** Never, as stated. A harvester may *propose* candidates in a PR
description for a human to score.

## No mass-generated pages

No more definition, question, or comparison pages generated in bulk. Audit the
existing question pages and merge or redirect the zero-value tail instead.

**Why.** Definitional queries convert at 0.08% CTR against 2.91% for exploratory
queries, a 36x gap. The product advantage is the graph and its cited data, not a
growing collection of generic pages.

**Revisit if.** An exploratory template earns impressions in a limited pilot,
which is the only route by which a template gets scaled.

## Human review is not optional

Agents propose; a person merges. Confidence scores and evidence sources are
assigned and changed by humans. An auditing agent never edits the claims it
audits.

**Why.** 444 out of 444 cited relationships is the site's core differentiator
and the one property an agent cannot cheaply regenerate if corrupted.

**Revisit if.** Never while a single maintainer owns the dataset.

## Locked implementation choices

Small decisions that keep getting "fixed" by agents who did not know they were
deliberate:

- **Node size is degree-based** in the graph, not fixed.
- **The graph draws local PNG logos**, not remote SVGs, because Cytoscape's
  canvas misrenders remote SVGs.
- **No logo beats a wrong logo.** Partial coverage is intended; letter badges
  are a supported state.
- **Wikipedia prose is never stored or rendered**, only structured facts, because
  article prose is CC BY-SA. Logo files keep their individual Commons licenses.
- **The design system is locked**: Section 1.6 of `SITE_IMPROVEMENT_PLAN.md`.
- **Dataset files are cached one hour in the browser, one year at the CDN**, and
  are edited in place within a version rather than being immutable.

## Where the open questions live

`IMPLEMENTATION_PLAN.md` is the canonical list of requested work and supersedes
`SITE_IMPROVEMENT_PLAN.md`, whose phases are complete except Phase 12
(accessibility). `MASTER_STATUS.md` is a verified progress snapshot: a reference,
not a source of new requests.
