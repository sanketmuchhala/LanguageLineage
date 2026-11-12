# CLAUDE.md

**Read `AGENTS.md` first. It is the contract for every agent working in this
repository, and it is kept current.** This file exists so Claude Code picks up
the same rules automatically; it does not restate them, to stop the two files
drifting apart.

`AGENTS.md` covers: the commands, the eleven hard rules, multi-agent worktree
discipline, `HUMAN-ONLY` protected zones, the pre-deploy preflight, pull request
expectations, and the known traps. It links to `docs/DATASET.md` (how to change
data), `docs/ARCHITECTURE.md` (the code map and invariants), `docs/TESTING.md`
(the gate and what each test protects), and `docs/DECISIONS.md` (settled
questions).

The six rules worth repeating here, because breaking one is expensive:

1. Run the gate before opening a PR: `npm run verify`.
2. Never delete or skip a test, and never disable validation, to get a green run.
3. Never edit an existing `evidence_source` or `confidence` value, and never
   modify any `<!-- HUMAN-ONLY:START -->` … `<!-- HUMAN-ONLY:END -->` block.
   Verify every citation you add by fetching it and reading the claim.
4. Never hand-edit generated files under `public/` or generated dataset release
   artifacts (`dataset/v5/*.csv`, `dataset/v5/DATACARD.md`,
   `dataset/v5/MANIFEST.json`). Edit the generator in `scripts/`, then run
   `npm run seo:generate`.
5. **Surgical scope:** touch only the files directly needed for your task. Never
   modify unrelated files or touch another agent's git worktree.
6. Always rebase onto `origin/main` and re-run `npm run seo:generate` +
   `npm run verify` before opening or merging a PR.
