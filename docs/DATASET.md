# DATASET.md

Part of the agent contract: start at [AGENTS.md](../AGENTS.md).

How to add to and change the dataset without breaking it.

`PIPELINE.md` explains how the pipeline works end to end. This document is the
working manual for making a change: what a record must contain, what counts as
evidence, how logos get attached, and the checklist to run before you open a PR.

## The files

| File | What it holds |
|---|---|
| `dataset/v5/lineage_v5.json` | **The source of truth.** Every node and relationship. |
| `dataset/v5/enrichment_v5.json` | Wikidata facts per node (designers, license, website, file extensions). |
| `dataset/v5/wikimedia_logo_overrides.json` | Accepted Commons logos with per-file license metadata. |
| `dataset/v4/lineage_v4.json` | Historical input, kept as a selectable version. Do not edit. |

`lineage_v5.json` is edited in place. Do not run `npm run dataset:v5` to add
nodes: that script rebuilds v5 from v4 and would drop everything added to v5
since. Append to the JSON directly, or with a throwaway script, then validate.

Formatting: two-space indented JSON with a trailing newline, written by
`JSON.stringify(data, null, 2)`. Keep it that way so diffs stay readable.

## Node records

Every node has all 18 fields, `null` where unknown. Ids are `lang:<slug>` for
languages and `tool:<slug>` for compilers, runtimes, engines, and
infrastructure. Slugs use underscores (`lang:emacs_lisp`), and page URLs convert
them to hyphens (`/languages/emacs-lisp`).

```json
{
  "id": "lang:luau",
  "name": "Luau",
  "first_release_year": 2021,
  "current_primary_implementation_language": "C++",
  "paradigm": ["imperative", "multi-paradigm", "scripting"],
  "typing": "gradual",
  "runtime_model": "vm",
  "self_hosting": false,
  "notes": "Gradually typed language derived from Lua 5.1, developed by Roblox.",
  "cluster_hint": "dynamic",
  "company": "Roblox",
  "garbage_collected": true,
  "logo_url": null,
  "peak_year": null,
  "current_users_estimate": "large",
  "logo_source": null,
  "logo_license": null,
  "logo_kind": "none"
}
```

Allowed values, enforced by `scripts/schema.ts`:

| Field | Values |
|---|---|
| `paradigm` | array, orientation, ..., low-level, imperative, procedural, functional, multi-paradigm, object-oriented, logic, declarative, generic, concurrent, systems, scientific, tool, modular, prototype-based, dependent-typed, proof-assistant, scripting, data-driven, statistical, static-analysis, markup, query, dataflow |
| `typing` | static, dynamic, gradual, weak, strong, none, untyped, unspecified |
| `runtime_model` | compiled, interpreted, jit, jit_compiled, bytecode_vm, vm, transpiled, native, none, tool |
| `current_users_estimate` | niche, moderate, large, dominant, or null |
| `logo_kind` | devicon, wikimedia, proxy, none |
| `cluster_hint` | free text in the schema, but keep to the ten in use: roots, historical, functional, systems, dynamic, jvm, clr, scientific, tools, other |

Tool nodes conventionally use `paradigm: ["tool"]` and `cluster_hint: "tools"`.

## Relationship records

```json
{
  "from_language": "lang:c",
  "to_language": "lang:python",
  "relationship": "runtime_written_in",
  "start_year": 1991,
  "end_year": null,
  "confidence": 0.98,
  "evidence_source": "https://github.com/python/cpython",
  "notes": "CPython reference implementation in C"
}
```

**Direction is the thing agents get wrong.** `from_language` is the
implementation language; `to_language` is the thing being implemented. The
record above reads "Python's runtime is written in C". So "what is X written
in?" means edges where `to_language` is X. `influenced` reads the same way:
`from` influenced `to`. `transpiled_to` is the exception that reads forward:
`from` compiles into `to` (`lang:nim` → `lang:c`).

The six types, and what each one means:

| Type | Use it for |
|---|---|
| `compiler_written_in` | The compiler for B is written in A. Also used when B's compiler is built on an infrastructure node such as LLVM. |
| `runtime_written_in` | B's runtime, VM, interpreter, or library core is written in A. |
| `bootstrap_written_in` | How a self-hosting loop actually started. Historical, and curated by hand. |
| `rewritten_in` | A deliberate reimplementation in a new language, recorded alongside the runtime/compiler edge that changed. |
| `transpiled_to` | Source in A is translated to source in B. |
| `influenced` | A's design shaped B's. |

Nothing vaguer exists. There is no "related to", no "depends on", no
"runs on". If a fact does not fit one of the six, leave it in `notes` or leave
it out.

**When an implementation changes, keep both edges.** Set `end_year` on the old
one and add the new one, plus a `rewritten_in` edge. The generators prefer edges
with `end_year: null` when stating what something is written in today, so the
history stays in the data without making the pages wrong. fish is the worked
example: C (2005–2012), C++ (2012–2025), Rust (2025–), plus `rewritten_in`.

Self-loops are legitimate and mean self-hosting (`lang:zig` → `lang:zig`).

### Confidence

Hand-assigned, printed on the page next to the claim. The validator flags
anything below 0.8 for review. Calibrate against what the source actually
supports:

| Range | Meaning |
|---|---|
| 0.95–0.99 | The primary source states it outright: the project's own repository, release notes, or official docs. |
| 0.88–0.94 | Official documentation implies it clearly, or the claim is well established but the single best source is secondary. |
| 0.80–0.87 | Reasonable inference from a real source: a source directory, a build file, a mixed-language codebase where the split is a judgment call. |
| 0.65–0.79 | Contested, partial, or historical claims with thin sourcing. Expect a reviewer to push back. |

Do not put 1.0 on anything. A uniform 1.0 across a batch is the signature of a
machine-generated edge and destroys the calibration of the hand-scored corpus.

### Evidence

Every relationship needs an `evidence_source` URL, and every new node needs at
least one non-Wikipedia source among its edges.

- **Fetch the URL and read it before you cite it.** A 200 response is not
  evidence; the page has to state the claim.
- Prefer, in order: the project's source repository, official documentation,
  release notes or a release blog post, a paper, then Wikipedia.
- Cite the specific page, not the homepage. `.../aten` beats `pytorch.org`.
- Never cite this site, a generated page, an LLM, or a search result.
- Implementation facts go stale. Check the current state rather than recalling
  it; several well-known projects changed implementation language recently.

## Which nodes belong

Admit a node when it has an implementation-provenance edge terminating in a node
already in the dataset, and its implementation-language fact is stable year over
year. A language or tool with no such edge is out, however famous.

For AI infrastructure specifically, the scope boundary in `docs/DECISIONS.md` is
narrow and deliberate: implementation provenance only, using `tool:` nodes and
the existing six edge types. Model lineage, benchmark trackers, and AI tutorial
content are all rejected, each with an incumbent already owning that space.

## Logos

Coverage is partial by design: no logo beats a wrong logo. A node without one
renders a letter badge, which is a supported state, not a bug.

Four kinds: `devicon` (Devicon CDN), `wikimedia` (Commons file, license
recorded), `proxy` (a related project or owner mark where no dedicated icon
exists, such as the Emacs logo for Emacs Lisp), and `none`.

To add logos for new nodes:

1. **Devicon first.** Check the index at
   `https://raw.githubusercontent.com/devicons/devicon/master/devicon.json` for
   a matching slug. Set `logo_url` to
   `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/<slug>/<slug>-original.svg`,
   `logo_source` to the icon's directory on GitHub, `logo_license` to
   `Devicon MIT; trademarks retained by owners`, and `logo_kind` to `devicon`
   (or `proxy` if it is another project's mark).
2. **Then Wikimedia.** Add the node to `TARGETS` in
   `scripts/harvestWikimediaLogos.ts` with a curated Wikipedia title or a QID,
   run `npm run logos:wikimedia`, then apply with
   `npx tsx scripts/applyLogoOverrides.ts`. The harvester accepts only Wikidata
   `P154` logo claims, never `P18` photographs.
3. **Render the graph assets.** `npm run logos:graph` rasterizes every logo to a
   256px PNG in `public/logos/graph/` and rewrites the manifest at
   `src/data/graphLogoAssets.ts`. The graph canvas uses these PNGs because
   Cytoscape misrenders remote SVGs.
4. **Check the count.** The script prints `Rendered N/M`. If N is less than M,
   entries were dropped from the manifest and those nodes lose their graph
   logo. Investigate rather than committing.
5. **Look at the images.** Wikidata occasionally points at the wrong mark. Known
   rejections are recorded by name with reasons in the harvester.

Two gotchas, both of which have caused real regressions:

- `harvestWikimediaLogos.ts` rewrites the overrides file with only the nodes it
  processed in that run, and it skips nodes that already have a logo. Merge its
  output with the existing file instead of letting it truncate the record.
- Wikimedia rejects headless Chromium's user agent, which makes rendering fail
  for Commons-hosted images and silently drops them from the manifest.

## Checklist for a data change

1. `git fetch origin && git status` — not behind `origin/main`.
2. Add nodes and edges. Keep it to about five new nodes per PR.
3. Verify every citation by fetching it and reading the claim.
4. `npm run analyze:v5` — schema valid, 0 integrity errors, one connected
   component, no isolated nodes.
5. Logos: devicon, harvest, apply, render, check the count, look at the images.
6. `npm run seo:generate` then `npm run og:generate`.
7. Update the hand-written counts (`npm test` tells you if you missed one).
8. `npm run verify` — the whole gate green.
9. Compare `public/sitemap.xml` with the live sitemap: gaining URLs is fine,
   losing one is not.
10. Confirm the diff is additive: no existing `evidence_source` or `confidence`
    value changed.
11. Open a PR listing each new citation and flagging new confidence values for
    review.
