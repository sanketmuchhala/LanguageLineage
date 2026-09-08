# Programming Language Lineage Dataset

Versioned JSON dataset of programming languages, tools, and the cited
implementation and influence relationships between them. `v5` is the current
version, served live at
[languagelineage.org/dataset/v5/lineage_v5.json](https://www.languagelineage.org/dataset/v5/lineage_v5.json).
Earlier versions (`v1`–`v4`) are kept for reproducibility.

Each relationship (`compiler_written_in`, `runtime_written_in`,
`bootstrap_written_in`, `rewritten_in`, `transpiled_to`, `influenced`) carries
a `confidence` score and an `evidence_source` URL. See
[languagelineage.org/dataset](https://www.languagelineage.org/dataset) for the
full schema, counts, and an interactive view.

## Provenance

Facts are compiled from structured sources — Wikidata, official language and
compiler documentation, and primary sources — and synthesized into the
dataset's own schema, not copied from any single source's prose. Each
relationship is independently cited via its `evidence_source` field so a
claim can be checked against the source that supports it.

## License

This dataset is licensed under the
[Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)
(CC BY 4.0). You may share and adapt the data for any purpose, provided you
give appropriate credit and indicate whether changes were made. See
[LICENSE](./LICENSE) for the full notice.

The dataset's source code (the site, the generator scripts, this repository)
is separately licensed under MIT — see the [root LICENSE](../LICENSE).

## Citation

Suggested citation:

```
Language Lineage. Programming Language Lineage Dataset, v5.0. 152 nodes and 443 relationships. Accessed 2026. https://www.languagelineage.org/dataset
```
