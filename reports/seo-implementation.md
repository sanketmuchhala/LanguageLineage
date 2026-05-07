# SEO Implementation Report

## Audit Date: 2026-05-07

---

## URLs Audited

| URL | Type | Raw HTML crawlable? | H1 | Title | Description | Canonical | JSON-LD | Result |
|---|---|---|---|---|---|---|---|---|
| `/` | SPA | ✓ (via JS render) | via react-helmet-async | ✓ unique | ✓ 155 chars | ✓ via react-helmet-async | ✓ WebSite + Dataset | PASS |
| `/explore` | SPA | JS only | via react-helmet-async | ✓ unique | ✓ unique | ✓ via react-helmet-async | — | PASS |
| `/dataset` | Static HTML | ✓ | ✓ | ✓ unique | ✓ | ✓ | ✓ Dataset schema | PASS |
| `/languages/python` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 87 chars | ✓ | ✓ TechArticle + FAQPage + BreadcrumbList | PASS |
| `/languages/javascript` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 91 chars | ✓ | ✓ | PASS |
| `/languages/rust` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 95 chars | ✓ | ✓ | PASS |
| `/languages/go` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 90 chars | ✓ | ✓ | PASS |
| `/languages/java` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 88 chars | ✓ | ✓ | PASS |
| `/languages/c` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 82 chars | ✓ | ✓ | PASS |
| `/languages/cxx` | Static HTML | ✓ | ✓ | ✓ unique | ✓ 86 chars | ✓ | ✓ | PASS |
| `/tools/v8` | Static HTML | ✓ | ✓ | ✓ unique | ✓ | ✓ | ✓ | PASS |
| `/tools/llvm` | Static HTML | ✓ | ✓ | ✓ unique | ✓ | ✓ | ✓ | PASS |
| `/guides/what-is-compiler-bootstrapping` | Static HTML | ✓ | ✓ | ✓ unique | ✓ | ✓ | ✓ | PASS |
| `/robots.txt` | Plain text | ✓ (not SPA HTML) | — | — | — | — | — | PASS |
| `/sitemap.xml` | XML | ✓ (not SPA HTML) | — | — | — | — | — | PASS |
| `/llms.txt` | Plain text | ✓ (not SPA HTML) | — | — | — | — | — | PASS |
| `/manifest.json` | JSON | ✓ (not SPA HTML) | — | — | — | — | — | PASS |

---

## Issues Found and Fixed

### Issue 1: Grammar bugs in answer boxes (85 pages affected)

**Before:**
```
Its runtime is well-documented implemented in C.
The Rust compiler is documented written in C and OCaml and Rust and LLVM.
```

**Root cause:** `confidenceLabel()` returned adjectives ("well-documented", "documented", "reported") placed inline in verb phrases where adverbs were grammatically required.

**Fix:** Renamed to `confidenceNote()`, moved to parenthetical after the fact:
```
Its runtime is implemented in C (well-documented).
The Rust compiler is written in C, OCaml, Rust, and LLVM (documented).
```

**Files changed:** `scripts/generateSeoPages.ts` lines 41–52, regenerated all 112 language/tool pages.

---

### Issue 2: Oxford comma missing in multi-item lists (answer boxes)

**Before:**
```
The Rust compiler is written in C and OCaml and Rust and LLVM
```

**Fix:** Added `joinNames()` helper using Oxford comma:
```
The Rust compiler is written in C, OCaml, Rust, and LLVM
```

---

### Issue 3: Guide description over 160 chars

**Before (165 chars):**
```
CPython, the reference Python implementation, is written in C. PyPy is written in RPython. Learn how Python interpreters work and which language they are written in.
```

**After (148 chars):**
```
CPython is the reference Python implementation, written in C. PyPy uses RPython. Learn how Python interpreters work and what language each is written in.
```

---

### Issue 4: Wrong canonical in base `index.html`

**Before:** `index.html` had `<link rel="canonical" href="https://languagelineage.org/" />`. Googlebot fetching `/explore` would see this canonical pointing to `/` — telling Google `/explore` is a duplicate of the homepage.

**Fix:** Removed the static canonical from `index.html`. `react-helmet-async` already sets the correct per-route canonical for each SPA route (`LandingPageWrapper` → `/`, `GraphExplorerWrapper` → `/explore`).

---

## Static Files Verification

| File | Content | First bytes | SPA HTML? |
|---|---|---|---|
| `robots.txt` | `User-agent: *\nAllow: /...` | Plain text | No |
| `sitemap.xml` | `<?xml version="1.0"...` | XML | No |
| `llms.txt` | `# Language Lineage...` | Markdown text | No |
| `manifest.json` | `{ "name": "Language Lineage"...` | JSON | No |

---

## Duplicate Title Check

- 120 language/tool/guide pages checked
- 120 unique titles (0 duplicates)

---

## URL Notes

- C++ is at `/languages/cxx` (matching dataset ID `lang:cxx`). No alias needed — the canonical slug is `cxx`.
- `/embed` is not in sitemap (internal graph service route).
- `/explore` is in sitemap but returns SPA HTML — Googlebot renders JS to get content.

---

## Validation Output (post-fix)

```
Validation complete: 0 errors, 0 warnings
```
