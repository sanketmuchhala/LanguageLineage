# Adding content without writing another page

The owner requested this workflow on 2026-11-11. All agents adding content or
changing publishing must follow it alongside AGENTS.md.

## The architecture

Use a validated content model and a renderer per page family. Each record gets a
stable route. The renderer builds the page, while discovery supplies the hub,
sitemap and catalogs. Review facts before publishing. Layout changes belong in
the renderer and apply to every record in that family.

For this repository the flow is:

```text
Reviewed JSON records
  -> schema and relationship validation
  -> discover records and choose canonical URLs
  -> generate social cards
  -> shared page templates and hub links
  -> sitemap, RSS and llms catalogs
  -> tests, SEO and link validation, production build
  -> preview and human review
```

No database or framework migration is needed for the current site. Static HTML
is already readable without running the graph app, and it is cached by hosting.

## Which file do I add?

| Content | Source | What is automatic |
| --- | --- | --- |
| Language or implementation tool | `dataset/v5/lineage_v5.json` | Detail page, directory/hub membership, graph, sitemap, catalog, social card |
| Detailed tool article | New `dataset/tool-articles/<node_slug>.json` | Sourced introduction and sections on the existing tool page; no new route or registration |
| AI execution path | New `dataset/ai/<slug>.json` | Interactive detail page, AI hub, configured lineage backlinks, sitemap, catalog, social card |
| Eligible implementation question | Lineage edges plus `dataset/v5/enrichment_v5.json` | Existing question template and canonical eligibility rules |
| Editorial guide or special landing page | Existing generator definitions | Still requires editorial code/catalog updates; it is not a data-only family yet |

Lineage rules are in `docs/DATASET.md`. AI files are validated by
`scripts/aiPaths.ts`; use an existing file to understand the model, then author
and verify the new facts. Do not copy another record's claims or citations.
AI execution stages never become new lineage relationship types.

For existing families, never add a per-record component, HTML file, condition
such as `if (slug === ...)`, or manual list entry to make discovery work.
Optional record-specific prose must be content, not another renderer.
`scripts/contentPages.ts` owns shared node routing and auto-question selection;
both the HTML and sitemap generators consume those rules. `loadAllPaths` owns
AI file discovery and validation across the generators.

Canonical exceptions reflect existing search evidence. Do not remove them or
scale question pages without the review described in `docs/DECISIONS.md`.

## Required content task handoff

This is the agent's mandatory finish procedure for both additions and
corrections. Trigger it after the final edit to lineage data, enrichment, AI
path files, logo metadata or editorial generator content. Do not ask the owner
to run the pipeline, and do not report content as complete after writing JSON.
Generation is an explicit command; saving a JSON file does not launch it.

### 1. Prepare in your own worktree

Read the target checkout's AGENTS.md and the relevant data instructions. Check
`git status --short` and `git worktree list` before changing files. Keep a note
of pre-existing changes. Work only in your assigned checkout; other agents may
be editing or committing simultaneously. Fetch and inspect the latest
`origin/main` when network access permits. Integrate required changes in your
own branch, preserving other agents' commits. Never reset, stash, switch or
clean another agent's checkout. Before deploying, the freshness and live
sitemap checks in AGENTS.md are required.

Add reviewed data and citations without changing the schema. For new nodes or
relationships, update the hand-written totals listed in `docs/ARCHITECTURE.md`.
If the global social image's numbers change, re-render `public/og-image.png`
from its SVG too; per-page OG generation does not update that global image.
For new or changed logos, follow `docs/DATASET.md`: render graph assets, check
rendered coverage, and inspect the marks. Do not run harvesters unrelated to
the task or rebuild the canonical dataset from historical inputs.

### 2. Verify sources

Read every citation added and confirm it supports the exact claim. Then run
checks relevant to the changed content:

| Change | Command | Passing result |
| --- | --- | --- |
| Lineage nodes or relationships | `npm run analyze:v5` | Valid schema, no integrity errors, connected graph |
| Lineage relationship citations | `npm run check:evidence-links` | Review the report; all new citation URLs resolve and support the claim |
| AI execution paths | `npm run check:ai-quotes` | All required quotes found in the live sources |

Network checks are separate from `verify`. If a check cannot run or a source
fails, report the exact failure and affected claim; do not mark it passed,
delete a claim to hide the failure, or silently change existing evidence or
confidence. A human still reviews evidence and new confidence values.

### 3. Trigger generation, then the full gate

Run these in order after the final content edit:

```bash
npm run seo:generate
npm run verify
```

The first command computes rankings, regenerates the downloadable family-tree
poster and its preview, generates per-page social cards before
HTML, then builds pages, hubs, sitemap, RSS, llms catalogs and dataset releases.
AI records are discovered from `dataset/ai/*.json`; lineage records are read
from the v5 dataset. Existing template eligibility determines which optional
question pages are produced. No per-record page code is needed.

The second command runs type checking, all tests, SEO validation, the internal
link audit and the production build. The build regenerates the site again;
that repetition is part of the existing gate. Require zero SEO errors/warnings,
zero broken/over-depth/orphan links, and all tests passing with none skipped.
The documented Cytoscape chunk-size warning is expected.

If content changes after either command, run both again. Fix failures in their
source; never hand-edit generated output or weaken tests. If the environment
blocks a command, record the error and any equivalent checks you could run.
Do not claim `npm run verify` passed if only individual stages were run.

### 4. Inspect output and prepare the handoff

Run `git diff --check`, `git diff --stat` and `git status --short`. Inspect the
new or changed page and its social image, its hub/directory entry and relevant
backlinks. Check canonical URLs, sitemap membership and llms catalog coverage.
A noncanonical question page correctly stays out of the sitemap. AI paths must
work for every supported mode/device selection. Existing discovered-file tests
cover each AI JSON file and its rendered stages and steps.

Compare sitemap URL sets before and after the change, using the task's base
commit, and report additions and removals. For a publishing task also compare
against the live sitemap as AGENTS.md requires. Investigate missing URLs;
renames and deletions need explicit redirect/removal review. Generation does
not prune stale HTML automatically.

Include source data and all affected tracked generated artifacts together in
the content commit. Inspect `public/`, generated logo manifests and
`scripts/page-dates.json`; do not stage another agent's pre-existing work or
force-add ignored files. `public/dataset/` releases are intentionally ignored
and rebuilt from tracked source data. Content and generator infrastructure
changes remain separate concerns.

Generation does not commit, push, merge or deploy. Follow the owner's current
instructions and repository review rules for those actions. Finish with a
report containing:

```text
Content: records added/updated and their generated routes.
Generation: command and actual result.
Sources: checks run, results, and evidence/confidence needing review.
Validation: full gate result, or each equivalent stage and any blocked checks.
URLs: added N, removed N; explain redirects or removals.
Review: pages/images/selections inspected and remaining manual checks.
Git: branch/commit, whether pushed, and PR/deployment status if applicable.
```

Do not call the task complete while generation, required source verification
or the gate is still failing or pending; report the outstanding work clearly.

`contentPages.test.ts` checks new-record eligibility without a slug allowlist,
actual lineage pages, sitemap membership, social cards, question canonical
decisions, and AI hub/catalog/image coverage. The existing AI suite checks all
discovered files and their rendered execution paths.

## When a new page family is needed

A new record and a new family are different changes. If the existing model
cannot express the content, propose a separately reviewed schema and template.
A family implementation includes validation, one shared renderer, stable route
rules, discovery, a hub/backlinks, canonical metadata, sitemap/catalog coverage,
social cards and tests proving another record can be discovered automatically.
Prove it with a small useful pilot before expanding coverage. Do not introduce a
general block editor or arbitrary HTML fields as a shortcut around modeling.

## Remaining manual work

The site is not fully data-only yet. These are specific follow-ups, not reasons
to write a new page component for a language, tool or execution path:

- Marketing counts in app copy, READMEs, dataset landing files and the global
  social image are hand-written. `siteCounts.test.ts` enforces consistency.
  Replace these with generated/shared counts in a separate focused change.
- Editorial guides and special landing pages embed prose and route lists in
  generator code. Migrate a family only when there is an approved need to add
  more of it; use structured content with equivalent output and preserved URLs.
- Page builders remain in `generateSeoPages.ts`. Splitting templates into
  modules can improve maintainability, but is not required to add a data record.
- Generation rebuilds the whole site and does not prune deleted pages. A delete
  or slug rename needs an explicit redirect/removal review. Do not silently
  remove existing indexed URLs.

## Scaling beyond this site

Separate content, template and delivery concerns. Large catalogs can use the
same route/template for many records, pre-render popular routes, render other
routes on demand, and cache the results. On a content change, invalidate only
that record and dependent hubs, indexes and related pages. Next.js documents
this approach through dynamic static parameters and incremental regeneration:

- https://nextjs.org/docs/app/api-reference/functions/generate-static-params
- https://nextjs.org/docs/app/guides/incremental-static-regeneration

Those are examples of the pattern, not a recommendation to migrate this site.
Measure full-build duration, output size and hosting limits before adopting
incremental generation. At much larger scale, also partition sitemaps and track
publish failures and cache invalidation. A million URLs is a capacity concern;
useful, sourced content is the publishing criterion. Google's guidance:

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies

## Detailed articles on existing tool pages

`dataset/tool-articles/<node_slug>.json` enriches an existing `tool:` record;
it does not create a node or change implementation evidence. The filename uses
the node id suffix, including underscores. `scripts/toolArticles.ts` validates
and discovers every file automatically.

Each record has `node_id`, a cited `introduction`, at least three `sections`
(`heading` and cited `paragraphs`), and `sources` (`id`, descriptive `title`,
HTTPS `url`). Each paragraph is plain `text` and a nonempty array of source ids.
HTML is escaped. Every source must be used and every reference must resolve.
Unknown nodes, mismatched filenames and extra fields fail generation.

Explain the tool's purpose, concrete execution boundaries, implementation layers
and limitations. Fetch and read primary sources before authoring each claim.
Keep CUDA/LLVM-style infrastructure dependencies separate from implementation
languages. Preserve the lineage record's evidence and confidence. An article
is not a new lineage relationship or a substitute for quoted execution paths.

Run `npm run seo:generate` and `npm run verify` after the final edit; inspect the
existing `/tools/<slug>` page, citations, contents links, FAQ structured data
and sitemap URL preservation. A later article needs only a JSON record, not
changes to the renderer. Submit content separately from model/schema changes.
