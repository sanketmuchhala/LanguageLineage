# Agent Instructions

## Core Principles

Only make the changes explicitly requested. The SITE_IMPROVEMENT_PLAN.md at repo root is the canonical source of explicit requests for improvement phases.

### What not to do:
- Do not add features that were not asked for
- Do not refactor working code unless specifically requested
- Do not add comments or documentation unless asked
- Do not rename variables or functions for "clarity"
- Do not create abstractions or helpers for one-time use

### What to do:
- Read the request carefully and understand exactly what is needed
- Make only the specific changes requested
- Test that the changes work
- Keep the same coding style as existing code
- If unclear, ask for clarification before making changes

## Project-Specific Rules

### This is a graph visualization and SEO content site
- Node sizing is degree-based (not fixed size). Do not change this.
- Do not change the dataset schema or field names. Adding nodes or edges is fine.
- Do not modify the design system (Section 1.6 of SITE_IMPROVEMENT_PLAN.md) without explicit approval.

### Static pages
- Everything under `public/languages/`, `public/tools/`, `public/questions/`, `public/guides/`, `public/relationships/`, `public/timeline/`, `public/embed-kit/`, `public/sitemap.xml`, and `public/llms.txt` is generated output. Never hand-edit these files. Edit the generator scripts in `scripts/`, then run `npm run seo:generate`. `public/seo.css` and `public/fx.js` are hand-maintained, not generated.
- The sitemap lists canonical URLs only. If you make a page canonicalize elsewhere, remove it from `scripts/generateSitemap.ts` too, or the sitemap will advertise a URL Google is told to ignore.
- Before changing a canonical or consolidating two pages, check `npm run gsc:analyze` first. Most `/languages/{slug}` and `/questions/what-is-{slug}-written-in` pairs are not competing: for roughly 85 slugs only one of the two ranks at all, and canonicalizing blindly removes the only indexed URL.
- Always run the full validation gate below before committing.

### When making UI changes:
- Keep it minimal and clean per the design system
- Respect `prefers-reduced-motion`
- Test at 320px, 390px, 768px, and 1440px widths

### When debugging:
- Fix only the specific bug reported
- Do not "clean up" surrounding code
- Do not add logging unless necessary

## Validation gate (run before every commit)

```
npm run type-check        # must pass
npm run seo:validate      # must report 0 errors, 0 warnings
npm run seo:links         # must report 0 broken, 0 over-depth, 0 orphans
npm run build             # must pass (Cytoscape chunk-size warning is expected)
```

`api/` is not covered by `npm run type-check`: `tsconfig.json` includes only
`src`, matching how `scripts/` is treated. Vercel compiles the functions on its
own side. To sanity-check one locally, run
`npx esbuild api/propose.ts --bundle --platform=node --format=esm --outfile=/dev/null`.

`vercel dev` hangs on this project, so API routes cannot be exercised locally.
Verify them on a preview deploy; the checks are listed in `DISTRIBUTION.md`.
