# Distribution and contributions

Two things this repo needs a human to do, plus the checklist for actually
putting the site in front of people.

## Setup required before the correction form works

`api/propose.ts` opens a GitHub issue for each correction submitted from a
language or tool page. Until the token exists it answers `503` and the form
shows a polite failure, so shipping without this is safe, just inert.

| Env var | Required | What to set it to |
|---|---|---|
| `GITHUB_TOKEN` | Yes | A fine-grained personal access token scoped to **only** `sanketmuchhala/LanguageLineage`, with **Issues: read and write** and nothing else. Add it in Vercel under Settings, Environment Variables, for Production and Preview. |
| `TURNSTILE_SECRET_KEY` | No | Cloudflare Turnstile secret. If unset, the endpoint falls back to the honeypot and per-instance rate limit. Add it if spam appears. |

The rate limit is best-effort: serverless instances do not share memory, so it
throttles one hot instance rather than the whole deployment. Turnstile is the
real gate if it ever matters.

### Verify on a preview deploy, not locally

`vercel dev` hangs on this project when it is not linked, so the API route was
not verifiable on a laptop. On the first preview deploy, check:

1. `GET /api/propose` returns **405** (not the SPA shell). If it returns HTML,
   the catch-all rewrite in `vercel.json` is swallowing `/api/*`; add a
   passthrough rewrite for `/api/(.*)` ahead of it.
2. `POST /api/propose` with no `GITHUB_TOKEN` returns **503**.
3. With the token set, submitting the form on `/languages/rust` creates an
   issue labelled `correction` and `from-website`.
4. Submit four times in a row from one browser; the fourth should be rejected.

Also confirm on that deploy that `/_vercel/insights/script.js` returns
JavaScript rather than the SPA shell, and that a hit on `/languages/go` shows
up in Vercel Analytics with a referrer.

## Launch checklist

The site has run 16 months on organic search alone and collected 60 clicks.
Nothing here has ever been deliberately distributed. Do this only after the
analytics work is deployed, so the traffic is actually measurable.

Lead with the graph and the dataset. The SEO pages are not the interesting
part and posting them reads as spam.

- [ ] **Hacker News, Show HN.** Title along the lines of "Show HN: An atlas of
      what programming languages are actually written in". Link the homepage,
      not a language page. Post Tuesday to Thursday, roughly 9-11am Eastern.
      Be in the thread to answer questions; that matters more than the title.
- [ ] **r/programming.** Link the family tree guide or `/explore`. The dataset
      angle plays better here than the SEO angle.
- [ ] **r/compilers.** Narrower and more receptive: lead with the bootstrap
      chains and the `bootstrap_written_in` edges.
- [ ] **Lobsters.** Tag `compilers`, `visualization`. Needs an invite.
- [ ] **Language-specific subreddits** (r/rust, r/golang, r/python). Post the
      single relevant language page, not the whole site, and only where the
      page is genuinely good.
- [ ] **The embed.** `/embed-kit` exists so other people can host the graph.
      That is the durable win: an embed on someone's blog is both a backlink
      and a referral path. Worth mentioning wherever the graph gets traction.

Track each one. Vercel Analytics now covers the static pages, so referrers
from these posts will actually be attributable, which was not true before.

## What to expect

Real human traffic is roughly 1-3 search visits a day. The 141-visitor day on
2026-08-26 was automated: 119 of those went straight to `/explore` with no
referrer, 77% on Linux, 99% desktop. Do not use it as a baseline.
