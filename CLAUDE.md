# CLAUDE.md

**Read `AGENTS.md` first. It is the contract for every agent working in this
repository, and it is kept current.** This file exists so Claude Code picks up
the same rules automatically; it does not restate them, to stop the two files
drifting apart.

`AGENTS.md` covers: the commands, the ten hard rules, the pre-deploy preflight,
pull request expectations, and the known traps. It links to `docs/DATASET.md` (how to
change data), `docs/ARCHITECTURE.md` (the code map and invariants), `docs/TESTING.md` (the
gate and what each test protects), and `docs/DECISIONS.md` (settled questions).

The four rules worth repeating here, because breaking one is expensive:

1. Run the gate before opening a PR: `npm run verify`.
2. Never delete or skip a test, and never disable validation, to get a green run.
3. Never edit an existing `evidence_source` or `confidence` value. Verify every
   citation you add by fetching it and reading the claim.
4. Never hand-edit generated files under `public/`. Edit the generator in
   `scripts/`, then run `npm run seo:generate`.

Scope discipline: make only the change that was requested. No unrequested
refactors, no renaming for clarity, no new abstractions for one-time use, no
added comments or documentation unless asked.
