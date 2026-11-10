# Dataset release: owner steps

Everything below needs the owner: it publishes to third-party services. The files are generated and tested in the repo (`scripts/generateDatasetRelease.ts`, `scripts/datasetRelease.test.ts`); do not edit the CSVs or the data card by hand.

## What is ready

| File | Purpose |
|---|---|
| `dataset/v5/lineage_v5.json` | Canonical source |
| `dataset/v5/lineage_v5_edges.csv`, `lineage_v5_nodes.csv` | CSV copies for Kaggle, Hugging Face, spreadsheets |
| `dataset/v5/DATACARD.md` | Data card with Hugging Face front matter (license, configs, tags) |
| `CITATION.cff` | Citation metadata; GitHub shows a "Cite this repository" button, Zenodo reads it |

## Order

1. **Fix known data issues first** (WP-03: the unsupported `C → Rust` compiler edge). A DOI freezes a version; publish a corrected one.
2. **GitHub release + Zenodo DOI.**
   - [ ] Log in to zenodo.org with GitHub, enable the `sanketmuchhala/LanguageLineage` repository under GitHub settings in Zenodo.
   - [ ] Create a GitHub release tagged `dataset-v5.0` from `main`. Zenodo archives it and mints a DOI.
   - [ ] Add the DOI to `CITATION.cff` (`doi:` field) and to the data card's citation line in `scripts/generateDatasetRelease.ts`, in a PR. The test that forbids a DOI in `CITATION.cff` must be updated in the same PR, since a real DOI then exists.
3. **Hugging Face.**
   - [ ] Create dataset repo `languagelineage/programming-language-lineage` (or under the owner's account).
   - [ ] Upload `DATACARD.md` as `README.md`, plus both CSVs and the JSON.
4. **Kaggle (optional).**
   - [ ] New dataset with both CSVs and the JSON; paste the data card body as the description; license CC BY 4.0.
   - [ ] Optional starter notebook: counts by relationship type, which languages implement the most others.
5. Record each published URL in [OUTREACH_TRACKER.md](OUTREACH_TRACKER.md) (rows 11–13) and the plan's measurement table (dataset downloads).

## Keeping copies in sync

Re-upload the generated files after each dataset change, and create a new tagged release (Zenodo mints a new version DOI under the same concept DOI). Never edit a CSV on Hugging Face or Kaggle directly.
