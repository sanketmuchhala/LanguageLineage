# AGENTS.md

Instructions for any AI coding agent working in this repository (Jules, Claude
Code, Copilot, Codex, Cursor, and anything else that reads this file).

Read this file first. It is the contract. The four documents it links to are the
detail; this page is what you must not get wrong.

## What this project is

Language Lineage is an evidence-cited graph of programming-language and software
implementation provenance: what each language's compiler and runtime are written
in, how each bootstrapped, and what influenced what. It publishes an interactive
graph, a static SEO site generated from the same data, and a downloadable
dataset.

One file is the source of truth: `dataset/v5/lineage_v5.json`. Every page, the
graph, the sitemap, and the download are generated from it. Every relationship
in it carries an evidence URL and a hand-assigned confidence score. That cited
coverage is the product's differentiator and the thing an agent can most easily
destroy.

## Commands

```bash
npm install
npm run dev              # local dev server
npm run verify           # THE GATE: type-check + tests + SEO validate + links + build
```

The gate must be green before you open a pull request. It is five commands if
you want them separately:

```bash
npm run type-check       # must pass
npm test                 # must pass, no skipped or deleted tests
npm run seo:validate     # must report 0 errors, 0 warnings
npm run seo:links        # must report 0 broken, 0 over-depth, 0 orphans
npm run build            # must pass (one Cytoscape chunk-size warning is expected)
```

After any dataset change:

```bash
npm run seo:generate     # regenerate every static page, sitemap, llms.txt
npm run og:generate      # regenerate social preview images
```

Data and logo work:

```bash
npm run analyze:v5       # schema + integrity report on the dataset
npm run logos:wikimedia  # harvest Commons logos for nodes that have none
npx tsx scripts/applyLogoOverrides.ts   # write harvested logos into the dataset
npm run logos:graph      # render local PNGs used by the graph canvas
npm run check:evidence-links            # network check that citations still resolve
```

## Hard rules

Breaking one of these is worse than not doing the task at all.

1. **Never hand-edit generated files.** Everything under `public/languages/`,
   `public/tools/`, `public/questions/`, `public/guides/`, `public/relationships/`,
   `public/timeline/`, `public/embed-kit/`, `public/sitemap.xml`, `public/llms.txt`
   and `public/rss.xml` is output. Edit the generator in `scripts/`, then run
   `npm run seo:generate`. (`public/seo.css`, `public/fx.js` and `public/hw-fx.js` are hand-maintained.)
2. **Never delete or skip a test to make the suite pass, and never disable
   validation.** If a test fails, either the code is wrong or the test is wrong;
   say which, and fix that. A previous agent deleted 28 tests and turned off
   dataset validation to make a branch build. That branch was thrown away.
3. **Never edit an existing `evidence_source` or `confidence` value.** New
   values you author are fine, and need human review before merge. Corrections
   to existing ones go in the PR description as a proposal, not in the diff.
4. **No schema changes in a content or bug-fix PR.** New fields, renamed fields,
   and new relationship types need their own PR and human review. Field *values*
   may be enriched or corrected with a cited source; that is expected work.
5. **Only the six relationship types** already in the schema:
   `compiler_written_in`, `runtime_written_in`, `bootstrap_written_in`,
   `influenced`, `transpiled_to`, `rewritten_in`. If something does not fit one
   of them, it does not go in the dataset.
6. **Verify every citation you add.** Fetch the URL and confirm the page
   actually states the claim. Do not cite a homepage for a specific fact, and do
   not assume an implementation language from memory. Implementations change:
   Bun moved from Zig to Rust, fish from C++ to Rust, TypeScript's compiler to
   Go.
7. **Never push to `main`, and never merge your own work.** Open a pull request
   and let a person review it.
8. **Do not relitigate settled decisions.** See `DECISIONS.md`. No database, no
   domain rename, no AI-model-lineage features, no mass-generated pages.
9. **Keep the hand-written counts in sync.** Node and relationship totals appear
   in the landing page, `index.html`, `README.md`, `dataset/index.html`,
   `dataset/README.md` and the social image. `npm test` fails if they drift.
10. **Scope.** Do only what was asked. No unrequested refactors, no renaming for
    "clarity", no new abstractions for one-time use, no added comments or docs
    unless asked.

## Before you build with intent to deploy

This checkout has gone stale before, and building from a stale base would have
deindexed 136 live pages.

```bash
git fetch origin && git status   # confirm you are not behind origin/main
```

After building, compare the generated `public/sitemap.xml` against the live
sitemap at https://www.languagelineage.org/sitemap.xml. Adding URLs is fine.
A URL that exists live and is missing locally is a stop-work signal.

## The four documents

| File | Read it when |
|---|---|
| `DATASET.md` | Adding or changing any node, edge, logo, or enrichment record |
| `ARCHITECTURE.md` | Changing code: the app, the graph, the generators |
| `TESTING.md` | Anything. It defines the gate and what each test protects |
| `DECISIONS.md` | You are about to propose a direction, a rename, or a new feature |

Also useful: `PIPELINE.md` (how the data pipeline works end to end),
`IMPLEMENTATION_PLAN.md` (the canonical list of requested work),
`MASTER_STATUS.md` (verified progress snapshot, not a source of new requests),
`DISTRIBUTION.md` (deploy and API-route setup).

## Pull request expectations

- One concern per PR. Data changes and generator changes do not travel together.
- State in the description: what changed, the full gate output, every new
  citation with the claim it supports, and anything you were unsure about.
- Flag all new `confidence` values for human review explicitly.
- If you regenerated pages, say how many URLs the sitemap gained or lost.
- Do not open more than two data PRs at once. Cap a single data PR at about
  five new nodes, so a person can actually review the sources.

## Known traps

- `api/` is not covered by `npm run type-check` (`tsconfig.json` includes only
  `src`). Check one function with
  `npx esbuild api/propose.ts --bundle --platform=node --format=esm --outfile=/dev/null`.
- `vercel dev` hangs in this project, so API routes cannot be exercised
  locally. Verify them on a preview deploy; see `DISTRIBUTION.md`.
- Wikimedia rejects headless Chromium's user agent, so logo rendering can
  silently drop entries from the graph manifest. Always check the rendered
  count against the number of nodes carrying a logo.
- Node sizing in the graph is degree-based by design. It is not a bug.
- `npm run build` prints a Cytoscape chunk-size warning. Expected.
