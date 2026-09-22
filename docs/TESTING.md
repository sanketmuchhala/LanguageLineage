# TESTING.md

Part of the agent contract: start at [AGENTS.md](../AGENTS.md).

What the checks are, what each one protects, and the rules for changing them.

## The gate

```bash
npm run verify
```

That runs, in order: `type-check`, `test`, `seo:validate`, `seo:links`, `build`.
All of it must be green before a pull request is opened. `.github/workflows/verify.yml`
runs the same sequence on every PR, plus a compile check of `api/propose.ts`,
which `type-check` does not cover.

| Check | Passing looks like |
|---|---|
| `npm run type-check` | No output. |
| `npm test` | All tests pass. No skipped tests. |
| `npm run seo:validate` | `0 errors, 0 warnings`. |
| `npm run seo:links` | `0 broken, 0 over-depth, 0 orphans`. |
| `npm run build` | Builds. One Cytoscape chunk-size warning is expected. |

## The rule about failing tests

**Never delete, skip, or weaken a test to get a green run, and never turn off
validation.** This is the single most damaging thing an agent has done to this
repository: a branch removed 28 tree-view tests and disabled dataset validation
so a rewrite would build. Those tests pass unmodified on `main`.

When something fails, decide which is wrong, the code or the test, say so out
loud, and fix that one. If a test genuinely no longer describes intended
behavior, change it in its own commit with the reason in the message. If you
cannot work out which is wrong, stop and ask.

## Test suites

Vitest, configured in `vitest.config.ts` to pick up `src/**/*.test.ts(x)` and
`scripts/**/*.test.ts`.

### Dataset integrity — `scripts/dataset.test.ts`

The build-time counterpart to the browser-side checks in
`src/data/validateDataset.ts`. It enforces what `docs/DATASET.md` describes:

- the file parses against the Zod schema, and each node and edge is valid alone
- the JSON stays 2-space formatted with a trailing newline, so diffs stay readable
- ids are unique and follow `lang:`/`tool:` with lowercase slugs
- every edge endpoint resolves; no duplicate from/to/type triples
- every edge cites an http(s) evidence URL, and never cites this site
- confidence is above 0 and at most 0.99 — **1.0 is rejected on purpose**,
  because a batch of 1.0 scores is the signature of machine-generated edges
- year ranges are ordered, self-loops only appear on implementation edge types
- the graph stays one connected component with no isolated nodes

### Logos — `scripts/logos.test.ts`

Partial logo coverage is fine; a node without one renders a letter badge. What
this catches is a node claiming a logo the graph cannot draw:

- every logo URL has a kind, a source and a license; `none` means a null URL
- devicon URLs point at the Devicon CDN, wikimedia URLs at Commons uploads
- no tracking parameters, https only
- the generated manifest in `src/data/graphLogoAssets.ts` lists only real nodes
  that carry a logo, each with a PNG on disk, and no orphan PNGs are shipped
- `src/graph/buildElements.ts` still passes `logoUrl` into Cytoscape node data.
  An agent once deleted that line to silence a console error, which blanked
  every logo on the graph while everything still built and validated.

### Counts — `scripts/siteCounts.test.ts`

Node and relationship totals are typed by hand into the landing page, the SPA
meta tags, `index.html`, both READMEs, the dataset page and the social image
source. They go stale silently. This test reads each one and compares it with
the dataset.

When it fails it names the file and both numbers. If copy was reworded so a
pattern no longer matches, update the pattern in the same PR. `public/og-image.png`
is a rendered copy of `public/og-image.svg`, so re-render it when a number in
the SVG changes.

### Graph logic — `src/graph/tree/`, `scripts/centrality/`

Tree hierarchy building, the tree view component, tree utilities, and the
centrality maths (PageRank, descendants, closures) behind the rankings page.

## What the gate does not cover

Know these gaps, and check them by hand when your change touches them.

- **Citations resolving.** `npm run check:evidence-links` hits the network, so
  it is deliberately outside the gate: it must not fail a build because a source
  site returned a transient 503. Run it periodically and read the report. It
  never rewrites the dataset.
- **Whether a citation supports its claim.** No machine checks this. Fetch and
  read every source you add.
- **API routes.** `vercel dev` hangs in this project. CI compiles
  `api/propose.ts`; behavior is verified on a preview deploy per `DISTRIBUTION.md`.
- **Visual correctness.** Nothing verifies that a logo is the right mark or that
  the graph looks right. Look at the images and the rendered page.
- **Generated pages being committed.** The build regenerates `public/`, and some
  pages carry today's date, so a "no diff after build" check would fail daily.
  After a dataset change, run `npm run seo:generate` and commit the output.
- **Accessibility.** Phase 12 of `SITE_IMPROVEMENT_PLAN.md` is still open.

## Adding tests

Put dataset, pipeline and generator tests in `scripts/*.test.ts`; app and graph
tests next to their source in `src/`. Prefer asserting on real dataset and
repository files over mocks: every regression listed above would have been
caught by reading the actual artifact, and mock-heavy tests were what a previous
agent used to justify deleting the suite.
