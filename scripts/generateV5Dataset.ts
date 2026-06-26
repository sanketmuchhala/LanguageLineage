import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LOGO_MAP } from '../src/data/logoMap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INPUT = join(ROOT, 'dataset/v4/lineage_v4.json');
const OUTPUT_DIR = join(ROOT, 'dataset/v5');
const OUTPUT = join(OUTPUT_DIR, 'lineage_v5.json');

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';
const DEVICON_SOURCE = 'https://github.com/devicons/devicon';
const DEVICON_LICENSE = 'Devicon MIT; trademarks retained by owners';

function devicon(slug: string, variant = 'original'): string {
  return `${DEVICON_BASE}/${slug}/${slug}-${variant}.svg`;
}

const EXTRA_LOGOS: Record<string, { url: string; kind: 'devicon' | 'proxy'; source?: string }> = {
  'lang:apl': { url: devicon('apl'), kind: 'devicon' },
  'lang:awk': { url: devicon('awk'), kind: 'devicon' },
  'tool:gcc': { url: devicon('gcc'), kind: 'devicon' },
  'tool:llvm': { url: devicon('llvm'), kind: 'devicon' },
  'tool:v8': { url: devicon('v8'), kind: 'devicon' },
  'tool:clang': { url: devicon('llvm'), kind: 'proxy', source: `${DEVICON_SOURCE}/tree/master/icons/llvm` },
  'tool:javascriptcore': { url: devicon('apple'), kind: 'proxy', source: `${DEVICON_SOURCE}/tree/master/icons/apple` },
  'tool:spidermonkey': { url: devicon('firefox'), kind: 'proxy', source: `${DEVICON_SOURCE}/tree/master/icons/firefox` },
};

const PROXY_LOGOS = new Set([
  'lang:fortran95',
  'lang:luajit',
  'lang:sh',
  'lang:freepascal',
  'tool:hotspot',
  'tool:roslyn',
  'tool:ghc',
  'tool:beam',
  ...Object.entries(EXTRA_LOGOS).filter(([, v]) => v.kind === 'proxy').map(([id]) => id),
]);

const LANGUAGE_OVERRIDES: Record<string, Record<string, unknown>> = {
  'lang:rust': {
    first_release_year: 2010,
    notes: 'Mozilla. Graydon Hoare. First appeared publicly in 2010; 1.0 released in 2015. Original compiler (rustboot) in OCaml. Rewritten in Rust ~2011. LLVM backend.',
  },
};

const RELATIONSHIP_START_OVERRIDES: Record<string, number> = {
  'lang:haskell|tool:ghc|compiler_written_in': 1990,
  'lang:elm|lang:rust|influenced': 2012,
  'lang:dylan|lang:python|influenced': 1992,
  'lang:haskell|lang:python|influenced': 2000,
  'lang:typescript|lang:dart|influenced': 2012,
  'lang:java|lang:php|influenced': 2004,
};

const RELATIONSHIP_NOTE_OVERRIDES: Record<string, string> = {
  'lang:haskell|tool:ghc|compiler_written_in': 'GHC is written in Haskell; start year normalized to Haskell first-release year for dataset chronology.',
  'lang:haskell|lang:python|influenced': 'Haskell influenced Python list comprehensions and functional features; start year aligned with Python 2.0 list comprehensions.',
  'lang:java|lang:php|influenced': 'PHP 5 object model drew influence from Java-style object-oriented programming.',
};

function sourceForLogo(url: string): string {
  const match = url.match(/\/icons\/([^/]+)\//);
  return match ? `${DEVICON_SOURCE}/tree/master/icons/${match[1]}` : DEVICON_SOURCE;
}

const dataset = JSON.parse(readFileSync(INPUT, 'utf8'));
dataset.version = 'v5';
dataset.description = 'Programming language lineage dataset v5 with logo metadata for graph and SEO rendering';

let direct = 0;
let proxy = 0;
let missing = 0;

dataset.languages = dataset.languages.map((lang: Record<string, unknown>) => {
  const id = String(lang.id);
  const languageOverride = LANGUAGE_OVERRIDES[id] ?? {};
  const extra = EXTRA_LOGOS[id];
  const url = extra?.url ?? (LOGO_MAP as Record<string, string | null>)[id] ?? null;
  const kind = url ? (PROXY_LOGOS.has(id) ? 'proxy' : 'devicon') : 'none';
  if (kind === 'devicon') direct++;
  else if (kind === 'proxy') proxy++;
  else missing++;

  return {
    ...lang,
    ...languageOverride,
    logo_url: url,
    logo_source: url ? (extra?.source ?? sourceForLogo(url)) : null,
    logo_license: url ? DEVICON_LICENSE : null,
    logo_kind: kind,
  };
});

dataset.relationships = dataset.relationships.map((rel: Record<string, unknown>) => {
  const key = `${rel.from_language}|${rel.to_language}|${rel.relationship}`;
  return {
    ...rel,
    start_year: RELATIONSHIP_START_OVERRIDES[key] ?? rel.start_year,
    notes: RELATIONSHIP_NOTE_OVERRIDES[key] ?? rel.notes,
  };
});

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`);

console.log(`Wrote ${OUTPUT}`);
console.log(`Logo coverage: ${direct + proxy}/${dataset.languages.length} (${direct} direct, ${proxy} proxy, ${missing} missing)`);
