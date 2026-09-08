# Agent Instructions

## Core Principles

Only make the changes explicitly requested. `IMPLEMENTATION_PLAN.md` at repo root is the canonical source of explicit requests — it supersedes `SITE_IMPROVEMENT_PLAN.md`, whose 13 phases are complete except Phase 12 (accessibility). `MASTER_STATUS.md` is a verified, generated snapshot of both plans' progress; treat it as a reference, not a source of new requests.

## Production-parity preflight (run before any build or deploy)

Local checkouts on this repo have gone stale before: a local `main` sat 164 commits behind `origin/main` for months, and building from it would have produced 156 sitemap URLs against 304 live, deindexing 33 language pages and 103 question pages. Before running `npm run build` with intent to deploy:

1. `git fetch origin && git status` — confirm the branch you're on is not behind `origin/main`.
2. After building, confirm the generated sitemap's URL count matches the live sitemap at `https://www.languagelineage.org/sitemap.xml` with zero difference before deploying.

Never push to `main` from a branch whose base predates the latest `origin/main`.

## Settled decisions (do not relitigate)

These were researched with sources and numbers, not opinions. Do not reopen them without new evidence — re-deriving the same debate from an empty context wastes a session on a question that's already answered.

**No database.** Reconsider only on: user accounts, outside-repo contributors, or more than three concurrent human editors. Git-diffable JSON is what makes agent-authored data changes reviewable; a database would remove that property for no benefit at current scale (one maintainer, zero accounts, a 268 KB read-only file queried once per build).

**No rename, no defensive domains.** The domain is `languagelineage.org` and the brand is Language Lineage. Do not propose renames, alternative domains, or defensive domain purchases (`.com`/`.dev`/`.io`/`.ai`). Closed: domain migration averages ~523 days to recover across ~892 studied migrations, with 17% never recovering; exact-match domains have been a near-zero ranking factor since 2012; branded search is not a meaningful acquisition channel for this site.

**AI-infrastructure scope boundary.** The dataset may expand to cover AI-infrastructure implementation provenance (PyTorch, CUDA, ggml, llama.cpp, BLAS-class tools), but only along the existing edge types, never by topic.

- **Admit** a node only if it has an implementation-provenance edge terminating in a node already in the dataset, and its implementation-language fact is stable year over year.
- **Reject**, with the incumbent named so it isn't re-litigated: AI model lineage graphs (Hugging Face Model tree already owns this via `base_model:` metadata, 2M+ repos), model/benchmark/parameter trackers (Epoch AI, Artificial Analysis), AI tutorials or "AI explained" content (3Blue1Brown, Karpathy, d2l.ai), ingesting Epoch's or Hugging Face's datasets wholesale, OS lineage (Lévénez, Spinellis `unix-history-repo`), paper/citation lineage (Connected Papers, Semantic Scholar).
- Do not build a CI job that auto-writes edges from GitHub's languages API or Linguist. The dataset has no `repo` field, byte-counting isn't architectural significance, and machine-generated edges at confidence 1.0 destroy the calibration of 443 hand-scored edges.

### What not to do:
- Do not add features that were not asked for
- Do not refactor working code unless specifically requested
- Do not add comments or documentation unless asked
- Do not rename variables or functions for "clarity"
- Do not create abstractions or helpers for one-time use

### What to do:
- Read the request carefully and understand exactly what is needed
- Make only the specific changes requested
- Test that the changes work
- Keep the same coding style as existing code
- If unclear, ask for clarification before making changes

## Project-Specific Rules

### This is a graph visualization and SEO content site
- Node sizing is degree-based (not fixed size). Do not change this.
- Dataset field **values** may be enriched or corrected when backed by a cited source — this is expected, ongoing work (see Stage 4 of `IMPLEMENTATION_PLAN.md`). Dataset **schema** changes — new fields, renamed fields, new relationship types — require a dedicated PR and human review; do not bundle a schema change into a content or bug-fix PR.
- Never edit `evidence_source` or `confidence` values without a human review step: 443/443 cited evidence coverage is this site's core differentiator, and it is the one property an agent cannot cheaply regenerate if corrupted.
- Do not modify the design system (Section 1.6 of `SITE_IMPROVEMENT_PLAN.md`) without explicit approval.

### Static pages
- Everything under `public/languages/`, `public/tools/`, `public/questions/`, `public/guides/`, `public/relationships/`, `public/timeline/`, `public/embed-kit/`, `public/sitemap.xml`, and `public/llms.txt` is generated output. Never hand-edit these files. Edit the generator scripts in `scripts/`, then run `npm run seo:generate`. `public/seo.css` and `public/fx.js` are hand-maintained, not generated.
- The sitemap lists canonical URLs only. If you make a page canonicalize elsewhere, remove it from `scripts/generateSitemap.ts` too, or the sitemap will advertise a URL Google is told to ignore.
- Before changing a canonical or consolidating two pages, check `npm run gsc:analyze` first. Most `/languages/{slug}` and `/questions/what-is-{slug}-written-in` pairs are not competing: for roughly 85 slugs only one of the two ranks at all, and canonicalizing blindly removes the only indexed URL.
- Always run the full validation gate below before committing.

### When making UI changes:
- Keep it minimal and clean per the design system
- Respect `prefers-reduced-motion`
- Test at 320px, 390px, 768px, and 1440px widths

### When debugging:
- Fix only the specific bug reported
- Do not "clean up" surrounding code
- Do not add logging unless necessary

## Validation gate (run before every commit)

```
npm run type-check        # must pass
npm run seo:validate      # must report 0 errors, 0 warnings
npm run seo:links         # must report 0 broken, 0 over-depth, 0 orphans
npm run build             # must pass (Cytoscape chunk-size warning is expected)
```

`api/` is not covered by `npm run type-check`: `tsconfig.json` includes only
`src`, matching how `scripts/` is treated. Vercel compiles the functions on its
own side. To sanity-check one locally, run
`npx esbuild api/propose.ts --bundle --platform=node --format=esm --outfile=/dev/null`.

`vercel dev` hangs on this project, so API routes cannot be exercised locally.
Verify them on a preview deploy; the checks are listed in `DISTRIBUTION.md`.
