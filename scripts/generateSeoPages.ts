import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LOGO_MAP, LOGO_COLORS } from '../src/data/logoMap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DATASET_PATH = join(ROOT, 'dataset/v4/lineage_v4.json');
const SITE = 'https://www.languagelineage.org';

const NAV_HTML = `<nav class="seo-nav">
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>`;

const FOOTER_HTML = `<footer class="seo-footer-rich">
  <div class="footer-grid">
    <div class="footer-col">
      <span class="footer-col-head">Explore</span>
      <a href="/programming-language-graph">Language Graph</a>
      <a href="/programming-language-family-tree">Family Tree</a>
      <a href="/programming-language-evolution">Evolution Timeline</a>
      <a href="/what-are-programming-languages-written-in">What languages are written in</a>
      <a href="/explore">Interactive Graph</a>
      <a href="/dataset">Dataset</a>
    </div>
    <div class="footer-col">
      <span class="footer-col-head">Popular Languages</span>
      <a href="/languages/python">Python</a>
      <a href="/languages/javascript">JavaScript</a>
      <a href="/languages/rust">Rust</a>
      <a href="/languages/go">Go</a>
      <a href="/languages/java">Java</a>
      <a href="/languages/c">C</a>
      <a href="/languages/cxx">C++</a>
      <a href="/languages/typescript">TypeScript</a>
    </div>
    <div class="footer-col">
      <span class="footer-col-head">Questions</span>
      <a href="/questions/what-is-python-written-in">What is Python written in?</a>
      <a href="/questions/what-is-javascript-written-in">What is JavaScript written in?</a>
      <a href="/questions/what-is-rust-written-in">What is Rust written in?</a>
      <a href="/questions/what-is-go-written-in">What is Go written in?</a>
      <a href="/questions/what-is-compiler-bootstrapping">What is compiler bootstrapping?</a>
      <a href="/questions">All questions &rarr;</a>
    </div>
    <div class="footer-col">
      <span class="footer-col-head">Tools &amp; Guides</span>
      <a href="/tools/v8">V8</a>
      <a href="/tools/llvm">LLVM</a>
      <a href="/tools/gcc">GCC</a>
      <a href="/tools/ghc">GHC</a>
      <a href="/guides">All guides</a>
      <a href="https://github.com/sanketmuchhala/LanguageLineage" rel="noopener noreferrer">GitHub</a>
    </div>
  </div>
  <div class="footer-bottom">&copy; 2026 Sanket Muchhala &middot; <a href="/">Language Lineage</a></div>
</footer>`;

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

const QUESTION_PAGE_LANGS = new Set(['python','javascript','rust','go','java','c','cxx','typescript','ruby','v8','cpython']);

function buildDiscoverMore(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const slug = idToSlug(node.id);
  const name = escapeHtml(node.name);
  const links: string[] = [];

  if (QUESTION_PAGE_LANGS.has(slug)) {
    links.push(`<a href="/questions/what-is-${slug}-written-in" class="discover-link">What is ${name} written in?</a>`);
  }
  links.push(`<a href="/what-are-programming-languages-written-in" class="discover-link">What are programming languages written in?</a>`);
  links.push(`<a href="/programming-language-family-tree" class="discover-link">${name} in the language family tree</a>`);
  links.push(`<a href="/programming-language-graph" class="discover-link">Interactive programming language graph</a>`);

  if (node.self_hosting) {
    links.push(`<a href="/guides/what-is-self-hosting" class="discover-link">Is ${name} self-hosting?</a>`);
    links.push(`<a href="/guides/what-is-compiler-bootstrapping" class="discover-link">Compiler bootstrapping explained</a>`);
  }

  const hasBootstrap = rels.some(r => (r.to_language === node.id || r.from_language === node.id) && r.relationship === 'bootstrap_written_in');
  if (hasBootstrap && !node.self_hosting) {
    links.push(`<a href="/guides/what-is-compiler-bootstrapping" class="discover-link">How ${name} bootstraps its compiler</a>`);
  }

  const influenced = rels.filter(r => r.from_language === node.id && r.relationship === 'influenced')
    .sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  for (const r of influenced) {
    const t = nodeMap.get(r.to_language);
    if (t) links.push(`<a href="/${idToPrefix(t.id)}/${idToSlug(t.id)}" class="discover-link">Languages ${name} influenced: ${escapeHtml(t.name)}</a>`);
  }

  const influencers = rels.filter(r => r.to_language === node.id && r.relationship === 'influenced')
    .sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  for (const r of influencers) {
    const s = nodeMap.get(r.from_language);
    if (s) links.push(`<a href="/${idToPrefix(s.id)}/${idToSlug(s.id)}" class="discover-link">Languages that influenced ${name}: ${escapeHtml(s.name)}</a>`);
  }

  if (links.length === 0) return '';
  return `<section class="discover-more">
  <h2>Discover More</h2>
  <div class="discover-links">${links.join('\n  ')}</div>
</section>`;
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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

  ${buildDiscoverMore(node, rels, nodeMap)}

  <a class="explore-btn" href="/explore?lang=${encodeURIComponent(idToSlug(node.id))}">Explore ${escapeHtml(node.name)} in Graph &rarr;</a>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

// ============================================================
// QUESTION PAGES
// ============================================================

interface QuestionDef {
  slug: string;
  title: string;
  answer: string;
  details: string;
  relatedLangs: string[];
  relatedTools?: string[];
}

const QUESTIONS: QuestionDef[] = [
  {
    slug: 'what-is-python-written-in',
    title: 'What is Python written in?',
    answer: "Python's reference implementation, CPython, is written primarily in C. The language specification itself is implementation-independent, but CPython is the dominant runtime and is implemented in C for performance and portability. Other implementations include Jython (Java), PyPy (Python/RPython), and IronPython (.NET).",
    details: `<p>When people ask "what is Python written in?" they usually mean CPython, the reference implementation maintained by the Python Software Foundation. CPython's interpreter core and standard library are written in C, with some modules written in Python itself.</p>
<p>Python as a <em>language specification</em> is separate from any particular implementation. The specification doesn't mandate that Python must be implemented in C — but CPython happens to be the most widely deployed runtime.</p>
<p>The dataset records a <code>runtime_written_in</code> relationship from C to Python, indicating that Python's primary runtime is implemented in C.</p>`,
    relatedLangs: ['python', 'c'],
    relatedTools: [],
  },
  {
    slug: 'what-is-javascript-written-in',
    title: 'What is JavaScript written in?',
    answer: "The major JavaScript engines are written in C++. Google's V8 (used in Chrome and Node.js), Mozilla's SpiderMonkey, and Apple's JavaScriptCore are all implemented in C++. The JavaScript language specification is defined by ECMAScript and doesn't mandate any particular implementation language.",
    details: `<p>JavaScript engines perform lexing, parsing, compilation, and execution of JavaScript code. The performance-critical work of JIT compilation and garbage collection is done in C++ for most major engines.</p>
<p>V8, SpiderMonkey, and JavaScriptCore each compile JavaScript to native machine code using JIT techniques — a task that benefits from C++'s low-level memory control.</p>
<p>The dataset records <code>compiler_written_in</code> and <code>runtime_written_in</code> relationships from C++ to the major JavaScript engines.</p>`,
    relatedLangs: ['javascript', 'cxx'],
    relatedTools: ['v8', 'spidermonkey', 'javascriptcore'],
  },
  {
    slug: 'what-is-rust-written-in',
    title: 'What is Rust written in?',
    answer: "Rust is self-hosting: the Rust compiler (rustc) is written in Rust. The first version of rustc was written in OCaml; Rust became self-hosting in 2011. mrustc is an alternative Rust compiler written in C++ that can bootstrap rustc from source.",
    details: `<p>Rustc, the official Rust compiler, is written in Rust — making it a self-hosting compiler. Self-hosting means the compiler can compile its own source code.</p>
<p>The bootstrap chain works roughly as follows: a previous version of rustc (or mrustc) compiles the current rustc source. This allows Rust to evolve without depending on another language for its compiler.</p>
<p>The dataset records a <code>bootstrap_written_in</code> relationship showing Rust's self-hosting bootstrap chain, and a historical <code>compiler_written_in</code> relationship from OCaml representing the original implementation.</p>`,
    relatedLangs: ['rust', 'ocaml', 'cxx'],
    relatedTools: ['mrustc'],
  },
  {
    slug: 'what-is-go-written-in',
    title: 'What is Go written in?',
    answer: "Go is self-hosting since version 1.5 (2015). The Go compiler and runtime are written in Go itself. Before Go 1.5, the gc compiler was written in C. The transition to a self-hosted compiler was completed as part of the Go 1.5 release.",
    details: `<p>The Go compiler toolchain (gc) is written entirely in Go. The Go runtime — which handles goroutines, garbage collection, and the scheduler — is also written in Go, with some assembly for low-level operations.</p>
<p>Before Go 1.5, the compiler was written in C, and the runtime was a mix of C and Go. The Go team rewrote the compiler in Go as part of their language stability goals.</p>
<p>The dataset records a <code>bootstrap_written_in</code> relationship reflecting Go's self-hosted compiler, and a historical <code>compiler_written_in</code> from C.</p>`,
    relatedLangs: ['go', 'c'],
    relatedTools: [],
  },
  {
    slug: 'what-is-java-written-in',
    title: 'What is Java written in?',
    answer: "The Java compiler (javac) is written in Java — making it partially self-hosting. The HotSpot JVM, the primary Java runtime, is written in C and C++. The Java standard library (java.lang, java.util, etc.) is written in Java itself.",
    details: `<p>Java has two distinct implementations to consider: the compiler and the runtime.</p>
<p>The <strong>javac compiler</strong> is written in Java. It compiles Java source files to JVM bytecode. Because javac is itself written in Java, it must be bootstrapped using a previous version of the compiler.</p>
<p>The <strong>HotSpot JVM</strong> — the virtual machine that interprets or JIT-compiles bytecode at runtime — is written in C and C++. HotSpot includes the garbage collector, JIT compiler, class loader, and interpreter, all implemented in C/C++.</p>`,
    relatedLangs: ['java', 'c', 'cxx'],
    relatedTools: ['hotspot'],
  },
  {
    slug: 'what-is-c-written-in',
    title: 'What is C written in?',
    answer: "C compilers like GCC and Clang are written in C and C++. C is one of the earliest self-hosted languages — the original C compiler was written in B, then rewritten in C itself. GCC (GNU Compiler Collection) is primarily written in C and C++; Clang is written in C++.",
    details: `<p>C compilers are generally self-hosted: they are written in C (or C++) and can compile their own source code. GCC, the GNU Compiler Collection, is implemented primarily in C with some C++. Clang/LLVM is implemented in C++.</p>
<p>Historically, the original C compiler was written in B (a predecessor to C) on the PDP-7. It was then rewritten in C once the language had enough capability — one of the earliest examples of compiler bootstrapping.</p>
<p>The dataset records <code>compiler_written_in</code> relationships from C and C++ to GCC and Clang, and a historical bootstrap relationship reflecting C's early self-hosting.</p>`,
    relatedLangs: ['c', 'cxx', 'b'],
    relatedTools: ['gcc', 'clang'],
  },
  {
    slug: 'what-is-cpp-written-in',
    title: 'What is C++ written in?',
    answer: "C++ compilers including GCC and Clang/LLVM are implemented in C++. The original Cfront compiler — which translated C++ to C — was written in C. GCC became capable of compiling C++ and is itself written in C++. Clang, the modern alternative, is written in C++ and built on the LLVM infrastructure.",
    details: `<p>The two dominant C++ compilers are GCC and Clang. Both are written in C++, making them self-hosting for the C++ language.</p>
<p>Cfront, the original C++ compiler developed at Bell Labs in the 1980s, was written in C and translated C++ code into C for compilation. GCC later gained C++ support and is now written in C++ itself.</p>
<p>Clang is built on the LLVM compiler infrastructure. Both Clang and the LLVM core libraries are implemented in C++.</p>`,
    relatedLangs: ['cxx', 'c'],
    relatedTools: ['gcc', 'clang', 'llvm'],
  },
  {
    slug: 'what-is-typescript-written-in',
    title: 'What is TypeScript written in?',
    answer: "The TypeScript compiler (tsc) is written in TypeScript itself, making it self-hosting. It compiles TypeScript to JavaScript, so the compiled tsc runs on any JavaScript engine. The TypeScript compiler and language services are fully self-hosted.",
    details: `<p>TypeScript is self-hosting: the tsc compiler is written in TypeScript. This means TypeScript's compiler is compiled by itself — a previous version of tsc compiles the next version.</p>
<p>Since TypeScript compiles to JavaScript, the compiled tsc binary runs on Node.js or any JavaScript engine. This makes TypeScript's self-hosting unique: it's a compiled language whose compiler runs as interpreted JavaScript.</p>`,
    relatedLangs: ['typescript', 'javascript'],
    relatedTools: [],
  },
  {
    slug: 'what-is-ruby-written-in',
    title: 'What is Ruby written in?',
    answer: "The reference Ruby implementation, MRI (Matz's Ruby Interpreter, also called CRuby), is written in C. Alternative implementations include JRuby (written in Java, runs on the JVM) and TruffleRuby (based on GraalVM, also Java-based).",
    details: `<p>MRI/CRuby is the original and most widely used Ruby runtime, maintained by Yukihiro Matsumoto's team. Its interpreter and standard library are implemented in C.</p>
<p>JRuby is an alternative implementation that runs Ruby on the Java Virtual Machine. It's written in Java and provides interoperability with Java libraries.</p>
<p>The dataset records a <code>runtime_written_in</code> relationship from C to Ruby (MRI) and from Java to Ruby (JRuby).</p>`,
    relatedLangs: ['ruby', 'c', 'java'],
    relatedTools: [],
  },
  {
    slug: 'what-is-v8-written-in',
    title: 'What is V8 written in?',
    answer: "V8, Google's JavaScript engine used in Chrome, Node.js, and Deno, is written in C++. V8 compiles JavaScript directly to native machine code using JIT compilation. It's open source and maintained by Google.",
    details: `<p>V8 is a high-performance JavaScript and WebAssembly engine. It's used in Google Chrome, Node.js, Deno, and Electron, among others.</p>
<p>V8 is implemented in C++ and includes: a parser, a bytecode interpreter (Ignition), a JIT compiler (TurboFan), a garbage collector (Orinoco), and WebAssembly support (Liftoff/TurboFan).</p>
<p>The dataset records a <code>compiler_written_in</code> relationship from C++ to V8, and a <code>runtime_written_in</code> relationship from C++ to JavaScript via V8.</p>`,
    relatedLangs: ['javascript', 'cxx'],
    relatedTools: ['v8'],
  },
  {
    slug: 'what-is-cpython-written-in',
    title: 'What is CPython written in?',
    answer: "CPython, the reference implementation of Python, is written primarily in C. Its interpreter, object model, and most of the standard library are implemented in C. Some higher-level standard library modules (like email or html.parser) are written in Python.",
    details: `<p>CPython is the canonical Python implementation. When Python documentation refers to "Python," it typically means CPython's behavior.</p>
<p>CPython's core — the bytecode interpreter, memory allocator, garbage collector, object model, and C API — is implemented in C. This gives CPython excellent interoperability with C libraries via the Python/C API.</p>
<p>CPython compiles Python source files to .pyc bytecode files, which the interpreter then executes. This is distinct from true ahead-of-time compilation.</p>`,
    relatedLangs: ['python', 'c'],
    relatedTools: [],
  },
  {
    slug: 'what-is-compiler-bootstrapping',
    title: 'What is compiler bootstrapping?',
    answer: "Compiler bootstrapping is the process of writing a compiler for a programming language in that same language. The first version of the compiler must be written in another language; subsequent versions are compiled by the self-hosted compiler. Examples: Rust's rustc, Go's gc, TypeScript's tsc, and GHC (Haskell).",
    details: `<p>Bootstrapping a compiler is a milestone in a language's maturity: it means the language is expressive enough to implement its own compiler.</p>
<p>The bootstrap process typically works like this:</p>
<ol>
  <li>Write the first compiler in language X (another language)</li>
  <li>Use that compiler to compile a new compiler written in the target language</li>
  <li>The self-hosted compiler now compiles future versions of itself</li>
</ol>
<p>Bootstrapped compilers: Rust (originally OCaml, now Rust), Go (originally C, now Go since 1.5), TypeScript (TypeScript), Haskell/GHC (originally Haskell), Kotlin (originally Java, now Kotlin).</p>`,
    relatedLangs: ['rust', 'go', 'typescript', 'haskell'],
    relatedTools: [],
  },
  {
    slug: 'what-is-a-self-hosting-compiler',
    title: 'What is a self-hosting compiler?',
    answer: "A self-hosting compiler is a compiler that is written in the language it compiles. Once self-hosted, the language no longer depends on another language for its compiler. Self-hosting languages include Rust, Go, TypeScript, Haskell, and Kotlin, among others.",
    details: `<p>Self-hosting is closely related to bootstrapping. A compiler is self-hosting when its source code is written in the language it compiles — meaning it can compile itself.</p>
<p>Self-hosting compilers:</p>
<ul>
  <li><strong>Rust</strong> — rustc is written in Rust (self-hosted since 2011)</li>
  <li><strong>Go</strong> — gc toolchain is written in Go (since version 1.5)</li>
  <li><strong>TypeScript</strong> — tsc is written in TypeScript</li>
  <li><strong>Haskell/GHC</strong> — GHC is written in Haskell</li>
  <li><strong>Java/javac</strong> — javac is written in Java</li>
</ul>
<p>Self-hosting is considered a sign of language maturity. It also provides a kind of correctness check: if the language's own compiler works, many of the language's features have been validated in a real-world use case.</p>`,
    relatedLangs: ['rust', 'go', 'typescript', 'haskell', 'java'],
    relatedTools: ['ghc'],
  },
];

function buildQuestionPage(q: QuestionDef, nodeMap: Map<string, Language>): string {
  const url = `${SITE}/questions/${q.slug}`;
  const faqJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: q.title,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    }],
  });
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: `${SITE}/questions` },
      { '@type': 'ListItem', position: 3, name: q.title, item: url },
    ],
  });

  const relatedLinks = [
    ...q.relatedLangs.map(slug => {
      const node = nodeMap.get(`lang:${slug}`) ?? nodeMap.get(`tool:${slug}`);
      return node ? `<a href="/languages/${slug}" class="discover-link">${escapeHtml(node.name)}</a>` : '';
    }),
    ...(q.relatedTools ?? []).map(slug => {
      const node = nodeMap.get(`tool:${slug}`);
      return node ? `<a href="/tools/${slug}" class="discover-link">${escapeHtml(node.name)}</a>` : '';
    }),
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(q.title)} | Language Lineage</title>
  <meta name="description" content="${escapeHtml(q.answer.slice(0, 155))}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(q.title)} | Language Lineage" />
  <meta property="og:description" content="${escapeHtml(q.answer.slice(0, 155))}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(q.title)}" />
  <meta name="twitter:description" content="${escapeHtml(q.answer.slice(0, 155))}" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/questions">Questions</a> &rsaquo; ${escapeHtml(q.title)}
  </nav>

  <h1>${escapeHtml(q.title)}</h1>

  <div class="question-answer">${escapeHtml(q.answer)}</div>

  <h2>Details</h2>
  ${q.details}

  <h2>Explore in the Graph</h2>
  <p>See implementation and influence relationships interactively.</p>
  <a class="explore-btn" href="/explore">Open Interactive Graph &rarr;</a>

  ${relatedLinks.length > 0 ? `<section class="discover-more">
  <h2>Related Pages</h2>
  <div class="discover-links">
    ${relatedLinks.join('\n    ')}
    <a href="/programming-language-graph" class="discover-link">Programming language graph</a>
    <a href="/what-are-programming-languages-written-in" class="discover-link">What are programming languages written in?</a>
    <a href="/questions" class="discover-link">All questions</a>
  </div>
</section>` : ''}

</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildQuestionsIndex(): string {
  const url = `${SITE}/questions`;
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: url },
    ],
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Questions Answered | Language Lineage</title>
  <meta name="description" content="Direct answers to common programming language questions: what languages are written in, compiler bootstrapping, self-hosting compilers, and more." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Questions Answered | Language Lineage" />
  <meta property="og:description" content="Direct answers to common programming language questions." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Questions
  </nav>

  <h1>Programming Language Questions Answered</h1>
  <p>Direct, dataset-backed answers to common questions about what programming languages are written in, how compilers are bootstrapped, and how languages relate to each other.</p>

  <h2>What is X written in?</h2>
  <div class="related-grid">
    ${QUESTIONS.filter(q => q.slug.startsWith('what-is-') && q.slug.endsWith('-written-in')).map(q =>
      `<a href="/questions/${q.slug}" class="related-card">${escapeHtml(q.title)}</a>`
    ).join('\n    ')}
  </div>

  <h2>Concepts</h2>
  <div class="related-grid">
    ${QUESTIONS.filter(q => !q.slug.endsWith('-written-in')).map(q =>
      `<a href="/questions/${q.slug}" class="related-card">${escapeHtml(q.title)}</a>`
    ).join('\n    ')}
  </div>

  <a class="explore-btn" href="/explore">Explore the Interactive Graph &rarr;</a>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

// ============================================================
// LANDING PAGES
// ============================================================

function buildProgrammingLanguageGraph(languages: Language[], rels: Relationship[]): string {
  const url = `${SITE}/programming-language-graph`;
  const langCount = languages.filter(l => l.id.startsWith('lang:')).length;
  const toolCount = languages.filter(l => l.id.startsWith('tool:')).length;
  const relTypes = [...new Set(rels.map(r => r.relationship))];
  const faqs = [
    { q: 'What is a programming language graph?', a: 'A programming language graph is a network visualization showing relationships between programming languages — including influence, ancestry, compiler implementation, runtime implementation, and bootstrapping chains.' },
    { q: 'How many languages are in the Language Lineage graph?', a: `The Language Lineage graph contains ${langCount} programming languages and ${toolCount} compilers/runtimes, connected by ${rels.length} relationships.` },
    { q: 'What relationships does the graph show?', a: 'The graph shows: influence (language A inspired language B), compiler_written_in (the compiler for language A is written in B), runtime_written_in (the runtime is written in B), bootstrap_written_in (A bootstraps via B), transpiled_to (A compiles to B), and rewritten_in.' },
    { q: 'How is this different from HOPL or Wikipedia genealogy charts?', a: 'HOPL and Wikipedia show influence and ancestry. Language Lineage adds implementation relationships — what compilers and runtimes are actually written in — with confidence scores and evidence sources for every relationship.' },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Programming Language Graph', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Graph | Interactive Language Lineage Map</title>
  <meta name="description" content="Explore an interactive programming language graph with ${langCount} languages and ${rels.length} relationships. See what languages are written in, how compilers are implemented, and how languages influenced each other." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Graph | Interactive Language Lineage Map" />
  <meta property="og:description" content="Interactive programming language graph: ${langCount} languages, ${rels.length} relationships, implementation and influence data." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Programming Language Graph
  </nav>

  <h1>Programming Language Graph</h1>
  <p>An interactive graph of ${langCount} programming languages and ${toolCount} compilers and runtimes, connected by ${rels.length} evidence-backed relationships. Explore how languages influenced each other and what they are implemented in.</p>

  <div class="answer-box">The Language Lineage graph maps both <strong>influence relationships</strong> (which language inspired which) and <strong>implementation relationships</strong> (what compiler, runtime, or bootstrap chain each language uses) — with confidence scores and source citations for every edge.</div>

  <h2>What is a programming language graph?</h2>
  <p>A programming language graph represents languages as nodes and their relationships as edges. Unlike a static family tree, an interactive graph lets you:</p>
  <ul>
    <li>Click any language to see its direct connections</li>
    <li>Filter by relationship type (influence, implementation, bootstrapping)</li>
    <li>Trace ancestry chains across multiple generations</li>
    <li>Switch between network, tree, cluster, and timeline layouts</li>
  </ul>

  <h2>Relationship types in the graph</h2>
  <table class="impl-table">
    <thead><tr><th>Relationship</th><th>Meaning</th><th>Count</th></tr></thead>
    <tbody>
      ${relTypes.map(t => {
        const count = rels.filter(r => r.relationship === t).length;
        const slug = t.replace(/_/g, '-');
        const label = t.replace(/_/g, ' ');
        return `<tr><td><a href="/relationships/${slug}">${label}</a></td><td>${
          t === 'influenced' ? 'Language A inspired language B' :
          t === 'compiler_written_in' ? 'A\'s compiler is written in B' :
          t === 'runtime_written_in' ? 'A\'s runtime is written in B' :
          t === 'bootstrap_written_in' ? 'A bootstraps its compiler from B' :
          t === 'transpiled_to' ? 'A compiles to B' :
          t === 'rewritten_in' ? 'A was rewritten in B' : t
        }</td><td>${count}</td></tr>`;
      }).join('\n      ')}
    </tbody>
  </table>

  <h2>Popular languages in the graph</h2>
  <div class="related-grid">
    <a href="/languages/python" class="related-card">Python</a>
    <a href="/languages/javascript" class="related-card">JavaScript</a>
    <a href="/languages/rust" class="related-card">Rust</a>
    <a href="/languages/go" class="related-card">Go</a>
    <a href="/languages/java" class="related-card">Java</a>
    <a href="/languages/c" class="related-card">C</a>
    <a href="/languages/cxx" class="related-card">C++</a>
    <a href="/languages/typescript" class="related-card">TypeScript</a>
    <a href="/languages/haskell" class="related-card">Haskell</a>
    <a href="/languages/lisp" class="related-card">Lisp</a>
    <a href="/languages/ruby" class="related-card">Ruby</a>
    <a href="/languages/scala" class="related-card">Scala</a>
  </div>

  <h2>How is this different from a static genealogy chart?</h2>
  <p>Static programming language genealogy charts (like the HOPL database or Wikipedia's SVG diagrams) show influence ancestry. Language Lineage adds:</p>
  <ul>
    <li><strong>Implementation data</strong> — what compilers and runtimes are written in</li>
    <li><strong>Bootstrap chains</strong> — which languages can compile their own compilers</li>
    <li><strong>Confidence scores</strong> — every relationship has a confidence value (0–1)</li>
    <li><strong>Evidence sources</strong> — links to Wikipedia, papers, and documentation for every edge</li>
    <li><strong>Interactivity</strong> — click, filter, zoom, switch layouts</li>
  </ul>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Open Interactive Graph &rarr;</a>

  <section class="discover-more">
    <h2>Related Pages</h2>
    <div class="discover-links">
      <a href="/programming-language-family-tree" class="discover-link">Programming language family tree</a>
      <a href="/programming-language-evolution" class="discover-link">Programming language evolution timeline</a>
      <a href="/what-are-programming-languages-written-in" class="discover-link">What are programming languages written in?</a>
      <a href="/programming-language-genealogy" class="discover-link">Programming language genealogy</a>
      <a href="/compiler-runtime-bootstrap" class="discover-link">Compiler, runtime, and bootstrap explained</a>
      <a href="/dataset" class="discover-link">Dataset</a>
    </div>
  </section>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildProgrammingLanguageFamilyTree(languages: Language[]): string {
  const url = `${SITE}/programming-language-family-tree`;
  const langCount = languages.filter(l => l.id.startsWith('lang:')).length;
  const families = [
    { name: 'C family', members: ['C', 'C++', 'Objective-C', 'Java', 'JavaScript', 'C#', 'Go', 'Rust'], desc: 'Languages influenced by C\'s syntax and systems-programming philosophy.' },
    { name: 'Lisp family', members: ['Lisp', 'Scheme', 'Common Lisp', 'Clojure', 'Racket', 'Emacs Lisp'], desc: 'Languages derived from John McCarthy\'s Lisp, emphasizing homoiconicity and macros.' },
    { name: 'ML family', members: ['ML', 'OCaml', 'Haskell', 'F#', 'Elm', 'ReasonML', 'SML'], desc: 'Statically typed functional languages with algebraic data types and type inference.' },
    { name: 'JVM family', members: ['Java', 'Scala', 'Kotlin', 'Groovy', 'Clojure'], desc: 'Languages that compile to JVM bytecode and run on the Java Virtual Machine.' },
    { name: 'BEAM family', members: ['Erlang', 'Elixir', 'Gleam'], desc: 'Languages targeting the BEAM (Erlang VM), designed for concurrency and fault tolerance.' },
  ];
  const faqs = [
    { q: 'What is a programming language family tree?', a: 'A programming language family tree shows which languages influenced or descended from other languages. Languages in the same "family" share syntactic, semantic, or conceptual heritage.' },
    { q: 'What is the C family of programming languages?', a: 'The C family includes languages that adopted C\'s syntax (curly braces, semicolons) or systems-programming philosophy: C++, Objective-C, Java, C#, Go, Rust, JavaScript, and many others.' },
    { q: 'What is the Lisp family of languages?', a: 'The Lisp family includes languages derived from John McCarthy\'s original Lisp (1958): Scheme, Common Lisp, Clojure, Racket, and Emacs Lisp. They share s-expression syntax and support for macros.' },
    { q: 'How does Language Lineage differ from a traditional family tree?', a: 'Traditional family trees show influence. Language Lineage also maps implementation relationships: what compilers and runtimes each language uses, bootstrap chains, and transpilation targets — with confidence scores and evidence sources.' },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Programming Language Family Tree', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Family Tree | Interactive Lineage Graph</title>
  <meta name="description" content="Explore the programming language family tree: C family, Lisp family, ML family, JVM family, and more. Interactive graph with ${langCount} languages and implementation relationships." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Family Tree | Interactive Lineage Graph" />
  <meta property="og:description" content="C family, Lisp family, ML family, JVM family and more — interactive programming language family tree with implementation data." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Programming Language Family Tree
  </nav>

  <h1>Programming Language Family Tree</h1>
  <p>The programming language family tree maps how languages descend from and influence each other. Language Lineage extends this with implementation data — what compilers, runtimes, and bootstrap chains each language uses.</p>

  <div class="answer-box">The Language Lineage graph contains ${langCount} programming languages grouped into families by influence, implementation, and conceptual ancestry. It goes beyond influence trees to include <strong>compiler, runtime, and bootstrap relationships</strong>.</div>

  ${families.map(f => `<h2>The ${escapeHtml(f.name)}</h2>
  <p>${escapeHtml(f.desc)}</p>
  <div class="related-grid">
    ${f.members.map(m => {
      const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const fixedSlug = slug === 'c++' ? 'cxx' : slug === 'c#' ? 'csharp' : slug === 'objective-c' ? 'objective-c' : slug === 'f#' ? 'fsharp' : slug;
      return `<a href="/languages/${fixedSlug}" class="related-card">${escapeHtml(m)}</a>`;
    }).join('\n    ')}
  </div>`).join('\n\n  ')}

  <h2>More than influence — implementation lineage</h2>
  <p>Traditional family trees show only conceptual influence. Language Lineage also tracks:</p>
  <ul>
    <li><a href="/relationships/compiler-written-in"><strong>compiler_written_in</strong></a> — what language each compiler is implemented in</li>
    <li><a href="/relationships/runtime-written-in"><strong>runtime_written_in</strong></a> — what language each runtime or VM is implemented in</li>
    <li><a href="/relationships/bootstrap-written-in"><strong>bootstrap_written_in</strong></a> — how self-hosting compilers bootstrap themselves</li>
    <li><a href="/relationships/transpiled-to"><strong>transpiled_to</strong></a> — which languages compile to other languages</li>
  </ul>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore the Family Tree Interactively &rarr;</a>

  <section class="discover-more">
    <h2>Related Pages</h2>
    <div class="discover-links">
      <a href="/programming-language-graph" class="discover-link">Programming language graph</a>
      <a href="/programming-language-genealogy" class="discover-link">Programming language genealogy</a>
      <a href="/programming-language-evolution" class="discover-link">Programming language evolution</a>
      <a href="/guides/programming-language-family-tree" class="discover-link">Guide: Programming language family tree</a>
      <a href="/what-are-programming-languages-written-in" class="discover-link">What are programming languages written in?</a>
    </div>
  </section>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildProgrammingLanguageGenealogy(languages: Language[], rels: Relationship[]): string {
  const url = `${SITE}/programming-language-genealogy`;
  const influenceCount = rels.filter(r => r.relationship === 'influenced').length;
  const faqs = [
    { q: 'What is programming language genealogy?', a: 'Programming language genealogy is the study of how programming languages descend from, influence, and relate to each other — tracing ancestry chains and identifying language families.' },
    { q: 'How is influence different from implementation in language genealogy?', a: 'Influence means one language inspired another\'s design. Implementation means one language was used to build another\'s compiler, runtime, or interpreter. Both are part of a complete language lineage picture.' },
    { q: 'Which programming language has the most descendants?', a: 'C and Lisp are among the most influential languages by direct and indirect influence. Many modern languages — Go, Rust, JavaScript, Java — trace some ancestry to C.' },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Programming Language Genealogy', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Genealogy | Language Evolution and Influence</title>
  <meta name="description" content="Explore programming language genealogy: ${influenceCount} influence relationships, language families, ancestry chains, and implementation lineage across ${languages.length} languages." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Genealogy | Language Evolution and Influence" />
  <meta property="og:description" content="Programming language genealogy: influence, ancestry, and implementation relationships across ${languages.length} languages." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Programming Language Genealogy
  </nav>

  <h1>Programming Language Genealogy</h1>
  <p>Programming language genealogy traces ancestry, influence, and implementation relationships between languages — from the first high-level languages of the 1950s to modern systems and scripting languages.</p>

  <div class="answer-box">The Language Lineage dataset contains <strong>${influenceCount} influence relationships</strong> across ${languages.filter(l => l.id.startsWith('lang:')).length} programming languages, tracking both conceptual influence and implementation lineage.</div>

  <h2>Influence versus implementation</h2>
  <p>Programming language genealogy has two distinct dimensions:</p>
  <ul>
    <li><strong>Conceptual influence</strong> — language A's design choices inspired language B (syntax, semantics, paradigm). Example: Smalltalk influenced Python's object model.</li>
    <li><strong>Implementation lineage</strong> — language A was used to build B's compiler, runtime, or interpreter. Example: C was used to implement CPython (Python's runtime).</li>
  </ul>
  <p>Most genealogy charts show only influence. Language Lineage shows both, with <a href="/dataset">evidence sources and confidence scores</a>.</p>

  <h2>Major genealogical lines</h2>
  <ul>
    <li><strong>FORTRAN → COBOL → PL/1 → ALGOL 60</strong> — early high-level languages</li>
    <li><strong>ALGOL 60 → CPL → BCPL → B → C</strong> — the path to C</li>
    <li><strong>C → C++ → Java → Kotlin / Scala</strong> — object-oriented mainstream</li>
    <li><strong>Lisp → Scheme → Racket, Common Lisp → Clojure</strong> — functional tradition</li>
    <li><strong>ML → SML → OCaml → F#, ReasonML</strong> — typed functional languages</li>
    <li><strong>Smalltalk → Objective-C, Ruby, Python (OO concepts)</strong> — message-passing OO</li>
  </ul>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore Genealogy Interactively &rarr;</a>

  <section class="discover-more">
    <h2>Related Pages</h2>
    <div class="discover-links">
      <a href="/programming-language-graph" class="discover-link">Programming language graph</a>
      <a href="/programming-language-family-tree" class="discover-link">Programming language family tree</a>
      <a href="/programming-language-evolution" class="discover-link">Programming language evolution timeline</a>
      <a href="/relationships/influenced" class="discover-link">All influence relationships</a>
      <a href="/dataset" class="discover-link">Browse the dataset</a>
    </div>
  </section>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildProgrammingLanguageEvolution(languages: Language[]): string {
  const url = `${SITE}/programming-language-evolution`;
  const langNodes = languages.filter(l => l.id.startsWith('lang:') && l.first_release_year);
  const decades: Record<number, Language[]> = {};
  for (const l of langNodes) {
    const dec = Math.floor((l.first_release_year as number) / 10) * 10;
    if (!decades[dec]) decades[dec] = [];
    decades[dec].push(l);
  }
  const sortedDecades = Object.keys(decades).map(Number).sort();
  const minYear = Math.min(...langNodes.map(l => l.first_release_year as number));
  const maxYear = Math.max(...langNodes.map(l => l.first_release_year as number));
  const faqs = [
    { q: 'When was the first programming language created?', a: `The earliest programming languages in the dataset date to ${minYear}. Assembly language and FORTRAN were among the first high-level languages in the late 1940s and 1950s.` },
    { q: 'Which decade had the most new programming languages?', a: `The ${sortedDecades.reduce((a, b) => (decades[a]?.length ?? 0) >= (decades[b]?.length ?? 0) ? a : b)}s had the most new languages in this dataset (${Math.max(...sortedDecades.map(d => decades[d]?.length ?? 0))} languages), reflecting rapid growth in the field.` },
    { q: 'What programming languages were created most recently?', a: `The dataset includes languages up to ${maxYear}. Recent languages include Rust (2015), Kotlin (2011), Swift (2014), Mojo (2023), and others.` },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Programming Language Evolution', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Evolution Timeline | ${minYear} to ${maxYear}</title>
  <meta name="description" content="Trace the evolution of programming languages from ${minYear} to ${maxYear}. Decade-by-decade timeline of ${langNodes.length} languages with influence and implementation relationships." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Evolution Timeline | ${minYear} to ${maxYear}" />
  <meta property="og:description" content="${langNodes.length} languages, ${minYear}–${maxYear}. Decade-by-decade programming language evolution." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Programming Language Evolution
  </nav>

  <h1>Programming Language Evolution Timeline</h1>
  <p>From assembly language in ${minYear} to modern systems languages in ${maxYear} — trace how programming languages evolved decade by decade. Each language links to its full lineage page with compiler, runtime, and influence relationships.</p>

  <div class="answer-box">The dataset spans <strong>${minYear}–${maxYear}</strong> with ${langNodes.length} programming languages. See the <a href="/timeline">interactive timeline visualization</a> for a graphical view.</div>

  ${sortedDecades.map(dec => {
    const langs = (decades[dec] ?? []).sort((a, b) => (a.first_release_year ?? 0) - (b.first_release_year ?? 0));
    return `<h2>${dec}s — ${langs.length} language${langs.length !== 1 ? 's' : ''}</h2>
  <div class="related-grid">
    ${langs.map(l => `<a href="/languages/${idToSlug(l.id)}" class="related-card">${escapeHtml(l.name)}${l.first_release_year ? ` <small>(${l.first_release_year})</small>` : ''}</a>`).join('\n    ')}
  </div>`;
  }).join('\n\n  ')}

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/timeline">View Interactive Timeline &rarr;</a>

  <section class="discover-more">
    <h2>Related Pages</h2>
    <div class="discover-links">
      <a href="/programming-language-graph" class="discover-link">Interactive programming language graph</a>
      <a href="/programming-language-family-tree" class="discover-link">Programming language family tree</a>
      <a href="/programming-language-genealogy" class="discover-link">Programming language genealogy</a>
      <a href="/timeline" class="discover-link">Timeline visualization</a>
    </div>
  </section>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildWhatAreLanguagesWrittenIn(languages: Language[], rels: Relationship[], nodeMap: Map<string, Language>): string {
  const url = `${SITE}/what-are-programming-languages-written-in`;
  const implRels = rels.filter(r => ['compiler_written_in','runtime_written_in'].includes(r.relationship));
  const examples = [
    { lang: 'Python', impl: 'C (CPython)', langSlug: 'python', implSlug: 'c', note: 'Reference implementation (CPython) is written in C' },
    { lang: 'JavaScript', impl: 'C++ (V8, SpiderMonkey)', langSlug: 'javascript', implSlug: 'cxx', note: 'Major engines (V8, SpiderMonkey, JavaScriptCore) are written in C++' },
    { lang: 'Rust', impl: 'Rust (self-hosting)', langSlug: 'rust', implSlug: 'rust', note: 'rustc is self-hosted; originally written in OCaml' },
    { lang: 'Go', impl: 'Go (self-hosting)', langSlug: 'go', implSlug: 'go', note: 'Self-hosting since Go 1.5; previously written in C' },
    { lang: 'Java', impl: 'C/C++ (HotSpot JVM)', langSlug: 'java', implSlug: 'c', note: 'HotSpot JVM is in C/C++; javac compiler is in Java' },
    { lang: 'TypeScript', impl: 'TypeScript (self-hosting)', langSlug: 'typescript', implSlug: 'typescript', note: 'tsc is self-hosted in TypeScript' },
    { lang: 'Ruby', impl: 'C (MRI/CRuby)', langSlug: 'ruby', implSlug: 'c', note: 'Reference implementation (MRI) is written in C' },
    { lang: 'Haskell', impl: 'Haskell (GHC)', langSlug: 'haskell', implSlug: 'haskell', note: 'GHC compiler is written in Haskell' },
  ];
  const faqs = [
    { q: 'What does "what is a programming language written in" mean?', a: 'It means what programming language was used to implement the compiler, interpreter, or runtime of another language. The implementation language is different from the language specification.' },
    { q: 'Can a language be written in itself?', a: 'Yes — this is called a self-hosting compiler. Rust, Go, TypeScript, Haskell, and Java\'s javac are all self-hosting. The first version must be written in another language, then it bootstraps itself.' },
    { q: 'Why does it matter what a language is written in?', a: 'The implementation language affects performance characteristics, portability, interoperability with native libraries, and how the language bootstraps itself. C and C++ are common choices for performance-critical runtimes.' },
    { q: 'How many languages in the dataset have compiler or runtime implementation data?', a: `The dataset includes ${implRels.length} compiler and runtime relationships across ${new Set(implRels.map(r => r.to_language)).size} languages.` },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'What Are Programming Languages Written In', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>What Are Programming Languages Written In?</title>
  <meta name="description" content="What are programming languages written in? Python is written in C, JavaScript engines in C++, Rust in Rust, Go in Go. Explore ${implRels.length} implementation relationships with evidence." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="What Are Programming Languages Written In?" />
  <meta property="og:description" content="Python is in C, JavaScript engines in C++, Rust in Rust. Explore ${implRels.length} compiler and runtime relationships." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; What Are Programming Languages Written In?
  </nav>

  <h1>What are programming languages written in?</h1>

  <div class="answer-box">Programming languages are implemented using other programming languages. The implementation language (used to build the compiler or runtime) is separate from the language specification itself. C and C++ are the most common implementation languages for performance-critical runtimes.</div>

  <h2>Language vs. implementation</h2>
  <p>When we say "Python is written in C," we mean CPython — the reference implementation — is written in C. The Python <em>language specification</em> doesn't mandate any implementation language. You could write a Python interpreter in JavaScript, and some people have.</p>
  <p>The key terms:</p>
  <ul>
    <li><strong>Language specification</strong> — defines the syntax and semantics (e.g., the Python Reference Manual)</li>
    <li><strong>Compiler</strong> — translates source code to machine code or bytecode (e.g., javac, rustc, tsc)</li>
    <li><strong>Interpreter / runtime</strong> — executes code (e.g., CPython, V8, HotSpot JVM)</li>
    <li><strong>VM (virtual machine)</strong> — an abstract machine that runs bytecode (JVM, CLR, BEAM)</li>
  </ul>

  <h2>What popular languages are written in</h2>
  <table class="impl-table">
    <thead><tr><th>Language</th><th>Primary implementation</th><th>Notes</th></tr></thead>
    <tbody>
      ${examples.map(e => `<tr>
        <td><a href="/languages/${e.langSlug}">${escapeHtml(e.lang)}</a></td>
        <td><a href="/languages/${e.implSlug}">${escapeHtml(e.impl)}</a></td>
        <td>${escapeHtml(e.note)}</td>
      </tr>`).join('\n      ')}
    </tbody>
  </table>

  <h2>Why C and C++ are so common</h2>
  <p>Most production programming language runtimes are implemented in C or C++ because:</p>
  <ul>
    <li>Direct memory control for garbage collectors and allocators</li>
    <li>Predictable performance without a runtime of their own</li>
    <li>Mature tooling and portability across architectures</li>
    <li>Historical: C was the dominant systems language when most early runtimes were written</li>
  </ul>

  <h2>Self-hosting languages</h2>
  <p>Some languages' compilers are written in the language itself — called self-hosting. This requires bootstrapping: an initial compiler written in another language, which is then used to compile the self-hosted version. Self-hosting languages: <a href="/languages/rust">Rust</a>, <a href="/languages/go">Go</a>, <a href="/languages/typescript">TypeScript</a>, <a href="/languages/haskell">Haskell</a>, <a href="/languages/java">Java (javac)</a>.</p>
  <p>See: <a href="/questions/what-is-compiler-bootstrapping">What is compiler bootstrapping?</a> and <a href="/questions/what-is-a-self-hosting-compiler">What is a self-hosting compiler?</a></p>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore Implementation Relationships &rarr;</a>

  <section class="discover-more">
    <h2>Individual Language Questions</h2>
    <div class="discover-links">
      <a href="/questions/what-is-python-written-in" class="discover-link">What is Python written in?</a>
      <a href="/questions/what-is-javascript-written-in" class="discover-link">What is JavaScript written in?</a>
      <a href="/questions/what-is-rust-written-in" class="discover-link">What is Rust written in?</a>
      <a href="/questions/what-is-go-written-in" class="discover-link">What is Go written in?</a>
      <a href="/questions/what-is-java-written-in" class="discover-link">What is Java written in?</a>
      <a href="/questions/what-is-c-written-in" class="discover-link">What is C written in?</a>
      <a href="/questions/what-is-cpp-written-in" class="discover-link">What is C++ written in?</a>
      <a href="/questions/what-is-typescript-written-in" class="discover-link">What is TypeScript written in?</a>
      <a href="/questions/what-is-compiler-bootstrapping" class="discover-link">What is compiler bootstrapping?</a>
      <a href="/relationships/compiler-written-in" class="discover-link">All compiler relationships</a>
      <a href="/relationships/runtime-written-in" class="discover-link">All runtime relationships</a>
    </div>
  </section>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildCompilerRuntimeBootstrap(rels: Relationship[]): string {
  const url = `${SITE}/compiler-runtime-bootstrap`;
  const relTypeCounts: Record<string, number> = {};
  for (const r of rels) { relTypeCounts[r.relationship] = (relTypeCounts[r.relationship] ?? 0) + 1; }
  const faqs = [
    { q: 'What is the difference between a compiler and a runtime?', a: 'A compiler translates source code to another form (machine code, bytecode, or another language). A runtime is the environment that executes the program — managing memory, concurrency, and standard library calls at execution time.' },
    { q: 'What does runtime_written_in mean in the dataset?', a: 'runtime_written_in means the runtime or interpreter for language A is implemented in language B. For example, CPython (Python\'s runtime) is written in C, so there\'s a runtime_written_in relationship from C to Python.' },
    { q: 'What is a bootstrap compiler?', a: 'A bootstrap compiler is an intermediate compiler used to bring a self-hosting compiler into existence. For example, Rust\'s first bootstrapper was written in OCaml; Go\'s first compiler was written in C.' },
    { q: 'How does transpilation differ from compilation?', a: 'Transpilation (source-to-source compilation) transforms code from one high-level language to another, rather than to machine code or bytecode. TypeScript transpiles to JavaScript. CoffeeScript transpiles to JavaScript.' },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Compiler, Runtime, and Bootstrap', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Compiler, Runtime, and Bootstrap Relationships Explained | Language Lineage</title>
  <meta name="description" content="Understand compiler, runtime, and bootstrap relationships in programming language implementation. Definitions, examples, and dataset evidence for all relationship types." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  <link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Compiler, Runtime, and Bootstrap Relationships Explained" />
  <meta property="og:description" content="Compiler, runtime, bootstrap, transpilation — what they mean and how Language Lineage tracks them." />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; Compiler, Runtime, and Bootstrap Relationships
  </nav>

  <h1>Compiler, Runtime, and Bootstrap Relationships Explained</h1>
  <p>Language Lineage tracks six types of relationships between programming languages. This page explains what each means, with examples from the dataset.</p>

  <h2>Relationship types</h2>
  <table class="impl-table">
    <thead><tr><th>Relationship</th><th>Meaning</th><th>Example</th><th>Count</th></tr></thead>
    <tbody>
      <tr><td><a href="/relationships/compiler-written-in">compiler_written_in</a></td><td>Language A's compiler is implemented in B</td><td>rustc is written in Rust</td><td>${relTypeCounts['compiler_written_in'] ?? 0}</td></tr>
      <tr><td><a href="/relationships/runtime-written-in">runtime_written_in</a></td><td>Language A's runtime/interpreter is implemented in B</td><td>CPython is written in C</td><td>${relTypeCounts['runtime_written_in'] ?? 0}</td></tr>
      <tr><td><a href="/relationships/bootstrap-written-in">bootstrap_written_in</a></td><td>Language A bootstraps from B (initial compiler was in B)</td><td>Rust bootstrapped from OCaml</td><td>${relTypeCounts['bootstrap_written_in'] ?? 0}</td></tr>
      <tr><td><a href="/relationships/influenced">influenced</a></td><td>Language A's design influenced language B</td><td>C influenced Go</td><td>${relTypeCounts['influenced'] ?? 0}</td></tr>
      <tr><td><a href="/relationships/transpiled-to">transpiled_to</a></td><td>Language A compiles to language B (source-to-source)</td><td>TypeScript transpiles to JavaScript</td><td>${relTypeCounts['transpiled_to'] ?? 0}</td></tr>
      <tr><td><a href="/relationships/rewritten-in">rewritten_in</a></td><td>Language A's implementation was rewritten in B</td><td>Go compiler rewritten from C to Go</td><td>${relTypeCounts['rewritten_in'] ?? 0}</td></tr>
    </tbody>
  </table>

  <h2>What is a compiler?</h2>
  <p>A compiler translates source code from one language to another — typically from a high-level language to machine code, bytecode, or another high-level language. Examples: <a href="/tools/gcc">GCC</a> (C/C++ → machine code), <a href="/tools/ghc">GHC</a> (Haskell → machine code), tsc (TypeScript → JavaScript).</p>

  <h2>What is a runtime?</h2>
  <p>A runtime (or interpreter) is the environment that executes a program. It handles memory allocation, garbage collection, I/O, and standard library calls at execution time. Examples: <a href="/tools/v8">V8</a> (JavaScript), CPython (Python), <a href="/tools/hotspot">HotSpot JVM</a> (Java bytecode).</p>

  <h2>What is compiler bootstrapping?</h2>
  <p>Bootstrapping is the process of using a compiler to compile a new version of itself. The first compiler for a language must be written in another language; once functional, it can compile a self-hosted version written in the target language itself. See: <a href="/questions/what-is-compiler-bootstrapping">full bootstrapping explainer</a>.</p>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore Implementation Relationships &rarr;</a>

  <section class="discover-more">
    <h2>Related Pages</h2>
    <div class="discover-links">
      <a href="/guides/what-is-compiler-bootstrapping" class="discover-link">Guide: What is compiler bootstrapping?</a>
      <a href="/guides/what-is-self-hosting" class="discover-link">Guide: What is a self-hosting compiler?</a>
      <a href="/guides/compiler-vs-interpreter-vs-runtime" class="discover-link">Compiler vs interpreter vs runtime</a>
      <a href="/what-are-programming-languages-written-in" class="discover-link">What are programming languages written in?</a>
      <a href="/questions/what-is-compiler-bootstrapping" class="discover-link">What is compiler bootstrapping? (Q&amp;A)</a>
      <a href="/dataset" class="discover-link">Browse the full dataset</a>
    </div>
  </section>
</main>
${FOOTER_HTML}
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
${FOOTER_HTML}
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
${FOOTER_HTML}
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
${FOOTER_HTML}
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
${FOOTER_HTML}
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
${FOOTER_HTML}
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
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
${FOOTER_HTML}
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
  const YEAR_START = 1948, YEAR_END = 2026;
  const CANVAS_H = 520, CENTER_Y = 260, WAVE_AMP = 70, WAVE_FREQ = 0.38;
  const X_PAD = 160, NODE_SPACING = 220, PX_PER_YEAR = 80;

  const degree: Record<string, number> = {};
  rels.forEach(r => {
    degree[r.from_language] = (degree[r.from_language] ?? 0) + 1;
    degree[r.to_language] = (degree[r.to_language] ?? 0) + 1;
  });

  const SELF_HOSTING = new Set<string>();
  rels.forEach(r => { if (r.relationship === 'bootstrap_written_in') SELF_HOSTING.add(r.to_language); });
  languages.forEach(l => { if (l.self_hosting) SELF_HOSTING.add(l.id); });

  const sorted = languages
    .filter(l => l.first_release_year && l.first_release_year >= YEAR_START)
    .sort((a, b) => (a.first_release_year ?? 0) - (b.first_release_year ?? 0));

  let prevX = X_PAD;
  const yearRankCount: Record<number, number> = {};

  const tlNodes = sorted.map((lang, idx) => {
    const yearX = X_PAD + (lang.first_release_year! - YEAR_START) * PX_PER_YEAR;
    const x = Math.max(yearX, prevX + (idx === 0 ? 0 : NODE_SPACING));
    prevX = x;
    const spineY = Math.round(CENTER_Y + Math.sin(idx * WAVE_FREQ) * WAVE_AMP);
    const cardY = spineY;
    const slug = idToSlug(lang.id);
    const prefix = lang.id.startsWith('tool:') ? 'tools' : 'languages';
    const logoUrl = (LOGO_MAP as Record<string, string | null>)[lang.id] ?? null;
    const color = (LOGO_COLORS as Record<string, string | null>)[lang.id] ?? '#c9a87c';
    const note = (lang.notes ?? '').split('.')[0].slice(0, 100) || null;
    const yr = lang.first_release_year!;
    const barRank = yearRankCount[yr] ?? 0;
    yearRankCount[yr] = barRank + 1;
    const barX = Math.round(X_PAD + (yr - YEAR_START) * PX_PER_YEAR);
    const barY = Math.round(CANVAS_H - 20 - barRank * 38);
    return {
      id: lang.id, name: lang.name, year: yr,
      x: Math.round(x), spineY, cardY, slug, prefix,
      logo: logoUrl, color, note,
      tags: (lang.paradigm ?? []).slice(0, 3),
      selfHosting: SELF_HOSTING.has(lang.id),
      barX, barY,
    };
  });

  const CANVAS_W = Math.ceil((tlNodes[tlNodes.length - 1]?.x ?? 5000) + X_PAD * 2);

  // Per-segment bezier paths (0.6 horizontal offset = "flat-then-steep" Google swoosh)
  const segmentsHtml = tlNodes.slice(1).map((c, i) => {
    const p = tlNodes[i];
    const dx = c.x - p.x;
    const cp1x = Math.round(p.x + dx * 0.6);
    const cp2x = Math.round(c.x - dx * 0.6);
    const d = `M ${p.x} ${p.spineY} C ${cp1x} ${p.spineY} ${cp2x} ${c.spineY} ${c.x} ${c.spineY}`;
    return `<path class="tl-seg-bg" d="${d}"/><path class="tl-seg" id="tl-seg-${i}" d="${d}" data-idx="${i}"/>`;
  }).join('\n    ');


  // Decade tick marks in SVG
  const decadeSet = new Set(sorted.map(l => Math.floor((l.first_release_year ?? 1980) / 10) * 10));
  const decadeXMap: Record<number, number> = {};
  [...decadeSet].sort((a, b) => a - b).forEach(decade => {
    const first = tlNodes.find(n => n.year >= decade);
    if (first) decadeXMap[decade] = first.x;
  });
  const decadeTicksHtml = Object.entries(decadeXMap).map(([d, x]) =>
    `<line x1="${x}" y1="${CANVAS_H-20}" x2="${x}" y2="${CANVAS_H-8}" stroke="rgba(245,240,232,0.14)" stroke-width="1"/>
    <text x="${x}" y="${CANVAS_H-2}" font-size="9" fill="rgba(245,240,232,0.22)" text-anchor="middle" font-family="'JetBrains Mono',monospace">${d}s</text>`
  ).join('\n    ');

  // Decade nav buttons
  const decadeButtons = Object.keys(decadeXMap).sort((a, b) => +a - +b)
    .map(d => `<button data-decade="${d}" onclick="jumpToDecade(${d})">${d}s</button>`)
    .join('');

  // Pre-rendered HTML glassmorphism cards
  const cardsHtml = tlNodes.map((n, i) => {
    const abbr = n.name.slice(0, 2).toUpperCase();
    const logoHtml = n.logo
      ? `<img src="${n.logo}" alt="${n.name}" loading="lazy"/>`
      : `<span class="tl-card-logo-abbr" style="color:${n.color}">${abbr}</span>`;
    const tagsHtml = n.tags.map(t => `<span class="tl-card-tag">${t}</span>`).join('');
    const shClass = n.selfHosting ? ' tl-sh' : '';
    const safeNote = (n.note || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return `<div class="tl-card${shClass}" data-idx="${i}" data-x="${n.x}" data-y="${n.cardY}" data-bar-x="${n.barX}" data-bar-y="${n.barY}" data-seg="${i > 0 ? i - 1 : -1}" data-seg-next="${i < tlNodes.length - 1 ? i : -1}" data-id="${n.id}" data-slug="${n.slug}" data-prefix="${n.prefix}" data-name="${n.name}" data-year="${n.year}" data-note="${safeNote}" data-color="${n.color}" data-logo="${n.logo || ''}" style="left:${n.x}px;top:${n.cardY}px;">
      <div class="tl-card-top">
        <div class="tl-card-logo-icon" style="border-color:${n.color}55;">${logoHtml}</div>
        <span class="tl-card-year">${n.year}</span>
      </div>
      <div class="tl-card-name">${n.name}</div>
      <div class="tl-card-tags">${tagsHtml}</div>
      <button class="tl-expand-btn" aria-label="Expand ${n.name}">+</button>
      <div class="tl-graph-dot">${logoHtml}</div>
    </div>`;
  }).join('\n    ');

  const decadeXJson = JSON.stringify(decadeXMap);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Timeline | Language Lineage</title>
  <meta name="description" content="75+ years of programming language history. Watch ${sorted.length} languages emerge one by one on an interactive scrollable timeline from Fortran to Rust." />
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
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand"><span class="nav-logo-mark">LL</span>Language Lineage</a>
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
<div class="tl-year-hud"><span class="tl-year-num" id="tl-year-hud">1948</span></div>
<div class="tl-outer" id="tl-outer">
  <div class="tl-scroll-content" style="width:${CANVAS_W}px;height:${CANVAS_H}px;">
    <svg id="tl-svg" width="${CANVAS_W}" height="${CANVAS_H}">
      ${segmentsHtml}
      ${decadeTicksHtml}
    </svg>
    <div id="tl-cards-layer" style="position:absolute;top:0;left:0;width:${CANVAS_W}px;height:${CANVAS_H}px;pointer-events:none;">
      ${cardsHtml}
    </div>
  </div>
</div>
<div id="tl-graph-axis" style="display:none;"></div>
<button class="tl-mode-toggle" id="tl-mode-toggle">Graph</button>
<!-- Modal — springs from "+" click position -->
<div class="tl-modal" id="tl-modal">
  <button class="tl-modal-close" id="tl-modal-close">&#x2715;</button>
  <div class="tl-modal-header">
    <div class="tl-modal-logo" id="tl-modal-logo"></div>
    <div class="tl-modal-meta">
      <div class="tl-modal-year" id="tl-modal-year"></div>
      <div class="tl-modal-name" id="tl-modal-name"></div>
      <div class="tl-modal-tags" id="tl-modal-tags"></div>
    </div>
  </div>
  <div class="tl-modal-note" id="tl-modal-note"></div>
  <a class="tl-modal-link" id="tl-modal-link" href="#">View full profile &#x2192;</a>
</div>
${FOOTER_HTML}
<script>
(function(){
var YEAR_START=${YEAR_START},YEAR_END=${YEAR_END};
var DECADE_X=${decadeXJson};
var CANVAS_W=${CANVAS_W};
var CANVAS_H=${CANVAS_H};

var outer=document.getElementById('tl-outer');
var fill=document.getElementById('tlp');
var hudEl=document.getElementById('tl-year-hud');
var dnav=document.getElementById('tldnav');
var modal=document.getElementById('tl-modal');
var modeBtn=document.getElementById('tl-mode-toggle');
var rafPending=false,scrollMax=1,dnavBtns=[];
var decades=Object.keys(DECADE_X).map(Number).sort(function(a,b){return a-b;});
var graphMode=false;
var introComplete=false;

// Cards & segments
var cards=Array.prototype.slice.call(document.querySelectorAll('.tl-card'));
var segments=Array.prototype.slice.call(document.querySelectorAll('.tl-seg'));
var cardRevealed=cards.map(function(){return false;});
var segSrcXs=[],segTgtXs=[];
cards.forEach(function(c){c.style.pointerEvents='auto';});

// Populate segment source/target X arrays from card positions
for(var _i=0;_i<cards.length-1;_i++){
  segSrcXs.push(parseFloat(cards[_i].dataset.x));
  segTgtXs.push(parseFloat(cards[_i+1].dataset.x));
}

// Init per-segment stroke-dasharray (all hidden)
function initSegments(){
  segments.forEach(function(seg){
    var len=Math.ceil(seg.getTotalLength&&seg.getTotalLength()||200);
    seg.dataset.len=String(len);
    seg.style.strokeDasharray=String(len);
    seg.style.strokeDashoffset=String(len);
  });
}

// Magnetic cursor effect + dual-segment glow on hover
cards.forEach(function(card){
  var segBefore=parseInt(card.dataset.seg,10);
  var segAfter=parseInt(card.dataset.segNext,10);
  card.addEventListener('mouseenter',function(){
    card.style.transitionDuration='0.12s,0.12s,0.25s,0.2s,0.65s,0.65s';
    if(segBefore>=0&&segments[segBefore])segments[segBefore].classList.add('lit');
    if(segAfter>=0&&segments[segAfter])segments[segAfter].classList.add('lit');
  });
  card.addEventListener('mousemove',function(e){
    if(graphMode)return;
    var r=card.getBoundingClientRect();
    var dx=((e.clientX-r.left-r.width/2)*0.07).toFixed(2);
    var dy=((e.clientY-r.top-r.height/2)*0.07).toFixed(2);
    card.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px))';
  });
  card.addEventListener('mouseleave',function(){
    card.style.transitionDuration='';
    card.style.transform='';
    if(segBefore>=0&&segments[segBefore])segments[segBefore].classList.remove('lit');
    if(segAfter>=0&&segments[segAfter])segments[segAfter].classList.remove('lit');
  });
});

// "+" button — modal springs from click origin
cards.forEach(function(card){
  var btn=card.querySelector('.tl-expand-btn');
  if(!btn)return;
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    var MODAL_W=300,MODAL_H=240;
    var br=btn.getBoundingClientRect();
    var btnCx=(br.left+br.right)/2,btnCy=(br.top+br.bottom)/2;
    var mx=btnCx+14,my=btnCy-MODAL_H/2;
    if(mx+MODAL_W>window.innerWidth-8)mx=btnCx-MODAL_W-14;
    if(my<8)my=8;
    if(my+MODAL_H>window.innerHeight-8)my=window.innerHeight-MODAL_H-8;
    modal.style.left=mx+'px';modal.style.top=my+'px';
    var ox=Math.min(98,Math.max(2,(btnCx-mx)/MODAL_W*100));
    var oy=Math.min(98,Math.max(2,(btnCy-my)/MODAL_H*100));
    modal.style.transformOrigin=ox.toFixed(1)+'% '+oy.toFixed(1)+'%';
    var color=card.dataset.color;
    var logoEl=document.getElementById('tl-modal-logo');
    logoEl.style.borderColor=color;logoEl.style.background=color+'22';logoEl.innerHTML='';
    if(card.dataset.logo){
      var img=document.createElement('img');
      img.src=card.dataset.logo;img.alt=card.dataset.name;
      img.style.cssText='width:60%;height:60%;object-fit:contain';
      logoEl.appendChild(img);
    } else {
      logoEl.innerHTML='<span class="tl-modal-abbr" style="color:'+color+'">'+card.dataset.name.slice(0,2).toUpperCase()+'</span>';
    }
    document.getElementById('tl-modal-year').textContent=card.dataset.year;
    document.getElementById('tl-modal-name').textContent=card.dataset.name;
    document.getElementById('tl-modal-tags').innerHTML=Array.prototype.slice.call(card.querySelectorAll('.tl-card-tag')).map(function(t){return '<span class="tl-modal-tag">'+t.textContent+'</span>';}).join('');
    document.getElementById('tl-modal-note').textContent=card.dataset.note||'';
    document.getElementById('tl-modal-link').href='/'+card.dataset.prefix+'/'+card.dataset.slug;
    modal.classList.add('show');
  });
});
document.getElementById('tl-modal-close').addEventListener('click',function(){modal.classList.remove('show');});
document.addEventListener('click',function(e){if(modal.classList.contains('show')&&!modal.contains(e.target))modal.classList.remove('show');});

// Graph mode toggle — viewport-fitting decade-column logo circles
function setGraphMode(on){
  graphMode=on;
  modeBtn.textContent=on?'Timeline':'Graph';
  var axis=document.getElementById('tl-graph-axis');
  if(on){
    modal.classList.remove('show');
    outer.scrollLeft=0;
    outer.style.overflowX='hidden';
    outer.classList.add('graph-mode');
    // Group by decade
    var byDecade={};
    cards.forEach(function(c){
      var dec=Math.floor(parseInt(c.dataset.year,10)/10)*10;
      if(!byDecade[dec])byDecade[dec]=[];
      byDecade[dec].push(c);
    });
    var decKeys=Object.keys(byDecade).map(Number).sort(function(a,b){return a-b;});
    var numCols=decKeys.length;
    var W=outer.clientWidth,H=outer.clientHeight;
    var LABEL_H=52,GAP=6,SUB_COLS=2,SUB_GAP=4;
    var colW=Math.floor((W-GAP*(numCols+1))/numCols);
    // Max rows using 2-wide sub-columns
    var maxRows=0;
    decKeys.forEach(function(d){
      var r=Math.ceil(byDecade[d].length/SUB_COLS);
      if(r>maxRows)maxRows=r;
    });
    var DOT=Math.min(
      Math.floor((colW-SUB_GAP)/SUB_COLS)-2,
      Math.floor((H-LABEL_H-GAP*(maxRows+1))/maxRows)
    );
    DOT=Math.max(18,Math.min(DOT,44));
    var layerOffY=(H-CANVAS_H)/2;
    // Axis covers full viewport for column bars + labels
    if(axis){
      axis.innerHTML='';
      axis.style.cssText='display:block;position:fixed;top:0;left:0;right:0;bottom:0;height:auto;pointer-events:none;z-index:5;';
    }
    decKeys.forEach(function(dec,ci){
      var colX=GAP+ci*(colW+GAP);
      var cx=colX+colW/2;
      var items=byDecade[dec];
      var numRows=Math.ceil(items.length/SUB_COLS);
      items.forEach(function(card,ri){
        var row=Math.floor(ri/SUB_COLS);
        var sub=ri%SUB_COLS;
        // Two sub-columns centered in column
        var subOffset=(sub-(SUB_COLS-1)/2)*(DOT+SUB_GAP);
        var targetX=cx+subOffset;
        var targetY=H-LABEL_H-GAP-DOT/2-row*(DOT+GAP);
        var color=card.dataset.color;
        var delay=(ci*0.04+row*0.02+sub*0.005).toFixed(3);
        card.style.transitionDelay=delay+'s';
        card.style.left=Math.round(targetX)+'px';
        card.style.top=Math.round(targetY-layerOffY)+'px';
        card.style.width=DOT+'px';
        card.style.height=DOT+'px';
        card.style.borderRadius='50%';
        card.style.borderColor=color+'bb';
        card.style.background=color+'20';
        card.style.boxShadow='0 0 0 1.5px '+color+'66, 0 3px 10px '+color+'28';
        card.style.padding='0';
        card.style.opacity='1';
        card.style.transform='translate(-50%,-50%)';
      });
      if(axis){
        // Column background bar (height proportional to this decade's count)
        var barH=numRows*(DOT+GAP)+GAP;
        var bg=document.createElement('div');
        bg.style.cssText='position:absolute;left:'+colX+'px;width:'+colW+'px;bottom:'+LABEL_H+'px;height:'+barH+'px;'
          +'background:rgba(201,168,124,0.025);border:1px solid rgba(201,168,124,0.09);border-bottom:none;border-radius:4px 4px 0 0;';
        axis.appendChild(bg);
        // Decade label + count
        var lbl=document.createElement('div');
        lbl.style.cssText='position:absolute;left:'+Math.round(cx)+'px;transform:translateX(-50%);text-align:center;bottom:8px;';
        lbl.innerHTML='<div style="font-size:11px;font-weight:800;font-family:JetBrains Mono,monospace;color:rgba(245,240,232,0.65);letter-spacing:0.06em;">'+dec+'s</div>'
                      +'<div style="font-size:9px;font-weight:600;font-family:JetBrains Mono,monospace;color:rgba(245,240,232,0.3);margin-top:2px;">'+items.length+'</div>';
        axis.appendChild(lbl);
      }
    });
    // Baseline separator
    if(axis){
      var baseline=document.createElement('div');
      baseline.style.cssText='position:absolute;left:0;right:0;bottom:'+(LABEL_H-1)+'px;height:1px;background:rgba(245,240,232,0.18);';
      axis.appendChild(baseline);
    }
  } else {
    // Keep content hidden during resize-back transition
    cards.forEach(function(card){card.classList.add('tl-card-exiting');});
    outer.classList.remove('graph-mode');
    cards.forEach(function(card){
      card.style.left=card.dataset.x+'px';
      card.style.top=card.dataset.y+'px';
      card.style.width='';
      card.style.height='';
      card.style.borderRadius='';
      card.style.borderColor='';
      card.style.background='';
      card.style.boxShadow='';
      card.style.padding='';
      card.style.opacity='';
      card.style.transform='';
      card.style.transitionDelay='';
    });
    outer.style.overflowX='';
    if(axis){axis.style.display='none';axis.innerHTML='';}
    setTimeout(function(){
      cards.forEach(function(card){card.classList.remove('tl-card-exiting');});
      doScroll();
    },650);
  }
}
modeBtn.addEventListener('click',function(){setGraphMode(!graphMode);});

// Scroll-driven: line leads viewport by 85%, segments draw in real-time
function doScroll(){
  rafPending=false;
  if(!introComplete)return;
  var sl=outer.scrollLeft;
  var frac=sl/scrollMax;
  if(fill)fill.style.width=(frac*100).toFixed(1)+'%';
  if(hudEl)hudEl.textContent=String(Math.round(YEAR_START+frac*(YEAR_END-YEAR_START)));
  // Parallax dot background at 25% of scroll speed
  outer.style.setProperty('--bg-x',(sl*-0.25).toFixed(1)+'px');
  // drawnX: where the "pen" is (leads viewport by 85%)
  var drawnX=sl+outer.clientWidth*0.85;
  // Update every segment dashoffset directly (no CSS transition)
  for(var i=0;i<segments.length;i++){
    var srcX=segSrcXs[i],tgtX=segTgtXs[i];
    var segLen=parseFloat(segments[i].dataset.len);
    if(drawnX>=tgtX){
      segments[i].style.strokeDashoffset='0';
    } else if(drawnX>srcX){
      segments[i].style.strokeDashoffset=((segLen*(1-(drawnX-srcX)/(tgtX-srcX))).toFixed(1));
    }
  }
  // Reveal cards as line crosses their X (skip card[0], revealed by intro)
  for(var j=1;j<cards.length;j++){
    if(!cardRevealed[j]&&drawnX>=parseFloat(cards[j].dataset.x)){
      cardRevealed[j]=true;
      cards[j].classList.add('visible');
    }
  }
  // Decade nav active state
  var active=null;
  for(var k=0;k<decades.length;k++){if(sl+outer.clientWidth/2>=DECADE_X[decades[k]])active=decades[k];}
  for(var b=0;b<dnavBtns.length;b++){dnavBtns[b].classList.toggle('active',parseInt(dnavBtns[b].dataset.decade,10)===active);}
}
function onScroll(){if(!rafPending){rafPending=true;requestAnimationFrame(doScroll);}}

// Debounced scroll-snap to nearest card
var snapTimer=null;
outer.addEventListener('scroll',function(){
  if(snapTimer)clearTimeout(snapTimer);
  snapTimer=setTimeout(function(){
    if(graphMode)return;
    var viewCx=outer.scrollLeft+outer.clientWidth/2;
    var nearest=null,nearestDist=Infinity;
    cards.forEach(function(c){
      var d=Math.abs(parseFloat(c.dataset.x)-viewCx);
      if(d<nearestDist){nearestDist=d;nearest=c;}
    });
    if(nearest&&nearestDist>40){
      outer.scrollTo({left:Math.max(0,parseFloat(nearest.dataset.x)-outer.clientWidth/2),behavior:'smooth'});
    }
  },200);
},{passive:true});

// Vertical wheel → horizontal scroll (locked during intro)
outer.addEventListener('wheel',function(e){
  if(!introComplete){e.preventDefault();return;}
  if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){
    e.preventDefault();
    outer.scrollLeft+=e.deltaY*1.2;
    if(!rafPending){rafPending=true;requestAnimationFrame(doScroll);}
  }
},{passive:false});

window.jumpToDecade=function(d){
  var x=DECADE_X[d];if(x==null)return;
  outer.scrollTo({left:Math.max(0,x-outer.clientWidth/4),behavior:'smooth'});
};

window.addEventListener('load',function(){
  scrollMax=Math.max(1,outer.scrollWidth-outer.clientWidth);
  if(dnav)dnavBtns=Array.prototype.slice.call(dnav.querySelectorAll('button'));
  window.addEventListener('resize',function(){scrollMax=Math.max(1,outer.scrollWidth-outer.clientWidth);});
  // Set per-card CSS color variable for left-border accent
  cards.forEach(function(card){var c=card.dataset.color;if(c)card.style.setProperty('--card-color',c);});
  initSegments();
  // Intro: reveal card[0] immediately, draw segment[0] over 1.2s
  if(cards[0]){cards[0].classList.add('visible');cardRevealed[0]=true;}
  var seg0=segments[0];
  if(seg0){
    seg0.style.transition='stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(function(){seg0.style.strokeDashoffset='0';},80);
  }
  // After intro: strip CSS transition, enable scroll-driven mode
  setTimeout(function(){
    introComplete=true;
    if(seg0)seg0.style.transition='';
    outer.addEventListener('scroll',onScroll,{passive:true});
    doScroll();
  },1400);

  // Mobile: vertical sine-wave bezier timeline with scroll-driven reveal
  if(window.innerWidth<=768){
    var MW=outer.clientWidth||window.innerWidth;
    var CARD_W=Math.min(140,Math.floor(MW*0.44));
    var CX=Math.floor(MW/2);
    var AMP=Math.floor(MW*0.25);
    var MFREQ=0.65;
    var CARD_H=100,VGAP=22;
    var TOP_PAD=50,BOT_PAD=60;

    // Position cards on a sine wave (smooth flowing oscillation)
    var mpts=[];
    cards.forEach(function(card,mi){
      var cx=Math.round(CX+Math.sin(mi*MFREQ)*AMP);
      var cy=TOP_PAD+mi*(CARD_H+VGAP)+CARD_H/2;
      mpts.push({x:cx,y:cy,color:card.dataset.color||'#c9a87c'});
      card.style.left=cx+'px';
      card.style.top=cy+'px';
      card.style.width=CARD_W+'px';
      card.style.transform='translate(-50%,-50%)';
    });

    var totalH=TOP_PAD+cards.length*(CARD_H+VGAP)+BOT_PAD;
    var mCardRevealed=new Array(cards.length).fill(false);
    mCardRevealed[0]=true;

    // Vertical bezier path — vertical tangents give smooth S-curve flow
    var mpd='M '+mpts[0].x+' '+mpts[0].y;
    for(var mi=1;mi<mpts.length;mi++){
      var mp=mpts[mi-1],mc=mpts[mi];
      var mdy=mc.y-mp.y;
      mpd+=' C '+mp.x+' '+(mp.y+mdy*0.6)+' '+mc.x+' '+(mc.y-mdy*0.6)+' '+mc.x+' '+mc.y;
    }

    var mns='http://www.w3.org/2000/svg';
    var msvg=document.createElementNS(mns,'svg');
    msvg.setAttribute('width',String(MW));
    msvg.setAttribute('height',String(totalH));
    msvg.style.cssText='position:absolute;top:0;left:0;pointer-events:none;z-index:0;overflow:visible;';

    var mpbg=document.createElementNS(mns,'path');
    mpbg.setAttribute('d',mpd);mpbg.setAttribute('fill','none');
    mpbg.setAttribute('stroke','rgba(245,240,232,0.07)');mpbg.setAttribute('stroke-width','4');
    mpbg.setAttribute('stroke-linecap','round');
    msvg.appendChild(mpbg);

    var mpline=document.createElementNS(mns,'path');
    mpline.setAttribute('d',mpd);mpline.setAttribute('fill','none');
    mpline.setAttribute('stroke','rgba(201,168,124,0.72)');mpline.setAttribute('stroke-width','2');
    mpline.setAttribute('stroke-linecap','round');
    msvg.appendChild(mpline);

    var msc=outer.querySelector('.tl-scroll-content');
    var mcl=document.getElementById('tl-cards-layer');
    if(msc){
      msc.style.cssText='position:relative;flex-shrink:0;width:'+MW+'px;height:'+totalH+'px;';
      msc.insertBefore(msvg,msc.firstChild);
    }
    if(mcl){mcl.style.width=MW+'px';mcl.style.height=totalH+'px';}

    // Get path length after insertion into DOM
    var mLen=mpline.getTotalLength()||totalH;
    mpline.setAttribute('stroke-dasharray',String(mLen));
    mpline.setAttribute('stroke-dashoffset',String(mLen));

    outer.style.overflowX='hidden';
    outer.style.overflowY='auto';

    // Scroll-driven: line draws and cards reveal as user scrolls down
    function mDoScroll(){
      var sl=outer.scrollTop;
      var drawnY=sl+outer.clientHeight*0.85;
      var frac=Math.min(1,drawnY/totalH);
      mpline.style.strokeDashoffset=String((mLen*(1-frac)).toFixed(1));
      for(var j=1;j<mpts.length;j++){
        if(!mCardRevealed[j]&&drawnY>=mpts[j].y){
          mCardRevealed[j]=true;
          cards[j].classList.add('visible');
        }
      }
    }

    introComplete=true;
    outer.addEventListener('scroll',mDoScroll,{passive:true});
    mDoScroll();
  }
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

// New landing pages
writeFile(join(PUBLIC, 'programming-language-graph', 'index.html'), buildProgrammingLanguageGraph(languages, rels));
writeFile(join(PUBLIC, 'programming-language-family-tree', 'index.html'), buildProgrammingLanguageFamilyTree(languages));
writeFile(join(PUBLIC, 'programming-language-genealogy', 'index.html'), buildProgrammingLanguageGenealogy(languages, rels));
writeFile(join(PUBLIC, 'programming-language-evolution', 'index.html'), buildProgrammingLanguageEvolution(languages));
writeFile(join(PUBLIC, 'what-are-programming-languages-written-in', 'index.html'), buildWhatAreLanguagesWrittenIn(languages, rels, nodeMap));
writeFile(join(PUBLIC, 'compiler-runtime-bootstrap', 'index.html'), buildCompilerRuntimeBootstrap(rels));
console.log('Generated 6 new landing pages');

// Question pages
writeFile(join(PUBLIC, 'questions', 'index.html'), buildQuestionsIndex());
for (const q of QUESTIONS) {
  writeFile(join(PUBLIC, 'questions', q.slug, 'index.html'), buildQuestionPage(q, nodeMap));
}
console.log(`Generated questions index + ${QUESTIONS.length} question pages`);

console.log('SEO page generation complete.');
