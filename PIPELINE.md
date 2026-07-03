# The Language Lineage data pipeline

This is the source-level companion to [languagelineage.org/how-it-works](https://www.languagelineage.org/how-it-works). That page explains the methodology for readers; this document maps every stage to the actual scripts, data files, and commands in this repository, in the order they run.

The short version: research agents harvest cited facts from public structured data, a deterministic build assembles them into one dataset file, a person reviews every diff, three mechanical gates check the result, and the entire site is regenerated from that one file on every deploy.

## Repository map

| Path | Role |
| --- | --- |
| `dataset/v5/lineage_v5.json` | The single source of truth: every node, edge, confidence score, and evidence URL |
| `dataset/v5/enrichment_v5.json` | Harvested Wikidata facts per node, with source URLs |
| `dataset/v5/wikimedia_logo_overrides.json` | Accepted logo files with per-file Commons license metadata |
| `dataset/v4/lineage_v4.json` | Historical input to the v5 assembly step, kept as a selectable version |
| `scripts/` | The pipeline: harvesters, assembly, generators, validators |
| `scripts/schema.ts` | Zod schemas for nodes, edges, and enums |
| `src/data/` | Runtime loading, validation, normalization, and indexing for the interactive graph |
| `public/languages/`, `public/tools/`, `public/questions/`, `public/guides/`, `public/relationships/`, `public/timeline/` | Generated static pages. Never hand-edited; always rebuilt from the dataset |

## Stage 01: Sources

Three classes of sources feed the pipeline, chosen because each can be checked by a machine and cited to a reader.

1. **Wikidata structured claims.** Designers, developers, licenses, influences, and implementation languages as machine-readable statements. Wikidata content is CC0.
2. **Wikimedia Commons.** Logo files, each carrying its own per-file license metadata, which the pipeline records alongside the image URL.
3. **Primary repositories and documentation.** The `evidence_source` URL on every edge points at a source tree, release notes, or official docs, for example the CPython repository for the claim that Python's reference runtime is written in C.

One licensing rule is enforced everywhere: Wikipedia article prose is CC BY-SA and is never stored or rendered. Only structured facts are kept, and every page's narrative is synthesized from those facts, then cited back to both Wikipedia and Wikidata.

## Stage 02: Research agents

Two harvest agents run offline. Both are deliberately mechanical: they fetch, resolve, and record. They do not decide anything, and both write an audit report on every run.

### The fact harvester

`scripts/harvestWikipediaContent.ts`, run with `npm run content:wikipedia`. For every node in the dataset it:

- Resolves the node to a Wikipedia article and its Wikidata item, following redirects. Ambiguous names (Io, Hack, Raku, Nix, and roughly 150 others) are pinned to exact article titles in a curated map so the agent never lands on a disambiguation page.
- Pulls structured claims from the Wikidata item, plus the CC0 English description tagline.

| Wikidata property | What it captures |
| --- | --- |
| `P287` / `P170` designed by, creator | Language designers |
| `P178` developer | Maintaining organizations |
| `P275` license | License |
| `P737` influenced by | Design influences, cross-checked against the graph's influence edges |
| `P277` programmed in | Implementation language, cross-checked against written-in edges |
| `P856` official website | Project site |
| `P1195` file extension | File extensions |

- Resolves referenced entities to names in batches of 50. When an entity has no English label, common for organizations and people, it falls back to the English Wikipedia sitelink title with any disambiguation suffix stripped.
- Behaves politely: an identified User-Agent, spaced requests, and up to four retries with backoff.
- Runs incrementally and writes an audit report with per-node fact counts and a table of everything it could not resolve.

Output: `dataset/v5/enrichment_v5.json`, shaped as `{ policy, enrichment: { [nodeId]: facts } }`. Nodes with no Wikipedia article carrying a Wikidata item are listed rather than guessed; their pages fall back to dataset facts alone instead of invented prose.

### The logo harvester

`scripts/harvestWikimediaLogos.ts`, run with `npm run logos:wikimedia`. Its policy is strict:

- Accepts only Wikidata `P154` logo claims. `P18` representative images are excluded on purpose: a screenshot or a photograph is not a logo.
- Resolves each accepted file on Wikimedia Commons and records its per-file license next to the URL, so attribution ships inside the dataset.
- Only fills gaps or upgrades stand-ins. It never overwrites a curated mark.
- Rejections are written down with reasons, by name, in the script. Wikidata claims Icon's logo is an unrelated magazine's mark and FemtoLisp's is Julia branding; both are refused explicitly.

Output: `dataset/v5/wikimedia_logo_overrides.json`, plus an audit report. The standing policy is that no logo beats a wrong logo.

## Stage 03: Assembly

`scripts/generateV5Dataset.ts`, run with `npm run dataset:v5`, deterministically merges three inputs into one file:

1. the base dataset, `dataset/v4/lineage_v4.json`
2. the harvested logo metadata and its curated overrides
3. a set of named corrections, each carried with a written reason

Output: `dataset/v5/lineage_v5.json`. Run the script twice and you get the same bytes.

### What a record looks like

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

Edge direction matters: `from_language` is the implementation language and `to_language` is the thing being implemented. So the record above reads "Python's runtime is written in C", and "what is X written in?" means edges where `to_language` is X.

Every edge carries one of six vetted relationship types (`compiler_written_in`, `runtime_written_in`, `bootstrap_written_in`, `influenced`, `transpiled_to`, `rewritten_in`), a hand-assigned confidence score, and an evidence URL. Nothing vague like "related to" exists in the schema, which is enforced by the Zod definitions in `scripts/schema.ts`.

## Stage 04: Human review

Agents propose; they never merge. Every change to the dataset or the generators lands as a git diff that a person reads before it reaches the main branch. This is the stage where judgment lives:

- All confidence scores are assigned by hand and printed wherever the claim appears.
- Contested history is adjudicated, not averaged. Self-hosting compilers create chicken-and-egg loops (rustc is written in Rust) that no scraper untangles; the `bootstrap_written_in` edges recording how each loop actually started are curated by hand.
- Every curated pin, override, and rejection is a named entry in code with a written reason, so a reviewer sees both the change and the argument for it.
- Policy is decided here too: the licensing rules, the logo standard, and what qualifies for each relationship type.

## Stage 05: Validation gates

Three mechanical gates run before any change ships. There is no override flag; a red gate stops the release until a person fixes the cause.

```
npm run type-check     # gate 1: strict TypeScript across app and pipeline
npm run seo:validate   # gate 2 and 3: dataset integrity + full site audit
npm run build          # regenerate everything, then compile
```

**Gate 1: Types.** The TypeScript compiler checks the application and every pipeline script against strict dataset interfaces, so a malformed record is a build error.

**Gate 2: The dataset validator.** `src/data/validateDataset.ts` checks the graph itself, and it runs again in the browser every time the dataset loads:

- every edge endpoint must resolve to a real node, with no dangling references
- no duplicate ids
- required fields on every node and edge, including the confidence score and start year
- any edge scoring below 0.8 is flagged for review

**Gate 3: The site auditor.** `scripts/validateSeo.ts` audits every generated page and exits nonzero on any error:

- exactly one `h1` per page and no skipped heading levels
- a unique title of at most 75 characters and a unique description of 75 to 180 characters, checked across all 300+ pages at once
- a canonical URL on every page and one canonical host everywhere: sitemap, robots.txt, redirects
- JSON-LD that parses, and exactly one Dataset schema on the whole site, carrying the version, the license, and a direct download URL
- `llms.txt` and `llms-full.txt` must list every page in the sitemap
- an embed snippet on every language page, speakable markup on question pages
- OG images within budget: 120 kB per image, 20 MB total

The required result is 0 errors, 0 warnings.

## Stage 06: Publication

`npm run build` regenerates the entire site from the dataset:

- `scripts/generateSeoPages.ts` renders every language, tool, question, guide, relationship, timeline, and dataset page as static HTML into `public/`
- `scripts/generateSitemap.ts` and `scripts/generateLlmsTxt.ts` derive the sitemap and the `llms.txt` index from the rendered pages rather than a hand-maintained list
- `scripts/generateOgImages.ts` renders the social preview images
- the interactive graph at `/explore` fetches the exact same `lineage_v5.json` at runtime, and the downloadable dataset is that same file, not an export

Nobody edits generated HTML. A fix goes into the dataset or a generator and the whole site is rebuilt, so a correction lands everywhere the fact appears.

## The corrections loop

Spot an error? [Open an issue](https://github.com/sanketmuchhala/LanguageLineage/issues). A correction is never a patch to one page: it becomes a dataset or generator change, re-enters the pipeline at the research or assembly stage, gets reviewed like any other diff, and has to clear every gate before it ships.

## Command reference

| Command | What it does |
| --- | --- |
| `npm run content:wikipedia` | Harvest cited facts from Wikidata into `enrichment_v5.json` |
| `npm run logos:wikimedia` | Harvest `P154` logos from Commons with license metadata |
| `npm run dataset:v5` | Deterministically assemble `lineage_v5.json` |
| `npm run type-check` | Gate 1: strict TypeScript |
| `npm run seo:generate` | Regenerate all static pages, the sitemap, and `llms.txt` |
| `npm run seo:validate` | Gates 2 and 3: dataset integrity and full site audit |
| `npm run seo:links` | Audit internal links across generated pages |
| `npm run og:generate` | Render OG preview images |
| `npm run build` | Everything above that ships: generate, type-check, compile |

## Licensing

The dataset is licensed CC BY 4.0, with a ready-made citation block on the [dataset page](https://www.languagelineage.org/dataset). Harvested facts come from Wikidata (CC0); logo files carry their individual Wikimedia Commons licenses, recorded per file inside the dataset.
