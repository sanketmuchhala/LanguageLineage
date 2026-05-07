# SEO Audit — languagelineage.org

**Audited:** 2026-05-07
**Live site:** https://languagelineage.org
**Codebase:** /Users/sanketmuchhala/Documents/GitHub/ProgrammingLanguageGraph

---

## 1. Raw HTML — What the Crawler Actually Sees

The live site serves a **pure SPA shell**. Every route (including `/` and `/explore`) returns the same HTML document:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:...&display=swap" rel="stylesheet" />
    <title>Language Lineage — The Evolution of Programming</title>
    <meta name="description" content="Explore the fascinating family tree of programming languages. Discover how languages influenced each other and trace the evolution of code from 1940 to today." />
    <script type="module" crossorigin src="/assets/index-Dslf67GI.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/cytoscape-vendor-06Bo7EW_.js">
    <link rel="modulepreload" crossorigin href="/assets/react-vendor-VmheXRjq.js">
    <link rel="stylesheet" crossorigin href="/assets/index-EsiFOUlg.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

**The body is a single empty `<div id="root"></div>`.** No text content, no headings, no language names are visible without JavaScript.

---

## 2. Head Tag Extraction (Raw HTML)

### From `index.html` (source) and the live dist build — identical content

| Tag | Value |
|-----|-------|
| `<title>` | `Language Lineage — The Evolution of Programming` |
| `<meta name="description">` | `Explore the fascinating family tree of programming languages. Discover how languages influenced each other and trace the evolution of code from 1940 to today.` |
| `<meta charset>` | `UTF-8` |
| `<meta name="viewport">` | `width=device-width, initial-scale=1.0` |
| `<link rel="icon">` | `/favicon.svg` (type `image/svg+xml`) |
| `<link rel="canonical">` | **MISSING** |
| `og:title` | **MISSING** |
| `og:description` | **MISSING** |
| `og:image` | **MISSING** |
| `og:url` | **MISSING** |
| `og:type` | **MISSING** |
| `twitter:card` | **MISSING** |
| `twitter:title` | **MISSING** |
| `twitter:description` | **MISSING** |
| `twitter:image` | **MISSING** |
| JSON-LD (`application/ld+json`) | **MISSING** |

### H1/H2/H3 structure in raw HTML
**None.** All heading structure is injected by React at runtime. A crawler with no JS sees zero headings.

The heading structure that exists in `LandingPage.tsx` (only rendered post-JS):

| Tag | Text |
|-----|------|
| `h1` | "The Family Tree / of Programming" |
| `h2` | "Mapping the Invisible Connections" |
| `h2` | "Explore History, Interactively" |
| `h2` | "Context Changes Everything" |
| `h2` | "Ready to Explore?" |
| `h3` | "Interactive Graph" |
| `h3` | "Timeline View" |
| `h3` | "Multiple Layouts" |
| `h3` | "Deep Filtering" |
| `h4` | "Learn Faster" |
| `h4` | "Choose Wisely" |
| `h4` | "Appreciate Craft" |

---

## 3. Live URL Inventory

### Fetched URLs

| URL | HTTP Result | Notes |
|-----|-------------|-------|
| `https://languagelineage.org` | 200 | Serves SPA shell |
| `https://languagelineage.org/explore` | 200 | Same SPA shell (Vercel rewrite) |
| `https://languagelineage.org/sitemap.xml` | Not found / SPA shell | Vercel catch-all returns the SPA HTML |
| `https://languagelineage.org/robots.txt` | Not found / SPA shell | Vercel catch-all returns the SPA HTML |
| `https://languagelineage.org/llms.txt` | Not found / SPA shell | Vercel catch-all returns the SPA HTML |
| `https://languagelineage.org/manifest.json` | Not found / SPA shell | Vercel catch-all returns the SPA HTML |
| `https://languagelineage.org/favicon.svg` | 200 — file served | SVG icon exists and is served |

**Root cause of missing files:** `vercel.json` contains a single catch-all rewrite:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
This means every request — including `/robots.txt`, `/sitemap.xml`, `/manifest.json` — is rewritten to `index.html`. Static files in `public/` must be placed before the rewrite rule, but only `favicon.svg` exists in `public/`.

### `favicon.svg` — actual content

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="6" fill="#0d1117"/>
  <text x="16" y="22" font-family="Georgia, serif" font-size="15" font-weight="700"
        fill="#c9a87c" text-anchor="middle" letter-spacing="0.5">LL</text>
</svg>
```

---

## 4. Routes

Defined in `src/app/App.tsx` using React Router:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPageWrapper` -> `LandingPage` | Marketing/landing page |
| `/explore` | `GraphExplorer` | Interactive Cytoscape.js graph |

No other routes. No 404 route defined. All unknown paths fall through to the Vercel rewrite -> `index.html` -> React Router renders nothing (no `<Route path="*">`).

---

## 5. LandingPage Sections and IDs

Sections in `src/ui/LandingPage.tsx`:

| Element | ID / Anchor | Content |
|---------|-------------|---------|
| `<nav>` | — | Logo "LL Language Lineage", nav links |
| `<section class="hero">` | — | H1, subtitle, "Explore the Graph" CTA button |
| `<section class="stats-bar">` | — | Stats: 150+ languages, 500+ relationships, 1940-2024 |
| `<section id="about">` | `#about` | H2, two paragraphs, ASCII-art-style lineage card |
| `<section id="explore">` | `#explore` | H2 "Explore History, Interactively", 4 feature cards |
| `<section id="why">` | `#why` | H2 "Context Changes Everything", 3 why-points |
| `<section class="cta-section">` | — | H2 "Ready to Explore?", CTA button |
| `<footer>` | — | Logo, GitHub link, copyright note |

**Note:** Stats on landing page (`150+ Languages`, `500+ Relationships`) are inflated vs. actual dataset (112 languages, 300 relationships per v4 data and CLAUDE.md). This is a content accuracy issue.

---

## 6. SEO Files Inventory

| File | Status | Detail |
|------|--------|--------|
| `public/sitemap.xml` | **MISSING** | Not in `public/`, not in project root |
| `public/robots.txt` | **MISSING** | Not in `public/`, not in project root |
| `public/manifest.json` | **MISSING** | No PWA manifest anywhere |
| `public/humans.txt` | **MISSING** | Not present |
| `public/llms.txt` | **MISSING** | Not present |
| `public/favicon.svg` | **EXISTS** | 32x32 SVG, dark background + "LL" gold text |
| `og:image` | **MISSING** | No OG image URL in any HTML. No image file in `public/`. |

---

## 7. Crawlability Analysis

### Is this a pure SPA with empty HTML shell?
**Yes, completely.** The raw HTML body is:
```html
<body>
  <div id="root"></div>
</body>
```

No text content, no headings, no language names, no relationships are present in the HTML delivered to a crawler.

### Does meaningful text content appear in raw HTML?
**No.** The only text visible without JavaScript is the page title in `<title>` and the meta description. All of the following require JS execution:

- H1 heading
- Navigation links ("About", "Explore", "Why")
- Stats bar (150+ languages, 500+ relationships)
- All section headings and body text
- The demo SVG graph showing ALGOL, B, C, C++, Java, Python, Rust, Go
- Feature descriptions
- Footer

### Is the graph data (language names, relationships) visible to crawlers?
**No.** The 112 language names and 300 relationships are in `/dataset/v4/lineage_v4.json` (182 KB), which is fetched client-side after JS initializes. Googlebot can execute JavaScript, but this takes multiple render cycles and is not guaranteed. Other crawlers (Bing, DuckDuckGo, AI crawlers, social preview bots) receive only the empty shell.

### Social preview bots (Facebook, Twitter/X, LinkedIn, Slack, Discord)
These bots **do not execute JavaScript**. Every link shared from `languagelineage.org` will render:
- No preview image (og:image missing)
- Title: "Language Lineage — The Evolution of Programming" (from `<title>`)
- No description (og:description missing — falls back to empty or nothing)

---

## 8. Technical SEO Risks

### Risk 1: CRITICAL — No Open Graph or Twitter Card tags
**Impact:** Every social share on Twitter/X, LinkedIn, Facebook, Slack, Discord shows no preview image and no description. The `<title>` tag may appear as the link title but with no visual card.

**Missing tags that need to be added to `index.html`:**
```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Language Lineage — The Evolution of Programming" />
<meta property="og:description" content="..." />
<meta property="og:url" content="https://languagelineage.org" />
<meta property="og:image" content="https://languagelineage.org/og-image.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```

---

### Risk 2: CRITICAL — No canonical URL tag
**Impact:** Google may canonicalize `https://languagelineage.org/` differently from `https://languagelineage.org` (trailing slash). Vercel rewrites also mean `/explore`, `/sitemap.xml`, and all 404s serve the same HTML — Google could treat them as duplicate content.

**Missing:**
```html
<link rel="canonical" href="https://languagelineage.org/" />
```

---

### Risk 3: HIGH — No sitemap.xml
**Impact:** Google cannot discover pages systematically. With only 2 routes (`/` and `/explore`), a sitemap is not complex but is still a signal.

**Fix:** Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://languagelineage.org/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://languagelineage.org/explore</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

### Risk 4: HIGH — No robots.txt
**Impact:** Crawlers have no guidance. Vercel's catch-all rewrite means `/robots.txt` serves `index.html` (HTML, not plain text), which all crawlers will reject/ignore.

**Fix:** Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://languagelineage.org/sitemap.xml
```

---

### Risk 5: HIGH — Client-side rendering — no indexable content
**Impact:** Google can eventually index JS-rendered content, but it takes days to weeks longer than static HTML, and there is no guarantee of full fidelity. Bing, DuckDuckGo, and AI crawlers (GPTBot, ClaudeBot, PerplexityBot) index far less JS-rendered content.

The entire value proposition of the site — 112 languages, their names, relationships, paradigms — is invisible to crawlers.

**Options (in order of effort):**
1. **Prerender landing page only** using `vite-plugin-prerender` or `@prerenderer/renderer-puppeteer`. Low risk, solves the landing page problem.
2. **Static landing page** — convert `LandingPage.tsx` content into static HTML in `index.html`. Highest impact, least complexity.
3. **Full SSR/SSG** with Vite SSR or migrating to Next.js/Remix. High effort, likely overkill for 2 routes.

---

### Risk 6: MEDIUM — Duplicate title on all routes
**Impact:** `/` and `/explore` share the exact same `<title>` tag and meta description. Google sees both routes as duplicates.

**The `/explore` route needs a distinct title:**
- Suggested: `"Explore the Graph — Language Lineage"`

This requires dynamic title setting via `document.title = ...` in the `GraphExplorer` component's `useEffect`, or adding `react-helmet-async`.

---

### Risk 7: MEDIUM — No structured data (JSON-LD)
**Impact:** No rich snippets in search results. A `WebSite` schema with a `SearchAction` would let Google show a sitelinks search box. A `Dataset` schema would be appropriate for the language dataset.

**Minimum recommended:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Language Lineage",
  "url": "https://languagelineage.org",
  "description": "Interactive visualization of programming language lineage and influence",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://languagelineage.org/explore?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

### Risk 8: MEDIUM — No PWA manifest
**Impact:** The site cannot be installed as a PWA. Modern browsers show an "Add to Home Screen" prompt only with a valid manifest. Missing on all routes.

---

### Risk 9: MEDIUM — Bundle size
**Impact:** Core Web Vitals / LCP penalty.

| Asset | Raw size | Gzipped |
|-------|----------|---------|
| `cytoscape-vendor-*.js` | 508 KB | 158 KB |
| `react-vendor-*.js` | 138 KB | 44 KB |
| `index-*.js` (app code) | 105 KB | 32 KB |
| `index-*.css` | 34 KB | 7 KB |
| **JS total** | **751 KB** | **234 KB** |
| `lineage_v4.json` (data) | 178 KB | (not gzip-measured) |

The Cytoscape chunk (508 KB raw, 158 KB gzip) is loaded on **every page** including the landing page, where no graph is rendered. Splitting the graph bundle to load only on `/explore` would save ~158 KB gzip on the landing page LCP path.

The dataset JSON (178 KB) is also fetched on every page on App mount, even when the user is on the landing page.

---

### Risk 10: LOW — Vercel catch-all rewrite defeats static file serving for some paths
**Impact:** Any static file that does not exist in `public/` before the rewrite runs will serve `index.html` instead of a proper 404 or the file content. This is why `sitemap.xml` and `robots.txt` currently 404 with HTML content.

**Fix:** Files placed in `public/` are served directly by Vercel before rewrites are evaluated. All static SEO files (`robots.txt`, `sitemap.xml`, `manifest.json`, `og-image.png`) must live in `public/`.

---

### Risk 11: LOW — No 404 route in React Router
**Impact:** Any typo URL (e.g., `languagelineage.org/about`) is rewritten by Vercel to `index.html`, React Router finds no matching route, and renders nothing. The page appears blank with a 200 status.

**Fix:** Add `<Route path="*" element={<NotFound />} />` in `App.tsx`.

---

### Risk 12: LOW — No `llms.txt`
**Impact:** LLM crawlers (GPTBot, ClaudeBot, Perplexity) have no structured hint about what the site contains or what content is available for training/retrieval.

---

### Risk 13: LOW — Stats page content mismatch
**Impact:** Landing page claims "150+ Languages Mapped" and "500+ Relationships", but the actual dataset has 112 languages and 300 relationships. Misleading to users and technically inaccurate.

---

### Risk 14: LOW — Google Fonts dependency at render time
**Impact:** Two preconnect tags (`fonts.googleapis.com`, `fonts.gstatic.com`) and a render-blocking CSS import from Google Fonts. This adds a cross-origin request to the critical render path. Self-hosting fonts or using `font-display: swap` + `rel="preload"` would improve LCP.

---

## 9. Summary Table

| Issue | Severity | Fix Complexity |
|-------|----------|---------------|
| No og:title / og:description / og:image / og:url | CRITICAL | Low — add tags to `index.html` |
| No twitter:card tags | CRITICAL | Low — add tags to `index.html` |
| No canonical URL | CRITICAL | Low — add `<link rel="canonical">` |
| No sitemap.xml | HIGH | Low — create `public/sitemap.xml` |
| No robots.txt | HIGH | Low — create `public/robots.txt` |
| Pure CSR — no crawlable content | HIGH | Medium-High — prerender or static |
| Duplicate title/meta on all routes | MEDIUM | Low — set `document.title` in useEffect |
| No JSON-LD structured data | MEDIUM | Low — add `<script type="application/ld+json">` |
| No PWA manifest | MEDIUM | Low — create `public/manifest.json` |
| Cytoscape loaded on landing page | MEDIUM | Medium — code-split the graph chunk |
| Dataset fetched on landing page | MEDIUM | Medium — defer data load to /explore |
| No 404 route | LOW | Low — add `<Route path="*">` |
| No llms.txt | LOW | Low — create `public/llms.txt` |
| Stats mismatch (150+ vs 112) | LOW | Low — update landing page copy |
| Google Fonts blocking render | LOW | Low-Medium — self-host or preload |

---

## 10. Quick Wins (can be done in one session)

These are all changes to `index.html` or new files in `public/` — no code changes needed:

1. Add `<link rel="canonical" href="https://languagelineage.org/" />` to `index.html`
2. Add all Open Graph tags to `index.html`
3. Add all Twitter Card tags to `index.html`
4. Create `public/robots.txt`
5. Create `public/sitemap.xml`
6. Create an OG image (1200x630 PNG) and put it in `public/og-image.png`
7. Create `public/manifest.json` for PWA installability
8. Add JSON-LD `WebSite` schema to `index.html`
