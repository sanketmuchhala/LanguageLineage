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
- Everything under `public/languages/`, `public/tools/`, `public/questions/`, `public/guides/`, `public/relationships/`, `public/timeline/`, `public/sitemap.xml`, and `public/llms.txt` is generated output. Never hand-edit these files. Edit the generator scripts in `scripts/`, then run `npm run seo:generate`.
- Always run `npm run type-check`, `npm run seo:validate`, and `npm run build` before committing.

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
npm run build             # must pass (Cytoscape chunk-size warning is expected)
```
