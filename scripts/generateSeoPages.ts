import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

function confidenceLabel(c: number): string {
  if (c >= 0.95) return 'well-documented';
  if (c >= 0.85) return 'documented';
  return 'reported';
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
    parts.push(`The <strong>${escapeHtml(node.name)}</strong> compiler is ${confidenceLabel(conf)} written in <strong>${names.map(escapeHtml).join(' and ')}</strong>.`);
  }

  if (runtimeRels.length > 0) {
    const names = runtimeRels.map(r => nameFromId(r.from_language, nodeMap));
    const conf = Math.min(...runtimeRels.map(r => r.confidence));
    parts.push(`Its runtime is ${confidenceLabel(conf)} implemented in <strong>${names.map(escapeHtml).join(' and ')}</strong>.`);
  }

  if (bootstrapRels.length > 0) {
    const names = bootstrapRels.map(r => nameFromId(r.from_language, nodeMap));
    parts.push(`${escapeHtml(node.name)} uses a ${confidenceLabel(bootstrapRels[0].confidence)} bootstrap chain from <strong>${names.map(escapeHtml).join(' and ')}</strong>.`);
  }

  if (rewrittenRels.length > 0) {
    const names = rewrittenRels.map(r => nameFromId(r.from_language, nodeMap));
    parts.push(`It has been rewritten in <strong>${names.map(escapeHtml).join(' and ')}</strong>.`);
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

const CLUSTER_COLORS: Record<string, string> = {
  c_family: '#e07a5f', jvm_dotnet: '#7a9e7e', js_engines: '#c9a87c',
  functional: '#9b7bb8', systems: '#5a8a7d', scripting: '#8b9a7d',
  compilers: '#9a958c', other: '#8a857c', clr: '#7a8aa8', dynamic: '#7da88a',
  historical: '#b8a07a', jvm: '#6b8ba8', roots: '#9a958c',
  scientific: '#6a9aa8', tools: '#8a9598',
};

const REL_COLORS: Record<string, string> = {
  compiler_written_in: '#c9a87c', runtime_written_in: '#8b9a7d',
  bootstrap_written_in: '#7da88a', rewritten_in: '#b8a07a',
  influenced: '#9b7bb8', transpiled_to: '#e07a5f',
};

function buildGraphSection(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const nodeEdges = rels.filter(r => r.from_language === id || r.to_language === id);

  const nodeIds = new Set<string>([id]);
  nodeEdges.forEach(r => { nodeIds.add(r.from_language); nodeIds.add(r.to_language); });

  const nodes = [...nodeIds].map(nid => {
    const lang = nodeMap.get(nid);
    return {
      data: {
        id: nid,
        label: lang?.name ?? nid,
        cluster: (lang as any)?.cluster_hint ?? 'other',
        isCenter: nid === id,
        href: `/${idToPrefix(nid)}/${idToSlug(nid)}`,
      },
    };
  });

  const edges = nodeEdges.map((r, i) => ({
    data: { id: `e${i}`, source: r.from_language, target: r.to_language, rel: r.relationship },
  }));

  const graphData = JSON.stringify({ nodes, edges });
  const clusterColorsJson = JSON.stringify(CLUSTER_COLORS);
  const relColorsJson = JSON.stringify(REL_COLORS);

  return `<h2>Relationship Graph</h2>
<p style="font-size:13px;color:var(--text-tertiary);margin-bottom:12px">Click any node to navigate to that language's page.</p>
<div id="graph-viz" style="width:100%;height:500px;background:#0d0d0f;border:1px solid rgba(245,240,232,0.08);border-radius:12px;margin-bottom:8px"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js"></script>
<script>
(function() {
  var data = ${graphData};
  var CC = ${clusterColorsJson};
  var RC = ${relColorsJson};
  var centerId = ${JSON.stringify(id)};

  var cy = cytoscape({
    container: document.getElementById('graph-viz'),
    elements: data.nodes.concat(data.edges),
    style: [
      {
        selector: 'node',
        style: {
          'width': 44, 'height': 44,
          'background-color': function(ele) { return CC[ele.data('cluster')] || '#8a857c'; },
          'border-width': 2, 'border-color': '#00000030',
          'label': 'data(label)',
          'color': '#f5f0e8',
          'font-size': 11,
          'font-weight': 600,
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          'text-outline-width': 2,
          'text-outline-color': '#0a0a0b',
          'text-outline-opacity': 0.9,
          'cursor': 'pointer',
        }
      },
      {
        selector: 'node[?isCenter]',
        style: {
          'width': 70, 'height': 70,
          'background-color': '#c9a87c',
          'border-width': 3,
          'border-color': '#dfc4a0',
          'font-size': 13,
          'font-weight': 700,
          'z-index': 10,
        }
      },
      {
        selector: 'node:hover',
        style: { 'border-color': '#c9a87c', 'border-width': 3, 'overlay-opacity': 0.08, 'overlay-color': '#c9a87c' }
      },
      {
        selector: 'edge',
        style: {
          'width': 1.5,
          'line-color': function(ele) { return RC[ele.data('rel')] || '#555'; },
          'target-arrow-color': function(ele) { return RC[ele.data('rel')] || '#555'; },
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'opacity': 0.7,
          'arrow-scale': 0.8,
        }
      },
      {
        selector: 'edge:hover',
        style: { 'width': 2.5, 'opacity': 1, 'z-index': 5 }
      }
    ],
    layout: {
      name: 'cose',
      animate: false,
      randomize: true,
      nodeRepulsion: function() { return 8000; },
      idealEdgeLength: function() { return 120; },
      gravity: 0.4,
      numIter: 500,
      padding: 40,
    },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    minZoom: 0.3,
    maxZoom: 3,
  });

  cy.on('tap', 'node', function(evt) {
    var href = evt.target.data('href');
    if (href) window.location.href = href;
  });

  cy.on('mouseover', 'node', function(evt) {
    document.getElementById('graph-viz').style.cursor = 'pointer';
  });
  cy.on('mouseout', 'node', function(evt) {
    document.getElementById('graph-viz').style.cursor = 'default';
  });
})();
</script>`;
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

function buildNodePage(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const prefix = idToPrefix(node.id);
  const slug = idToSlug(node.id);
  const url = `${SITE}/${prefix}/${slug}`;
  const title = `What is ${node.name} written in? | Language Lineage`;
  const implRels = rels.filter(r => r.to_language === node.id && ['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in'].includes(r.relationship));
  const implLangs = [...new Set(implRels.map(r => nameFromId(r.from_language, nodeMap)))];
  const descriptionBase = implLangs.length > 0
    ? `${node.name} is implemented in ${implLangs.slice(0, 2).join(' and ')}. Explore its compiler, runtime, and influence relationships.`
    : `Explore ${node.name}'s relationships, influences, and history in the Language Lineage graph.`;
  const description = descriptionBase.slice(0, 160);

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
  <meta property="og:image" content="${SITE}/og-image.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <script type="application/ld+json">${articleJsonLd}</script>
  ${faqJsonLd ? `<script type="application/ld+json">${faqJsonLd}</script>` : ''}
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/">Language Lineage</a>
  <a href="/explore">Graph Explorer</a>
  <a href="/dataset">Dataset</a>
</nav>
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/${prefix}">${prefix === 'tools' ? 'Tools' : 'Languages'}</a> &rsaquo; ${escapeHtml(node.name)}
  </nav>

  <h1>What is ${escapeHtml(node.name)} written in?</h1>

  ${buildMetaTags(node)}

  ${buildAnswerBox(node, rels, nodeMap)}

  ${buildImplSection(node, rels, nodeMap)}

  ${buildInfluenceSection(node, rels, nodeMap)}

  ${buildGraphSection(node, rels, nodeMap)}

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
  <meta property="og:image" content="${SITE}/og-image.svg" />
  <script type="application/ld+json">${datasetJsonLd}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/">Language Lineage</a>
  <a href="/explore">Graph Explorer</a>
  <a href="/dataset">Dataset</a>
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
  <meta property="og:image" content="${SITE}/og-image.svg" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/">Language Lineage</a>
  <a href="/explore">Graph Explorer</a>
  <a href="/dataset">Dataset</a>
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
    description: 'CPython, the reference Python implementation, is written in C. PyPy is written in RPython. Learn how Python interpreters work and which language they are written in.',
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
  <meta property="og:image" content="${SITE}/og-image.svg" />
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
  <a href="/">Language Lineage</a>
  <a href="/explore">Graph Explorer</a>
  <a href="/dataset">Dataset</a>
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

console.log('SEO page generation complete.');
