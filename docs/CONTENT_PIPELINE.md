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

## Publish an addition

1. Add reviewed data and citations. Keep schema changes separate from content.
2. Run `npm run seo:generate`. This generates social cards before HTML; a new
   record must get its final social image on this first run. Sitemap, catalogs,
   dataset downloads and existing feed generation run in the same command.
3. For lineage records with logos, follow the logo commands in AGENTS.md. Logo
   harvesting and rendering remain explicit because they can fetch remote data.
4. Run the relevant citation check (`npm run check:ai-quotes` for execution
   paths, or `npm run check:evidence-links` for lineage), read the sources, and
   inspect the new page and its hub/backlinks.
5. Run `npm run verify`. Review generated changes and canonical URLs; keep
   counts synchronized as described below. Commit data and generated artifacts
   together in a content PR, with human review of confidence values.

`npm run build` also runs generation. Deploy only after the freshness and live
sitemap checks in AGENTS.md. Nothing in this workflow auto-merges or deploys.

`contentPages.test.ts` checks new-record eligibility without a slug allowlist,
then checks actual lineage pages, sitemap membership and social cards, automatic
question canonical decisions, and AI hub/catalog/image coverage. The existing
AI suite checks all discovered files and their rendered execution paths.

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
