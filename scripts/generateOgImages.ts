import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const OG_DIR = join(PUBLIC, 'og');

// Fonts (OFL licensed)
const fraunces600 = readFileSync(join(__dirname, 'assets/fonts/Fraunces-SemiBold.ttf'));
const jetbrainsMono = readFileSync(join(__dirname, 'assets/fonts/JetBrainsMono-Regular.ttf'));
const FONTS = [
  { name: 'Fraunces', data: fraunces600, weight: 600 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: jetbrainsMono, weight: 400 as const, style: 'normal' as const },
];

// Dataset
const dataset = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const nodes: Language[] = dataset.languages;
const rels: Relationship[] = dataset.relationships;

interface Language {
  id: string;
  name: string;
  first_release_year?: number | null;
  notes?: string;
  logo_url?: string | null;
  logo_kind?: 'devicon' | 'wikimedia' | 'proxy' | 'none' | null;
}
interface Relationship {
  from_language: string;
  to_language: string;
  relationship: string;
}

const nodeMap = new Map<string, Language>(nodes.map(n => [n.id, n]));

function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}

// Semantic relationship colors (locked per Section 1.6)
const REL_COLOR: Record<string, string> = {
  runtime_written_in: '#34d399',
  compiler_written_in: '#f59e0b',
  bootstrap_written_in: '#8b5cf6',
  influenced: '#3b82f6',
  transpiled_to: '#22d3ee',
  rewritten_in: '#f43f5e',
};

const REL_LABEL: Record<string, string> = {
  runtime_written_in: 'runtime in',
  compiler_written_in: 'compiler in',
  bootstrap_written_in: 'bootstrap in',
  influenced: 'influenced',
  transpiled_to: 'transpiled to',
  rewritten_in: 'rewritten in',
};

// Priority order for which relationship to feature on a card
const REL_PRIORITY = ['runtime_written_in', 'compiler_written_in', 'bootstrap_written_in', 'rewritten_in', 'transpiled_to', 'influenced'];

function getPrimaryRel(nodeId: string): { fromName: string; toName: string; type: string; color: string; label: string } | null {
  const implementedBy = rels.filter(r => r.to_language === nodeId && REL_PRIORITY.slice(0, 4).includes(r.relationship));
  implementedBy.sort((a, b) => REL_PRIORITY.indexOf(a.relationship) - REL_PRIORITY.indexOf(b.relationship));
  const r = implementedBy[0];
  if (!r) return null;
  const from = nodeMap.get(r.from_language);
  const to = nodeMap.get(r.to_language);
  if (!from || !to) return null;
  return {
    fromName: from.name,
    toName: to.name,
    type: r.relationship,
    color: REL_COLOR[r.relationship] ?? '#4ade80',
    label: REL_LABEL[r.relationship] ?? r.relationship.replace(/_/g, ' '),
  };
}

// Build satori VNode for the OG card
function buildCard(opts: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  rel?: { fromName: string; toName: string; color: string; label: string } | null;
}): object {
  const titleLen = opts.title.length;
  const titleSize = titleLen > 60 ? 44 : titleLen > 44 ? 54 : titleLen > 30 ? 66 : 80;

  const hasRel = !!opts.rel;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        paddingTop: 60,
        paddingBottom: 60,
        paddingLeft: 72,
        paddingRight: 72,
        boxSizing: 'border-box',
        borderLeft: '5px solid #4ade80',
        fontFamily: 'Fraunces',
      },
      children: [
        // Eyebrow
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'JetBrains Mono',
              fontSize: 18,
              color: '#4ade80',
              letterSpacing: '0.08em',
              marginBottom: 16,
            },
            children: [opts.eyebrow + '  ·  LANGUAGE LINEAGE'],
          },
        },
        // Spacer
        { type: 'div', props: { style: { display: 'flex', flex: 1 }, children: [] } },
        // Title
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'Fraunces',
              fontWeight: 600,
              fontSize: titleSize,
              color: '#fafafa',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
            },
            children: [opts.title],
          },
        },
        // Subtitle
        ...(opts.subtitle ? [{
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'JetBrains Mono',
              fontSize: 20,
              color: '#9a9a9a',
              marginTop: 20,
            },
            children: [opts.subtitle],
          },
        }] : []),
        // Spacer
        { type: 'div', props: { style: { display: 'flex', flex: 1 }, children: [] } },
        // Footer row
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 40,
            },
            children: [
              // Domain
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 18,
                    color: '#5a5a5a',
                  },
                  children: ['languagelineage.org'],
                },
              },
              // Relationship motif
              ...(hasRel && opts.rel ? [{
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 18,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          color: '#9a9a9a',
                          backgroundColor: '#1c1c1c',
                          borderRadius: 6,
                          paddingTop: 4,
                          paddingBottom: 4,
                          paddingLeft: 12,
                          paddingRight: 12,
                        },
                        children: [opts.rel.fromName],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex', color: opts.rel.color, fontSize: 16 },
                              children: ['──>'],
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: { display: 'flex', color: opts.rel.color, fontSize: 12 },
                              children: [opts.rel.label],
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          color: '#fafafa',
                          backgroundColor: '#1c1c1c',
                          borderRadius: 6,
                          paddingTop: 4,
                          paddingBottom: 4,
                          paddingLeft: 12,
                          paddingRight: 12,
                          border: `1.5px solid ${opts.rel.color}`,
                        },
                        children: [opts.rel.toName],
                      },
                    },
                  ],
                },
              }] : []),
            ],
          },
        },
      ],
    },
  };
}

async function renderCard(card: object): Promise<Buffer> {
  const svg = await satori(card as any, { width: 1200, height: 630, fonts: FONTS });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return Buffer.from(resvg.render().asPng());
}

function write(path: string, buf: Buffer): void {
  const dir = join(path, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, buf);
}

mkdirSync(OG_DIR, { recursive: true });

let count = 0;

async function main() {
  // Language and tool node pages
  for (const node of nodes) {
    const isLang = node.id.startsWith('lang:');
    const isTool = node.id.startsWith('tool:');
    if (!isLang && !isTool) continue;
    const slug = idToSlug(node.id);
    const prefix = isTool ? 'tools' : 'languages';
    const eyebrow = isTool ? 'TOOL' : 'LANGUAGE';
    const rel = getPrimaryRel(node.id);
    const subtitle = rel ? `${rel.label}: ${rel.fromName}` : (node.first_release_year ? `Est. ${node.first_release_year}` : undefined);
    const card = buildCard({ eyebrow, title: node.name, subtitle, rel });
    const png = await renderCard(card);
    write(join(OG_DIR, `${prefix}-${slug}.png`), png);
    count++;
    if (count % 20 === 0) process.stdout.write(`  ${count}...`);
  }

  // Guide pages (read from generated HTML in public/guides/)
  const GUIDE_SLUGS = [
    'what-is-compiler-bootstrapping',
    'how-javascript-engines-work',
    'how-python-is-implemented',
    'how-rust-is-bootstrapped',
    'gcc-vs-llvm',
    'v8-vs-spidermonkey-vs-javascriptcore',
    'what-programming-languages-are-written-in-c',
    'what-programming-languages-are-written-in-rust',
    'what-programming-languages-are-written-in-python',
    'how-programming-languages-are-made',
    'typescript-vs-javascript-implementation',
    'graalvm-vs-hotspot',
    'the-c-bootstrap-chain',
  ];
  for (const slug of GUIDE_SLUGS) {
    // Extract title from generated HTML
    const htmlPath = join(PUBLIC, 'guides', slug, 'index.html');
    let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');
      const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      if (m) title = m[1].replace(/<[^>]+>/g, '').trim().slice(0, 80);
    }
    const card = buildCard({ eyebrow: 'GUIDE', title, rel: null });
    const png = await renderCard(card);
    write(join(OG_DIR, `guides-${slug}.png`), png);
    count++;
  }

  // Hand-authored question pages
  const QUESTION_SLUGS = [
    'what-is-javascript-written-in',
    'what-is-rust-written-in',
    'what-is-python-written-in',
    'what-is-go-written-in',
    'what-is-java-written-in',
    'what-is-c-written-in',
    'what-is-cpp-written-in',
    'what-is-typescript-written-in',
    'what-is-ruby-written-in',
    'what-is-haskell-written-in',
    'what-is-kotlin-written-in',
    'what-is-swift-written-in',
    'what-is-scala-written-in',
    'what-is-lua-written-in',
    'what-is-perl-written-in',
    'what-is-compiler-bootstrapping',
    'is-javascript-written-in-c',
    'is-rustc-written-in-rust',
    'is-rust-compiled',
    'what-is-cpython-written-in',
  ];
  for (const slug of QUESTION_SLUGS) {
    const htmlPath = join(PUBLIC, 'questions', slug, 'index.html');
    let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + '?';
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf8');
      const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      if (m) title = m[1].replace(/<[^>]+>/g, '').trim();
    }
    const card = buildCard({ eyebrow: 'QUESTION', title, rel: null });
    const png = await renderCard(card);
    write(join(OG_DIR, `questions-${slug}.png`), png);
    count++;
  }

  // Relationship type pages
  const REL_TYPES = [
    { slug: 'compiler-written-in', label: 'Compiler Written In' },
    { slug: 'runtime-written-in', label: 'Runtime Written In' },
    { slug: 'bootstrap-written-in', label: 'Bootstrap Written In' },
    { slug: 'influenced', label: 'Influenced' },
    { slug: 'transpiled-to', label: 'Transpiled To' },
    { slug: 'rewritten-in', label: 'Rewritten In' },
  ];
  for (const rt of REL_TYPES) {
    const count2 = rels.filter(r => r.relationship === rt.slug.replace(/-/g, '_')).length;
    const card = buildCard({
      eyebrow: 'RELATIONSHIP',
      title: rt.label,
      subtitle: `${count2} edges in the Language Lineage dataset`,
      rel: null,
    });
    const png = await renderCard(card);
    write(join(OG_DIR, `relationships-${rt.slug}.png`), png);
    count++;
  }

  console.log(`\nGenerated ${count} OG images into public/og/`);

  // Size check
  const { statSync, readdirSync } = await import('fs');
  const files = readdirSync(OG_DIR);
  let totalBytes = 0;
  for (const f of files) totalBytes += statSync(join(OG_DIR, f)).size;
  const mb = (totalBytes / 1024 / 1024).toFixed(1);
  console.log(`Total size: ${mb} MB across ${files.length} files`);
  if (totalBytes > 20 * 1024 * 1024) console.warn('WARNING: total exceeds 20 MB target');
}

main().catch(err => { console.error(err); process.exit(1); });
