## Summary

<!-- State concisely what this PR changes and why. One concern per PR: do not mix dataset changes with generator/UI refactors unless required by a shared schema/manifest update. -->

## Surgical Scope & Multi-Agent Discipline

- [ ] **Minimal touch:** Only files directly necessary for this task were modified (`git diff --stat origin/main...HEAD` reviewed).
- [ ] **No `HUMAN-ONLY` edits:** No `<!-- HUMAN-ONLY:START -->` … `<!-- HUMAN-ONLY:END -->` block was altered.
- [ ] **Immutable curatorial fields preserved:** No existing `evidence_source` or `confidence` value in `dataset/v5/lineage_v5.json` was modified (propose corrections below instead).
- [ ] **Synced with `origin/main`:** Branch is rebased on latest `origin/main` and `npm run seo:generate` was run if dataset or generator files changed.

## Verification Gate (`npm run verify`)

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm test` passes (all test files and assertions pass; no skipped or deleted tests)
- [ ] `npm run seo:validate` passes (0 errors, 0 warnings)
- [ ] `npm run seo:links` passes (0 broken links, 0 over-depth pages, 0 orphans)
- [ ] `npm run build` succeeds

<details>
<summary>Paste <code>npm run verify</code> summary output</summary>

```text
Paste terminal output here
```
</details>

## Citations & Confidence Review (Required for `dataset/` changes)

<!-- If this PR adds edges to `dataset/v5/lineage_v5.json` or execution-path steps to `dataset/ai/*.json`, list every new citation and flag every new confidence score for human review. -->

| From → To / Step | Relationship / Kind | Proposed Confidence | Evidence URL | Verbatim Claim Verified? |
|---|---|---:|---|---|
| | | | | |

- [ ] For `dataset/ai/*.json` changes: `npm run check:ai-quotes` passed against live sources.
- [ ] Sitemap delta (`public/sitemap.xml`): `+0 / -0 URLs` (losing any live URL is a stop-work signal).
