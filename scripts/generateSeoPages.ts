import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LOGO_MAP, LOGO_COLORS } from '../src/data/logoMap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DATASET_PATH = join(ROOT, 'dataset/v4/lineage_v4.json');
const SITE = 'https://languagelineage.org';

interface Language {
  id: string;
  name: string;
  first_release_year?: number | null;
  paradigm?: string[];
  typing?: string;
  cluster_hint?: string;
  notes?: string;
  self_hosting?: boolean;
}

interface Relationship {
  from_language: string;
  to_language: string;
  relationship: string;
  start_year?: number | null;
  end_year?: number | null;
  confidence: number;
  evidence_source?: string;
  notes?: string;
}

function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}

function idToPrefix(id: string): string {
  return id.startsWith('tool:') ? 'tools' : 'languages';
}

function confidenceNote(c: number): string {
  if (c >= 0.95) return ' (well-documented)';
  if (c >= 0.85) return ' (documented)';
  return ' (reported)';
}

function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function confidenceClass(c: number): string {
  if (c >= 0.9) return 'confidence-high';
  if (c >= 0.75) return 'confidence-mid';
  return 'confidence-low';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeFile(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

function nameFromId(id: string, nodeMap: Map<string, Language>): string {
  return nodeMap.get(id)?.name ?? id.replace(/^(lang|tool):/, '').replace(/_/g, ' ');
}

function linkNode(id: string, nodeMap: Map<string, Language>): string {
  const name = nameFromId(id, nodeMap);
  const prefix = idToPrefix(id);
  const slug = idToSlug(id);
  return `<a href="/${prefix}/${slug}">${escapeHtml(name)}</a>`;
}

const PRIORITY_TITLES: Record<string, { title: string; description: string }> = {
  python: {
    title: 'What is Python written in? CPython implementation explained | Language Lineage',
    description: "Python's reference implementation, CPython, is written in C. Explore its runtime, bootstrap history, and language lineage.",
  },
  javascript: {
    title: 'What is JavaScript written in? V8, SpiderMonkey, and JSC | Language Lineage',
    description: 'JavaScript engines V8, SpiderMonkey, and JavaScriptCore are primarily written in C++. Explore their implementations and lineage.',
  },
  rust: {
    title: 'What is Rust written in? rustc bootstrapping explained | Language Lineage',
    description: 'Modern Rust is self-hosting — rustc is written in Rust. Explore its OCaml origins, bootstrap chain, and LLVM backend.',
  },
  go: {
    title: 'What is Go written in? Go compiler lineage explained | Language Lineage',
    description: "Modern Go is self-hosting since Go 1.5. The original compiler was written in C. Explore Go's compiler evolution and lineage.",
  },
  java: {
    title: 'What is Java written in? javac and HotSpot explained | Language Lineage',
    description: "javac is self-hosting and written in Java. The HotSpot JVM is written in C++. Explore Java's compiler and runtime lineage.",
  },
  c: {
    title: 'What was C written in? C compiler lineage explained | Language Lineage',
    description: 'C bootstrapped from B in the early 1970s and became self-hosting within its first year. Explore its compiler history.',
  },
  cxx: {
    title: 'What is C++ written in? Cfront, GCC, LLVM, and Clang | Language Lineage',
    description: 'C++ was originally translated to C via Cfront. GCC and Clang/LLVM are the primary modern implementations, written in C++.',
  },
  ruby: {
    title: 'What is Ruby written in? CRuby and MRI explained | Language Lineage',
    description: "Ruby's reference implementation, CRuby (MRI), is written in C. Explore its runtime, influences, and lineage.",
  },
  typescript: {
    title: 'What is TypeScript written in? tsc compiler explained | Language Lineage',
    description: "TypeScript's compiler, tsc, is self-hosting and written in TypeScript. Explore its implementation and language lineage.",
  },
  v8: {
    title: "What is V8 written in? Google's JavaScript engine explained | Language Lineage",
    description: "Google's V8 JavaScript engine is written in C++. It powers Chrome, Node.js, and Deno. Explore its implementation.",
  },
  llvm: {
    title: 'What is LLVM written in? Compiler infrastructure explained | Language Lineage',
    description: 'LLVM is written in C++. It is a compiler infrastructure used by Clang, Rust, Swift, and many other languages.',
  },
  gcc: {
    title: 'What is GCC written in? GNU compiler collection explained | Language Lineage',
    description: 'GCC (GNU Compiler Collection) is written in C and C++. It compiles C, C++, Fortran, Ada, Go, and other languages.',
  },
  spidermonkey: {
    title: "What is SpiderMonkey written in? Mozilla's JS engine | Language Lineage",
    description: "SpiderMonkey is written in C++, Rust, and JavaScript. It is Mozilla's JavaScript engine powering Firefox.",
  },
  ghc: {
    title: 'What is GHC written in? Haskell compiler explained | Language Lineage',
    description: 'GHC (Glasgow Haskell Compiler) is self-hosting and written in Haskell with a C runtime. Explore its lineage.',
  },
};

function buildAnswerBox(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const implTypes = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in', 'rewritten_in']);
  const implRels = rels.filter(r => r.to_language === id && implTypes.has(r.relationship));

  if (implRels.length === 0) {
    return `<div class="answer-box">The Language Lineage dataset does not currently include compiler or runtime implementation relationships for <strong>${escapeHtml(node.name)}</strong>. It may appear in influence relationships with other languages.</div>`;
  }

  const parts: string[] = [];

  const compilerRels = implRels.filter(r => r.relationship === 'compiler_written_in');
  const runtimeRels = implRels.filter(r => r.relationship === 'runtime_written_in');
  const bootstrapRels = implRels.filter(r => r.relationship === 'bootstrap_written_in');
  const rewrittenRels = implRels.filter(r => r.relationship === 'rewritten_in');

  if (compilerRels.length > 0) {
    const names = compilerRels.map(r => nameFromId(r.from_language, nodeMap));
    const conf = Math.min(...compilerRels.map(r => r.confidence));
    parts.push(`The <strong>${escapeHtml(node.name)}</strong> compiler is written in <strong>${joinNames(names.map(escapeHtml))}</strong>${confidenceNote(conf)}.`);
  }

  if (runtimeRels.length > 0) {
    const names = runtimeRels.map(r => nameFromId(r.from_language, nodeMap));
    const conf = Math.min(...runtimeRels.map(r => r.confidence));
    parts.push(`Its runtime is implemented in <strong>${joinNames(names.map(escapeHtml))}</strong>${confidenceNote(conf)}.`);
  }

  if (bootstrapRels.length > 0) {
    const names = bootstrapRels.map(r => nameFromId(r.from_language, nodeMap));
    const conf = bootstrapRels[0].confidence;
    parts.push(`${escapeHtml(node.name)} uses a bootstrap chain from <strong>${joinNames(names.map(escapeHtml))}</strong>${confidenceNote(conf)}.`);
  }

  if (rewrittenRels.length > 0) {
    const names = rewrittenRels.map(r => nameFromId(r.from_language, nodeMap));
    parts.push(`It has been rewritten in <strong>${joinNames(names.map(escapeHtml))}</strong>.`);
  }

  if (node.self_hosting === true) {
    parts.push(`${escapeHtml(node.name)} is self-hosting.`);
  }

  return `<div class="answer-box">${parts.join(' ')}</div>`;
}

function buildMetaTags(node: Language): string {
  const tags: string[] = [];
  if (node.first_release_year) {
    tags.push(`<span class="meta-tag"><span class="meta-tag-label">Year</span> ${node.first_release_year}</span>`);
  }
  if (node.paradigm && node.paradigm.length > 0) {
    tags.push(`<span class="meta-tag"><span class="meta-tag-label">Paradigm</span> ${escapeHtml(node.paradigm.join(', '))}</span>`);
  }
  if (node.typing) {
    tags.push(`<span class="meta-tag"><span class="meta-tag-label">Typing</span> ${escapeHtml(node.typing)}</span>`);
  }
  if (node.self_hosting) {
    tags.push(`<span class="meta-tag"><span class="meta-tag-label">Self-hosting</span> yes</span>`);
  }
  return tags.length > 0 ? `<div class="node-meta">${tags.join('\n')}</div>` : '';
}

function buildImplSection(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const sections: string[] = [];

  const compilerRels = rels.filter(r => r.to_language === id && r.relationship === 'compiler_written_in');
  const runtimeRels = rels.filter(r => r.to_language === id && r.relationship === 'runtime_written_in');
  const bootstrapRels = rels.filter(r => r.to_language === id && r.relationship === 'bootstrap_written_in');
  const rewrittenRels = rels.filter(r => r.to_language === id && r.relationship === 'rewritten_in');
  const transpiledRels = rels.filter(r => (r.from_language === id || r.to_language === id) && r.relationship === 'transpiled_to');

  function relTable(title: string, relList: Relationship[]): string {
    if (relList.length === 0) return '';
    const rows = relList.map(r => {
      const implId = r.from_language === id ? r.to_language : r.from_language;
      const direction = r.from_language === id ? 'target' : 'implementation';
      const conf = r.confidence;
      return `<tr>
        <td>${linkNode(implId, nodeMap)}</td>
        <td class="${confidenceClass(conf)}">${(conf * 100).toFixed(0)}%</td>
        <td>${r.notes ? escapeHtml(r.notes) : ''}</td>
        <td>${r.evidence_source ? `<a href="${escapeHtml(r.evidence_source)}" rel="noopener noreferrer" target="_blank">Source</a>` : ''}</td>
      </tr>`;
    }).join('\n');
    return `<h2>${escapeHtml(title)}</h2>
<table>
  <thead><tr><th>Language</th><th>Confidence</th><th>Notes</th><th>Source</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
  }

  sections.push(relTable('Compiler Implementation', compilerRels));
  sections.push(relTable('Runtime Implementation', runtimeRels));
  sections.push(relTable('Bootstrap Chain', bootstrapRels));
  sections.push(relTable('Rewritten In', rewrittenRels));
  sections.push(relTable('Transpilation', transpiledRels));

  return sections.filter(Boolean).join('\n');
}

function buildInfluenceSection(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const influencedBy = rels.filter(r => r.to_language === id && r.relationship === 'influenced');
  const influenced = rels.filter(r => r.from_language === id && r.relationship === 'influenced');

  const parts: string[] = [];

  if (influencedBy.length > 0) {
    const items = influencedBy
      .sort((a, b) => b.confidence - a.confidence)
      .map(r => `<li>${linkNode(r.from_language, nodeMap)}${r.notes ? ` — ${escapeHtml(r.notes)}` : ''}</li>`)
      .join('\n');
    parts.push(`<h2>Influenced By</h2><ul>${items}</ul>`);
  }

  if (influenced.length > 0) {
    const items = influenced
      .sort((a, b) => b.confidence - a.confidence)
      .map(r => `<li>${linkNode(r.to_language, nodeMap)}${r.notes ? ` — ${escapeHtml(r.notes)}` : ''}</li>`)
      .join('\n');
    parts.push(`<h2>Languages ${escapeHtml(node.name)} Influenced</h2><ul>${items}</ul>`);
  }

  return parts.join('\n');
}

function buildFaqs(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): { q: string; a: string }[] {
  const id = node.id;
  const faqs: { q: string; a: string }[] = [];
  const implTypes = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);
  const implRels = rels.filter(r => r.to_language === id && implTypes.has(r.relationship));

  if (implRels.length > 0) {
    const names = [...new Set(implRels.map(r => nameFromId(r.from_language, nodeMap)))];
    faqs.push({
      q: `What language is ${node.name} written in?`,
      a: `${node.name} is primarily implemented in ${names.join(' and ')}. See the implementation section above for details and source references.`,
    });
  }

  const influencedBy = rels.filter(r => r.to_language === id && r.relationship === 'influenced');
  if (influencedBy.length > 0) {
    const names = influencedBy.slice(0, 3).map(r => nameFromId(r.from_language, nodeMap));
    faqs.push({
      q: `What languages influenced ${node.name}?`,
      a: `${node.name} was influenced by ${names.join(', ')} among others. See the influence section above for the full list.`,
    });
  }

  const influenced = rels.filter(r => r.from_language === id && r.relationship === 'influenced');
  if (influenced.length > 0) {
    const names = influenced.slice(0, 3).map(r => nameFromId(r.to_language, nodeMap));
    faqs.push({
      q: `Which languages did ${node.name} influence?`,
      a: `${node.name} influenced ${names.join(', ')} among others.`,
    });
  }

  if (node.self_hosting) {
    faqs.push({
      q: `Is ${node.name} self-hosting?`,
      a: `Yes, ${node.name} is self-hosting — its compiler can compile itself.`,
    });
  }

  return faqs;
}

function buildRelatedSection(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const seen = new Set<string>();
  const related: string[] = [];

  rels.forEach(r => {
    const other = r.from_language === id ? r.to_language : r.from_language;
    if (other !== id && !seen.has(other) && nodeMap.has(other)) {
      seen.add(other);
      related.push(other);
    }
  });

  if (related.length === 0) return '';

  const cards = related.slice(0, 12).map(rid => {
    const name = nameFromId(rid, nodeMap);
    const prefix = idToPrefix(rid);
    const slug = idToSlug(rid);
    return `<a href="/${prefix}/${slug}" class="related-card">${escapeHtml(name)}</a>`;
  }).join('\n');

  return `<h2>Related Languages</h2><div class="related-grid">${cards}</div>`;
}

function buildGraphSection(node: Language): string {
  const slug = idToSlug(node.id);
  return `<h2>Relationship Graph</h2>
<p style="font-size:13px;color:var(--text-tertiary);margin-bottom:12px">All directly connected languages. Click any node to navigate to its page.</p>
<iframe
  src="/embed?lang=${encodeURIComponent(slug)}"
  loading="lazy"
  width="100%"
  height="500"
  style="border:none;border-radius:12px;display:block;background:#0a0a0b"
  title="${node.name} relationship graph"
></iframe>`;
}

function buildSources(node: Language, rels: Relationship[]): string {
  const id = node.id;
  const sources = [...new Set(
    rels
      .filter(r => r.from_language === id || r.to_language === id)
      .map(r => r.evidence_source)
      .filter((s): s is string => !!s)
  )];

  if (sources.length === 0) return '';

  const items = sources.map(s => `<li><a href="${escapeHtml(s)}" rel="noopener noreferrer" target="_blank">${escapeHtml(s)}</a></li>`).join('\n');
  return `<h2>Evidence Sources</h2><ul class="source-list">${items}</ul>`;
}

function buildToolIntro(node: Language): string {
  if (!node.id.startsWith('tool:') || !node.notes) return '';
  const firstSentence = node.notes.split('.')[0].trim();
  if (!firstSentence) return '';
  return `<p class="tool-intro">${escapeHtml(firstSentence)}.</p>`;
}

function buildNodePage(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const prefix = idToPrefix(node.id);
  const slug = idToSlug(node.id);
  const url = `${SITE}/${prefix}/${slug}`;
  const priorityOverride = PRIORITY_TITLES[slug];
  const title = priorityOverride ? priorityOverride.title : `What is ${node.name} written in? | Language Lineage`;
  const implRels = rels.filter(r => r.to_language === node.id && ['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in'].includes(r.relationship));
  const implLangs = [...new Set(implRels.map(r => nameFromId(r.from_language, nodeMap)))];
  const descriptionBase = implLangs.length > 0
    ? `${node.name} is implemented in ${implLangs.slice(0, 2).join(' and ')}. Explore its compiler, runtime, and influence relationships.`
    : `Explore ${node.name}'s relationships, influences, and history in the Language Lineage graph.`;
  const description = (priorityOverride ? priorityOverride.description : descriptionBase).slice(0, 160);

  const faqs = buildFaqs(node, rels, nodeMap);
  const faqJsonLd = faqs.length > 0 ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }) : null;

  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `What is ${node.name} written in?`,
    description,
    url,
    author: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    about: {
      '@type': 'SoftwareApplication',
      name: node.name,
      ...(node.first_release_year ? { dateCreated: String(node.first_release_year) } : {}),
    },
  });

  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: prefix === 'tools' ? 'Tools' : 'Languages', item: `${SITE}/${prefix}` },
      { '@type': 'ListItem', position: 3, name: node.name, item: url },
    ],
  });

  const faqSection = faqs.length > 0 ? `
<h2>Frequently Asked Questions</h2>
${faqs.map(f => `<div class="faq-item">
  <div class="faq-question">${escapeHtml(f.q)}</div>
  <div class="faq-answer">${escapeHtml(f.a)}</div>
</div>`).join('\n')}` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <script type="application/ld+json">${articleJsonLd}</script>
  ${faqJsonLd ? `<script type="application/ld+json">${faqJsonLd}</script>` : ''}
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/${prefix}">${prefix === 'tools' ? 'Tools' : 'Languages'}</a> &rsaquo; ${escapeHtml(node.name)}
  </nav>

  <h1>What is ${escapeHtml(node.name)} written in?</h1>

  ${buildMetaTags(node)}

  ${buildToolIntro(node)}

  ${buildAnswerBox(node, rels, nodeMap)}

  ${buildGraphSection(node)}

  ${buildImplSection(node, rels, nodeMap)}

  ${buildInfluenceSection(node, rels, nodeMap)}

  ${faqSection}

  ${buildSources(node, rels)}

  ${buildRelatedSection(node, rels, nodeMap)}

  <a class="explore-btn" href="/explore?lang=${encodeURIComponent(idToSlug(node.id))}">Explore ${escapeHtml(node.name)} in Graph &rarr;</a>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

function buildDatasetPage(languages: Language[], rels: Relationship[]): string {
  const langCount = languages.filter(l => l.id.startsWith('lang:')).length;
  const toolCount = languages.filter(l => l.id.startsWith('tool:')).length;

  const relTypeCounts: Record<string, number> = {};
  rels.forEach(r => { relTypeCounts[r.relationship] = (relTypeCounts[r.relationship] || 0) + 1; });

  const relRows = Object.entries(relTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
    const label = type.replace(/_/g, ' ');
    return `<tr><td>${escapeHtml(label)}</td><td>${count}</td></tr>`;
  }).join('\n');

  const datasetJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Programming Language Lineage Dataset',
    description: `Structured dataset of ${languages.length} programming languages and tools with ${rels.length} documented implementation and influence relationships.`,
    url: `${SITE}/dataset`,
    creator: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    temporalCoverage: '1949/2023',
    variableMeasured: Object.keys(relTypeCounts),
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Lineage Dataset | Language Lineage</title>
  <meta name="description" content="Open dataset of ${languages.length} programming languages with ${rels.length} implementation and influence relationships, evidence sources, and confidence scores." />
  <link rel="canonical" href="${SITE}/dataset" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Lineage Dataset" />
  <meta property="og:description" content="Open dataset of ${languages.length} programming languages with ${rels.length} relationships." />
  <meta property="og:url" content="${SITE}/dataset" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <script type="application/ld+json">${datasetJsonLd}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Dataset
  </nav>

  <h1>Programming Language Lineage Dataset</h1>

  <p>An open, evidence-backed dataset of programming language implementation and influence relationships. Every relationship includes a confidence score and at least one evidence source URL.</p>

  <div class="stat-grid">
    <div class="stat-card">
      <span class="stat-number">${languages.length}</span>
      <span class="stat-label">Total nodes</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${langCount}</span>
      <span class="stat-label">Languages</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${toolCount}</span>
      <span class="stat-label">Tools</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${rels.length}</span>
      <span class="stat-label">Relationships</span>
    </div>
  </div>

  <h2>Relationship Breakdown</h2>
  <table>
    <thead><tr><th>Type</th><th>Count</th></tr></thead>
    <tbody>${relRows}</tbody>
  </table>

  <h2>Schema</h2>
  <p>Each language node contains: <code>id</code>, <code>name</code>, <code>first_release_year</code>, <code>paradigm</code>, <code>typing</code>, <code>cluster_hint</code>.</p>
  <p>Each relationship contains: <code>from_language</code>, <code>to_language</code>, <code>relationship</code>, <code>confidence</code> (0–1), <code>evidence_source</code> (URL), <code>notes</code>.</p>

  <h2>Download</h2>
  <p>The raw dataset JSON is available at:</p>
  <pre>https://languagelineage.org/dataset/v4/lineage_v4.json</pre>

  <h2>Citation</h2>
  <pre>Language Lineage dataset (languagelineage.org). Accessed ${new Date().getFullYear()}.</pre>

  <a class="explore-btn" href="/explore">Explore in Graph &rarr;</a>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
</footer>
</body>
</html>`;
}

const RELATIONSHIP_DEFS: Record<string, { label: string; h1: string; description: string }> = {
  compiler_written_in: {
    label: 'Compiler Written In',
    h1: 'Compiler Implementation Relationships',
    description: 'These relationships document what programming language each compiler is written in. For example, GCC (the GNU Compiler Collection) is written in C.',
  },
  runtime_written_in: {
    label: 'Runtime Written In',
    h1: 'Runtime Implementation Relationships',
    description: 'These relationships document what programming language each runtime or interpreter is written in. For example, CPython (the reference Python interpreter) is written in C.',
  },
  bootstrap_written_in: {
    label: 'Bootstrap Chain',
    h1: 'Bootstrap and Self-Hosting Chains',
    description: 'Bootstrapping is the process of writing a compiler in the same language it compiles. These relationships show the bootstrap chains — what language was used to write the initial compiler before self-hosting was achieved.',
  },
  influenced: {
    label: 'Influenced',
    h1: 'Language Influence Relationships',
    description: 'Conceptual influence relationships document which design ideas, syntax features, or programming paradigms one language borrowed or adapted from another.',
  },
  transpiled_to: {
    label: 'Transpiled To',
    h1: 'Transpilation Relationships',
    description: 'Transpilation (source-to-source compilation) converts code from one high-level language to another. For example, CoffeeScript transpiles to JavaScript.',
  },
  rewritten_in: {
    label: 'Rewritten In',
    h1: 'Language Rewrites',
    description: 'These relationships document cases where a language runtime or compiler was substantially rewritten in a different implementation language.',
  },
};

function buildRelationshipPage(type: string, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const def = RELATIONSHIP_DEFS[type] || { label: type, h1: type, description: '' };
  const typeRels = rels.filter(r => r.relationship === type);
  const slug = type.replace(/_/g, '-');
  const url = `${SITE}/relationships/${slug}`;
  const title = `${def.h1} | Language Lineage`;

  const rows = typeRels.sort((a, b) => b.confidence - a.confidence).map(r => {
    const fromName = nameFromId(r.from_language, nodeMap);
    const toName = nameFromId(r.to_language, nodeMap);
    const fromPrefix = idToPrefix(r.from_language);
    const fromSlug = idToSlug(r.from_language);
    const toPrefix = idToPrefix(r.to_language);
    const toSlug = idToSlug(r.to_language);
    return `<tr>
      <td><a href="/${fromPrefix}/${fromSlug}">${escapeHtml(fromName)}</a></td>
      <td><a href="/${toPrefix}/${toSlug}">${escapeHtml(toName)}</a></td>
      <td class="${confidenceClass(r.confidence)}">${(r.confidence * 100).toFixed(0)}%</td>
      <td>${r.notes ? escapeHtml(r.notes) : ''}</td>
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(def.description.slice(0, 160))}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/relationships">Relationships</a> &rsaquo; ${escapeHtml(def.label)}
  </nav>

  <h1>${escapeHtml(def.h1)}</h1>

  <div class="answer-box">${escapeHtml(def.description)}</div>

  <h2>All ${typeRels.length} Relationships</h2>
  <table>
    <thead><tr><th>From</th><th>To</th><th>Confidence</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <a class="explore-btn" href="/explore">Explore in Graph &rarr;</a>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

const GUIDES: Array<{ slug: string; title: string; h1: string; description: string; content: string }> = [
  {
    slug: 'what-is-compiler-bootstrapping',
    title: 'What is Compiler Bootstrapping? | Language Lineage',
    h1: 'What is Compiler Bootstrapping?',
    description: 'Compiler bootstrapping is the process of writing a compiler for a language in that same language. Learn how it works and which languages use it.',
    content: `<div class="answer-box">Compiler bootstrapping is the process of writing a compiler for a programming language <strong>in that same language</strong>. A language whose compiler can compile itself is called <em>self-hosting</em>.</div>

<h2>How Bootstrapping Works</h2>
<p>To bootstrap a compiler, you first write a simple initial compiler (called a "stage 0" or "seed" compiler) in an existing language. This compiler may not support all language features. Then you use it to compile a richer compiler written in the new language itself.</p>
<p>The process typically follows these stages:</p>
<ul>
<li><strong>Stage 0:</strong> Write a minimal compiler in C or another existing language</li>
<li><strong>Stage 1:</strong> Use Stage 0 to compile the full compiler written in the new language</li>
<li><strong>Stage 2:</strong> Use Stage 1 to compile itself — if the output matches Stage 1, bootstrapping succeeded</li>
</ul>

<h2>Why Bootstrap?</h2>
<p>Self-hosting is a meaningful milestone because it proves the language is expressive enough to implement a real-world systems program. It also means the compiler can be improved using the language's own features.</p>

<h2>Examples from the Dataset</h2>
<p>Languages in the Language Lineage dataset with documented bootstrap chains include Rust, Go, Haskell, OCaml, and many others. See <a href="/relationships/bootstrap-written-in">all bootstrap relationships</a> for the complete list.</p>

<a class="explore-btn" href="/explore">Explore Bootstrap Chains in Graph &rarr;</a>`,
  },
  {
    slug: 'what-is-self-hosting',
    title: 'What is a Self-Hosting Compiler? | Language Lineage',
    h1: 'What is a Self-Hosting Compiler?',
    description: 'A self-hosting compiler is a compiler that can compile its own source code. Learn which languages are self-hosting and why it matters.',
    content: `<div class="answer-box">A <strong>self-hosting compiler</strong> is a compiler that can compile the source code of its own compiler. This means the language implementation is written in the language itself.</div>

<h2>What Self-Hosting Means</h2>
<p>If a language is self-hosting, its compiler source code is written in that same language. For example, the Rust compiler (rustc) is written in Rust. The GHC Haskell compiler is written in Haskell.</p>

<h2>Benefits of Self-Hosting</h2>
<ul>
<li>Proves the language is powerful enough for systems programming</li>
<li>Allows compiler developers to use the language's own features</li>
<li>Enables compiler-driven language bootstrapping</li>
<li>Acts as a large, real-world test case for the language</li>
</ul>

<h2>Self-Hosting vs. Bootstrapping</h2>
<p>Bootstrapping is the process of <em>achieving</em> self-hosting. A self-hosting language is the <em>result</em>. Not all languages are self-hosting — many interpreters are written in C and never become self-hosting.</p>

<a class="explore-btn" href="/explore">Explore in Graph &rarr;</a>`,
  },
  {
    slug: 'compiler-vs-interpreter-vs-runtime',
    title: 'Compiler vs Interpreter vs Runtime | Language Lineage',
    h1: 'Compiler vs Interpreter vs Runtime',
    description: 'Understand the difference between a compiler, interpreter, and runtime, and how these determine what language an implementation is written in.',
    content: `<div class="answer-box">A <strong>compiler</strong> translates source code to machine code ahead of time. An <strong>interpreter</strong> executes source code directly at runtime. A <strong>runtime</strong> is the environment that manages execution, memory, and I/O for a running program.</div>

<h2>Compilers</h2>
<p>A compiler takes source code and produces an executable (machine code, bytecode, or another language). Examples: GCC (C/C++), rustc (Rust), javac (Java). The compiler itself is written in some implementation language — this is what the Language Lineage "compiler_written_in" relationships track.</p>

<h2>Interpreters</h2>
<p>An interpreter reads and executes source code without a separate compilation step. CPython (the standard Python interpreter) is an interpreter written in C. The "runtime_written_in" relationship tracks what language the interpreter is written in.</p>

<h2>Runtimes</h2>
<p>A runtime provides services during program execution: garbage collection, thread management, standard library, FFI. JavaScript has V8 (written in C++). Java has the JVM. Go has its own runtime written in Go itself.</p>

<a class="explore-btn" href="/explore">Explore Relationships in Graph &rarr;</a>`,
  },
  {
    slug: 'programming-language-family-tree',
    title: 'Programming Language Family Tree | Language Lineage',
    h1: 'Programming Language Family Tree',
    description: 'Explore the family tree of programming languages. See how Fortran, LISP, C, and Simula gave rise to modern languages through 75+ years of evolution.',
    content: `<div class="answer-box">The programming language family tree traces how languages descended from and influenced each other over 75+ years, from Fortran (1957) and LISP (1958) to Rust (2015) and beyond.</div>

<h2>The Roots (1950s)</h2>
<p>The first high-level languages established the major paradigms. <a href="/languages/fortran">Fortran</a> pioneered imperative scientific computing. <a href="/languages/lisp">LISP</a> established functional programming and dynamic typing. COBOL targeted business computing. These three defined the landscape for decades.</p>

<h2>The C Revolution (1970s)</h2>
<p><a href="/languages/c">C</a> became the implementation language of choice for operating systems and runtimes. Its descendants — <a href="/languages/cxx">C++</a>, Objective-C — extended it with object-oriented features. C also became the runtime implementation language for Python, Ruby, PHP, and many others.</p>

<h2>The OOP Era (1980s–90s)</h2>
<p><a href="/languages/smalltalk">Smalltalk</a> pioneered pure object-oriented design and influenced Python, Ruby, and Objective-C. <a href="/languages/java">Java</a> brought managed runtimes and garbage collection to the mainstream. <a href="/languages/javascript">JavaScript</a> brought dynamic typing to the web.</p>

<h2>The Modern Era (2000s–2020s)</h2>
<p><a href="/languages/rust">Rust</a> revisited systems programming with memory safety. <a href="/languages/go">Go</a> brought simplicity and built-in concurrency. Swift and Kotlin modernized mobile development. Each new language synthesizes ideas from its predecessors.</p>

<a class="explore-btn" href="/explore">Explore the Family Tree in Graph &rarr;</a>`,
  },
  {
    slug: 'how-javascript-engines-work',
    title: 'How JavaScript Engines Work | Language Lineage',
    h1: 'How JavaScript Engines Work',
    description: 'JavaScript engines like V8, SpiderMonkey, and JavaScriptCore are written in C++. Learn how they parse, compile, and execute JavaScript code.',
    content: `<div class="answer-box">JavaScript engines parse JavaScript source code, compile it to bytecode or machine code, and execute it. The major engines — V8, SpiderMonkey, and JavaScriptCore — are all written in <strong>C++</strong>.</div>

<h2>V8 (Google / Node.js / Chrome)</h2>
<p>V8 is an open-source JavaScript and WebAssembly engine written in C++. It compiles JavaScript directly to machine code before executing it (JIT compilation). V8 powers Google Chrome, Node.js, and Deno.</p>

<h2>SpiderMonkey (Firefox)</h2>
<p>SpiderMonkey is Mozilla's JavaScript engine, written in C++ and Rust. It was the first JavaScript engine ever created (1995) and powers Firefox. It uses a tiered JIT compilation approach.</p>

<h2>JavaScriptCore (Safari / WebKit)</h2>
<p>JavaScriptCore (also called Nitro) powers Safari and all iOS browsers. It is written in C++ and uses a four-tier JIT architecture.</p>

<h2>Why C++?</h2>
<p>JavaScript engines are written in C++ for performance: direct memory management, fine-grained control over compilation, and low-level platform access. <a href="/languages/javascript">JavaScript</a> itself is a high-level dynamic language — only its <em>engine</em> is in C++.</p>

<a class="explore-btn" href="/explore">Explore JavaScript Relationships in Graph &rarr;</a>`,
  },
  {
    slug: 'how-python-is-implemented',
    title: 'How Python is Implemented | Language Lineage',
    h1: 'How Python is Implemented',
    description: 'CPython is the reference Python implementation, written in C. PyPy uses RPython. Learn how Python interpreters work and what language each is written in.',
    content: `<div class="answer-box"><strong>CPython</strong>, the reference Python implementation, is written in <strong>C</strong>. It interprets Python bytecode via a virtual machine. Alternative implementations include PyPy (written in RPython) and Jython (written in Java).</div>

<h2>CPython</h2>
<p>CPython is the canonical Python interpreter, maintained by the Python Software Foundation. It compiles Python source to bytecode (.pyc files) and executes that bytecode in a C-implemented virtual machine. CPython is available on GitHub at <a href="https://github.com/python/cpython" rel="noopener noreferrer" target="_blank">github.com/python/cpython</a>.</p>

<h2>PyPy</h2>
<p>PyPy is a high-performance Python interpreter written in RPython (a restricted subset of Python). It uses JIT compilation to achieve speeds often 5–10x faster than CPython. PyPy is ideal for long-running CPU-intensive programs.</p>

<h2>Is Python Self-Hosting?</h2>
<p>No, Python is not self-hosting in its standard distribution. CPython is written in C, not Python. PyPy is written in RPython (a Python subset), which is close but not standard Python.</p>

<h2>Python's Influences</h2>
<p>Python was influenced by ABC, C, Modula-3, Smalltalk, and Haskell. It in turn influenced Ruby, CoffeeScript, and many others. See the <a href="/languages/python">Python page</a> for the full relationship map.</p>

<a class="explore-btn" href="/languages/python">View Python in Graph &rarr;</a>`,
  },
  {
    slug: 'how-rust-is-bootstrapped',
    title: 'How Rust is Bootstrapped | Language Lineage',
    h1: 'How Rust is Bootstrapped',
    description: 'Rust is a self-hosting language. The Rust compiler (rustc) is written in Rust itself. Learn how the Rust bootstrap process works.',
    content: `<div class="answer-box">The Rust compiler (<strong>rustc</strong>) is written in Rust. To bootstrap Rust from scratch, you need a prior version of rustc — the compiler bootstraps itself through a stage-based process.</div>

<h2>The Rust Bootstrap Process</h2>
<p>Rust uses a multi-stage bootstrap:</p>
<ul>
<li><strong>Stage 0:</strong> Download a pre-compiled rustc binary (the "beta" channel release)</li>
<li><strong>Stage 1:</strong> Use Stage 0 to compile the current rustc source code</li>
<li><strong>Stage 2:</strong> Use Stage 1 to compile rustc again — this is the final compiler</li>
</ul>
<p>Stage 2 is used because it ensures the compiler was compiled by the same-version compiler, catching any bootstrap-specific bugs.</p>

<h2>Historical Bootstrap</h2>
<p>Rust's original compiler (before it was rewritten in Rust) was written in OCaml. The transition to self-hosting happened around 2011–2012. The OCaml compiler was phased out once the Rust-in-Rust compiler was stable.</p>

<h2>mrustc: An Alternative Bootstrap Path</h2>
<p>mrustc is an alternative Rust compiler written in C++ that can compile older Rust code. It provides a bootstrap path that does not require a pre-compiled rustc binary, which is important for reproducible builds.</p>

<a class="explore-btn" href="/languages/rust">View Rust in Graph &rarr;</a>`,
  },
  {
    slug: 'gcc-vs-llvm',
    title: 'GCC vs LLVM: Compiler Infrastructure | Language Lineage',
    h1: 'GCC vs LLVM: Compiler Infrastructure',
    description: 'GCC and LLVM are the two dominant open-source compiler infrastructures. Both are written in C++. Learn how they differ and which languages use each.',
    content: `<div class="answer-box">Both GCC (GNU Compiler Collection) and LLVM are written in <strong>C++</strong>. GCC is the older, traditionally Unix-focused compiler. LLVM is a modular, reusable compiler infrastructure used by Clang, Rust, Swift, Kotlin/Native, and many others.</div>

<h2>GCC</h2>
<p>GCC has been the primary open-source C/C++ compiler since 1987. It supports dozens of languages (C, C++, Fortran, Ada, Go, D) and targets hundreds of architectures. GCC is written in C++ (migrated from C in 2012) and is licensed under GPL.</p>

<h2>LLVM</h2>
<p>LLVM started as a research project at the University of Illinois in 2000. It provides a modular compiler infrastructure with a well-defined intermediate representation (LLVM IR). Languages that compile to LLVM IR can target any architecture LLVM supports.</p>

<h2>Languages That Use LLVM</h2>
<ul>
<li>Clang (C/C++/Objective-C frontend)</li>
<li>Rust (rustc uses LLVM as its backend)</li>
<li>Swift</li>
<li>Kotlin/Native</li>
<li>Julia</li>
<li>Haskell (GHC LLVM backend)</li>
</ul>

<h2>Key Differences</h2>
<table>
<thead><tr><th>Aspect</th><th>GCC</th><th>LLVM</th></tr></thead>
<tbody>
<tr><td>License</td><td>GPL</td><td>Apache 2.0</td></tr>
<tr><td>Modularity</td><td>Monolithic</td><td>Highly modular</td></tr>
<tr><td>IR</td><td>GIMPLE/RTL</td><td>LLVM IR</td></tr>
<tr><td>JIT support</td><td>Limited</td><td>First-class (MCJIT)</td></tr>
</tbody>
</table>

<a class="explore-btn" href="/explore">Explore Compiler Relationships in Graph &rarr;</a>`,
  },
  {
    slug: 'how-programming-languages-are-made',
    title: 'How Are Programming Languages Made? | Language Lineage',
    h1: 'How Are Programming Languages Made?',
    description: 'Learn how programming languages are designed and implemented. Languages are built using other languages — compilers and interpreters are programs written in existing languages.',
    content: `<div class="answer-box">Programming languages are implemented using other languages. A compiler or interpreter is a program — and every program is written in some language. The first compilers were written in assembly; today most are self-hosting or written in C, C++, or Rust.</div>

<h2>What is a Programming Language Implementation?</h2>
<p>A programming language is defined by its specification (grammar, semantics). Its <em>implementation</em> is a compiler or interpreter that executes code written in that language. CPython implements Python; rustc implements Rust; V8 implements JavaScript.</p>

<h2>What Compilers and Interpreters Do</h2>
<p>A <strong>compiler</strong> translates source code to machine code or bytecode ahead of time. A <strong>interpreter</strong> reads and executes source code directly. Most languages use one or both: Java compiles to bytecode, then the JVM interprets or JIT-compiles that bytecode.</p>

<h2>The Bootstrap Problem</h2>
<p>To write a compiler for a new language, you need an existing language to write it in. Early compilers were written in assembly or C. Once a compiler is stable, it can be rewritten in the language itself — this is called bootstrapping. Languages like Rust, Go, Haskell, and OCaml are self-hosting: their compilers are written in themselves.</p>

<h2>Examples from the Dataset</h2>
<ul>
<li><a href="/languages/python">Python (CPython)</a> is implemented in C</li>
<li><a href="/languages/rust">Rust (rustc)</a> is self-hosting, with an original OCaml implementation</li>
<li><a href="/languages/go">Go</a> has been self-hosting since version 1.5 (2015)</li>
<li><a href="/languages/javascript">JavaScript</a> engines (V8, SpiderMonkey, JavaScriptCore) are written in C++</li>
<li><a href="/languages/java">Java (javac)</a> is self-hosting; the HotSpot JVM is written in C++</li>
</ul>

<h2>Further Reading</h2>
<ul>
<li><a href="/guides/what-is-compiler-bootstrapping">What is compiler bootstrapping?</a></li>
<li><a href="/guides/compiler-vs-interpreter-vs-runtime">Compiler vs interpreter vs runtime</a></li>
<li><a href="/relationships/compiler-written-in">All compiler_written_in relationships</a></li>
</ul>

<a class="explore-btn" href="/explore">Explore the Full Graph &rarr;</a>`,
  },
  {
    slug: 'v8-vs-spidermonkey-vs-javascriptcore',
    title: 'V8 vs SpiderMonkey vs JavaScriptCore | Language Lineage',
    h1: 'V8 vs SpiderMonkey vs JavaScriptCore',
    description: 'All three major JavaScript engines are written in C++. V8 powers Chrome and Node.js, SpiderMonkey powers Firefox, and JavaScriptCore powers Safari.',
    content: `<div class="answer-box">All three major JavaScript engines are primarily written in <strong>C++</strong>. V8 (Google) powers Chrome and Node.js. SpiderMonkey (Mozilla) powers Firefox and also uses Rust and JavaScript. JavaScriptCore (Apple/WebKit) powers Safari.</div>

<h2>V8</h2>
<p>V8 is Google's open-source JavaScript and WebAssembly engine, written in C++. It compiles JavaScript directly to machine code using JIT compilation. V8 powers Google Chrome, Node.js, Deno, and Electron. It was first released in 2008.</p>

<h2>SpiderMonkey</h2>
<p>SpiderMonkey is Mozilla's JavaScript engine, written in C++, Rust, and JavaScript. It was the first JavaScript engine ever created, written by Brendan Eich in 1995. SpiderMonkey powers Firefox. It uses a tiered JIT compilation system (Baseline JIT + IonMonkey).</p>

<h2>JavaScriptCore</h2>
<p>JavaScriptCore (also called Nitro) is Apple's JavaScript engine, written in C++. It is part of the WebKit project and powers Safari on macOS and iOS. All iOS browsers are required by Apple to use JavaScriptCore. It uses a four-tier architecture (LLInt, Baseline JIT, DFG JIT, FTL JIT).</p>

<h2>Comparison</h2>
<table>
<thead><tr><th>Engine</th><th>Creator</th><th>Written in</th><th>Powers</th></tr></thead>
<tbody>
<tr><td><a href="/tools/v8">V8</a></td><td>Google</td><td>C++</td><td>Chrome, Node.js, Deno</td></tr>
<tr><td><a href="/tools/spidermonkey">SpiderMonkey</a></td><td>Mozilla</td><td>C++, Rust, JavaScript</td><td>Firefox</td></tr>
<tr><td>JavaScriptCore</td><td>Apple/WebKit</td><td>C++</td><td>Safari, all iOS browsers</td></tr>
</tbody>
</table>

<h2>Related Pages</h2>
<ul>
<li><a href="/languages/javascript">JavaScript language page</a></li>
<li><a href="/tools/v8">V8 tool page</a></li>
<li><a href="/tools/spidermonkey">SpiderMonkey tool page</a></li>
<li><a href="/guides/how-javascript-engines-work">How JavaScript engines work</a></li>
</ul>

<a class="explore-btn" href="/explore">Explore JavaScript Relationships in Graph &rarr;</a>`,
  },
];

function buildGuidePage(guide: (typeof GUIDES)[0]): string {
  const url = `${SITE}/guides/${guide.slug}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title)}</title>
  <meta name="description" content="${escapeHtml(guide.description)}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="${escapeHtml(guide.title)}" />
  <meta property="og:description" content="${escapeHtml(guide.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    url,
    author: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
  })}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/guides">Guides</a> &rsaquo; ${escapeHtml(guide.h1)}
  </nav>

  <h1>${escapeHtml(guide.h1)}</h1>

  ${guide.content}

</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

const FEATURED_LANG_SLUGS = ['c', 'python', 'javascript', 'typescript', 'rust', 'go', 'java', 'cxx', 'ruby', 'haskell', 'swift', 'kotlin'];

function buildLanguagesIndex(langs: Language[]): string {
  const langNodes = langs.filter(l => l.id.startsWith('lang:')).sort((a, b) => a.name.localeCompare(b.name));
  const langBySlug = new Map(langNodes.map(l => [idToSlug(l.id), l]));

  const featuredCards = FEATURED_LANG_SLUGS.map(slug => {
    const l = langBySlug.get(slug);
    if (!l) return '';
    return `<a href="/languages/${slug}" class="featured-lang-card">
  <span class="featured-lang-name">${escapeHtml(l.name)}</span>
  ${l.first_release_year ? `<span class="featured-lang-year">${l.first_release_year}</span>` : ''}
</a>`;
  }).filter(Boolean).join('\n');

  const allCards = langNodes.map(l => {
    const slug = idToSlug(l.id);
    return `<a href="/languages/${slug}" class="related-card">${escapeHtml(l.name)}</a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Languages Index | Language Lineage</title>
  <meta name="description" content="Browse all ${langNodes.length} programming languages in the Language Lineage dataset. Find what each language is written in, its compiler, runtime, and lineage." />
  <link rel="canonical" href="${SITE}/languages" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Languages Index | Language Lineage" />
  <meta property="og:url" content="${SITE}/languages" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Languages
  </nav>
  <h1>Programming Languages Index</h1>
  <p>${langNodes.length} programming languages spanning 1949 to 2023, each with documented compiler, runtime, and influence relationships.</p>

  <h2>Popular Languages</h2>
  <div class="featured-langs">${featuredCards}</div>

  <h2>All Languages (A&ndash;Z)</h2>
  <div class="related-grid">${allCards}</div>

  <a class="explore-btn" href="/explore">Explore All in Graph &rarr;</a>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

function buildToolsIndex(langs: Language[]): string {
  const toolNodes = langs.filter(l => l.id.startsWith('tool:')).sort((a, b) => a.name.localeCompare(b.name));
  const cards = toolNodes.map(l => {
    const slug = idToSlug(l.id);
    const intro = l.notes ? `<span class="tool-index-note">${escapeHtml(l.notes.split('.')[0])}.</span>` : '';
    return `<a href="/tools/${slug}" class="tool-index-card">
  <span class="tool-index-name">${escapeHtml(l.name)}</span>
  ${intro}
</a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Compilers, Runtimes, and Tools | Language Lineage</title>
  <meta name="description" content="Browse ${toolNodes.length} compilers, runtimes, and language tools: GCC, LLVM, V8, SpiderMonkey, GHC, HotSpot JVM, and more. Find what each is written in." />
  <link rel="canonical" href="${SITE}/tools" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Compilers, Runtimes, and Tools | Language Lineage" />
  <meta property="og:url" content="${SITE}/tools" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Tools
  </nav>
  <h1>Compilers, Runtimes, and Tools</h1>
  <div class="answer-box">This section covers the ${toolNodes.length} major compiler and runtime tools in the Language Lineage dataset — including GCC, LLVM, V8, SpiderMonkey, GHC, and HotSpot JVM. Each entry documents what the tool is written in, its relationships to languages, and its implementation history.</div>
  <div class="tool-index-grid">${cards}</div>
  <a class="explore-btn" href="/explore">Explore All in Graph &rarr;</a>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

function buildGuidesIndex(): string {
  const cards = GUIDES.map(g => `<a href="/guides/${g.slug}" class="guide-card">
  <div class="guide-card-title">${escapeHtml(g.h1)}</div>
  <p class="guide-card-desc">${escapeHtml(g.description)}</p>
</a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Guides | Language Lineage</title>
  <meta name="description" content="In-depth guides on compiler bootstrapping, self-hosting, JavaScript engines, Python implementation, GCC vs LLVM, and more." />
  <link rel="canonical" href="${SITE}/guides" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Guides | Language Lineage" />
  <meta property="og:url" content="${SITE}/guides" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Guides
  </nav>
  <h1>Programming Language Guides</h1>
  <p>In-depth guides on how programming languages are made, implemented, bootstrapped, and related to each other. ${GUIDES.length} guides covering compilers, runtimes, and language history.</p>
  <div class="guide-cards">${cards}</div>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

function buildRelationshipsIndex(rels: Relationship[]): string {
  const counts: Record<string, number> = {};
  rels.forEach(r => { counts[r.relationship] = (counts[r.relationship] || 0) + 1; });

  const cards = Object.entries(RELATIONSHIP_DEFS).map(([type, def]) => {
    const slug = type.replace(/_/g, '-');
    const count = counts[type] || 0;
    return `<a href="/relationships/${slug}" class="rel-card">
  <div class="rel-card-body">
    <div class="rel-card-title">${escapeHtml(def.label)}</div>
    <p class="rel-card-desc">${escapeHtml(def.description)}</p>
  </div>
  <span class="rel-card-count">${count}</span>
</a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relationship Types | Language Lineage</title>
  <meta name="description" content="Browse all 6 relationship types in the Language Lineage dataset: compiler_written_in, runtime_written_in, bootstrap_written_in, influenced, transpiled_to, rewritten_in." />
  <link rel="canonical" href="${SITE}/relationships" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Relationship Types | Language Lineage" />
  <meta property="og:url" content="${SITE}/relationships" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Relationships
  </nav>
  <h1>Relationship Types</h1>
  <p>The Language Lineage dataset tracks six types of relationships across ${rels.length} total edges. Each relationship type has its own evidence requirements and confidence scoring.</p>
  <div class="rel-cards">${cards}</div>
  <a class="explore-btn" href="/explore">Explore All Relationships in Graph &rarr;</a>
</main>
<footer class="seo-footer">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
</body>
</html>`;
}

// Main
const raw = JSON.parse(readFileSync(DATASET_PATH, 'utf8'));
const languages: Language[] = raw.languages ?? [];
const rels: Relationship[] = raw.relationships ?? [];
const nodeMap = new Map(languages.map(l => [l.id, l]));

let count = 0;

// Language and tool pages
for (const node of languages) {
  const prefix = idToPrefix(node.id);
  const slug = idToSlug(node.id);
  const html = buildNodePage(node, rels, nodeMap);
  writeFile(join(PUBLIC, prefix, slug, 'index.html'), html);
  count++;
}
function buildTimelinePage(languages: Language[], rels: Relationship[]): string {
  const CANVAS_W = 7200, CANVAS_H = 840, YEAR_START = 1948, YEAR_END = 2026, X_L = 300, X_R = 200;
  function yearToX(year: number): number {
    return Math.round(X_L + (year - YEAR_START) / (YEAR_END - YEAR_START) * (CANVAS_W - X_L - X_R));
  }

  const LANE_Y: Record<string, number> = {
    functional: 110, systems: 230, tools: 250, compilers: 240,
    historical: 380, roots: 380, other: 380,
    jvm: 510, clr: 510, dynamic: 630, scientific: 730,
  };

  const degree: Record<string, number> = {};
  rels.forEach(r => {
    degree[r.from_language] = (degree[r.from_language] ?? 0) + 1;
    degree[r.to_language] = (degree[r.to_language] ?? 0) + 1;
  });

  const SELF_HOSTING = new Set<string>();
  rels.forEach(r => {
    if (r.relationship === 'bootstrap_written_in') SELF_HOSTING.add(r.to_language);
  });
  languages.forEach(l => { if (l.self_hosting) SELF_HOSTING.add(l.id); });

  // Sort by year for jitter processing
  const sorted = languages
    .filter(l => l.first_release_year && l.first_release_year >= 1948)
    .sort((a, b) => (a.first_release_year ?? 0) - (b.first_release_year ?? 0));

  const nodePos: Record<string, { x: number; y: number; r: number }> = {};
  const JITTER = [0, 55, -55, 110, -110, 165, -165];
  const clusterOccupied: Map<string, { x: number; y: number }[]> = new Map();

  for (const lang of sorted) {
    const year = lang.first_release_year ?? 1980;
    const cluster = lang.cluster_hint ?? 'other';
    const baseY = LANE_Y[cluster] ?? 380;
    const x = yearToX(year);
    const deg = degree[lang.id] ?? 0;
    const r = Math.min(28, Math.max(16, Math.round(12 + Math.sqrt(deg) * 2.0)));

    if (!clusterOccupied.has(cluster)) clusterOccupied.set(cluster, []);
    const occupied = clusterOccupied.get(cluster)!;

    let finalY = baseY;
    for (const jy of JITTER) {
      const cy = baseY + jy;
      const conflict = occupied.some(o => Math.abs(o.x - x) < 80 && Math.abs(o.y - cy) < 50);
      if (!conflict) { finalY = cy; break; }
    }
    occupied.push({ x, y: finalY });
    nodePos[lang.id] = { x, y: finalY, r };
  }

  // Build TL_DATA nodes array
  const tlNodes = sorted.map(lang => {
    const slug = idToSlug(lang.id);
    const prefix = lang.id.startsWith('tool:') ? 'tools' : 'languages';
    const pos = nodePos[lang.id] ?? { x: 300, y: 380, r: 16 };
    const logoUrl = (LOGO_MAP as Record<string, string | null>)[lang.id] ?? null;
    const color = (LOGO_COLORS as Record<string, string | null>)[lang.id] ?? '#c9a87c';
    return {
      id: lang.id,
      name: lang.name,
      year: lang.first_release_year ?? 1980,
      slug,
      prefix,
      x: pos.x,
      y: pos.y,
      r: pos.r,
      cluster: lang.cluster_hint ?? 'other',
      logo: logoUrl,
      color,
      note: (lang.notes ?? '').split('.')[0].slice(0, 120) || null,
      tags: (lang.paradigm ?? []).slice(0, 3),
      selfHosting: SELF_HOSTING.has(lang.id),
    };
  });

  const nodeIdSet = new Set(tlNodes.map(n => n.id));
  const tlEdges = rels
    .filter(r => nodeIdSet.has(r.from_language) && nodeIdSet.has(r.to_language))
    .map(r => ({
      from: r.from_language,
      to: r.to_language,
      type: r.relationship,
      revealYear: Math.max(
        sorted.find(l => l.id === r.from_language)?.first_release_year ?? 1980,
        sorted.find(l => l.id === r.to_language)?.first_release_year ?? 1980,
      ),
    }));

  const tlDataJson = JSON.stringify({ nodes: tlNodes, edges: tlEdges });

  // Decade nav
  const decadeSet = new Set(sorted.map(l => Math.floor((l.first_release_year ?? 1980) / 10) * 10));
  const decadeButtons = [...decadeSet].sort().map(d => `<button data-decade="${d}" onclick="jumpToDecade(${d})">${d}s</button>`).join('');

  // Axis decade X positions for lane labels
  const axisDecades = [1950,1960,1970,1980,1990,2000,2010,2020];
  const axisTicks = axisDecades.map(yr => {
    const x = yearToX(yr);
    return `<line class="tl-axis-tick" x1="${x}" y1="0" x2="${x}" y2="${CANVAS_H}"/><text class="tl-axis-label" x="${x+5}" y="${CANVAS_H-12}">${yr}</text>`;
  }).join('');

  const laneLabels = Object.entries({
    'Functional': 110, 'Systems': 230, 'JVM / CLR': 510, 'Dynamic': 630, 'Scientific': 730, 'Historical': 380,
  }).map(([label, y]) => `<text class="tl-lane-label" x="8" y="${y - 8}">${label}</text>`).join('');

  // Trunk snaking bezier
  const t = yearToX.bind(null);
  const trunkD = `M 60,380 C ${t(1951)},380 ${t(1954)},380 ${t(1957)},380 C ${t(1959)},380 ${t(1962)},230 ${t(1965)},230 C ${t(1968)},230 ${t(1971)},230 ${t(1972)},230 C ${t(1974)},230 ${t(1976)},380 ${t(1978)},380 C ${t(1981)},380 ${t(1984)},380 ${t(1986)},380 C ${t(1988)},380 ${t(1990)},510 ${t(1993)},510 C ${t(1995)},510 ${t(1998)},510 ${t(2000)},510 C ${t(2002)},510 ${t(2005)},380 ${t(2007)},380 C ${t(2009)},380 ${t(2011)},240 ${t(2014)},240 C ${t(2016)},240 ${t(2019)},240 ${t(2021)},240 C ${t(2022)},240 ${t(2024)},380 ${t(2026)},380`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Timeline | Language Lineage</title>
  <meta name="description" content="75+ years of programming language history as a cinematic atlas. Watch ${tlNodes.length} languages and tools materialize across time — from Fortran to Rust, with all implementation edges." />
  <link rel="canonical" href="${SITE}/timeline" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Timeline | Language Lineage" />
  <meta property="og:url" content="${SITE}/timeline" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page" style="overflow-x:hidden">
<nav class="seo-nav">
  <a href="/" class="nav-brand">Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>
<div class="tl-prog-track"><div class="tl-prog-fill" id="tlp"></div></div>
<div class="tl-decade-nav" id="tldnav">${decadeButtons}</div>
<div class="tl-outer" id="tl-outer">
  <svg id="tl-svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" width="${CANVAS_W}" height="${CANVAS_H}">
    <defs>
      <filter id="tl-glow-f" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g id="tl-axis">${axisTicks}</g>
    <g id="tl-lane-labels">${laneLabels}</g>
    <g id="tl-trunk-g">
      <path class="tl-trunk-bg" d="${trunkD}"/>
      <path class="tl-trunk" id="tl-trunk-path" d="${trunkD}"/>
      <path class="tl-trunk-pulse" id="tl-pulse-path" d="${trunkD}"/>
    </g>
    <g id="tl-edges-g"></g>
    <g id="tl-nodes-g"></g>
  </svg>
</div>
<div id="tl-spacer"></div>
<div class="tl-year-hud"><span class="tl-year-num" id="tl-year-hud">1948</span></div>
<button class="tl-reset-btn" id="tl-reset">
  <svg width="14" height="14" viewBox="0 0 16 16"><path d="M8 2L2 8h4v5h4V8h4L8 2z" fill="currentColor"/></svg>
  Overview
</button>
<div class="tl-float-card" id="tl-card">
  <div class="tl-fc-logo" id="tl-fc-logo"></div>
  <div class="tl-fc-name" id="tl-fc-name"></div>
  <div class="tl-fc-year" id="tl-fc-year"></div>
  <div class="tl-fc-tags" id="tl-fc-tags"></div>
  <div class="tl-fc-note" id="tl-fc-note"></div>
  <a class="tl-fc-link" id="tl-fc-link" href="#">View details</a>
</div>
<footer class="seo-footer" style="position:relative;z-index:5">
  <a href="/">Language Lineage</a>
  <span>&middot;</span>
  <a href="/dataset">Dataset</a>
  <span>&middot;</span>
  <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
  <span class="seo-footer-copy">&copy; 2026 Sanket Muchhala</span>
</footer>
<script>const TL_DATA=${tlDataJson};</script>
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
(function(){
var CANVAS_W=${CANVAS_W},CANVAS_H=${CANVAS_H},YEAR_START=${YEAR_START},YEAR_END=${YEAR_END},X_L=${X_L},X_R=${X_R};
function yearToX(yr){return X_L+(yr-YEAR_START)/(YEAR_END-YEAR_START)*(CANVAS_W-X_L-X_R);}

var nodeById=new Map(TL_DATA.nodes.map(function(n){return[n.id,n];}));

var svg=d3.select('#tl-svg');
var nodesG=svg.select('#tl-nodes-g');
var edgesG=svg.select('#tl-edges-g');

// Edges
var edgeLine=function(from,to){
  var mx=(from.x+to.x)/2;
  return 'M '+from.x+','+from.y+' C '+mx+','+from.y+' '+mx+','+to.y+' '+to.x+','+to.y;
};
var typeClass=function(t){return 'tl-edge tl-edge-'+t.replace(/_/g,'-');};
edgesG.selectAll('.tl-edge')
  .data(TL_DATA.edges.filter(function(e){return nodeById.has(e.from)&&nodeById.has(e.to);}))
  .join('path')
  .attr('class',function(d){return typeClass(d.type);})
  .attr('data-from',function(d){return d.from;})
  .attr('data-to',function(d){return d.to;})
  .attr('data-reveal',function(d){return d.revealYear;})
  .attr('d',function(d){return edgeLine(nodeById.get(d.from),nodeById.get(d.to));})
  .each(function(){
    var len=this.getTotalLength?Math.ceil(this.getTotalLength()):800;
    d3.select(this).style('stroke-dasharray',len).style('stroke-dashoffset',len);
  });

// Nodes
var nodeEnter=nodesG.selectAll('.tl-node')
  .data(TL_DATA.nodes)
  .join('g')
  .attr('class',function(d){return 'tl-node'+(d.selfHosting?' tl-sh':'');})
  .attr('data-id',function(d){return d.id;})
  .attr('data-year',function(d){return d.year;})
  .attr('transform',function(d){return 'translate('+d.x+','+d.y+')';});

nodeEnter.filter(function(d){return d.selfHosting;})
  .append('circle').attr('class','tl-glow-ring').attr('r',function(d){return d.r+8;});

nodeEnter.append('circle')
  .attr('class','tl-node-circle')
  .attr('r',function(d){return d.r;})
  .attr('fill',function(d){return (d.color||'#2a2a2e')+'22';})
  .attr('stroke',function(d){return d.color||'#c9a87c';})
  .attr('stroke-width',1.5);

nodeEnter.filter(function(d){return !!d.logo;})
  .append('image')
  .attr('class','tl-node-img')
  .attr('href',function(d){return d.logo;})
  .attr('x',function(d){return -d.r*0.58;}).attr('y',function(d){return -d.r*0.58;})
  .attr('width',function(d){return d.r*1.16;}).attr('height',function(d){return d.r*1.16;});

nodeEnter.filter(function(d){return !d.logo;})
  .append('text').attr('class','tl-node-abbr')
  .attr('y',1)
  .attr('fill',function(d){return d.color||'#c9a87c';})
  .text(function(d){return d.name.slice(0,2).toUpperCase();});

nodeEnter.append('text').attr('class','tl-node-label')
  .attr('y',function(d){return d.r+13;})
  .text(function(d){return d.name;});

var expandBtn=nodeEnter.append('g')
  .attr('class','tl-expand-btn')
  .attr('transform',function(d){return 'translate('+(d.r-2)+','+(-(d.r-2))+')';});
expandBtn.append('circle').attr('r',9);
expandBtn.append('text').attr('y',1).text('+');

// Hover card
var card=document.getElementById('tl-card');
var cardVisible=false;
var cardTimeout=null;
function showCard(d,cx,cy){
  document.getElementById('tl-fc-name').textContent=d.name;
  document.getElementById('tl-fc-year').textContent=d.year;
  var logoEl=document.getElementById('tl-fc-logo');
  logoEl.innerHTML='';
  if(d.logo){
    var img=document.createElement('img');img.src=d.logo;img.style.cssText='width:60%;height:60%;object-fit:contain';
    logoEl.style.background=(d.color||'#2a2a2e')+'22';logoEl.style.border='2px solid '+(d.color||'#c9a87c')+'50';
    logoEl.appendChild(img);
  } else {
    logoEl.style.background=(d.color||'#2a2a2e')+'22';logoEl.style.border='2px solid '+(d.color||'#c9a87c')+'50';
    logoEl.innerHTML='<span class="tl-fc-abbr" style="color:'+(d.color||'#c9a87c')+'">'+d.name.slice(0,2).toUpperCase()+'</span>';
  }
  var tagsEl=document.getElementById('tl-fc-tags');
  tagsEl.innerHTML=(d.tags||[]).map(function(t){return '<span class="tl-fc-tag">'+t+'</span>';}).join('');
  document.getElementById('tl-fc-note').textContent=d.note||'';
  var lnk=document.getElementById('tl-fc-link');
  lnk.href='/'+d.prefix+'/'+d.slug;lnk.textContent='View '+d.name;
  moveCard(cx,cy);card.classList.add('show');cardVisible=true;
}
function moveCard(cx,cy){
  var cw=card.offsetWidth||220,ch=card.offsetHeight||180;
  var x=cx+16,y=cy-ch/2;
  if(x+cw>window.innerWidth-20)x=cx-cw-16;
  if(y<8)y=8;if(y+ch>window.innerHeight-8)y=window.innerHeight-ch-8;
  card.style.left=x+'px';card.style.top=y+'px';
}
function hideCard(){if(cardTimeout)clearTimeout(cardTimeout);cardTimeout=setTimeout(function(){card.classList.remove('show');cardVisible=false;},120);}

nodesG.selectAll('.tl-node')
  .on('mouseover',function(event,d){if(!d)return;if(cardTimeout)clearTimeout(cardTimeout);showCard(d,event.clientX,event.clientY);})
  .on('mousemove',function(event){if(cardVisible)moveCard(event.clientX,event.clientY);})
  .on('mouseleave',function(){hideCard();})
  .on('click',function(event,d){
    var btn=event.target.closest('.tl-expand-btn');
    if(!btn)return;
    event.stopPropagation();
    var connectedIds=new Set();
    TL_DATA.edges.forEach(function(e){
      if(e.from===d.id)connectedIds.add(e.to);
      if(e.to===d.id)connectedIds.add(e.from);
    });
    var delay=0;
    connectedIds.forEach(function(id){
      var el=document.querySelector('.tl-node[data-id="'+id+'"]');
      if(el&&!el.classList.contains('visible')){
        setTimeout(function(){el.classList.add('visible','tl-expanded');},delay);delay+=60;
      }
    });
    document.querySelectorAll('.tl-edge[data-from="'+d.id+'"],.tl-edge[data-to="'+d.id+'"]')
      .forEach(function(e){e.classList.add('visible');});
  });

// Trunk + pulse animation
var trunkEl=document.getElementById('tl-trunk-path');
var pulseEl=document.getElementById('tl-pulse-path');
var trunkLen=trunkEl.getTotalLength?Math.ceil(trunkEl.getTotalLength()):7200;
d3.select(trunkEl).style('stroke-dasharray',trunkLen).style('stroke-dashoffset',trunkLen);
var shortDash=90;
pulseEl.style.strokeDasharray=shortDash+'px '+trunkLen+'px';
pulseEl.style.strokeDashoffset='0';
pulseEl.style.animation='tl-flow '+(trunkLen/200).toFixed(1)+'s linear infinite';

// Scroll mechanic
var outer=document.getElementById('tl-outer');
var svgEl=document.getElementById('tl-svg');
var spacer=document.getElementById('tl-spacer');
var fill=document.getElementById('tlp');
var dnav=document.getElementById('tldnav');
var hudEl=document.getElementById('tl-year-hud');
var isMobile=window.innerWidth<=768;
var scrollDist=0;
var decadeXMap={};

function setup(){
  if(isMobile)return;
  scrollDist=CANVAS_W-outer.offsetWidth;
  if(scrollDist<1)scrollDist=CANVAS_W;
  spacer.style.height=scrollDist+'px';
  [1950,1960,1970,1980,1990,2000,2010,2020].forEach(function(d){
    decadeXMap[d]=yearToX(d);
  });
}

function currentYearFromScroll(progress){
  var frac=progress/scrollDist;
  return Math.round(YEAR_START+frac*(YEAR_END-YEAR_START));
}

function onScroll(){
  if(isMobile)return;
  var progress=Math.max(0,Math.min(window.scrollY,scrollDist));
  svgEl.style.transform='translateX(-'+progress+'px)';
  if(fill)fill.style.width=(scrollDist>0?progress/scrollDist*100:0)+'%';
  var currentYear=currentYearFromScroll(progress);
  if(hudEl)hudEl.textContent=currentYear;

  // Trunk reveal
  var trunkProgress=Math.max(0,Math.min(1,progress/scrollDist));
  d3.select(trunkEl).style('stroke-dashoffset',trunkLen*(1-trunkProgress));

  // Decade nav active state
  if(dnav){
    var active=null;
    Object.keys(decadeXMap).forEach(function(d){
      if(progress>=decadeXMap[d]-outer.offsetWidth/2)active=d;
    });
    dnav.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('active',b.dataset.decade===String(active));
    });
  }

  // Reveal nodes and edges by year
  document.querySelectorAll('.tl-node[data-year]').forEach(function(el){
    var yr=parseInt(el.getAttribute('data-year'),10);
    if(yr<=currentYear)el.classList.add('visible');
  });
  document.querySelectorAll('.tl-edge[data-reveal]').forEach(function(el){
    var yr=parseInt(el.getAttribute('data-reveal'),10);
    if(yr<=currentYear)el.classList.add('visible');
  });
}

window.jumpToDecade=function(decade){
  var x=decadeXMap[decade];
  if(x==null)return;
  window.scrollTo({top:Math.max(0,x-outer.offsetWidth/3),behavior:'smooth'});
};

document.getElementById('tl-reset').addEventListener('click',function(){
  window.scrollTo({top:0,behavior:'smooth'});
});

window.addEventListener('load',function(){
  setup();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){
    isMobile=window.innerWidth<=768;setup();onScroll();
  });
  onScroll();
});
})();
</script>
</body>
</html>`;
}

console.log(`Generated ${count} language/tool pages`);

// Dataset page
writeFile(join(PUBLIC, 'dataset', 'index.html'), buildDatasetPage(languages, rels));
console.log('Generated dataset page');

// Relationship pages
const relTypes = [...new Set(rels.map(r => r.relationship))];
for (const type of relTypes) {
  const slug = type.replace(/_/g, '-');
  writeFile(join(PUBLIC, 'relationships', slug, 'index.html'), buildRelationshipPage(type, rels, nodeMap));
}
console.log(`Generated ${relTypes.length} relationship pages`);

// Guide pages
for (const guide of GUIDES) {
  writeFile(join(PUBLIC, 'guides', guide.slug, 'index.html'), buildGuidePage(guide));
}
console.log(`Generated ${GUIDES.length} guide pages`);

// Collection index pages
writeFile(join(PUBLIC, 'languages', 'index.html'), buildLanguagesIndex(languages));
writeFile(join(PUBLIC, 'tools', 'index.html'), buildToolsIndex(languages));
writeFile(join(PUBLIC, 'guides', 'index.html'), buildGuidesIndex());
writeFile(join(PUBLIC, 'relationships', 'index.html'), buildRelationshipsIndex(rels));
console.log('Generated 4 collection index pages');

// Timeline page
writeFile(join(PUBLIC, 'timeline', 'index.html'), buildTimelinePage(languages, rels));
console.log('Generated timeline page');

console.log('SEO page generation complete.');
