# Launch checklist

Human-owned. Claude prepares drafts; the owner rewrites them in their own voice, approves, posts, and stays in the discussion. Draft sources: [research/deep-research-report.md](../../research/deep-research-report.md) §"Launch playbook". No vote coordination anywhere.

## Readiness gates (all required before the first post)

- [ ] `growth/research-execution` reviewed, merged by the owner, deployed; live `/` shows the static fallback with JS disabled.
- [ ] WP-03 data review done (Rust `c → rust` edge, Swift context): the first comments on HN will test exactly these edges.
- [ ] `npm run check:evidence-links` clean on the deployed dataset.
- [ ] Analytics confirmed: a visit to `/languages/go` with a referrer shows in Vercel Analytics.
- [ ] Referring-domain baseline recorded from a real source (plan §8).
- [ ] Screenshots taken: homepage hero, `/explore` with Rust selected, family-tree self-hosting table. Poster (WP-08) if ready.
- [ ] Owner has a 3–4 hour block free after each post to answer comments.
- [ ] Check whether the September 2026 r/dataisbeautiful post linking the site was the owner's; if so, do not repost the same visual there.

## Sequence (one event per day or more apart)

| Day | Venue | Link to | Angle | Fresh rule check on the day |
|---|---|---|---|---|
| 1 (Thu, ~11:00–12:00 ET) | Show HN | `https://www.languagelineage.org/` | Implementation vs influence; corrections welcome | HN Show guidelines; no generated text; no vote requests |
| 3 | r/ProgrammingLanguages | homepage + dataset | Taxonomy feedback: is the relationship split precise? | sidebar rules, self-promo ratio, AI-text policy |
| 5 | r/compilers | family-tree guide `#compilers-that-learned-to-compile-themselves` | Bootstrap transitions, ask for primary sources | sidebar rules |
| 7 | r/programming | homepage | Concrete resource; one surprising chain | rules on self-promotion and link posts |
| 9 | X thread (6 posts) | homepage | Lead image + one chain per post | — |
| 10+ | r/dataisbeautiful | poster page (only with WP-08 done) | Original visual, methodology in comment, `[OC]` | OC rules, prior-post check |
| 10+ | Lobsters | homepage | Only if the owner has an account/invite; tags `compilers`, `visualization` | posting norms |
| after HN | Newsletters (see OUTREACH_TRACKER) | specific artifact | one visual + one finding | each submission route |

## Draft: Show HN (rewrite before posting)

**Title:** Show HN: Language Lineage – a cited graph of what programming languages are written in

**First comment (outline, not final text):**
1. Why: "what influenced X?" and "what is X's compiler written in?" get mixed up.
2. What: both relationships, kept separate; every edge has a source; dated changes such as Rust's OCaml-era compiler and Go before 1.5.
3. Scope: 172 languages and tools, 492 relationships, open dataset (CC BY 4.0), embeddable graph. Re-check counts on the day.
4. Ask: corrections from compiler and PL people, especially better primary sources.
5. Links: graph, family-tree guide table, GitHub repo.

## Draft angles: Reddit (one per community, different visual each)

- **r/ProgrammingLanguages:** "Mapping implementation lineage separately from language influence" — ask whether the six edge types are precise enough.
- **r/compilers:** "Dated compiler self-hosting transitions for ~170 languages and tools" — link the table, ask for corrections.
- **r/programming:** "An interactive, cited graph of what programming languages are written in" — lead with one surprising chain.
- **r/dataisbeautiful:** only with the poster; include methodology and source.

## Draft: X thread outline (6 posts)

1. Hook + image: what languages are actually written in, not what they compile to.
2. Bootstrapping: how does a compiler written in its own language get built?
3. Four kinds of relationship, and why mixing them makes misleading family trees.
4. Dataset size, every edge sourced, open data link.
5. Favorite view: trace a modern language back to C or assembly.
6. Ask for corrections, with the link.

## During and after each post

- [ ] Reply to technical comments within the first hours; thank and log every correction.
- [ ] Log each correction as a GitHub issue labeled `correction`; fix through a data PR with a verified source.
- [ ] Note traffic from Vercel Analytics referrers per venue (launch spikes go in their own row of the plan's §8 table, not the organic baseline).
- [ ] Do not argue with moderators; if a post is removed, read the reason and do not repost elsewhere the same day.
- [ ] Update [OUTREACH_TRACKER.md](OUTREACH_TRACKER.md) and [WORKLOG.md](WORKLOG.md) with what actually happened.
