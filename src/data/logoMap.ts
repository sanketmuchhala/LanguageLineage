// Maps language/tool IDs to devicon SVG URLs (CDN)
// Uses devicon "original" variants where available, "plain" as fallback
// For languages without devicon icons, value is null (fallback to letter abbreviation)

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';
const WIKIMEDIA_RUST_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Rust_programming_language_black_logo.svg';

function devicon(slug: string, variant = 'original'): string {
  return `${DEVICON_BASE}/${slug}/${slug}-${variant}.svg`;
}

export type LogoKind = 'devicon' | 'wikimedia' | 'proxy' | 'none' | null | undefined;
export type LogoSurface = 'dark' | 'soft-light';

export interface LogoPresentation {
  size: string;
  offsetY: string;
  surface: LogoSurface;
}

// Logo background colors (dominant color from each logo for cohesive look)
export const LOGO_COLORS: Record<string, string | null> = {
  'lang:python': '#3776ab',
  'lang:javascript': '#f7df1e',
  'lang:typescript': '#3178c6',
  'lang:rust': '#ce422b',
  'lang:go': '#00add8',
  'lang:java': '#007396',
  'lang:csharp': '#239120',
  'lang:cxx': '#00599c',
  'lang:c': '#a8b9cc',
  'lang:ruby': '#cc342d',
  'lang:php': '#777bb4',
  'lang:swift': '#fa7343',
  'lang:kotlin': '#7f52ff',
  'lang:scala': '#dc322f',
  'lang:haskell': '#5d4f85',
  'lang:elixir': '#4e2a8e',
  'lang:erlang': '#a90533',
  'lang:clojure': '#5881d8',
  'lang:fsharp': '#378bba',
  'lang:ocaml': '#ec6813',
  'lang:racket': '#9f1d20',
  'lang:lua': '#000080',
  'lang:r': null,
  'lang:julia': '#9558b2',
  'lang:dart': '#0175c2',
  'lang:elm': '#5fb4cb',
  'lang:crystal': null,
  'lang:nim': '#ffe953',
  'lang:zig': '#f7a41d',
  'lang:groovy': '#4298b8',
  'lang:perl': '#0073b7',
  'lang:bash': '#4eaa25',
  'lang:coffeescript': '#244776',
  'lang:purescript': null,
  'lang:fortran': '#734f96',
  'lang:cobol': '#0000cc',
  'lang:prolog': '#74283c',
  'lang:matlab': '#e16737',
  'lang:delphi': '#ee1f35',
  'lang:vb_net': '#945db7',
  'lang:apl': '#5a8164',
  'lang:awk': '#c30e9b',
  'lang:carbon': null,
  'lang:gleam': '#ffaff3',
  'lang:angular': '#dd0031',
  'lang:lisp': '#111827',
  'lang:algol': '#52525b',
  'lang:simula': '#1f2937',
  'lang:smalltalk': '#4aa3df',
  'lang:scheme': '#111827',
  'lang:ada': '#5f8f3a',
  'lang:d': '#ba3327',
  'lang:reasonml': '#dd4b39',
  'lang:v': '#5d87bf',
  'lang:oberon2': '#2459a8',
  'lang:oberon': '#2459a8',
  'lang:modula3': '#b91c1c',
  'lang:self': '#111827',
  'lang:cython': '#3776ab',
  'lang:pharo': '#1594d2',
  'lang:guile': '#a61c2e',
  'lang:freepascal': '#b91c1c',
  'lang:fortran95': '#734f96',
  'tool:gcc': '#d75c37',
  'tool:llvm': '#262d3a',
  'tool:clang': '#262d3a',
  'tool:v8': '#4b8bf5',
  'tool:spidermonkey': '#ff7139',
  'tool:javascriptcore': '#111111',
  'tool:dotnet_runtime': '#512bd4',
  'tool:roslyn': '#512bd4',
  'tool:ghc': '#5d4f85',
};

export const LOGO_MAP: Record<string, string | null> = {
  // === Languages with devicon icons ===
  'lang:fortran': devicon('fortran', 'original'),
  'lang:cobol': devicon('cobol', 'original'),
  'lang:c': devicon('c', 'original'),
  'lang:prolog': devicon('prolog', 'original'),
  'lang:ada': null,
  'lang:cxx': devicon('cplusplus', 'original'),
  'lang:objective_c': devicon('objectivec', 'plain'),
  'lang:erlang': devicon('erlang', 'original'),
  'lang:perl': devicon('perl', 'original'),
  'lang:haskell': devicon('haskell', 'original'),
  'lang:python': devicon('python', 'original'),
  'lang:ocaml': devicon('ocaml', 'original'),
  'lang:java': devicon('java', 'original'),
  'lang:javascript': devicon('javascript', 'original'),
  'lang:ruby': devicon('ruby', 'original'),
  'lang:php': devicon('php', 'original'),
  'lang:r': devicon('r', 'original'),
  'lang:racket': devicon('racket', 'original'),
  'lang:csharp': devicon('csharp', 'original'),
  'lang:lua': devicon('lua', 'original'),
  'lang:d': null,
  'lang:scala': devicon('scala', 'original'),
  'lang:fsharp': devicon('fsharp', 'original'),
  'lang:clojure': devicon('clojure', 'original'),
  'lang:go': devicon('go', 'original'),
  'lang:coffeescript': devicon('coffeescript', 'original'),
  'lang:rust': WIKIMEDIA_RUST_LOGO,
  'lang:kotlin': devicon('kotlin', 'original'),
  'lang:typescript': devicon('typescript', 'original'),
  'lang:dart': devicon('dart', 'original'),
  'lang:elixir': devicon('elixir', 'original'),
  'lang:elm': devicon('elm', 'original'),
  'lang:julia': devicon('julia', 'original'),
  'lang:swift': devicon('swift', 'original'),
  'lang:crystal': devicon('crystal', 'original'),
  'lang:purescript': devicon('purescript', 'original'),
  'lang:nim': devicon('nim', 'original'),
  'lang:zig': devicon('zig', 'original'),
  'lang:carbon': devicon('carbon', 'original'),
  'lang:groovy': devicon('groovy', 'original'),
  'lang:vb_net': devicon('visualbasic', 'original'),
  'lang:matlab': devicon('matlab', 'original'),
  'lang:delphi': devicon('delphi', 'original'),
  'lang:apl': devicon('apl', 'original'),
  'lang:bash': devicon('bash', 'original'),
  'lang:awk': devicon('awk', 'original'),
  'lang:gleam': devicon('gleam', 'original'),
  'lang:angular': devicon('angular', 'original'),

  // === Tools/runtimes with devicon icons ===
  'tool:gcc': devicon('gcc', 'original'),
  'tool:llvm': devicon('llvm', 'original'),
  'tool:dotnet_runtime': devicon('dotnetcore', 'original'),
  'tool:v8': devicon('v8', 'original'),

  // === Parent/proxy logos (use related language icon) ===
  'lang:fortran95': devicon('fortran', 'original'),
  'lang:luajit': devicon('lua', 'original'),
  'lang:sh': devicon('bash', 'original'),
  'lang:freepascal': devicon('delphi', 'original'),
  'tool:clang': devicon('llvm', 'original'),
  'tool:hotspot': devicon('java', 'original'),
  'tool:roslyn': devicon('dotnetcore', 'original'),
  'tool:ghc': devicon('haskell', 'original'),
  'tool:beam': devicon('erlang', 'original'),

  // === No logo available (will use letter abbreviation) ===
  'lang:machine_code': null,
  'lang:assembly': null,
  'lang:lisp': null,
  'lang:algol': null,
  'lang:simula': null,
  'lang:bcpl': null,
  'lang:b': null,
  'lang:pascal': null,
  'lang:smalltalk': null,
  'lang:ml': null,
  'lang:scheme': null,
  'lang:sml': null,
  'lang:common_lisp': null,
  'lang:v': null,
  'lang:mojo': null,
  'lang:reasonml': null,
  'lang:cython': null,
  'lang:flow_matic': null,
  'lang:comtran': null,
  'lang:planner': null,
  'lang:lazy_ml': null,
  'lang:newsqueak': null,
  'lang:limbo': null,
  'lang:oberon2': null,
  'lang:alef': null,
  'lang:cyclone': null,
  'lang:clu': null,
  'lang:oberon': null,
  'lang:abc': null,
  'lang:modula3': null,
  'lang:icon': null,
  'lang:dylan': null,
  'lang:modula2': null,
  'lang:self': null,
  'lang:miranda': null,
  'lang:idris': null,
  'lang:agda': null,
  'lang:j': null,
  'lang:mercury': null,
  'lang:algol68': null,
  'lang:pl1': null,
  'lang:tcl': null,
  'lang:s': null,
  'lang:pharo': null,
  'lang:guile': null,
  'lang:mypy': null,
  'tool:spidermonkey': devicon('firefox', 'original'),
  'tool:javascriptcore': devicon('apple', 'original'),
  'tool:mrustc': null,
  'tool:chez_scheme': null,
  'tool:femtolisp': null,
};

const LOGO_SIZES: Record<string, string> = {
  // Wide marks and wordmarks need more breathing room inside circular nodes.
  'lang:ada': '46%',
  'lang:algol': '54%',
  'lang:simula': '54%',
  'lang:lisp': '56%',
  'lang:scheme': '56%',
  'lang:reasonml': '54%',
  'lang:rust': '64%',
  'lang:smalltalk': '60%',
  'lang:freepascal': '50%',
  'lang:fortran95': '58%',
  'lang:oberon': '52%',
  'lang:oberon2': '52%',
  'lang:modula3': '50%',
  'lang:self': '56%',
  'lang:cython': '56%',
  'lang:pharo': '58%',
  'lang:guile': '54%',
  'tool:roslyn': '54%',
  'tool:spidermonkey': '56%',
  'tool:ghc': '58%',

  // Devicon marks that read as wider than they are tall.
  'lang:go': '58%',
  'lang:coffeescript': '58%',
  'lang:vb_net': '58%',
  'tool:dotnet_runtime': '58%',
  'tool:gcc': '60%',
  'tool:llvm': '58%',
  'tool:clang': '58%',
  'tool:javascriptcore': '58%',
};

const LOGO_OFFSETS_Y: Record<string, string> = {
  'lang:ada': '51%',
  'lang:freepascal': '51%',
  'tool:spidermonkey': '49%',
};

const SOFT_LIGHT_SURFACE_LOGOS = new Set<string>([
  // These assets are mostly black/dark on transparency, so a restrained light
  // plate is intentional. Everything else stays on the dark graph badge.
  'lang:rust',
  'lang:crystal',
  'lang:purescript',
  'lang:scheme',
  'lang:lisp',
  'lang:simula',
  'lang:self',
  'lang:guile',
  'tool:llvm',
  'tool:clang',
  'tool:javascriptcore',
]);

export function getLogoPresentation(id: string, logoKind: LogoKind): LogoPresentation {
  const defaultSize = logoKind === 'wikimedia' ? '58%' : logoKind === 'proxy' ? '62%' : '64%';

  return {
    size: LOGO_SIZES[id] ?? defaultSize,
    offsetY: LOGO_OFFSETS_Y[id] ?? '50%',
    surface: SOFT_LIGHT_SURFACE_LOGOS.has(id) ? 'soft-light' : 'dark',
  };
}

// Generate a 1-2 letter abbreviation for languages without logos
export function getLetterAbbreviation(name: string): string {
  // Special cases
  const specials: Record<string, string> = {
    'C++': 'C+',
    'C#': 'C#',
    'F#': 'F#',
    'ALGOL 68': 'A6',
    'FLOW-MATIC': 'FM',
    'Oberon-2': 'O2',
    'Modula-2': 'M2',
    'Modula-3': 'M3',
    'PL/I': 'PL',
    'Visual Basic .NET': 'VB',
    '.NET Runtime': '.N',
    'BEAM VM': 'BM',
    'Standard ML': 'SM',
    'Common Lisp': 'CL',
    'Bourne Shell': 'sh',
    'GNU Guile': 'Gu',
    'Lazy ML': 'LM',
    'Free Pascal': 'FP',
    'Fortran 95': 'F9',
    'Machine Code': 'MC',
    'HotSpot JVM': 'HS',
    'Chez Scheme': 'CS',
    'Objective-C': 'OC',
    'JavaScript': 'JS',
    'TypeScript': 'TS',
    'CoffeeScript': 'CS',
    'PureScript': 'PS',
    'SpiderMonkey': 'SM',
    'JavaScriptCore': 'JC',
    'ReasonML': 'Re',
  };

  if (specials[name]) return specials[name];

  // For single-word names, use first 2 letters
  if (!name.includes(' ') && !name.includes('-')) {
    return name.slice(0, 2);
  }

  // For multi-word, use initials
  const words = name.split(/[\s-]+/);
  if (words.length >= 2) {
    return words[0][0] + words[1][0];
  }

  return name.slice(0, 2);
}
