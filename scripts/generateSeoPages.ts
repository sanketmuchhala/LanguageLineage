import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LOGO_MAP, LOGO_COLORS, getLogoPresentation } from '../src/data/logoMap.js';
import { getAdaptiveLogoBackground, getLogoBorderColor } from '../src/utils/colorContrast.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');
const SITE = 'https://www.languagelineage.org';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

function ogImg(filename: string): string {
  return existsSync(join(PUBLIC, 'og', filename)) ? `${SITE}/og/${filename}` : `${SITE}/og-image.png`;
}

const FONTS_HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"><script defer src="/fx.js"></script>`;

const BRAND_MARK = `<img class="nav-logo-mark" src="/logo-mark.svg" width="22" height="22" alt="" aria-hidden="true">`;

const NAV_HTML = `<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
  <a href="/relationships">Relationships</a>
  <a href="/languages">Languages</a>
  <a href="/tools">Tools</a>
  <a href="/guides">Guides</a>
  <a href="/timeline">Timeline</a>
  <a href="/dataset">Dataset</a>
  <a href="/explore" class="nav-enter-graph">Enter Graph</a>
</nav>`;

const FOOTER_HTML = `<footer class="seo-footer-rich">
  <div data-nosnippet>
  <div class="footer-grid">
    <div class="footer-col">
      <span class="footer-col-head">Explore</span>
      <a href="/programming-language-graph">Programming language graph</a>
      <a href="/programming-language-family-tree">Language family tree</a>
      <a href="/programming-language-evolution">Evolution timeline</a>
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
  <p class="footer-note">Articles here are drafted with AI and reviewed by a human. Implementation and lineage facts are sourced from public references such as Wikipedia and Wikidata, and cited on each page. Spot an error? <a href="https://github.com/sanketmuchhala/LanguageLineage/issues" rel="noopener noreferrer">Open an issue on GitHub</a> and it gets fixed.</p>
  <div class="footer-bottom">Made with <span style="color:#fb7185">❤️</span> by <a href="https://github.com/sanketmuchhala" rel="noopener noreferrer">Sanket Muchhala</a> &middot; <a href="/">Language Lineage</a></div>
  </div>
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
  logo_url?: string | null;
  logo_kind?: 'devicon' | 'wikimedia' | 'proxy' | 'none' | null;
  runtime_model?: string;
  garbage_collected?: boolean | null;
  current_primary_implementation_language?: string;
  company?: string | null;
  peak_year?: number | null;
  current_users_estimate?: string | null;
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

// Wikipedia / Wikidata enrichment (scraped non-copyrightable facts).
// Produced offline by scripts/harvestWikipediaContent.ts into dataset/v5/enrichment_v5.json.
// On-page prose is synthesized from these facts and cited; Wikipedia text is never pasted.
interface EnrichedNode {
  name: string;
  wikidata_id: string;
  wikipedia_title: string;
  wikipedia_url: string;
  tagline: string | null;
  facts: {
    designers: string[];
    developers: string[];
    license: string[];
    influenced_by: string[];
    implemented_in: string[];
    website: string | null;
    file_extensions: string[];
  };
  sources: { wikidata: string; wikipedia: string };
}

const ENRICHMENT: Record<string, EnrichedNode> = (() => {
  try {
    const parsed = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/enrichment_v5.json'), 'utf8'));
    return parsed.enrichment ?? {};
  } catch {
    return {};
  }
})();

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

function aOrAn(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a';
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

function truncateMetaDescription(text: string, maxLength = 155): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const clipped = normalized.slice(0, maxLength - 3);
  // Only match sentence-ending punctuation followed by a space (not mid-word periods like "Node.js")
  let sentenceEnd = -1;
  for (let i = clipped.length - 1; i >= 80; i--) {
    if ((clipped[i] === '.' || clipped[i] === '?' || clipped[i] === '!') &&
        (i + 1 === clipped.length || clipped[i + 1] === ' ')) {
      sentenceEnd = i;
      break;
    }
  }
  if (sentenceEnd >= 80) return clipped.slice(0, sentenceEnd + 1);

  const lastSpace = clipped.lastIndexOf(' ');
  const trimmed = clipped
    .slice(0, lastSpace >= 80 ? lastSpace : clipped.length)
    .replace(/[,:;–-]\s*$/, '')
    .trim();

  return `${trimmed}...`;
}

function writeFile(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

const TOC_SKIP = ['Evidence Sources', 'Related Languages', 'Discover More', 'Frequently Asked', 'Explore in the Graph', 'Related Pages', 'Quick Facts'];

function insertPageToc(html: string): string {
  if (!html.includes('%%TOC%%')) return html;

  const headings: { id: string; text: string }[] = [];
  const idCounter: Record<string, number> = {};

  const processed = html.replace(
    /<h2((?:[^>]*?))>([\s\S]*?)<\/h2>/g,
    (match, attrs: string, inner: string) => {
      if (attrs.includes('lang-written-q')) return match;
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (TOC_SKIP.some(p => text.startsWith(p))) return match;
      if (!text) return match;

      const baseId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
      if (!baseId) return match;

      const count = idCounter[baseId] ?? 0;
      idCounter[baseId] = count + 1;
      const id = count === 0 ? baseId : `${baseId}-${count}`;

      if (attrs.includes('id=')) {
        const existingId = attrs.match(/id="([^"]+)"/)?.[1] ?? id;
        headings.push({ id: existingId, text });
        return match;
      }

      headings.push({ id, text });
      return `<h2${attrs} id="${id}">${inner}</h2>`;
    }
  );

  if (headings.length < 5) return processed.replace('%%TOC%%', '');

  const tocHtml = `<nav class="page-toc" aria-label="Page contents">
  <p class="page-toc-label">On this page</p>
  <ol class="page-toc-list">
${headings.map(h => `    <li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('\n')}
  </ol>
</nav>`;

  return processed.replace('%%TOC%%', tocHtml);
}

function processPage(html: string): string {
  // Wrap tables in overflow container to preserve semantics while enabling mobile scroll
  const wrapped = html
    .replace(/<table\b([^>]*)>/g, '<div class="table-wrap"><table$1>')
    .replace(/<\/table>/g, '</table></div>');
  return insertPageToc(wrapped);
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
    title: 'What is Python written in? CPython: written in C | Language Lineage',
    description: "Python's reference implementation, CPython, is written in C. Explore its runtime, bootstrap history, and language lineage.",
  },
  javascript: {
    title: 'What is JavaScript written in? V8, SpiderMonkey, and JSC | Language Lineage',
    description: 'JavaScript engines V8, SpiderMonkey, and JavaScriptCore are primarily written in C++. Explore their implementations and lineage.',
  },
  rust: {
    title: 'What is Rust written in? rustc bootstrapping explained | Language Lineage',
    description: 'Modern Rust is self-hosting, rustc is written in Rust. Explore its OCaml origins, bootstrap chain, and LLVM backend.',
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
    title: "What is V8 written in? Google's JS engine in C++ | Language Lineage",
    description: "Google's V8 JavaScript engine is written in C++. It powers Chrome, Node.js, and Deno. Explore its implementation.",
  },
  llvm: {
    title: 'What is LLVM written in? Compiler infrastructure in C++ | Language Lineage',
    description: 'LLVM is written in C++. It is a compiler infrastructure used by Clang, Rust, Swift, and many other languages.',
  },
  gcc: {
    title: 'What is GCC written in? GNU collection written in C++ | Language Lineage',
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

interface QuickFact {
  label: string;
  value: string;
  href?: string;
}

interface PriorityContent {
  answerHtml: string;
  faqAnswer: string;
  facts: QuickFact[];
  sections: { heading: string; body: string }[];
}

const PRIORITY_CONTENT: Record<string, PriorityContent> = {
  python: {
    answerHtml: '<strong>Python</strong> usually means <strong>CPython</strong>, the reference implementation, and CPython is written primarily in <strong>C</strong>. The Python language specification is implementation-independent, so other Python runtimes can be written in other languages.',
    faqAnswer: "Python's reference implementation, CPython, is written primarily in C. The language specification is implementation-independent, and other implementations include PyPy, Jython, and IronPython.",
    facts: [
      { label: 'Short answer', value: 'CPython is written primarily in C' },
      { label: 'Language spec', value: 'Implementation-independent' },
      { label: 'Main runtime', value: 'CPython' },
      { label: 'Other implementations', value: 'PyPy, Jython, IronPython' },
    ],
    sections: [
      {
        heading: 'Python language vs CPython',
        body: `<p>When people ask what Python is written in, they almost always mean CPython, the reference implementation maintained by the Python Software Foundation. CPython is a bytecode interpreter: it compiles Python source code to a compact intermediate format and then executes those instructions inside a tight C loop called <code>ceval.c</code>. The parser, abstract-syntax-tree builder, bytecode compiler, and the main evaluation loop are all implemented in C.</p>
<p>CPython also ships the Python standard library, which is a mix: the performance-sensitive parts (regular expressions, JSON, CSV parsing, cryptography) are C extension modules, while the majority of the library is written in Python itself. This split reflects a deliberate design choice: write in Python where clarity matters, drop to C where speed does.</p>
<p>The Python language itself is a specification, not a piece of code. That specification does not mandate C. A compatible Python implementation can be written in any language as long as it follows the same language semantics defined in the CPython documentation and the language reference.</p>`,
      },
      {
        heading: 'CPython architecture and the C extension API',
        body: `<p>CPython's internal architecture connects Python objects to C memory through a single foundational struct: <code>PyObject</code>. Every Python value, whether an integer, a list, or a function, is a <code>PyObject</code> at the C level. The reference-count field inside that struct drives CPython's primary memory management strategy: when the count reaches zero, the object is freed. A cycle-detecting garbage collector runs periodically to handle circular references that reference counting alone cannot reclaim.</p>
<p>CPython exposes a stable C extension API so that third-party libraries can implement performance-sensitive logic in C while behaving like ordinary Python modules. NumPy, Pandas, SciPy, and most data-science libraries use this API. Extensions link directly against the Python interpreter, which is why NumPy wheels are specific to a Python version and platform.</p>
<p>The GIL (Global Interpreter Lock) is a mutex inside CPython that protects the interpreter's internal state. Only one thread can execute Python bytecode at a time. This simplifies reference counting but limits parallelism on CPU-bound workloads. Python 3.13 introduced an experimental free-threaded build (PEP 703) that removes the GIL, though the ABI-stable extension ecosystem is still catching up.</p>`,
      },
      {
        heading: 'Python implementations compared',
        body: `<table class="impl-table">
  <thead><tr><th>Implementation</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>CPython</td><td>C and Python</td><td>Reference implementation and most common runtime</td></tr>
    <tr><td>PyPy</td><td>RPython and Python</td><td>Alternative runtime with JIT compilation, often 5-10x faster on CPU-bound loops</td></tr>
    <tr><td>Jython</td><td>Java</td><td>Python implementation that runs on the JVM and integrates with Java libraries</td></tr>
    <tr><td>IronPython</td><td>C#</td><td>Python implementation for .NET; integrates with the CLR</td></tr>
    <tr><td>MicroPython</td><td>C</td><td>Lean CPython-compatible implementation for microcontrollers</td></tr>
    <tr><td>GraalPy</td><td>Java</td><td>Python on GraalVM, targeting high-throughput JIT performance</td></tr>
  </tbody>
</table>`,
      },
      {
        heading: 'Python release history',
        body: `<span id="release-date"></span>
<p>Guido van Rossum began Python in the late 1980s as a hobby project at Centrum Wiskunde and Informatica (CWI) in the Netherlands, aiming for a language that was easy to read and to teach. The first public release, Python 0.9.0, appeared in February 1991. Python 1.0 arrived in January 1994, adding lambda, map, filter, and reduce.</p>
<p>Python 2.0 (October 2000) introduced list comprehensions, garbage collection for cycles, and Unicode support. The 2.x line continued until Python 2.7 (2010), which received extended support through 2020 to ease migration.</p>
<p>Python 3.0 (December 2008) was a clean break: it unified the string and bytes model around Unicode, removed the old-style division behavior, and dropped several legacy warts. Adoption was initially slow because Python 3 was intentionally incompatible with Python 2. By the mid-2010s, the ecosystem had largely migrated.</p>
<p>The modern Python 3.x cycle follows an annual release cadence. Notable milestones: 3.5 (2015, async and await), 3.6 (2016, f-strings), 3.8 (2019, walrus operator), 3.10 (2021, structural pattern matching), 3.12 (2023, per-interpreter GIL, improved error messages), 3.13 (2024, free-threaded experimental build). Each minor release is supported for five years.</p>`,
      },
    ],
  },
  javascript: {
    answerHtml: '<strong>JavaScript</strong> is a language standard, so the language itself is not "written in" one language. Modern JavaScript engines are mostly written in <strong>C++</strong>: V8, SpiderMonkey, and JavaScriptCore all use C++ for performance-critical compiler and runtime code.',
    faqAnswer: 'JavaScript itself is a language standard. Modern JavaScript engines such as V8, SpiderMonkey, and JavaScriptCore are mostly written in C++, although the earliest SpiderMonkey implementation was written in C.',
    facts: [
      { label: 'Short answer', value: 'Modern JavaScript engines are mostly C++' },
      { label: 'Specification', value: 'ECMAScript' },
      { label: 'Major engines', value: 'V8, SpiderMonkey, JavaScriptCore' },
      { label: 'Historical note', value: 'Original SpiderMonkey began in C' },
    ],
    sections: [
      {
        heading: 'JavaScript language vs JavaScript engines',
        body: `<p>JavaScript source code runs inside an engine. The ECMAScript specification, maintained by TC39 and published by Ecma International, defines the language: its syntax, semantics, and standard library. Engines such as V8, SpiderMonkey, and JavaScriptCore implement that specification. A JavaScript program is not "written in" a particular language any more than a PDF document is "written in" Acrobat; the engine is the implementation.</p>
<p>That distinction matters when answering "what is JavaScript written in?" The answer that is actually useful is about engines, because the engines are what run on your machine. V8 powers Chrome and Node.js. SpiderMonkey powers Firefox. JavaScriptCore powers Safari. Every major engine writes its performance-critical compilation and runtime code in C++, which gives it the low-level control needed to JIT-compile JavaScript to native machine code at acceptable overhead.</p>
<p>TypeScript, Babel, and other transpilers are written in JavaScript or TypeScript. They are pre-processing tools, not engines. They transform source code before it reaches an engine, but they do not define how JavaScript executes.</p>`,
      },
      {
        heading: 'How modern JavaScript engines compile code',
        body: `<p>Modern JavaScript engines do not interpret source code line by line. They use a multi-tier compilation pipeline that trades compilation cost against execution speed based on how often each function runs.</p>
<p>V8's pipeline illustrates the pattern. First, V8 parses JavaScript into an AST and compiles it to Ignition bytecode, a compact intermediate representation. Ignition executes bytecode immediately. While it runs, V8 tracks how many times each function is called and what types its arguments receive. Functions that exceed a hotness threshold are handed to TurboFan, V8's optimizing JIT compiler, which generates highly tuned machine code based on the observed types. V8 introduced Maglev in 2023 as a mid-tier between Ignition and TurboFan, reducing compilation latency for medium-hot functions.</p>
<p>Speculative optimization is key. TurboFan assumes that a variable that has always been an integer will continue to be one, and generates fast integer code. If that assumption breaks because a string arrives, the engine deoptimizes: it throws away the compiled code and falls back to Ignition, then potentially recompiles with the wider type profile. This cycle is invisible to developers but drives JavaScript performance on tight loops and server-side Node.js workloads.</p>`,
      },
      {
        heading: 'Major JavaScript engines',
        body: `<table class="impl-table">
  <thead><tr><th>Engine</th><th>Written in</th><th>Used by</th><th>JIT tiers</th></tr></thead>
  <tbody>
    <tr><td>V8</td><td>C++</td><td>Chrome, Node.js, Deno, Electron</td><td>Ignition, Maglev, TurboFan</td></tr>
    <tr><td>SpiderMonkey</td><td>C++, Rust, JavaScript</td><td>Firefox</td><td>Baseline JIT, IonMonkey</td></tr>
    <tr><td>JavaScriptCore</td><td>C++</td><td>Safari and WebKit</td><td>LLInt, Baseline JIT, DFG, FTL</td></tr>
    <tr><td>Hermes</td><td>C++</td><td>React Native</td><td>AOT bytecode, minimal JIT</td></tr>
    <tr><td>QuickJS</td><td>C</td><td>Embedded environments</td><td>Interpreter only</td></tr>
  </tbody>
</table>`,
      },
      {
        heading: 'JavaScript release history',
        body: `<span id="release-date"></span>
<p>Brendan Eich created JavaScript in ten days in May 1995 while at Netscape, under a brief to make Navigator's pages interactive without requiring a Java applet. It shipped as LiveScript, was renamed JavaScript for marketing reasons, and had little in common with Java beyond the name and some syntax surface. Microsoft's JScript reverse-engineered it for Internet Explorer shortly after.</p>
<p>Ecma International standardized the language as ECMAScript. ES1 was published in June 1997. ES3 (1999) added regular expressions and try/catch and became the de-facto baseline for the 2000s. ES5 (2009) added strict mode, JSON support, and Array methods. ES6, rechristened ES2015, was the biggest release in the language's history: classes, arrow functions, promises, modules, template literals, destructuring, and generators.</p>
<p>Since ES2016, TC39 has shipped a new ECMAScript edition every June. Major additions include async/await (ES2017), optional chaining and nullish coalescing (ES2020), top-level await (ES2022), and array grouping and set operations (ES2024). The V8 and SpiderMonkey teams typically ship new syntax within months of TC39 Stage 4 approval.</p>`,
      },
    ],
  },
  rust: {
    answerHtml: '<strong>Rust</strong> is self-hosting: the official compiler, <strong>rustc</strong>, is written in <strong>Rust</strong>. Early Rust used an OCaml compiler, and modern rustc uses LLVM as its backend.',
    faqAnswer: 'Rust is self-hosting. The official Rust compiler, rustc, is written in Rust. The first Rust compiler was written in OCaml, and modern rustc uses LLVM as its backend.',
    facts: [
      { label: 'Short answer', value: 'rustc is written in Rust' },
      { label: 'Original compiler', value: 'OCaml' },
      { label: 'Backend', value: 'LLVM' },
      { label: 'Bootstrap status', value: 'Self-hosting since 2011' },
    ],
    sections: [
      {
        heading: 'The OCaml origin and bootstrap transition',
        body: `<p>Rust did not start self-hosted. Graydon Hoare began the language in 2006 as a personal project while working at Mozilla. The first compiler, known informally as rustboot, was written in OCaml. OCaml was a pragmatic choice for a language researcher: it has a powerful type system and pattern matching that suited the rapid experimentation Rust required in those early years.</p>
<p>Mozilla began sponsoring the project in 2009. By that point the team was designing Rust's ownership and borrowing rules, a type system complex enough that the OCaml compiler would have become a maintenance burden: OCaml developers on the team were limited, and writing the compiler in the language being designed is the strongest possible end-to-end test of its expressiveness.</p>
<p>The transition happened incrementally. The team first rewrote rustboot in Rust while keeping OCaml as the compilation host. Once that Rust-in-Rust compiler could compile itself, the OCaml dependency was dropped. By 2011, Rust was self-hosting: every new rustc release is compiled by the previous release. This is the standard self-hosting bootstrap: a stage-0 binary (the prior release) compiles stage-1 from the current source, stage-1 compiles stage-2, and stage-2 must be byte-for-byte identical to stage-3 to confirm the toolchain is internally consistent.</p>`,
      },
      {
        heading: 'rustc compiler architecture',
        body: `<p>rustc is a multi-stage compiler with several distinct intermediate representations. Source code is parsed into an abstract syntax tree (AST), then lowered to HIR (High-level Intermediate Representation), where type inference and trait resolution run. HIR is then lowered to MIR (Mid-level Intermediate Representation), which is the layer where the borrow checker operates. MIR's explicit control-flow graph makes liveness analysis and borrow-checking tractable.</p>
<p>After MIR, rustc lowers to LLVM IR and calls LLVM for machine-code generation. LLVM provides target support for x86-64, ARM, RISC-V, WebAssembly, and other platforms. The decision to use LLVM from the beginning let rustc focus on language semantics rather than code generation, and gave Rust access to decades of LLVM optimization work.</p>
<p>A second backend, Cranelift, has been available since Rust 1.67 as an opt-in alternative for debug builds. Cranelift compiles faster than LLVM at the cost of less optimized output, which speeds up the inner loop of Rust development. Cranelift is also the JIT backend for Wasmtime. The long-term goal is to use Cranelift for debug builds and LLVM for release builds.</p>`,
      },
      {
        heading: 'mrustc: an alternative bootstrap path',
        body: `<p>mrustc is an independent Rust compiler written in C++. Unlike rustc, mrustc does not aim to be a general-purpose production compiler. Its purpose is security: it can compile an early version of rustc without relying on a pre-built rustc binary, breaking the binary dependency chain that concerns reproducible-build advocates.</p>
<p>The Bootstrappable Builds project highlights the risk that a malicious binary compiler could inject hidden code into programs it compiles, including future compilers, in a way that no inspection of source code would reveal. This is Ken Thompson's "Trusting Trust" attack. mrustc provides a path from C (which has diverse compilers like GCC and Clang to cross-check each other) to Rust without trusting a Rust binary of unknown provenance.</p>
<p>In practice, most Rust users rely on the rustup toolchain manager, which downloads pre-built binaries from the official Rust release infrastructure. mrustc is relevant to distributions and organizations that require a fully source-audited build chain.</p>`,
      },
      {
        heading: 'Rust implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>rustc frontend (parser, HIR, MIR, borrow checker)</td><td>Rust</td><td>Parses, analyzes, type-checks, and borrow-checks Rust source</td></tr>
    <tr><td>LLVM backend</td><td>C++</td><td>Optimization and machine-code generation for release builds</td></tr>
    <tr><td>Cranelift backend</td><td>Rust</td><td>Optional fast debug-build backend; also powers Wasmtime</td></tr>
    <tr><td>rustboot (historical)</td><td>OCaml</td><td>Original compiler before Rust became self-hosting (2006 to 2011)</td></tr>
    <tr><td>mrustc</td><td>C++</td><td>Independent compiler for security-audited bootstrap chains</td></tr>
    <tr><td>Rust standard library</td><td>Rust</td><td>core and std, including allocator, collections, I/O, and threading</td></tr>
  </tbody>
</table>`,
      },
      {
        heading: 'Rust release history and edition system',
        body: `<span id="release-date"></span>
<p>Graydon Hoare started Rust in 2006 as a personal project. Mozilla sponsored the project from 2009. Rust 0.1 shipped in January 2012. The language went through extensive design iteration during those years: early Rust had typestate, a different memory model, and a green-threading runtime, all of which were removed before 1.0.</p>
<p>Rust 1.0 was released on May 15, 2015. It committed to stability: code that compiled under Rust 1.0 would compile without modification under all future Rust 1.x releases. Rust has shipped a new stable release every six weeks since 1.0, and that cadence has been maintained without interruption.</p>
<p>The edition system manages language evolution without breaking the stability promise. An edition is an opt-in compatibility boundary: code in Rust 2015, 2018, and 2021 editions can coexist in one crate graph, and rustc compiles them all. Editions allow the language to change syntax without forcing every crate to update at once. The 2018 edition made the module system cleaner and introduced the async keyword. The 2021 edition updated closure captures and improved the prelude. Rust 2024 was stabilized in 2025.</p>
<p>The Rust Foundation was established in February 2021, with AWS, Google, Huawei, Microsoft, and Mozilla as founding members, to own the Rust trademark, run the infrastructure, and fund core team contributors. Rust has since been adopted by the Linux kernel (support landed in Linux 6.1 in December 2022), the Windows kernel, Android, and major cloud providers.</p>`,
      },
    ],
  },
  go: {
    answerHtml: '<strong>Go</strong> is self-hosting: since Go 1.5, the Go compiler and most of the runtime have been written in <strong>Go</strong>. Before that rewrite, the original Go compiler was written in <strong>C</strong>.',
    faqAnswer: 'Go is self-hosting. Since Go 1.5 in 2015, the Go compiler and most of the runtime have been written in Go. The earlier Go compiler was written in C.',
    facts: [
      { label: 'Short answer', value: 'Go compiler and runtime are written in Go' },
      { label: 'Self-hosting since', value: 'Go 1.5 in 2015' },
      { label: 'Before Go 1.5', value: 'Compiler written in C' },
      { label: 'Low-level pieces', value: 'Some assembly remains' },
    ],
    sections: [
      {
        heading: 'Go before and after Go 1.5',
        body: `<p>The original Go toolchain was written in C. Robert Griesemer, Rob Pike, and Ken Thompson designed Go at Google beginning in 2007, and the first open-source release in November 2009 shipped with a C compiler. Using C was pragmatic: the team were C experts, the Go runtime and scheduler concepts were familiar in C, and writing a new language's first compiler in C is the conventional bootstrapping path.</p>
<p>The move to a self-hosted compiler was deliberate and methodical. In 2013, Russ Cox created a tool that mechanically translated the C compiler source to Go, producing a Go compiler that was syntactically Go but still structurally a C program. That automatically translated compiler was the foundation for Go 1.5's compiler, released in August 2015.</p>
<p>Go 1.5 removed the C compiler entirely from the toolchain. The build system no longer required a C toolchain: you only needed a prior Go binary to bootstrap. The same release also moved the runtime's garbage collector and scheduler from C to Go, significantly improving the ability of Go contributors to understand and modify the runtime. The Go garbage collector, written in Go since 1.5, received major improvements in 1.5 (concurrent), 1.8 (sub-millisecond pauses), and 1.14 (preemptible goroutines).</p>`,
      },
      {
        heading: 'Go runtime architecture',
        body: `<p>The Go runtime is written in Go and a small amount of assembly, and provides three major services: goroutine scheduling, garbage collection, and low-level primitives for the standard library.</p>
<p>Goroutines are Go's concurrency primitive. They are multiplexed onto operating system threads using an M:N scheduler. The scheduler's model has three entities: M (OS thread), P (logical processor, controlled by GOMAXPROCS), and G (goroutine). Each P holds a local run queue of goroutines and draws from a global run queue when its own is empty. Work stealing lets an idle P take goroutines from a busy P's queue, keeping all available OS threads occupied.</p>
<p>Go's garbage collector is a concurrent tri-color mark-sweep collector designed for low-latency applications. The collector runs concurrently with the program during the mark and sweep phases and stops the world only briefly to acknowledge marking completion and to flip the write barrier state. Goroutine stacks start small (a few kilobytes) and grow by copying to a larger allocation on demand, which allows starting hundreds of thousands of goroutines in a single process without pre-allocating large stacks.</p>`,
      },
      {
        heading: 'Go implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>gc compiler (go tool compile)</td><td>Go</td><td>Self-hosted since Go 1.5 (August 2015)</td></tr>
    <tr><td>Original compiler</td><td>C</td><td>Used before Go 1.5; mechanically translated to Go in 2013 to 2015</td></tr>
    <tr><td>Runtime (scheduler, GC)</td><td>Go and assembly</td><td>Concurrent GC, goroutine scheduler using the GMP model</td></tr>
    <tr><td>Standard library</td><td>Go</td><td>Nearly all pure Go, with small assembly stubs for atomic operations and syscalls</td></tr>
    <tr><td>gccgo</td><td>C++</td><td>Alternative Go frontend for GCC; less commonly used than the gc compiler</td></tr>
  </tbody>
</table>`,
      },
      {
        heading: 'Go release history',
        body: `<span id="release-date"></span>
<p>Go was designed by Robert Griesemer, Rob Pike, and Ken Thompson at Google starting in September 2007. The initial goal was a language that addressed frustrations with C++ build times and Java's verbosity while retaining C-like simplicity. Go's concurrency model drew from Tony Hoare's Communicating Sequential Processes (CSP), which Rob Pike had previously explored in the Newsqueak and Limbo languages.</p>
<p>Go was open-sourced in November 2009 under a BSD-style license. Go 1.0 shipped in March 2012 with a compatibility guarantee: source code written for Go 1.0 would continue to compile on all future Go 1.x releases. That promise has been kept without exception.</p>
<p>Key releases: Go 1.5 (August 2015, self-hosted compiler and concurrent GC), Go 1.11 (2018, module system replacing GOPATH), Go 1.14 (2020, asynchronous preemption for goroutines), Go 1.18 (March 2022, generics via type parameters, the biggest language change since 1.0), Go 1.21 (August 2023, built-in min, max, and clear functions, WASI preview), Go 1.22 (2024, loop variable semantics corrected). Go ships two releases per year, in February and August.</p>`,
      },
    ],
  },
  java: {
    answerHtml: '<strong>Java</strong> has several layers. The <strong>javac</strong> compiler is written in <strong>Java</strong>, while the HotSpot JVM runtime is written mainly in <strong>C and C++</strong>. The Java standard library is largely written in Java.',
    faqAnswer: 'The Java compiler javac is written in Java. The HotSpot JVM runtime is written mainly in C and C++, and the Java standard library is largely written in Java.',
    facts: [
      { label: 'Compiler', value: 'javac is written in Java' },
      { label: 'Runtime', value: 'HotSpot JVM is written in C and C++' },
      { label: 'Standard library', value: 'Mostly Java' },
      { label: 'Compiled output', value: 'JVM bytecode' },
    ],
    sections: [
      {
        heading: 'Java compiler vs JVM runtime',
        body: `<p>Java has a two-stage execution model that separates compilation from running. The javac compiler takes Java source files and produces class files containing JVM bytecode. Bytecode is a compact, platform-independent instruction set: the same class files run on Windows, Linux, and macOS without recompilation. Javac itself is written in Java and is part of the JDK (Java Development Kit). Because javac is a Java program, building a new version of javac requires an existing Java compiler.</p>
<p>Executing bytecode is a different job from compiling source. The HotSpot JVM, which is the production JVM in OpenJDK (and thus in Oracle JDK, Amazon Corretto, Eclipse Temurin, and others), is written primarily in C and C++. HotSpot includes an interpreter for cold code paths, a JIT compiler that compiles hot methods to native machine code, and a suite of garbage collectors. The JIT compiler observes which methods are called most often and optimizes those aggressively, including inlining call chains that would be expensive to analyze at compile time.</p>
<p>The Java standard library (java.lang, java.util, java.io, java.nio, and friends) is largely written in Java, though some classes have native methods that delegate to C or C++ for low-level OS integration. The combination gives Java its portability: application code and most of the standard library are bytecode that the JVM runs anywhere; only the JVM itself is platform-native code.</p>`,
      },
      {
        heading: 'HotSpot JVM and modern JIT compilation',
        body: `<p>HotSpot's name comes from its original insight: most programs spend most of their time in a small fraction of their code. HotSpot monitors execution counts and compiles hot methods to native code using two JIT compilers: C1 (the client compiler, fast to compile but less optimized output) and C2 (the server compiler, slower to compile but generates heavily optimized native code). By default, methods start with the C1 tier and are promoted to C2 if they remain hot enough.</p>
<p>GraalVM is a JDK distribution that replaces the C2 compiler with Graal, a JIT written entirely in Java. Graal can apply more aggressive speculative optimizations because it can use the full Java type system to represent its internal analysis. GraalVM also offers Native Image, which AOT-compiles Java applications to self-contained native executables by running compilation offline, reducing startup time and memory footprint significantly.</p>
<p>Modern Java garbage collector options include: G1 (Garbage First, the default since Java 9, designed for large heaps with predictable pause targets), ZGC (concurrent, sub-millisecond pauses, available since Java 15, generational since Java 21), and Shenandoah (concurrent compaction, contributed by Red Hat). Each collector makes different tradeoffs between throughput, latency, and footprint.</p>`,
      },
      {
        heading: 'Java implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>javac</td><td>Java</td><td>Compiles Java source to JVM bytecode (.class files)</td></tr>
    <tr><td>HotSpot JVM (interpreter + JIT)</td><td>C and C++</td><td>Executes bytecode; JIT-compiles hot methods to native code via C1 and C2</td></tr>
    <tr><td>Graal JIT</td><td>Java</td><td>Alternative JIT in GraalVM; replaces C2 with a Java-written optimizing compiler</td></tr>
    <tr><td>Java standard library (java.*)</td><td>Java (with native stubs)</td><td>Core APIs; some native methods delegate to C for OS calls</td></tr>
    <tr><td>GC (G1, ZGC, Shenandoah)</td><td>C++</td><td>Memory management, running concurrently with application threads</td></tr>
  </tbody>
</table>`,
      },
      {
        heading: 'Java release history',
        body: `<span id="release-date"></span>
<p>Java was created by James Gosling and colleagues at Sun Microsystems beginning in 1991, under the internal codename "Oak." The Green Project aimed to build a language for consumer electronics with a small footprint and platform independence. When the consumer electronics market did not materialize, the team pivoted to the web: Java 1.0 launched in January 1996 alongside the promise of "Write Once, Run Anywhere," backed by the first browser-embedded JVM.</p>
<p>Java 1.1 (1997) added inner classes, reflection, and JDBC. Java 1.2 (1998, branded Java 2) introduced the Collections framework and the Swing UI toolkit. Java 5 (2004, previously numbered 1.5) was the biggest language update before Java 8: generics, annotations, enum types, autoboxing, and the enhanced for loop. Java 8 (March 2014) added lambda expressions, the Stream API, and the new java.time package.</p>
<p>Oracle acquired Sun in 2010. Java 9 (September 2017) introduced the module system (Project Jigsaw) and shifted to a six-month release cadence. Since then, Java releases arrive in March and September, with Long-Term Support (LTS) versions every three years. LTS releases: Java 11 (September 2018), Java 17 (September 2021), Java 21 (September 2023). Pattern matching, sealed classes, records, and virtual threads (Project Loom) shipped across Java 14 through 21.</p>`,
      },
    ],
  },
  c: {
    answerHtml: '<strong>C</strong> is compiled by toolchains such as <strong>GCC</strong> and <strong>Clang</strong>. Those compilers are themselves written in C and C++, so in practice C is self-hosting: a C compiler is built using an existing C/C++ compiler.',
    faqAnswer: 'C is compiled by toolchains such as GCC and Clang. GCC is written primarily in C, and Clang is written in C++, so C compilers are largely written in C and C++. C itself compiles down to machine code.',
    facts: [
      { label: 'Short answer', value: 'Compiled by GCC (C) and Clang (C++)' },
      { label: 'Created by', value: 'Dennis Ritchie at Bell Labs, 1972' },
      { label: 'Standard', value: 'ANSI C (1989), then ISO C' },
      { label: 'Role', value: 'Implementation language for most OS kernels and runtimes' },
    ],
    sections: [
      {
        heading: 'Why C is the substrate of computing',
        body: `<p>C compiles directly to machine code, with no managed runtime of its own. That makes it the implementation language for operating-system kernels, language runtimes, and the compilers themselves. Many interpreters on this site, including CPython, the reference Ruby (MRI), and PHP, have runtimes written in C.</p>
<p>C is effectively self-hosting. A new build of GCC is produced by an existing C/C++ compiler in a multi-stage bootstrap, the same pattern used by self-hosting languages like Rust and Go.</p>`,
      },
      {
        heading: 'C compilers compared',
        body: `<table class="impl-table">
  <thead><tr><th>Compiler</th><th>Written in</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>GCC</td><td>C and C++</td><td>GNU Compiler Collection; bootstrapped in multiple stages</td></tr>
    <tr><td>Clang</td><td>C++</td><td>LLVM-based C/C++/Objective-C front end</td></tr>
    <tr><td>TCC</td><td>C</td><td>Tiny C Compiler; small, fast, used in bootstrap discussions</td></tr>
  </tbody>
</table>`,
      },
    ],
  },
  cxx: {
    answerHtml: '<strong>C++</strong> is compiled by <strong>GCC (g++)</strong>, <strong>Clang</strong>, and <strong>MSVC</strong>. These compilers are themselves written mostly in C++, so C++ is self-hosting. The Clang/LLVM toolchain is written in C++.',
    faqAnswer: 'C++ is compiled by GCC (g++), Clang, and MSVC. Those compilers are written largely in C++ themselves, so C++ is self-hosting. C++ compiles to native machine code.',
    facts: [
      { label: 'Short answer', value: 'Compiled by g++, Clang, and MSVC (all C++)' },
      { label: 'Created by', value: 'Bjarne Stroustrup, 1985' },
      { label: 'Backend', value: 'LLVM (Clang) or GCC' },
      { label: 'Self-hosting', value: 'Yes, C++ compilers are written in C++' },
    ],
    sections: [
      {
        heading: 'C++ compilers and the LLVM backend',
        body: `<p>C++ has no single reference compiler. The three dominant toolchains, GCC's g++, Clang, and Microsoft's MSVC, each parse C++ and emit native code. Clang is a C++ front end for LLVM, and LLVM's optimizer and code generator are also written in C++. That same LLVM backend is used by Rust, Swift, and Julia.</p>
<p>Because every major C++ compiler is itself a C++ program, building a compiler requires an existing C++ toolchain, the classic self-hosting arrangement.</p>`,
      },
      {
        heading: 'C++ toolchains compared',
        body: `<table class="impl-table">
  <thead><tr><th>Toolchain</th><th>Written in</th><th>Backend</th></tr></thead>
  <tbody>
    <tr><td>GCC (g++)</td><td>C and C++</td><td>GCC backend</td></tr>
    <tr><td>Clang</td><td>C++</td><td>LLVM</td></tr>
    <tr><td>MSVC</td><td>C++</td><td>Microsoft backend</td></tr>
  </tbody>
</table>`,
      },
    ],
  },
  typescript: {
    answerHtml: '<strong>TypeScript</strong> is self-hosting: the TypeScript compiler (<strong>tsc</strong>) is written in <strong>TypeScript</strong>. It does not have its own runtime, it transpiles to JavaScript, which then runs on engines such as V8.',
    faqAnswer: 'The TypeScript compiler, tsc, is written in TypeScript itself, so TypeScript is self-hosting. TypeScript has no separate runtime; it compiles (transpiles) to JavaScript, which runs on JavaScript engines like V8.',
    facts: [
      { label: 'Short answer', value: 'tsc is written in TypeScript' },
      { label: 'Created by', value: 'Anders Hejlsberg, Microsoft, 2012' },
      { label: 'Output', value: 'Transpiles to JavaScript' },
      { label: 'Runtime', value: 'None of its own, runs on JS engines' },
    ],
    sections: [
      {
        heading: 'TypeScript transpiles, it does not run',
        body: `<p>TypeScript is a typed superset of JavaScript. The compiler checks types and then strips them away, emitting plain JavaScript. There is no TypeScript virtual machine: the generated JavaScript executes on whatever engine the target uses, V8 in Node.js and Chrome, JavaScriptCore in Safari.</p>
<p>tsc is itself written in TypeScript and compiled with a previous version of tsc, making TypeScript self-hosting in the same sense as Rust or Go.</p>`,
      },
    ],
  },
  ruby: {
    answerHtml: 'The reference implementation of <strong>Ruby</strong>, called <strong>MRI</strong> or CRuby, is written in <strong>C</strong>. Alternative implementations include JRuby (Java) and TruffleRuby (Java/GraalVM).',
    faqAnswer: "Ruby's reference implementation, MRI (also called CRuby), is written in C. Alternative implementations include JRuby, written in Java, and TruffleRuby, built on the GraalVM in Java.",
    facts: [
      { label: 'Short answer', value: 'CRuby/MRI is written in C' },
      { label: 'Created by', value: 'Yukihiro Matsumoto, 1995' },
      { label: 'Other implementations', value: 'JRuby (Java), TruffleRuby (GraalVM)' },
      { label: 'Execution', value: 'Bytecode on the YARV virtual machine' },
    ],
    sections: [
      {
        heading: 'Ruby implementations',
        body: `<table class="impl-table">
  <thead><tr><th>Implementation</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>CRuby / MRI</td><td>C</td><td>Reference implementation; runs YARV bytecode</td></tr>
    <tr><td>JRuby</td><td>Java</td><td>Ruby on the JVM</td></tr>
    <tr><td>TruffleRuby</td><td>Java</td><td>High-performance Ruby on GraalVM</td></tr>
  </tbody>
</table>`,
      },
    ],
  },
  haskell: {
    answerHtml: 'The <strong>Glasgow Haskell Compiler (GHC)</strong> is written in <strong>Haskell</strong> and is self-hosting. Its runtime system, which handles lazy evaluation and garbage collection, is written in <strong>C</strong>.',
    faqAnswer: 'The main Haskell compiler, GHC, is written in Haskell and is self-hosting. The GHC runtime system (RTS), which manages lazy evaluation, threads, and garbage collection, is written in C.',
    facts: [
      { label: 'Short answer', value: 'GHC is written in Haskell' },
      { label: 'Runtime system', value: 'Written in C' },
      { label: 'Self-hosting', value: 'Yes' },
      { label: 'Backend', value: 'Native code generator or LLVM' },
    ],
    sections: [
      {
        heading: 'GHC and its C runtime',
        body: `<p>GHC compiles Haskell to native code, optionally through an LLVM backend. The compiler is a large Haskell program and is bootstrapped from a previous GHC. Underneath sits the runtime system (RTS), written in C, which implements Haskell's lazy evaluation, lightweight threads, and generational garbage collector.</p>`,
      },
    ],
  },
  csharp: {
    answerHtml: 'The <strong>C#</strong> compiler, <strong>Roslyn</strong>, is written in <strong>C#</strong>. Compiled C# runs on the .NET runtime (the CLR), which is written mainly in <strong>C++</strong>. The standard library is largely C#.',
    faqAnswer: "C#'s compiler, Roslyn, is written in C# and is self-hosting. C# compiles to .NET intermediate language, which runs on the Common Language Runtime (CLR), written mainly in C++.",
    facts: [
      { label: 'Compiler', value: 'Roslyn is written in C#' },
      { label: 'Runtime', value: 'CLR / CoreCLR is written in C++' },
      { label: 'Created by', value: 'Anders Hejlsberg, Microsoft, 2000' },
      { label: 'Output', value: 'Common Intermediate Language (CIL)' },
    ],
    sections: [
      {
        heading: 'C# implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>Roslyn compiler</td><td>C#</td><td>Compiles C# to CIL bytecode</td></tr>
    <tr><td>CoreCLR runtime</td><td>C++</td><td>JIT-compiles CIL, manages memory</td></tr>
    <tr><td>Base Class Library</td><td>C#</td><td>Core .NET APIs</td></tr>
  </tbody>
</table>`,
      },
    ],
  },
  swift: {
    answerHtml: 'The <strong>Swift</strong> compiler is written in <strong>C++</strong>, with a growing amount of Swift, and uses the <strong>LLVM</strong> backend. The Swift standard library is written in Swift.',
    faqAnswer: 'The Swift compiler is written mainly in C++ and uses LLVM as its backend, while the Swift standard library is written in Swift. Apple open-sourced the toolchain in 2015.',
    facts: [
      { label: 'Short answer', value: 'Swift compiler is C++ on LLVM' },
      { label: 'Standard library', value: 'Written in Swift' },
      { label: 'Created by', value: 'Chris Lattner, Apple, 2014' },
      { label: 'Backend', value: 'LLVM' },
    ],
    sections: [
      {
        heading: 'Swift compiler and LLVM',
        body: `<p>Swift was created by Chris Lattner, who also started LLVM, so the language is built tightly on the LLVM backend that compiles its intermediate representation (SIL) to machine code. The compiler front end is largely C++; the standard library and much newer tooling are written in Swift itself.</p>`,
      },
    ],
  },
  kotlin: {
    answerHtml: 'The <strong>Kotlin</strong> compiler is written in <strong>Kotlin and Java</strong>. It targets JVM bytecode, JavaScript, and native code (through <strong>LLVM</strong>). The original compiler was written in Java.',
    faqAnswer: 'The Kotlin compiler is written in Kotlin and Java and is largely self-hosting. It compiles to JVM bytecode, to JavaScript, and to native binaries via LLVM (Kotlin/Native).',
    facts: [
      { label: 'Short answer', value: 'Kotlin compiler is written in Kotlin and Java' },
      { label: 'Created by', value: 'JetBrains, 2011' },
      { label: 'Targets', value: 'JVM bytecode, JavaScript, native (LLVM)' },
      { label: 'Original compiler', value: 'Written in Java' },
    ],
    sections: [
      {
        heading: 'Kotlin targets three backends',
        body: `<p>Kotlin began as a Java program at JetBrains and has progressively moved to being written in Kotlin. The default target is JVM bytecode, so Kotlin interoperates directly with Java. Kotlin/JS emits JavaScript, and Kotlin/Native compiles through LLVM to standalone native binaries with no JVM.</p>`,
      },
    ],
  },
  v8: {
    answerHtml: '<strong>V8</strong>, Google\'s JavaScript and WebAssembly engine, is written in <strong>C++</strong>. It JIT-compiles JavaScript directly to machine code and powers Chrome, Node.js, and Deno.',
    faqAnswer: 'V8, the JavaScript and WebAssembly engine from Google, is written in C++. It compiles JavaScript to machine code with a tiered JIT and powers Chrome, Node.js, Deno, and Electron.',
    facts: [
      { label: 'Short answer', value: 'V8 is written in C++' },
      { label: 'Developer', value: 'Google' },
      { label: 'Technique', value: 'Tiered JIT to machine code' },
      { label: 'Used by', value: 'Chrome, Node.js, Deno, Electron' },
    ],
    sections: [
      {
        heading: 'Why a JavaScript engine is written in C++',
        body: `<p>JavaScript is a high-level, dynamically typed language, but the engine that runs it needs direct memory control, manual layout of objects, and tight machine-code generation. C++ provides that. V8 parses JavaScript, generates bytecode for its Ignition interpreter, and hot paths are optimized to native code by the TurboFan and Maglev compilers, all implemented in C++.</p>`,
      },
    ],
  },
  spidermonkey: {
    answerHtml: '<strong>SpiderMonkey</strong>, Mozilla\'s JavaScript engine, is written in <strong>C++ and Rust</strong>. It was the first JavaScript engine, created in 1995, and powers Firefox.',
    faqAnswer: "SpiderMonkey, Mozilla's JavaScript engine, is written in C++ and Rust. It was the original JavaScript engine, written by Brendan Eich in 1995, and powers Firefox.",
    facts: [
      { label: 'Short answer', value: 'SpiderMonkey is C++ and Rust' },
      { label: 'Developer', value: 'Mozilla' },
      { label: 'History', value: 'First JavaScript engine, 1995' },
      { label: 'Used by', value: 'Firefox' },
    ],
    sections: [
      {
        heading: 'The original JavaScript engine',
        body: `<p>SpiderMonkey was written by Brendan Eich at Netscape alongside JavaScript itself in 1995. Today it is maintained by Mozilla, written primarily in C++ with an increasing amount of Rust for memory safety, and uses a multi-tier JIT to execute JavaScript in Firefox.</p>`,
      },
    ],
  },
  beam: {
    answerHtml: 'The <strong>BEAM</strong>, the Erlang virtual machine, is written in <strong>C</strong>. It executes bytecode compiled from Erlang and Elixir and provides the Erlang/OTP concurrency runtime.',
    faqAnswer: 'BEAM, the Erlang virtual machine, is written in C. It runs bytecode compiled from Erlang and Elixir and implements the lightweight-process concurrency model of Erlang/OTP.',
    facts: [
      { label: 'Short answer', value: 'BEAM is written in C' },
      { label: 'Runs', value: 'Erlang and Elixir bytecode' },
      { label: 'Model', value: 'Lightweight processes, message passing' },
      { label: 'Part of', value: 'Erlang/OTP' },
    ],
    sections: [
      {
        heading: 'The Erlang virtual machine',
        body: `<p>BEAM is the bytecode interpreter at the heart of the Erlang/OTP system. Written in C, it schedules millions of lightweight processes, isolates their memory, and passes messages between them. Elixir compiles to the same BEAM bytecode, so it inherits the entire Erlang runtime.</p>`,
      },
    ],
  },
};

function renderQuickFacts(facts: QuickFact[]): string {
  if (facts.length === 0) return '';
  const items = facts.map(f => {
    const value = f.href
      ? `<a href="${escapeHtml(f.href)}" rel="noopener noreferrer" target="_blank">${escapeHtml(f.value)}</a>`
      : escapeHtml(f.value);
    return `<div class="quick-fact">
    <dt>${escapeHtml(f.label)}</dt>
    <dd>${value}</dd>
  </div>`;
  }).join('\n');
  return `<section class="quick-facts-section">
  <h2>Quick Facts</h2>
  <dl class="quick-facts">${items}</dl>
</section>`;
}

function buildPriorityContent(node: Language): string {
  const content = PRIORITY_CONTENT[idToSlug(node.id)];
  if (!content) return '';
  const sections = content.sections.map(section => `<section class="intent-section">
  <h2>${escapeHtml(section.heading)}</h2>
  ${section.body}
</section>`).join('\n');
  return `${renderQuickFacts(content.facts)}
${sections}`;
}

// Linked impl-language names for a given relationship type (deduped).
function implLinks(rels: Relationship[], id: string, type: string, nodeMap: Map<string, Language>): string[] {
  return [...new Set(rels.filter(r => r.to_language === id && r.relationship === type).map(r => r.from_language))]
    .map(fid => linkNode(fid, nodeMap));
}

// Prose paragraph describing what the node is implemented in (the "written in" payload).
function buildImplementationNarrative(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const name = escapeHtml(node.name);
  const compiler = implLinks(rels, id, 'compiler_written_in', nodeMap);
  const runtime = implLinks(rels, id, 'runtime_written_in', nodeMap);
  const bootstrap = implLinks(rels, id, 'bootstrap_written_in', nodeMap);
  const rewritten = implLinks(rels, id, 'rewritten_in', nodeMap);

  const clauses: string[] = [];
  if (node.self_hosting) {
    clauses.push(`${name} is <strong>self-hosting</strong>, so its own compiler is written in ${name} itself`);
  } else if (compiler.length) {
    clauses.push(`its compiler is written in ${joinNames(compiler)}`);
  }
  if (runtime.length) clauses.push(`its runtime is implemented in ${joinNames(runtime)}`);
  if (bootstrap.length) clauses.push(`its toolchain was bootstrapped from ${joinNames(bootstrap)}`);
  if (rewritten.length) clauses.push(`it was later rewritten in ${joinNames(rewritten)}`);

  let out = '';
  if (clauses.length > 0) {
    out = `In the Language Lineage dataset, ${joinNames(clauses)}.`;
  } else if (node.current_primary_implementation_language && node.current_primary_implementation_language !== 'unspecified') {
    out = `${name} is primarily implemented in ${escapeHtml(node.current_primary_implementation_language)}.`;
  } else {
    return '';
  }
  // Teach the self-hosting concept the first time it comes up.
  if (node.self_hosting) {
    out += ` Reaching self-hosting, where a language is mature enough to compile itself, is a milestone that proves the language can handle a large, real-world program.`;
  }
  return out;
}

// Prose paragraph placing the node in its lineage (influences in and out).
function buildLineageNarrative(node: Language, rels: Relationship[], nodeMap: Map<string, Language>, e: EnrichedNode): string {
  const id = node.id;
  const name = escapeHtml(node.name);
  const influencedBy = [...new Set(rels.filter(r => r.to_language === id && r.relationship === 'influenced').map(r => r.from_language))]
    .map(fid => linkNode(fid, nodeMap));
  const influenced = [...new Set(rels.filter(r => r.from_language === id && r.relationship === 'influenced').map(r => r.to_language))]
    .map(tid => linkNode(tid, nodeMap));

  const clauses: string[] = [];
  if (influencedBy.length) clauses.push(`drew on ideas from ${joinNames(influencedBy.slice(0, 5))}`);
  else if (e.facts.influenced_by.length) clauses.push(`drew on ideas from ${escapeHtml(joinNames(e.facts.influenced_by.slice(0, 5)))}`);
  if (influenced.length) clauses.push(`went on to influence ${joinNames(influenced.slice(0, 6))}`);
  if (clauses.length === 0) return '';
  return `${name} ${joinNames(clauses)}.`;
}

// --- teaching helpers: turn dataset enums into plain-English, educational phrasing ---
function runtimeModelClause(model?: string): string {
  switch (model) {
    case 'compiled':
    case 'native': return 'compiles ahead of time to native machine code';
    case 'vm': return 'compiles to bytecode that runs on a virtual machine';
    case 'interpreted': return 'is executed directly by an interpreter';
    case 'jit': return 'is just-in-time compiled to machine code as it runs';
    case 'transpiled': return 'compiles (transpiles) into another language to run';
    default: return '';
  }
}

function runtimeModelTeaching(model?: string): string {
  switch (model) {
    case 'vm': return ' Compiling to bytecode for a virtual machine is the same model the JVM and .NET use: the VM, not the CPU, interprets or JIT-compiles the bytecode.';
    case 'jit': return ' A just-in-time (JIT) compiler translates hot code paths to native machine code while the program runs, trading a slower start for faster steady-state speed.';
    case 'transpiled': return ' Transpiling means the compiler emits source in another high-level language rather than machine code, so the output then runs on that language\'s runtime.';
    default: return '';
  }
}

function typingWord(typing?: string): string {
  if (typing === 'static') return 'statically typed';
  if (typing === 'dynamic') return 'dynamically typed';
  if (typing === 'untyped') return 'untyped';
  return '';
}

function usersSentence(name: string, est?: string | null): string {
  switch (est) {
    case 'dominant': return `Today ${name} is one of the most widely used programming languages in the world.`;
    case 'large': return `${name} has a large, active user base today.`;
    case 'moderate': return `${name} keeps a steady, moderate following today.`;
    case 'niche': return `${name} is now used mainly in specialized niches and by dedicated communities.`;
    default: return '';
  }
}

// Multi-section, sourced, educational article synthesized from the dataset + scraped facts.
// includeImpl adds the "How it is implemented" section (omitted on priority pages, which
// already cover implementation in depth via hand-authored content).
function buildEnrichedOverview(node: Language, rels: Relationship[], nodeMap: Map<string, Language>, includeImpl: boolean): string {
  const e = ENRICHMENT[node.id];
  if (!e) return '';
  const isTool = node.id.startsWith('tool:');
  const name = escapeHtml(node.name);
  const developers = e.facts.developers.filter(d => !e.facts.designers.includes(d));
  const sections: string[] = [];

  // ---- About: identity, nature, history ----
  const aboutParas: string[] = [];
  const tagline = e.tagline ? e.tagline.replace(/\.$/, '') : '';

  // Sentence 1: identity + technical nature.
  let p1 = tagline
    ? `<strong>${name}</strong> is ${aOrAn(tagline)} ${escapeHtml(tagline)}.`
    : `<strong>${name}</strong> is a ${isTool ? 'toolchain' : 'programming language'}.`;
  if (!isTool) {
    const nature: string[] = [];
    const tw = typingWord(node.typing);
    if (tw) nature.push(tw);
    if (node.garbage_collected === true) nature.push('garbage-collected');
    const rm = runtimeModelClause(node.runtime_model);
    if (nature.length) {
      p1 += ` It is ${aOrAn(nature[0])} ${joinNames(nature)} language${rm ? ` that ${rm}` : ''}.`;
    } else if (rm) {
      p1 += ` ${name} ${rm}.`;
    }
    if (node.paradigm && node.paradigm.length) p1 += ` It supports ${joinNames(node.paradigm)} programming.`;
    p1 += runtimeModelTeaching(node.runtime_model);
  }
  aboutParas.push(`<p>${p1}</p>`);

  // Sentence 2+: history, makers, popularity.
  const histBits: string[] = [];
  if (node.first_release_year && node.first_release_year > 0) histBits.push(`first appeared in ${node.first_release_year}`);
  let companyNamed = false;
  if (e.facts.designers.length) {
    let d = `was ${isTool ? 'created' : 'designed'} by ${escapeHtml(joinNames(e.facts.designers))}`;
    if (node.company) { d += ` at ${escapeHtml(node.company)}`; companyNamed = true; }
    histBits.push(d);
  } else if (node.company) {
    histBits.push(`was developed at ${escapeHtml(node.company)}`);
    companyNamed = true;
  }
  let p2 = histBits.length ? `${name} ${joinNames(histBits)}.` : '';
  // Only credit the maintaining org when a company was not already named (avoids INRIA-style double mentions).
  if (developers.length && !companyNamed) p2 += ` ${p2 ? '' : `${name} `}Development is led by ${escapeHtml(joinNames(developers))}.`;
  if (node.peak_year) p2 += ` Its popularity peaked around ${node.peak_year}.`;
  const users = usersSentence(name, node.current_users_estimate);
  if (users) p2 += ` ${users}`;
  if (p2.trim()) aboutParas.push(`<p>${p2.trim()}</p>`);

  sections.push(`<section class="intent-section">
  <h2>About ${name}</h2>
  ${aboutParas.join('\n  ')}
</section>`);

  // ---- How it is implemented (full pages only) ----
  if (includeImpl) {
    const implPara = buildImplementationNarrative(node, rels, nodeMap);
    if (implPara) {
      sections.push(`<section class="intent-section">
  <h2>How ${name} is implemented</h2>
  <p>${implPara}</p>
</section>`);
    }
  }

  // ---- Lineage ----
  const lineagePara = buildLineageNarrative(node, rels, nodeMap, e);
  const cite = `<p class="enrich-cite" style="font-size:13px;color:var(--text-tertiary);margin-top:14px">Sources: <a href="${escapeHtml(e.sources.wikipedia)}" rel="noopener noreferrer" target="_blank">Wikipedia</a> &middot; <a href="${escapeHtml(e.sources.wikidata)}" rel="noopener noreferrer" target="_blank">Wikidata</a>${e.facts.website ? ` &middot; <a href="${escapeHtml(e.facts.website)}" rel="noopener noreferrer" target="_blank">Official site</a>` : ''}</p>`;
  if (lineagePara) {
    sections.push(`<section class="intent-section">
  <h2>${name} in the language family tree</h2>
  <p>${lineagePara}</p>
  ${cite}
</section>`);
  } else {
    sections.push(`<section class="intent-section">${cite}</section>`);
  }

  return sections.join('\n');
}

// Quick Facts panel from scraped fields (designers, release year, license, etc.).
function buildEnrichedFacts(node: Language): string {
  const e = ENRICHMENT[node.id];
  if (!e) return '';
  const isTool = node.id.startsWith('tool:');
  const developers = e.facts.developers.filter(d => !e.facts.designers.includes(d));
  const facts: QuickFact[] = [];
  if (e.facts.designers.length) facts.push({ label: isTool ? 'Created by' : 'Designed by', value: joinNames(e.facts.designers) });
  if (developers.length) facts.push({ label: 'Developer', value: joinNames(developers) });
  if (node.first_release_year && node.first_release_year > 0) facts.push({ label: 'First released', value: String(node.first_release_year) });
  if (!isTool && node.typing && node.typing !== 'unspecified') facts.push({ label: 'Typing', value: node.typing });
  if (e.facts.license.length) facts.push({ label: 'License', value: joinNames(e.facts.license) });
  if (e.facts.file_extensions.length) facts.push({ label: 'Filename extension', value: e.facts.file_extensions.join(', ') });
  if (e.facts.website) facts.push({ label: 'Website', value: e.facts.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: e.facts.website });
  return renderQuickFacts(facts);
}

// Hand-written "what it's actually used for" + notable real-world software. This is
// the most useful thing a reader wants and the dataset does not carry it, so it is
// curated here for the highest-interest languages and tools.
const USE_CASES: Record<string, string> = {
  python: `<p>Python is the default language of data science, machine learning, and AI, and a mainstay for scripting, automation, and back-end web development. Libraries like NumPy, pandas, PyTorch, and TensorFlow made it the lingua franca of analytics and deep learning, while Django and Flask power web apps.</p>
<p>Notable software written in or built on Python includes Instagram's backend, Dropbox, much of YouTube's early code, and tooling at Google and Netflix.</p>`,
  javascript: `<p>JavaScript runs in every web browser, so it is the language of interactive front-end development; with Node.js it also runs servers, build tools, and desktop apps. Frameworks like React, Vue, and Angular are built in it, and it powers everything from single-page apps to serverless functions.</p>
<p>Notable software: virtually every modern website's interactivity, plus desktop apps built on Electron such as VS Code, Slack, and Discord.</p>`,
  typescript: `<p>TypeScript is JavaScript with static types, used to build large, maintainable front-end and back-end applications where the type checker catches bugs before runtime. It is now the default choice for most serious React, Angular, and Node.js projects.</p>
<p>Notable software: VS Code, Angular, and large parts of the tooling at Microsoft, Slack, and Airbnb are written in TypeScript.</p>`,
  java: `<p>Java is a workhorse of enterprise back-end systems, Android apps, and big-data tooling. Its "write once, run anywhere" JVM, strong tooling, and vast ecosystem (Spring, Hibernate) make it a staple of banks, large web services, and Android development.</p>
<p>Notable software: Android apps, Minecraft (Java Edition), and big-data systems like Apache Hadoop, Kafka, and Elasticsearch.</p>`,
  c: `<p>C is the language of operating systems, embedded devices, and the low-level machinery that everything else runs on. Its direct memory access and minimal runtime make it the default for kernels, device drivers, and language runtimes.</p>
<p>Notable software: the Linux and Windows kernels, SQLite, Redis, and the CPython, Ruby, and PHP interpreters are all written in C.</p>`,
  cxx: `<p>C++ is used where you need both high performance and large-scale structure: game engines, browsers, databases, trading systems, and high-end desktop software. It adds object orientation, templates, and the standard library on top of C's speed.</p>
<p>Notable software: Unreal Engine, Google Chrome, Adobe Photoshop, MySQL, and most AAA video games.</p>`,
  csharp: `<p>C# is the primary language of the Microsoft .NET ecosystem, used for Windows desktop apps, enterprise back-ends (ASP.NET), and games. The Unity engine makes it one of the most popular languages for game development.</p>
<p>Notable software: countless Unity games, Windows business applications, and Microsoft services built on ASP.NET.</p>`,
  go: `<p>Go is built for cloud infrastructure and networked services: its fast compilation, simple concurrency (goroutines), and single static binaries make it ideal for servers, CLIs, and DevOps tooling.</p>
<p>Notable software: Docker, Kubernetes, Terraform, and much of the modern cloud-native stack are written in Go.</p>`,
  rust: `<p>Rust targets systems programming where safety and speed both matter: operating systems, browsers, command-line tools, WebAssembly, and performance-critical services. Its ownership model prevents whole classes of memory bugs without a garbage collector.</p>
<p>Notable software: parts of Firefox, the Deno runtime, the ripgrep and fd CLI tools, and components inside Windows, Android, and the Linux kernel.</p>`,
  ruby: `<p>Ruby is best known for web development through Ruby on Rails, which popularized convention-over-configuration and rapid prototyping. It is also widely used for scripting, automation, and DevOps tooling.</p>
<p>Notable software: GitHub, Shopify, Airbnb's early platform, and the Homebrew package manager are built with Ruby.</p>`,
  php: `<p>PHP powers a large share of the web's back-ends, especially content management and e-commerce. It is designed to be embedded in HTML and deployed easily on shared hosting.</p>
<p>Notable software: WordPress (which runs a major fraction of all websites), Wikipedia (MediaWiki), Facebook's original codebase, and Slack's backend.</p>`,
  swift: `<p>Swift is Apple's language for building iOS, macOS, watchOS, and tvOS apps, replacing Objective-C with a safer, more modern syntax. It is increasingly used for server-side Swift as well.</p>
<p>Notable software: a large share of modern iPhone and Mac apps, including many of Apple's own.</p>`,
  kotlin: `<p>Kotlin is Google's preferred language for Android development, a concise and safer alternative to Java that interoperates fully with it. It is also used for back-end services and cross-platform mobile.</p>
<p>Notable software: Android apps at Google, Pinterest, and Netflix, plus back-ends using the Ktor and Spring frameworks.</p>`,
  scala: `<p>Scala blends object-oriented and functional programming on the JVM and is popular for large-scale data processing and back-end systems where type safety and concurrency matter.</p>
<p>Notable software: Apache Spark, Apache Kafka tooling, and the back-ends of Twitter and many data platforms.</p>`,
  haskell: `<p>Haskell is a purely functional language used in academia, research, and industries that prize correctness, finance, compilers, and formal verification. Its strong type system and laziness make it a laboratory for language ideas later adopted elsewhere.</p>
<p>Notable software: the Cardano blockchain, parts of financial trading systems, and the pandoc document converter.</p>`,
  lua: `<p>Lua is a tiny, fast, embeddable scripting language designed to be dropped into larger programs, especially games and configuration. Its small footprint makes it ideal for extending C/C++ applications.</p>
<p>Notable software: scripting in World of Warcraft and Roblox, the Redis and Nginx (OpenResty) scripting layers, and many game engines.</p>`,
  perl: `<p>Perl is a text-processing and system-administration powerhouse, famous for its regular expressions and "glue" scripting. It dominated early web CGI and bioinformatics, and still handles log processing and automation.</p>
<p>Notable software: large amounts of legacy web and sysadmin tooling, and bioinformatics pipelines built on BioPerl.</p>`,
  r: `<p>R is a language built for statistics, data analysis, and visualization, used heavily in academia, bioinformatics, and quantitative research. The tidyverse and ggplot2 make it a favorite for exploratory analysis and publication-quality charts.</p>
<p>Notable software: statistical analyses across science and finance, and reproducible reports built with R Markdown and Shiny dashboards.</p>`,
  julia: `<p>Julia targets scientific and numerical computing, aiming for the readability of Python with the speed of C. It is used in research, data science, and high-performance simulation.</p>
<p>Notable software: climate models, pharmaceutical simulations, and the Pumas pharmacometrics platform.</p>`,
  elixir: `<p>Elixir brings a modern, productive syntax to the battle-tested Erlang VM, making it a strong choice for highly concurrent, fault-tolerant web and real-time systems. The Phoenix framework is its flagship.</p>
<p>Notable software: Discord's real-time messaging infrastructure and many chat, IoT, and streaming back-ends.</p>`,
  erlang: `<p>Erlang was built at Ericsson for telecom switches that must never go down, so it excels at massively concurrent, fault-tolerant, distributed systems with hot code swapping.</p>
<p>Notable software: WhatsApp's messaging backend, RabbitMQ, and telecom infrastructure worldwide.</p>`,
  clojure: `<p>Clojure is a modern Lisp on the JVM, used for data-heavy back-end systems where immutability and functional style help manage complexity and concurrency.</p>
<p>Notable software: data platforms and back-ends at Nubank, Walmart, and many fintech companies.</p>`,
  ocaml: `<p>OCaml is a fast, statically typed functional language used in compilers, formal verification, and finance, where its expressive type system catches errors early.</p>
<p>Notable software: the first Rust compiler, Jane Street's trading systems, the Coq proof assistant, and the Flow type checker for JavaScript.</p>`,
  fortran: `<p>Fortran remains the language of high-performance numerical and scientific computing, weather prediction, computational physics, and engineering simulations, where decades of optimized math libraries still run.</p>
<p>Notable software: climate and weather models, and core linear-algebra libraries (BLAS, LAPACK) that underpin much of modern scientific computing.</p>`,
  cobol: `<p>COBOL still runs a huge share of the world's banking, insurance, and government batch systems, prized for stable, readable business data processing on mainframes.</p>
<p>Notable software: core transaction systems at banks and government agencies, an estimated majority of daily business transactions still touch COBOL.</p>`,
  lisp: `<p>Lisp pioneered ideas, the REPL, garbage collection, macros, treating code as data, that shaped every language after it. It was historically central to artificial-intelligence research and remains influential in language design.</p>
<p>Notable software: classic AI systems, Emacs (via Emacs Lisp), and AutoCAD's scripting (AutoLISP).</p>`,
  dart: `<p>Dart is Google's language for the Flutter framework, used to build cross-platform mobile, web, and desktop apps from a single codebase.</p>
<p>Notable software: Flutter apps including Google Pay, and many cross-platform mobile applications.</p>`,
  zig: `<p>Zig is a modern systems language positioned as a simpler, safer alternative to C, with manual memory control, no hidden allocations, and excellent C interop and cross-compilation.</p>
<p>Notable software: the Bun JavaScript runtime is written in Zig, and it is increasingly used for low-level tooling and game development.</p>`,
  'objective-c': `<p>Objective-C was the primary language for Apple's iOS and macOS apps before Swift, adding Smalltalk-style messaging to C. It is still widely seen in older codebases and Apple's frameworks.</p>
<p>Notable software: a generation of iPhone and Mac apps, and large parts of Apple's Cocoa frameworks.</p>`,
  assembly: `<p>Assembly is the human-readable form of a CPU's own machine instructions, used where you need absolute control or maximum speed: bootloaders, device drivers, operating-system cores, and hand-optimized inner loops. It is also essential for reverse engineering and security research.</p>
<p>Notable use: boot code and performance-critical routines inside virtually every operating system and game console.</p>`,
  smalltalk: `<p>Smalltalk pioneered pure object-oriented programming, the integrated development environment, and the graphical UI. It is still used in some finance and industrial systems, and its ideas shaped Python, Ruby, and Objective-C.</p>
<p>Notable software: trading and logistics systems, and the modern Pharo and Squeak environments.</p>`,
  prolog: `<p>Prolog is the leading logic-programming language, used for artificial intelligence, expert systems, natural-language processing, and theorem proving, you state facts and rules and let the engine search for answers.</p>
<p>Notable use: parts of IBM Watson, scheduling and constraint systems, and academic AI research (often via SWI-Prolog).</p>`,
  ada: `<p>Ada is built for safety-critical, real-time systems where failure is not an option: avionics, defense, rail signaling, and spacecraft. Its strong typing and runtime checks catch errors early.</p>
<p>Notable use: aircraft flight software (Boeing, Airbus), air-traffic control, and rail and defense systems.</p>`,
  pascal: `<p>Pascal was designed for teaching structured programming and dominated computer-science education for years; its Object Pascal descendant (Delphi) became a popular tool for Windows desktop apps.</p>
<p>Notable software: early Apple Macintosh system software, and the original Skype client (built in Delphi).</p>`,
  groovy: `<p>Groovy is a dynamic scripting language for the JVM, used heavily for build automation and writing concise glue code alongside Java.</p>
<p>Notable software: the Gradle build system and Jenkins pipeline scripts are written in Groovy.</p>`,
  matlab: `<p>MATLAB is a numerical-computing environment used across engineering and science for matrix math, signal and image processing, control systems, and simulation. Its toolboxes and Simulink make it standard in many labs and industries.</p>
<p>Notable use: control-system and signal-processing design in automotive, aerospace, and academic research.</p>`,
  delphi: `<p>Delphi (Object Pascal) is a rapid application development tool for native Windows, and now cross-platform, desktop software, known for fast compilation and visual form design.</p>
<p>Notable software: the original Skype client and many long-lived business and point-of-sale applications.</p>`,
  fsharp: `<p>F# is a functional-first language on .NET, used for data processing, finance, and analytics where its concise syntax and strong types reduce bugs.</p>
<p>Notable use: quantitative finance, data pipelines, and analytics teams on the .NET platform.</p>`,
  elm: `<p>Elm is a pure functional language for building reliable web front-ends; its compiler is famous for friendly errors and for eliminating runtime exceptions in production.</p>
<p>Notable software: front-end applications at companies like NoRedInk that value crash-free UIs.</p>`,
  crystal: `<p>Crystal offers Ruby-like syntax with static typing and native compilation, aimed at developers who want Ruby's productivity with much higher performance.</p>
<p>Notable use: web APIs and tools where teams want Ruby ergonomics without the runtime cost.</p>`,
  nim: `<p>Nim is a general-purpose language with Python-like readability that compiles to C, C++, or JavaScript, giving native speed with a small runtime, handy for systems tools, games, and embedded work.</p>
<p>Notable software: the Status messaging client and a range of community tools and games.</p>`,
  tcl: `<p>Tcl ("Tool Command Language") is a compact scripting and embedding language, long used to add scripting to applications and for test automation, networking, and electronic-design tools.</p>
<p>Notable use: scripting in Cisco network gear, EDA chip-design tools, and the Expect automation tool.</p>`,
  bash: `<p>Bash is the default shell on most Linux and macOS systems, and the everyday language of automation: install scripts, build and deploy pipelines, and gluing command-line tools together.</p>
<p>Notable use: the startup, build, and CI scripts behind a huge share of servers and developer machines.</p>`,
  'vb-net': `<p>Visual Basic .NET is an approachable language for business applications on the .NET platform, common in enterprise line-of-business and internal Windows software.</p>
<p>Notable use: corporate Windows applications and Office-adjacent automation.</p>`,
  racket: `<p>Racket is a descendant of Scheme built for creating new programming languages, plus teaching and scripting. It ships with the DrRacket environment and powerful macro system.</p>
<p>Notable software: the "How to Design Programs" curriculum and many domain-specific languages built on Racket.</p>`,
  scheme: `<p>Scheme is a minimalist, elegant dialect of Lisp, central to computer-science education and language research, and embedded as a scripting layer in some applications.</p>
<p>Notable use: the classic SICP curriculum, and GNU Guile as an extension language (e.g. in GNU tools).</p>`,
  llvm: `<p>LLVM is the compiler backend that turns an intermediate representation into optimized machine code; many modern languages plug into it instead of writing their own code generator.</p>
<p>Used by: Clang (C/C++), Rust, Swift, Julia, and Kotlin/Native all rely on the LLVM backend.</p>`,
  gcc: `<p>GCC, the GNU Compiler Collection, is the default compiler on most Linux systems and supports C, C++, Fortran, and more. It compiles a huge share of the open-source world.</p>
<p>Used by: the Linux kernel and most Linux distributions are built with GCC.</p>`,
  ghc: `<p>GHC is the standard Haskell compiler, used to build essentially all production Haskell, with an advanced optimizer and a C-based runtime for lazy evaluation and concurrency.</p>
<p>Used by: the Cardano blockchain, the pandoc converter, and most Haskell software.</p>`,
  hotspot: `<p>HotSpot is the standard Java Virtual Machine, the runtime that executes JVM bytecode with a tiered just-in-time compiler and advanced garbage collectors.</p>
<p>Used by: every standard Java, Kotlin, Scala, and Clojure program running on the JVM.</p>`,
};

function buildUseCases(node: Language): string {
  const body = USE_CASES[idToSlug(node.id)];
  if (!body) return '';
  return `<section class="intent-section">
  <h2>What ${escapeHtml(node.name)} is used for</h2>
  ${body}
</section>`;
}

// Page header: H1 question + one-line tagline (left), with the language/tool logo
// on the right in the same adaptive dark badge the graph uses.
function buildPageHeader(node: Language): string {
  const e = ENRICHMENT[node.id];
  const tagline = e?.tagline ? e.tagline.replace(/\.$/, '') : '';
  const taglineText = tagline ? `${tagline.charAt(0).toUpperCase()}${tagline.slice(1)}.` : '';

  let logo = '';
  if (node.logo_url) {
    const logoColor = LOGO_COLORS[node.id] ?? null;
    const surface = getLogoPresentation(node.id, node.logo_kind).surface;
    const bg = getAdaptiveLogoBackground(logoColor, true, surface);
    const border = getLogoBorderColor(logoColor, true, surface);
    logo = `<div class="lang-logo-tile" style="background:${bg};border-color:${border}"><img src="${escapeHtml(node.logo_url)}" alt="${escapeHtml(node.name)} logo" width="56" height="56" loading="eager" decoding="async" /></div>`;
  }

  return `<div class="lang-header">
  <div class="lang-header-text">
    <h1>What is ${escapeHtml(node.name)} written in?</h1>
    ${taglineText ? `<p class="lang-tagline">${escapeHtml(taglineText)}</p>` : ''}
  </div>
  ${logo}
</div>`;
}

// Curated, plain-language succession notes for well-known languages: what each one
// displaced, and what (if anything) is taking its place. Languages without an entry
// fall back to the graph-derived "Built on / Influenced" lineage only.
const SUCCESSION: Record<string, { replaced?: string; replacedBy?: string }> = {
  python: { replaced: 'Perl for scripting, and much of what R and Java did for data work', replacedBy: 'Not really being replaced; teams reach for Rust, Go, or Julia for raw speed, usually called from Python' },
  javascript: { replaced: 'Java applets and Adobe Flash for in-browser interactivity', replacedBy: 'Most new front-end code is written in TypeScript, which compiles back to JavaScript' },
  typescript: { replaced: 'plain JavaScript for large, long-lived codebases', replacedBy: 'Still ascending; no successor in sight' },
  java: { replaced: 'C++ for portable enterprise and server software', replacedBy: 'Kotlin on Android, and Go or Rust for many new back-end services' },
  c: { replaced: 'assembly language for most systems programming', replacedBy: 'Rust and Zig for new memory-safe systems work, though C is still everywhere' },
  cxx: { replaced: 'C for large, performance-critical applications', replacedBy: 'Rust for many new safety-critical and systems projects' },
  csharp: { replaced: 'Visual Basic and C++ for Windows and .NET development', replacedBy: 'Still current; no successor' },
  rust: { replaced: 'C and C++ where memory safety matters', replacedBy: 'Still ascending; no clear successor' },
  go: { replaced: 'C, Python, and Java for many cloud and network services', replacedBy: 'Still growing; Rust competes for the most performance-sensitive parts' },
  ruby: { replaced: 'Perl and PHP for fast web development, through Rails', replacedBy: 'JavaScript/TypeScript and Python for many new web back-ends' },
  php: { replaced: 'Perl CGI scripts for server-side web pages', replacedBy: 'Node.js and Python for many new back-ends, though PHP still runs much of the web' },
  perl: { replaced: 'shell scripts and C for text processing and early CGI', replacedBy: 'Python and Ruby took over most of its scripting and web roles' },
  swift: { replaced: 'Objective-C for Apple platform apps', replacedBy: 'Still current; the language Apple recommends' },
  objective_c: { replaced: 'C and C++ for NeXT and early Apple app development', replacedBy: 'Swift, recommended by Apple since 2014' },
  kotlin: { replaced: 'Java for Android app development', replacedBy: 'Still current; the language Google prefers for Android' },
  cobol: { replaced: 'assembly for business data processing on mainframes', replacedBy: 'Java and C# for new systems, though COBOL still runs core banking and government batch jobs' },
  fortran: { replaced: 'assembly for scientific and numerical computing', replacedBy: 'C++, Python, and Julia for new work, though Fortran math libraries remain in use' },
  pascal: { replaced: 'assembly and BASIC for teaching structured programming', replacedBy: 'C, C++, and Java in education and industry' },
  basic: { replaced: 'assembly for beginners on early microcomputers', replacedBy: 'Python as the common first language; Visual Basic for Windows apps' },
  actionscript: { replaced: 'plain JavaScript for rich, animated Flash content', replacedBy: 'HTML5 and JavaScript, after Adobe Flash was discontinued in 2020' },
  vb_net: { replaced: 'classic Visual Basic for Windows business apps', replacedBy: 'C# for most new .NET development' },
  delphi: { replaced: 'C and C++ for rapid Windows desktop development', replacedBy: 'C#, web stacks, and cross-platform frameworks for new desktop apps' },
  lisp: { replaced: 'assembly for early AI and symbolic computing', replacedBy: 'Python and statistical methods for most modern AI work' },
  smalltalk: { replaced: 'procedural languages for pure object-oriented design', replacedBy: 'Its ideas live on in Python, Ruby, and Objective-C rather than a single successor' },
  coffeescript: { replaced: 'verbose early-2010s JavaScript syntax', replacedBy: 'ES6 JavaScript and TypeScript, which absorbed most of its ideas' },
  elm: { replaced: 'unsafe JavaScript for crash-free front-ends', replacedBy: 'TypeScript with React for most teams' },
  hack: { replaced: 'untyped PHP at Facebook scale' },
  reasonml: { replacedBy: 'ReScript, its renamed and refocused successor' },
};

const REL_MAP_LEGEND: Record<string, { label: string; color: string }> = {
  compiler_written_in: { label: 'Compiler', color: '#e3a008' },
  runtime_written_in: { label: 'Runtime', color: '#34d399' },
  bootstrap_written_in: { label: 'Bootstrap', color: '#a78bfa' },
  rewritten_in: { label: 'Rewrite', color: '#fb7185' },
  influenced: { label: 'Influence', color: '#60a5fa' },
  transpiled_to: { label: 'Transpile', color: '#22d3ee' },
};

// A lightweight inline-SVG relationship map for the top of each page: the focal node at
// center, what it is built from on the left (written-in + influences), what it influenced
// on the right, with edges colored by the same semantic palette the live graph uses.
function buildRelationshipMap(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const implTypes = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in', 'rewritten_in']);
  type Conn = { id: string; rel: string };

  const inSeen = new Set<string>();
  const inputs: Conn[] = [];
  rels.filter(r => r.to_language === node.id && implTypes.has(r.relationship))
    .forEach(r => { if (!inSeen.has(r.from_language)) { inSeen.add(r.from_language); inputs.push({ id: r.from_language, rel: r.relationship }); } });
  rels.filter(r => r.to_language === node.id && r.relationship === 'influenced')
    .sort((a, b) => b.confidence - a.confidence)
    .forEach(r => { if (!inSeen.has(r.from_language)) { inSeen.add(r.from_language); inputs.push({ id: r.from_language, rel: 'influenced' }); } });
  const left = inputs.slice(0, 8);

  const outSeen = new Set<string>();
  const outputs: Conn[] = [];
  rels.filter(r => r.from_language === node.id && r.relationship === 'influenced')
    .sort((a, b) => b.confidence - a.confidence)
    .forEach(r => { if (!outSeen.has(r.to_language)) { outSeen.add(r.to_language); outputs.push({ id: r.to_language, rel: 'influenced' }); } });
  rels.filter(r => r.from_language === node.id && r.relationship === 'transpiled_to')
    .forEach(r => { if (!outSeen.has(r.to_language)) { outSeen.add(r.to_language); outputs.push({ id: r.to_language, rel: 'transpiled_to' }); } });
  const right = outputs.slice(0, 8);

  if (!left.length && !right.length) return '';

  const W = 760;
  const rowH = 56;
  const rows = Math.max(left.length, right.length, 1);
  const H = Math.max(rows * rowH + 56, 184);
  const cx = W / 2, cy = H / 2;
  const leftX = 150, rightX = W - 150, focalR = 32, nodeR = 6;
  const midL = (leftX + cx) / 2, midR = (rightX + cx) / 2;
  const yFor = (i: number, count: number) => cy - ((count - 1) * rowH) / 2 + i * rowH;
  const colorOf = (rel: string) => REL_MAP_LEGEND[rel]?.color ?? '#60a5fa';

  const edgeEls: string[] = [];
  const nodeEls: string[] = [];

  left.forEach((c, i) => {
    const y = yFor(i, left.length);
    const col = colorOf(c.rel);
    edgeEls.push(`<path d="M ${leftX + nodeR} ${y} C ${midL} ${y}, ${midL} ${cy}, ${cx - focalR - 2} ${cy}" fill="none" stroke="${col}" stroke-width="1.6" stroke-opacity="0.5" />`);
    const name = escapeHtml(nameFromId(c.id, nodeMap));
    nodeEls.push(`<a href="/${idToPrefix(c.id)}/${idToSlug(c.id)}" class="rel-node"><circle cx="${leftX}" cy="${y}" r="${nodeR}" fill="#0e0e0e" stroke="${col}" stroke-width="2" /><text x="${leftX - nodeR - 9}" y="${y}" text-anchor="end" dominant-baseline="middle" class="rel-node-label">${name}</text></a>`);
  });
  right.forEach((c, i) => {
    const y = yFor(i, right.length);
    const col = colorOf(c.rel);
    edgeEls.push(`<path d="M ${cx + focalR + 2} ${cy} C ${midR} ${cy}, ${midR} ${y}, ${rightX - nodeR} ${y}" fill="none" stroke="${col}" stroke-width="1.6" stroke-opacity="0.5" />`);
    const name = escapeHtml(nameFromId(c.id, nodeMap));
    nodeEls.push(`<a href="/${idToPrefix(c.id)}/${idToSlug(c.id)}" class="rel-node"><circle cx="${rightX}" cy="${y}" r="${nodeR}" fill="#0e0e0e" stroke="${col}" stroke-width="2" /><text x="${rightX + nodeR + 9}" y="${y}" text-anchor="start" dominant-baseline="middle" class="rel-node-label">${name}</text></a>`);
  });

  let focal: string;
  if (node.logo_url) {
    focal = `<defs><clipPath id="relfocal"><circle cx="${cx}" cy="${cy}" r="${focalR - 3}" /></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${focalR}" fill="#161616" stroke="#4ade80" stroke-width="2" /><image href="${escapeHtml(node.logo_url)}" x="${cx - focalR + 9}" y="${cy - focalR + 9}" width="${(focalR - 9) * 2}" height="${(focalR - 9) * 2}" clip-path="url(#relfocal)" preserveAspectRatio="xMidYMid meet" />`;
  } else {
    focal = `<circle cx="${cx}" cy="${cy}" r="${focalR}" fill="#161616" stroke="#4ade80" stroke-width="2" /><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" class="rel-focal-mark">${escapeHtml(node.name.charAt(0))}</text>`;
  }
  const glow = `<circle cx="${cx}" cy="${cy}" r="${focalR + 13}" fill="#4ade80" opacity="0.08" />`;
  const focalLabel = `<text x="${cx}" y="${cy + focalR + 21}" text-anchor="middle" class="rel-focal-label">${escapeHtml(node.name)}</text>`;
  const headLeft = left.length ? `<text x="${leftX}" y="20" text-anchor="middle" class="rel-col-head">Built from</text>` : '';
  const headRight = right.length ? `<text x="${rightX}" y="20" text-anchor="middle" class="rel-col-head">Influenced</text>` : '';

  const presentRels = [...new Set([...left, ...right].map(c => c.rel))];
  const legend = presentRels.map(rel => `<span class="rel-legend-item"><i style="background:${REL_MAP_LEGEND[rel].color}"></i>${REL_MAP_LEGEND[rel].label}</span>`).join('');

  return `<figure class="rel-map">
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(node.name)} relationship map" preserveAspectRatio="xMidYMid meet">
    ${headLeft}${headRight}
    ${edgeEls.join('')}
    ${glow}${focal}${focalLabel}
    ${nodeEls.join('')}
  </svg>
  <figcaption class="rel-legend">${legend}</figcaption>
</figure>`;
}

// The integrated page header: logo, name, tagline, a horizontal spec rail of key data
// (written in, released, developer, typing, license), and the curated succession notes ,
// woven into the top of the article rather than boxed into a card.
function buildLanguageHeader(node: Language, rels: Relationship[], nodeMap: Map<string, Language>, mapHtml = ''): string {
  const e = ENRICHMENT[node.id];
  const isTool = node.id.startsWith('tool:');
  const slug = idToSlug(node.id);
  const rawTag = e?.tagline ? e.tagline.replace(/\.$/, '') : '';
  const tagline = rawTag ? `${rawTag.charAt(0).toUpperCase()}${rawTag.slice(1)}.` : '';

  let logo = `<div class="lang-logo-tile lang-logo-tile--mark" aria-hidden="true">${escapeHtml(node.name.charAt(0))}</div>`;
  if (node.logo_url) {
    const logoColor = LOGO_COLORS[node.id] ?? null;
    const surface = getLogoPresentation(node.id, node.logo_kind).surface;
    const bg = getAdaptiveLogoBackground(logoColor, true, surface);
    const border = getLogoBorderColor(logoColor, true, surface);
    logo = `<div class="lang-logo-tile" style="background:${bg};border-color:${border}"><img src="${escapeHtml(node.logo_url)}" alt="${escapeHtml(node.name)} logo" width="56" height="56" loading="eager" decoding="async" /></div>`;
  }

  const implTypes = ['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in'];
  const writtenInIds = [...new Set(rels.filter(r => r.to_language === node.id && implTypes.includes(r.relationship)).map(r => r.from_language))];
  const writtenIn = writtenInIds.length
    ? writtenInIds.map(id => linkNode(id, nodeMap)).join(', ')
    : (node.self_hosting ? `${escapeHtml(node.name)} (self-hosting)` : '');

  const developer = node.company || joinNames(e?.facts.designers ?? []) || joinNames(e?.facts.developers ?? []) || '';
  const license = joinNames(e?.facts.license ?? []) || '';
  const website = e?.facts.website || '';
  const typing = (!isTool && node.typing && !['unspecified', 'none'].includes(node.typing)) ? node.typing : '';

  // Horizontal spec rail, the page's key data, read like an instrument readout rather
  // than boxed into a card. Each cell is a value over a small monospace label.
  const cells: Array<[string, string]> = [];
  if (writtenIn) cells.push([writtenIn, 'Written in']);
  if (node.first_release_year && node.first_release_year > 0) cells.push([String(node.first_release_year), 'First released']);
  if (developer) cells.push([escapeHtml(developer), isTool ? 'Built by' : 'Developer']);
  if (typing) cells.push([escapeHtml(typing), 'Typing']);
  if (license) cells.push([escapeHtml(license), 'License']);
  const rail = cells.length
    ? `<div class="spec-rail">${cells.map(([v, l]) => `<div class="spec-cell"><span class="spec-val">${v}</span><span class="spec-lab">${l}</span></div>`).join('')}</div>`
    : '';

  const succ = SUCCESSION[slug];
  const succHtml = (succ?.replaced || succ?.replacedBy)
    ? `<div class="succession">
    ${succ.replaced ? `<div class="succ-row"><span class="succ-k">Replaced</span><span>${escapeHtml(succ.replaced)}</span></div>` : ''}
    ${succ.replacedBy ? `<div class="succ-row"><span class="succ-k">Being replaced by</span><span>${escapeHtml(succ.replacedBy)}</span></div>` : ''}
  </div>`
    : '';

  const kind = isTool ? 'Toolchain' : 'Programming language';
  const year = (node.first_release_year && node.first_release_year > 0) ? ` &middot; ${node.first_release_year}` : '';

  return `<header class="lang-head">
  <div class="lang-head-main">
    <p class="lang-head-eyebrow">${kind}${year}</p>
    <h1>${escapeHtml(node.name)}</h1>
    ${tagline ? `<p class="lang-head-tagline">${escapeHtml(tagline)}</p>` : ''}
    ${website ? `<a class="lang-head-site" href="${escapeHtml(website)}" rel="nofollow noopener noreferrer" target="_blank">Official site &rsaquo;</a>` : ''}
  </div>
  ${logo}
</header>
${rail}
${mapHtml}
${succHtml}`;
}

// Full enriched block (facts + overview) for nodes without a hand-authored PRIORITY_CONTENT entry.
function buildEnrichedContent(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  if (!ENRICHMENT[node.id]) return '';
  return `${buildEnrichedFacts(node)}
${buildEnrichedOverview(node, rels, nodeMap, true)}`;
}

function buildAnswerBox(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const id = node.id;
  const priority = PRIORITY_CONTENT[idToSlug(id)];
  if (priority) {
    return `<div class="answer-box">${priority.answerHtml}</div>`;
  }

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
  const isTool = node.id.startsWith('tool:');
  const tags: string[] = [];
  tags.push(`<span class="meta-tag meta-kind${isTool ? ' meta-kind-tool' : ''}">${isTool ? 'Toolchain' : 'Programming language'}</span>`);
  if (node.first_release_year) {
    tags.push(`<span class="meta-tag"><span class="meta-tag-label">Year</span> ${node.first_release_year}</span>`);
  }
  if (!isTool && node.paradigm && node.paradigm.length > 0) {
    tags.push(`<span class="meta-tag"><span class="meta-tag-label">Paradigm</span> ${escapeHtml(node.paradigm.join(', '))}</span>`);
  }
  if (!isTool && node.typing && node.typing !== 'unspecified') {
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
      .map(r => `<li>${linkNode(r.from_language, nodeMap)}${r.notes ? `, ${escapeHtml(r.notes)}` : ''}</li>`)
      .join('\n');
    parts.push(`<h2>Influenced By</h2><ul>${items}</ul>`);
  }

  if (influenced.length > 0) {
    const items = influenced
      .sort((a, b) => b.confidence - a.confidence)
      .map(r => `<li>${linkNode(r.to_language, nodeMap)}${r.notes ? `, ${escapeHtml(r.notes)}` : ''}</li>`)
      .join('\n');
    parts.push(`<h2>Languages ${escapeHtml(node.name)} Influenced</h2><ul>${items}</ul>`);
  }

  return parts.join('\n');
}

function buildFaqs(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): { q: string; a: string }[] {
  const id = node.id;
  const priority = PRIORITY_CONTENT[idToSlug(id)];
  const faqs: { q: string; a: string }[] = [];
  const implTypes = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);
  const implRels = rels.filter(r => r.to_language === id && implTypes.has(r.relationship));

  if (implRels.length > 0) {
    const names = [...new Set(implRels.map(r => nameFromId(r.from_language, nodeMap)))];
    faqs.push({
      q: `What language is ${node.name} written in?`,
      a: priority?.faqAnswer ?? `${node.name} is primarily implemented in ${names.join(' and ')}. See the implementation section above for details and source references.`,
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
      a: `Yes, ${node.name} is self-hosting, its compiler can compile itself.`,
    });
  }

  if (node.first_release_year && node.first_release_year > 0) {
    const e = ENRICHMENT[id];
    const verb = id.startsWith('tool:') ? 'created' : 'designed';
    const designerNote = e && e.facts.designers.length > 0
      ? ` It was ${verb} by ${joinNames(e.facts.designers)}.`
      : '';
    faqs.push({
      q: `When was ${node.name} first released?`,
      a: `${node.name} was first released in ${node.first_release_year}.${designerNote}`,
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

  return `<aside class="related-section" data-nosnippet>
  <h2>Related Languages</h2>
  <div class="related-grid">${cards}</div>
</aside>`;
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

  const items = sources.map(s => `<li><a href="${escapeHtml(s)}" rel="noopener noreferrer" target="_blank">${escapeHtml(s)}</a></li>`);

  const e = ENRICHMENT[id];
  if (e) {
    if (!sources.includes(e.sources.wikipedia)) {
      items.push(`<li><a href="${escapeHtml(e.sources.wikipedia)}" rel="noopener noreferrer" target="_blank">${escapeHtml(node.name)} on Wikipedia</a></li>`);
    }
    items.push(`<li><a href="${escapeHtml(e.sources.wikidata)}" rel="noopener noreferrer" target="_blank">${escapeHtml(node.name)} on Wikidata (${escapeHtml(e.wikidata_id)})</a></li>`);
  }

  if (items.length === 0) return '';
  return `<h2>Evidence Sources</h2><ul class="source-list">${items.join('\n')}</ul>`;
}

function buildToolIntro(node: Language): string {
  if (!node.id.startsWith('tool:') || !node.notes) return '';
  const firstSentence = node.notes.split('.')[0].trim();
  if (!firstSentence) return '';
  return `<p class="tool-intro">${escapeHtml(firstSentence)}.</p>`;
}

const QUESTION_PAGE_LANGS = new Set(['python','javascript','rust','go','java','c','cxx','typescript','ruby','v8','cpython']);

// Some language slugs differ from their question page slug (cxx -> cpp)
const QUESTION_SLUG_OVERRIDE: Record<string, string> = { cxx: 'cpp' };

// Contextually relevant guide links per language slug (at most 2)
const LANG_GUIDE_LINKS: Record<string, Array<{ slug: string; label: string }>> = {
  python:     [{ slug: 'how-python-is-implemented', label: 'How Python is implemented' }],
  rust:       [{ slug: 'how-rust-is-bootstrapped', label: 'How Rust bootstraps itself' }, { slug: 'the-c-bootstrap-chain', label: 'Toolchain lineage back to C' }],
  javascript: [{ slug: 'v8-vs-spidermonkey-vs-javascriptcore', label: 'V8 vs SpiderMonkey vs JavaScriptCore' }],
  typescript: [{ slug: 'typescript-vs-javascript-implementation', label: 'TypeScript vs JavaScript compilers' }],
  java:       [{ slug: 'graalvm-vs-hotspot', label: 'GraalVM vs HotSpot' }],
  c:          [{ slug: 'gcc-vs-llvm', label: 'GCC vs LLVM: compiler infrastructure' }, { slug: 'the-c-bootstrap-chain', label: 'How modern languages trace back to C' }, { slug: 'how-programming-languages-are-made', label: 'How programming languages are made' }],
  cxx:        [{ slug: 'gcc-vs-llvm', label: 'GCC vs LLVM: compiler infrastructure' }],
  go:         [{ slug: 'the-c-bootstrap-chain', label: 'Toolchain lineage back to C' }],
  haskell:    [{ slug: 'what-is-compiler-bootstrapping', label: 'Compiler bootstrapping explained' }],
};

function buildDiscoverMore(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const slug = idToSlug(node.id);
  const name = escapeHtml(node.name);
  const links: string[] = [];

  if (QUESTION_PAGE_LANGS.has(slug)) {
    const qSlug = QUESTION_SLUG_OVERRIDE[slug] ?? slug;
    links.push(`<a href="/questions/what-is-${qSlug}-written-in" class="discover-link">What is ${name} written in?</a>`);
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

  // Per-language contextual guide links (at most 2, deduplicated against already-added bootstrap guide)
  const addedGuides = new Set(links.filter(l => l.includes('/guides/')).map(l => l.match(/\/guides\/([^"]+)/)?.[1]).filter(Boolean));
  for (const g of (LANG_GUIDE_LINKS[slug] ?? [])) {
    if (!addedGuides.has(g.slug)) {
      links.push(`<a href="/guides/${g.slug}" class="discover-link">${g.label}</a>`);
      addedGuides.add(g.slug);
    }
  }

  if (links.length === 0) return '';
  return `<section class="discover-more" data-nosnippet>
  <h2>Discover More</h2>
  <div class="discover-links">${links.join('\n  ')}</div>
</section>`;
}

function buildNodePage(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const prefix = idToPrefix(node.id);
  const slug = idToSlug(node.id);
  const url = `${SITE}/${prefix}/${slug}`;
  const priorityOverride = PRIORITY_TITLES[slug];
  const implRels = rels.filter(r => r.to_language === node.id && ['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in'].includes(r.relationship));
  const implLangs = [...new Set(implRels.map(r => nameFromId(r.from_language, nodeMap)))];
  const enrich = ENRICHMENT[node.id];

  // Language/tool pages target brand queries ("X language", "X release date").
  // Question pages own the "what is X written in" queries.
  const defaultTitle = `${node.name}: Implementation, History, and Lineage | Language Lineage`;
  const title = priorityOverride ? priorityOverride.title : defaultTitle;

  // Description leads with the implementation answer, then context, to serve both
  // "what is X written in" and "X language" search intents from a single snippet.
  function buildDefaultDesc(): string {
    const implType = implRels.find(r => r.relationship === 'runtime_written_in')
      ? 'runtime'
      : implRels.find(r => r.relationship === 'compiler_written_in')
      ? 'compiler'
      : implRels.length > 0 ? 'implementation' : '';
    const isTool = prefix === 'tools';
    const implSentence = implLangs.length > 0
      ? isTool
        ? `${node.name} is written in ${implLangs.slice(0, 2).join(' and ')}. `
        : `${node.name}'s ${implType} is written in ${implLangs.slice(0, 2).join(' and ')}. `
      : '';
    const context = enrich?.tagline
      ? `${node.name} is ${aOrAn(enrich.tagline)} ${enrich.tagline}`
      : node.name;
    const year = node.first_release_year && node.first_release_year > 0
      ? `, first released in ${node.first_release_year}`
      : '';
    return `${implSentence}${context}${year}. Explore the full lineage.`;
  }
  const description = truncateMetaDescription(priorityOverride ? priorityOverride.description : buildDefaultDesc(), 160);
  const priorityHtml = buildPriorityContent(node);
  const priorityContentHtml = priorityHtml
    ? `${buildEnrichedOverview(node, rels, nodeMap, false)}\n${priorityHtml}`
    : buildEnrichedContent(node, rels, nodeMap);

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

  const publishDate = node.first_release_year ? `${node.first_release_year}-01-01` : '2024-01-01';
  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `What is ${node.name} written in?`,
    description,
    url,
    datePublished: publishDate,
    dateModified: BUILD_DATE,
    author: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    publisher: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  ${QUESTION_PAGE_LANGS.has(slug) ? `<link rel="alternate" href="${SITE}/questions/what-is-${slug}-written-in" />` : ''}
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ogImg(`${prefix}-${slug}.png`)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="article:published_time" content="${publishDate}" />
  <meta property="article:modified_time" content="${BUILD_DATE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <script type="application/ld+json">${articleJsonLd}</script>
  ${faqJsonLd ? `<script type="application/ld+json">${faqJsonLd}</script>` : ''}
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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

  ${buildLanguageHeader(node, rels, nodeMap, buildRelationshipMap(node, rels, nodeMap))}

  ${buildToolIntro(node)}

  <h2 class="lang-written-q">What is ${escapeHtml(node.name)} written in?</h2>
  ${buildAnswerBox(node, rels, nodeMap)}
  %%TOC%%

  ${buildUseCases(node)}
${priorityContentHtml ? `

  ${priorityContentHtml}
` : `
`}
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
  // Short phrase (under 35 chars) appended to the title in the <title> tag to give the direct answer.
  // Helps searchers see the answer before clicking.
  titleHook?: string;
  answer: string;
  details: string;
  relatedLangs: string[];
  relatedTools?: string[];
}

const QUESTIONS: QuestionDef[] = [
  {
    slug: 'what-is-python-written-in',
    title: 'What is Python written in?',
    titleHook: 'CPython is written in C',
    answer: "Python's reference implementation, CPython, is written primarily in C. The language specification itself is implementation-independent, but CPython is the dominant runtime and is implemented in C for performance and portability. Other implementations include Jython (Java), PyPy (Python/RPython), and IronPython (.NET).",
    details: `<p>When people ask "what is Python written in?" they usually mean the <strong>CPython implementation language</strong>. CPython is the reference implementation maintained by the Python Software Foundation. Its interpreter core, object model, memory allocator, and C API are implemented primarily in C, with many higher-level library modules written in Python.</p>
<p>Because its core is written in C, Python is often said to be "built on C". However, Python as a <em>language specification</em> is separate from any particular implementation. The specification does not require C. CPython is simply the dominant runtime and the behavior most people mean when they say "Python."</p>
<h2>Python implementation layers</h2>
<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>CPython core</td><td>C</td><td>Interpreter, object model, memory management, C API</td></tr>
    <tr><td>Standard library</td><td>Python and C</td><td>Built-in modules, libraries, extension modules</td></tr>
    <tr><td>Alternative runtimes</td><td>RPython, Java, C#</td><td>PyPy, Jython, IronPython</td></tr>
  </tbody>
</table>
<p>The dataset records a <code>runtime_written_in</code> relationship from C to Python because CPython is the reference and most widely deployed Python runtime.</p>`,
    relatedLangs: ['python', 'c'],
    relatedTools: [],
  },
  {
    slug: 'what-is-javascript-written-in',
    title: 'What is JavaScript written in?',
    titleHook: 'V8 and SpiderMonkey: C++',
    answer: "The major JavaScript engines are written in C++. Google's V8 (used in Chrome and Node.js), Mozilla's SpiderMonkey, and Apple's JavaScriptCore are all implemented in C++. The JavaScript language specification is defined by ECMAScript and doesn't mandate any particular implementation language.",
    details: `<p>JavaScript itself is a language standard, defined by ECMAScript. The useful implementation question is about JavaScript engines: the programs that parse, compile, optimize, and execute JavaScript code.</p>
<p>While the very first JavaScript engine was written in C, most modern major engines use C++ for performance-critical compiler and runtime code. V8 powers Chrome and Node.js, SpiderMonkey powers Firefox, and JavaScriptCore powers Safari and WebKit-based environments.</p>
<h2>Major JavaScript engines</h2>
<table class="impl-table">
  <thead><tr><th>Engine</th><th>Written in</th><th>Where it runs</th></tr></thead>
  <tbody>
    <tr><td>V8</td><td>C++</td><td>Chrome, Node.js, Deno, Electron</td></tr>
    <tr><td>SpiderMonkey</td><td>C++, Rust, JavaScript</td><td>Firefox</td></tr>
    <tr><td>JavaScriptCore</td><td>C++</td><td>Safari and WebKit</td></tr>
  </tbody>
</table>
<p>The dataset keeps the historical C relationship for the original SpiderMonkey implementation, while the modern engine pages document C++-based implementations such as V8 and JavaScriptCore.</p>`,
    relatedLangs: ['javascript', 'cxx'],
    relatedTools: ['v8', 'spidermonkey', 'javascriptcore'],
  },
  {
    slug: 'what-is-rust-written-in',
    title: 'What is Rust written in?',
    titleHook: 'rustc is self-hosting',
    answer: "Rust is self-hosting: the Rust compiler (rustc) is written in Rust. The first version of rustc was written in OCaml; Rust became self-hosting in 2011. mrustc is an alternative Rust compiler written in C++ that can bootstrap rustc from source.",
    details: `<p>Rustc, the official Rust compiler, is written in Rust, making Rust self-hosting. Self-hosting means the compiler can compile the source code of its own compiler.</p>
<p>Rust was not self-hosting from day one. Early Rust used a compiler written in OCaml, then moved to rustc written in Rust once the language and compiler were mature enough.</p>
<h2>Rust implementation layers</h2>
<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>rustc frontend and compiler driver</td><td>Rust</td><td>Parses, type-checks, and drives compilation</td></tr>
    <tr><td>Historical compiler</td><td>OCaml</td><td>Original Rust compiler before self-hosting</td></tr>
    <tr><td>LLVM backend</td><td>C++</td><td>Optimization and machine-code generation</td></tr>
    <tr><td>mrustc</td><td>C++</td><td>Alternative compiler relevant to bootstrap chains</td></tr>
  </tbody>
</table>
<p>The bootstrap chain normally uses a previous rustc snapshot to build the next compiler version. The dataset records both Rust's self-hosting chain and the historical OCaml origin.</p>`,
    relatedLangs: ['rust', 'ocaml', 'cxx'],
    relatedTools: ['mrustc'],
  },
  {
    slug: 'what-is-go-written-in',
    title: 'What is Go written in?',
    titleHook: 'Self-hosting since Go 1.5',
    answer: "Go is self-hosting since version 1.5 (2015). The Go compiler and runtime are written in Go itself. Before Go 1.5, the gc compiler was written in C. The transition to a self-hosted compiler was completed as part of the Go 1.5 release.",
    details: `<p>The Go compiler toolchain is written in Go. The Go runtime, including the scheduler and garbage collector, is also mostly written in Go, with assembly where the runtime needs architecture-specific machine-level behavior.</p>
<p>Before Go 1.5, the compiler was written in C. Go 1.5 completed the move to a self-hosted compiler, which means modern Go is built using Go itself.</p>
<h2>Go implementation layers</h2>
<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>Modern compiler</td><td>Go</td><td>Compiles Go source; self-hosted since Go 1.5</td></tr>
    <tr><td>Historical compiler</td><td>C</td><td>Used before the Go 1.5 rewrite</td></tr>
    <tr><td>Runtime</td><td>Go and assembly</td><td>Goroutines, scheduler, garbage collector, low-level runtime support</td></tr>
  </tbody>
</table>
<p>The dataset records Go's self-hosted compiler and runtime relationships as well as the historical compiler relationship from C.</p>`,
    relatedLangs: ['go', 'c'],
    relatedTools: [],
  },
  {
    slug: 'what-is-java-written-in',
    title: 'What is Java written in?',
    titleHook: 'javac in Java, HotSpot in C++',
    answer: "The Java compiler (javac) is written in Java, making it partially self-hosting. The HotSpot JVM, the primary Java runtime, is written in C and C++. The Java standard library (java.lang, java.util, etc.) is written in Java itself.",
    details: `<p>Java has multiple implementation layers: the compiler, the virtual machine, and the standard library. A complete answer depends on which layer you mean.</p>
<p>The <strong>javac compiler</strong> is written in Java. It compiles Java source files to JVM bytecode. Because javac is itself written in Java, new versions are bootstrapped using an existing Java toolchain.</p>
<p>The <strong>HotSpot JVM</strong>, the primary Java runtime, is written mainly in C and C++. HotSpot includes the bytecode interpreter, JIT compiler, garbage collectors, class loader, and native platform integration.</p>
<h2>Java implementation layers</h2>
<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>javac</td><td>Java</td><td>Compiles Java source to JVM bytecode</td></tr>
    <tr><td>HotSpot JVM</td><td>C and C++</td><td>Executes bytecode, JIT-compiles hot code, manages memory</td></tr>
    <tr><td>Standard library</td><td>Java</td><td>Core APIs such as java.lang and java.util</td></tr>
  </tbody>
</table>`,
    relatedLangs: ['java', 'c', 'cxx'],
    relatedTools: ['hotspot'],
  },
  {
    slug: 'what-is-c-written-in',
    title: 'What is C written in?',
    titleHook: 'GCC and Clang are C and C++',
    answer: "C compilers like GCC and Clang are written in C and C++. C is one of the earliest self-hosted languages, the original C compiler was written in B, then rewritten in C itself. GCC (GNU Compiler Collection) is primarily written in C and C++; Clang is written in C++.",
    details: `<p>C compilers are generally self-hosted: they are written in C (or C++) and can compile their own source code. GCC, the GNU Compiler Collection, is implemented primarily in C with some C++. Clang/LLVM is implemented in C++.</p>
<p>Historically, the original C compiler was written in B (a predecessor to C) on the PDP-7. It was then rewritten in C once the language had enough capability, one of the earliest examples of compiler bootstrapping.</p>
<p>The dataset records <code>compiler_written_in</code> relationships from C and C++ to GCC and Clang, and a historical bootstrap relationship reflecting C's early self-hosting.</p>`,
    relatedLangs: ['c', 'cxx', 'b'],
    relatedTools: ['gcc', 'clang'],
  },
  {
    slug: 'what-is-cpp-written-in',
    title: 'What is C++ written in?',
    titleHook: 'GCC and Clang/LLVM are C++',
    answer: "C++ compilers including GCC and Clang/LLVM are implemented in C++. The original Cfront compiler, which translated C++ to C, was written in C. GCC became capable of compiling C++ and is itself written in C++. Clang, the modern alternative, is written in C++ and built on the LLVM infrastructure.",
    details: `<p>The two dominant C++ compilers are GCC and Clang. Both are written in C++, making them self-hosting for the C++ language.</p>
<p>Cfront, the original C++ compiler developed at Bell Labs in the 1980s, was written in C and translated C++ code into C for compilation. GCC later gained C++ support and is now written in C++ itself.</p>
<p>Clang is built on the LLVM compiler infrastructure. Both Clang and the LLVM core libraries are implemented in C++.</p>`,
    relatedLangs: ['cxx', 'c'],
    relatedTools: ['gcc', 'clang', 'llvm'],
  },
  {
    slug: 'what-is-typescript-written-in',
    title: 'What is TypeScript written in?',
    titleHook: 'tsc is self-hosting',
    answer: "The TypeScript compiler (tsc) is written in TypeScript itself, making it self-hosting. It compiles TypeScript to JavaScript, so the compiled tsc runs on any JavaScript engine. The TypeScript compiler and language services are fully self-hosted.",
    details: `<p>TypeScript is self-hosting: the tsc compiler is written in TypeScript. This means TypeScript's compiler is compiled by itself, a previous version of tsc compiles the next version.</p>
<p>Since TypeScript compiles to JavaScript, the compiled tsc binary runs on Node.js or any JavaScript engine. This makes TypeScript's self-hosting unique: it's a compiled language whose compiler runs as interpreted JavaScript.</p>`,
    relatedLangs: ['typescript', 'javascript'],
    relatedTools: [],
  },
  {
    slug: 'what-is-ruby-written-in',
    title: 'What is Ruby written in?',
    titleHook: 'CRuby (MRI) is written in C',
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
    titleHook: 'V8 is written in C++',
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
    titleHook: 'CPython is written in C',
    answer: "CPython, the reference implementation of Python, is written primarily in C. Its interpreter, object model, and most of the standard library are implemented in C. Some higher-level standard library modules (like email or html.parser) are written in Python.",
    details: `<p>CPython is the canonical Python implementation. When Python documentation refers to "Python," it typically means CPython's behavior.</p>
<p>CPython's core, the bytecode interpreter, memory allocator, garbage collector, object model, and C API, is implemented in C. This gives CPython excellent interoperability with C libraries via the Python/C API.</p>
<p>CPython compiles Python source files to .pyc bytecode files, which the interpreter then executes. This is distinct from true ahead-of-time compilation.</p>`,
    relatedLangs: ['python', 'c'],
    relatedTools: [],
  },
  {
    slug: 'what-is-compiler-bootstrapping',
    title: 'What is compiler bootstrapping?',
    titleHook: 'self-compiling explained',
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
    titleHook: 'compiles its own source',
    answer: "A self-hosting compiler is a compiler that is written in the language it compiles. Once self-hosted, the language no longer depends on another language for its compiler. Self-hosting languages include Rust, Go, TypeScript, Haskell, and Kotlin, among others.",
    details: `<p>Self-hosting is closely related to bootstrapping. A compiler is self-hosting when its source code is written in the language it compiles, meaning it can compile itself.</p>
<p>Self-hosting compilers:</p>
<ul>
  <li><strong>Rust</strong>, rustc is written in Rust (self-hosted since 2011)</li>
  <li><strong>Go</strong>, gc toolchain is written in Go (since version 1.5)</li>
  <li><strong>TypeScript</strong>, tsc is written in TypeScript</li>
  <li><strong>Haskell/GHC</strong>, GHC is written in Haskell</li>
  <li><strong>Java/javac</strong>, javac is written in Java</li>
</ul>
<p>Self-hosting is considered a sign of language maturity. It also provides a kind of correctness check: if the language's own compiler works, many of the language's features have been validated in a real-world use case.</p>`,
    relatedLangs: ['rust', 'go', 'typescript', 'haskell', 'java'],
    relatedTools: ['ghc'],
  },
  {
    slug: 'is-javascript-written-in-c',
    title: 'Is JavaScript written in C?',
    titleHook: 'No, modern engines are C++',
    answer: "No, modern JavaScript engines like V8 and JavaScriptCore are written in C++, not C. Historically, the very first engine (SpiderMonkey) was written in C, but it has since been rewritten in C++, Rust, and JavaScript.",
    details: `<p>A common misconception is that JavaScript is written in C. While C heavily influenced JavaScript's syntax, the engines that actually execute JavaScript code are almost universally written in C++ today.</p>
<p>Google's V8 (used in Chrome and Node.js) and Apple's JavaScriptCore (used in Safari) are both implemented in C++. Mozilla's SpiderMonkey, the original JavaScript engine, was initially written in C by Brendan Eich, but has evolved into a complex codebase of C++, Rust, and JavaScript itself.</p>`,
    relatedLangs: ['javascript', 'cxx', 'c'],
    relatedTools: ['v8', 'javascriptcore', 'spidermonkey'],
  },
  {
    slug: 'is-rustc-written-in-rust',
    title: 'Is rustc written in Rust?',
    titleHook: 'Yes, self-hosting since 2011',
    answer: "Yes, rustc (the official Rust compiler) is written entirely in Rust. It is a self-hosting compiler, meaning it compiles its own source code.",
    details: `<p>The Rust compiler, <code>rustc</code>, is a classic example of a self-hosting compiler. The source code for <code>rustc</code> is written in Rust, and it uses an older version of itself (a bootstrap compiler) to compile the newest version.</p>
<p>However, <code>rustc</code> relies on LLVM as its backend to generate optimized machine code. LLVM itself is written in C++.</p>`,
    relatedLangs: ['rust', 'cxx'],
    relatedTools: ['llvm', 'mrustc'],
  },
  {
    slug: 'is-rust-compiled',
    title: 'Is Rust a compiled language?',
    titleHook: 'Yes, AOT compiled via LLVM',
    answer: "Yes, Rust is a compiled language. The Rust compiler (rustc) translates Rust source code ahead-of-time (AOT) directly into native machine code using the LLVM backend.",
    details: `<p>Unlike interpreted languages (like Python or JavaScript) or bytecode-compiled languages (like Java or C#), Rust is an ahead-of-time (AOT) compiled language.</p>
<p>When you run <code>cargo build</code> or <code>rustc</code>, the compiler parses your Rust code and passes it to the LLVM infrastructure, which generates highly optimized, native machine code for your specific target architecture (e.g., x86_64, ARM). This results in a standalone binary executable that does not require a runtime or interpreter to run.</p>`,
    relatedLangs: ['rust'],
    relatedTools: ['llvm'],
  }
];

// Related question slugs per question slug (used to cross-link orphan question pages)
const RELATED_QUESTIONS: Record<string, Array<{ slug: string; title: string }>> = {
  'what-is-javascript-written-in': [{ slug: 'is-javascript-written-in-c', title: 'Is JavaScript written in C?' }],
  'what-is-rust-written-in': [
    { slug: 'is-rustc-written-in-rust', title: 'Is rustc written in Rust?' },
    { slug: 'is-rust-compiled', title: 'Is Rust compiled?' },
  ],
  'what-is-python-written-in': [{ slug: 'what-is-cpython-written-in', title: 'What is CPython written in?' }],
};

function buildQuestionPage(q: QuestionDef, nodeMap: Map<string, Language>): string {
  const url = `${SITE}/questions/${q.slug}`;
  const metaDescription = truncateMetaDescription(q.answer);
  const prioritySlug = q.slug.match(/^what-is-(.+)-written-in$/)?.[1];
  const priorityContent = prioritySlug ? PRIORITY_CONTENT[prioritySlug] : null;
  const faqJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: q.title,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    }],
  });
  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: q.title,
    description: metaDescription,
    url,
    datePublished: '2024-01-01',
    dateModified: BUILD_DATE,
    author: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    publisher: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.question-answer'],
    },
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
  const matchingLangSlug = q.slug.match(/^what-is-(.+)-written-in$/)?.[1];

  const relatedLinks = [
    ...q.relatedLangs.map(slug => {
      const node = nodeMap.get(`lang:${slug}`) ?? nodeMap.get(`tool:${slug}`);
      return node ? `<a href="/languages/${slug}" class="discover-link">${escapeHtml(node.name)}</a>` : '';
    }),
    ...(q.relatedTools ?? []).map(slug => {
      const node = nodeMap.get(`tool:${slug}`);
      return node ? `<a href="/tools/${slug}" class="discover-link">${escapeHtml(node.name)}</a>` : '';
    }),
    ...(RELATED_QUESTIONS[q.slug] ?? []).map(rq => `<a href="/questions/${rq.slug}" class="discover-link">${escapeHtml(rq.title)}</a>`),
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(q.titleHook ? `${q.title} ${q.titleHook}` : q.title)} | Language Lineage</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  ${matchingLangSlug && QUESTION_PAGE_LANGS.has(matchingLangSlug) ? `<link rel="alternate" href="${SITE}/languages/${matchingLangSlug}" />` : ''}
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(q.titleHook ? `${q.title} ${q.titleHook}` : q.title)} | Language Lineage" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ogImg(`questions-${q.slug}.png`)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="article:published_time" content="2024-01-01" />
  <meta property="article:modified_time" content="${BUILD_DATE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(q.titleHook ? `${q.title} ${q.titleHook}` : q.title)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${articleJsonLd}</script>
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
${priorityContent ? `

  ${renderQuickFacts(priorityContent.facts)}
` : `
`}  <h2>Details</h2>
  ${q.details}

  <h2>Explore in the Graph</h2>
  <p>See implementation and influence relationships interactively.</p>
  <a class="explore-btn" href="/explore">Open Interactive Graph &rarr;</a>

  ${relatedLinks.length > 0 ? `<section class="discover-more" data-nosnippet>
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

// ============================================================
// AUTO-GENERATED QUESTION PAGES  (Phase 3)
// ============================================================

interface AutoQNode {
  node: Language;
  implEdges: Relationship[];
}

function buildAutoQuestionPage(aqn: AutoQNode, nodeMap: Map<string, Language>): string {
  const { node, implEdges } = aqn;
  const slug = idToSlug(node.id);
  const url = `${SITE}/questions/what-is-${slug}-written-in`;
  const title = `What is ${node.name} written in?`;
  const enrich = ENRICHMENT[node.id];

  const compilerEdges = implEdges.filter(e => e.relationship === 'compiler_written_in');
  const runtimeEdges  = implEdges.filter(e => e.relationship === 'runtime_written_in');
  const bootstrapEdges = implEdges.filter(e => e.relationship === 'bootstrap_written_in');
  const isSelfHosting = implEdges.some(e => e.from_language === node.id);

  function getNodeName(id: string): string {
    const n = nodeMap.get(id);
    return n ? n.name : id.replace(/^(lang|tool):/, '');
  }
  function uniqFromLangs(edges: Relationship[]): string[] {
    const seen = new Set<string>();
    return edges.reduce<string[]>((acc, e) => {
      if (!seen.has(e.from_language)) { seen.add(e.from_language); acc.push(getNodeName(e.from_language)); }
      return acc;
    }, []);
  }
  function joinNames(names: string[]): string {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  }

  // Synthesize direct answer
  const answerParts: string[] = [];
  if (isSelfHosting) {
    answerParts.push(`${node.name} is self-hosting: its compiler is written in ${node.name} itself.`);
    const nonSelf = compilerEdges.filter(e => e.from_language !== node.id);
    if (nonSelf.length > 0) answerParts.push(`It also relies on ${joinNames(uniqFromLangs(nonSelf))} in its toolchain.`);
  } else {
    if (compilerEdges.length > 0) {
      answerParts.push(`The ${node.name} compiler is written in ${joinNames(uniqFromLangs(compilerEdges))}.`);
    }
    if (runtimeEdges.length > 0) {
      const rn = joinNames(uniqFromLangs(runtimeEdges));
      answerParts.push(compilerEdges.length > 0 ? `Its runtime is written in ${rn}.` : `The ${node.name} runtime is written in ${rn}.`);
    }
    if (bootstrapEdges.length > 0) {
      answerParts.push(`It bootstraps via ${joinNames(uniqFromLangs(bootstrapEdges))}.`);
    }
  }
  const answerText = answerParts.join(' ');

  // Build meta description with enough context to exceed 75 chars
  const descParts: string[] = [answerText];
  const goodTagline = enrich?.tagline && enrich.tagline.length > 3 && enrich.tagline !== 'node js';
  if (goodTagline) descParts.push(` ${node.name} is ${aOrAn(enrich!.tagline!)} ${enrich!.tagline!}`);
  const designers: string[] = (enrich?.facts as Record<string, string[]> | undefined)?.designers?.filter((d: string) => d?.length > 0) ?? [];
  if (designers.length > 0) {
    descParts.push(goodTagline
      ? `, designed by ${joinNames(designers.slice(0, 2))}`
      : ` ${node.name} was designed by ${joinNames(designers.slice(0, 2))}`);
  }
  if (node.first_release_year && node.first_release_year > 0) descParts.push(`, first released in ${node.first_release_year}`);
  descParts.push('. Explore the full lineage on Language Lineage.');
  const metaDescription = truncateMetaDescription(descParts.join(''));

  // Title tag with hook (implementation language) if it fits in 75 chars
  const allImplNames = uniqFromLangs(implEdges);
  let hookText = isSelfHosting ? 'self-hosting' : allImplNames.length === 1 ? `written in ${allImplNames[0]}` : `${allImplNames[0]}${allImplNames.length > 1 ? ' and more' : ''}`;
  const hookFits = (title.length + 1 + hookText.length + 19) <= 75;
  const pageTitleTag = hookFits ? `${title} ${hookText} | Language Lineage` : `${title} | Language Lineage`;

  // Enrichment context line
  const enrichBits: string[] = [];
  if (enrich?.tagline) enrichBits.push(`${node.name} is ${aOrAn(enrich.tagline)} ${enrich.tagline}`);
  if (enrich?.designers && enrich.designers.length > 0) enrichBits.push(`designed by ${joinNames(enrich.designers.slice(0, 3))}`);
  if (node.first_release_year && node.first_release_year > 0) enrichBits.push(`first released in ${node.first_release_year}`);
  const enrichLine = enrichBits.length > 0 ? `<p>${escapeHtml(enrichBits.join(', '))}.</p>` : '';

  // Implementation table rows
  const relLabel: Record<string, string> = {
    compiler_written_in: 'Compiler',
    runtime_written_in: 'Runtime',
    bootstrap_written_in: 'Bootstrap',
  };
  const tableRows = implEdges.map(e => {
    const implNodeName = getNodeName(e.from_language);
    const implSlug = e.from_language.replace(/^(lang|tool):/, '').replace(/_/g, '-');
    const implPrefix = e.from_language.startsWith('tool:') ? 'tools' : 'languages';
    const since = e.start_year ? ` (since ${e.start_year})` : '';
    const notes = e.notes ? escapeHtml(e.notes) : '';
    return `<tr><td>${relLabel[e.relationship] ?? e.relationship.replace(/_/g, ' ')}</td><td><a href="/${implPrefix}/${implSlug}">${escapeHtml(implNodeName)}</a>${since}</td><td>${notes}</td></tr>`;
  }).join('\n      ');

  // Context section explaining the relationship type
  let contextHtml = '';
  if (isSelfHosting) {
    contextHtml = `<h2>Self-hosting</h2>
<p>${escapeHtml(node.name)} is a self-hosting language: its compiler is written in ${escapeHtml(node.name)} itself. Self-hosting means the compiler can compile its own source code, which is a milestone in a language's maturity. New versions of the compiler are built using an older version of the same compiler, a process called bootstrapping.</p>
<p>Self-hosting also acts as a practical stress test: if a language can compile its own compiler, most core language features have been validated in a complex, real-world workload. See <a href="/guides/what-is-compiler-bootstrapping">what is compiler bootstrapping</a> for a full explanation.</p>`;
  } else if (bootstrapEdges.length > 0) {
    const bLangs = joinNames(uniqFromLangs(bootstrapEdges));
    contextHtml = `<h2>Bootstrap chain</h2>
<p>Bootstrapping is the process of using a language's own compiler to compile a new version of itself. The very first compiler must be written in another language; once functional, that compiler can compile a self-hosted version. ${escapeHtml(node.name)} uses ${escapeHtml(bLangs)} as part of its bootstrap chain.</p>
<p>See the guide on <a href="/guides/what-is-compiler-bootstrapping">what is compiler bootstrapping</a> for a walkthrough of how bootstrap chains work in practice.</p>`;
  } else if (runtimeEdges.length > 0 && compilerEdges.length === 0) {
    const rLangs = joinNames(uniqFromLangs(runtimeEdges));
    contextHtml = `<h2>Runtime model</h2>
<p>The ${escapeHtml(node.name)} runtime, written in ${escapeHtml(rLangs)}, manages the execution of ${escapeHtml(node.name)} programs. Runtime-based languages rely on a host process to interpret or compile code at runtime rather than compiling entirely ahead-of-time to native machine code. This means running ${escapeHtml(node.name)} programs requires the runtime to be present on the target system.</p>
<p>The choice of ${escapeHtml(rLangs)} for the runtime gives ${escapeHtml(node.name)} access to native performance, established platform abstractions, and existing ecosystem libraries.</p>`;
  } else if (compilerEdges.length > 0) {
    const cLangs = joinNames(uniqFromLangs(compilerEdges));
    contextHtml = `<h2>Compiler implementation</h2>
<p>The ${escapeHtml(node.name)} compiler, written in ${escapeHtml(cLangs)}, translates ${escapeHtml(node.name)} source code into an executable or intermediate format. The choice of implementation language affects the compiler's portability, build-time dependencies, and the path toward ${escapeHtml(node.name)} eventually becoming self-hosting.</p>
<p>Many language compilers are written in C or C++ for maximum portability and performance. When a compiler is written in a higher-level language, it can leverage that language's abstractions for clearer compiler code, at the cost of a longer bootstrap dependency chain.</p>`;
  }

  // Related links
  const seenIds = new Set<string>();
  const relatedLinks: string[] = [];
  for (const e of implEdges.slice(0, 4)) {
    if (seenIds.has(e.from_language)) continue;
    seenIds.add(e.from_language);
    const n = nodeMap.get(e.from_language);
    if (!n) continue;
    const s = idToSlug(n.id);
    const pfx = n.id.startsWith('tool:') ? 'tools' : 'languages';
    relatedLinks.push(`<a href="/${pfx}/${s}" class="discover-link">${escapeHtml(n.name)}</a>`);
  }
  relatedLinks.push(`<a href="/languages/${slug}" class="discover-link">${escapeHtml(node.name)} language page</a>`);
  relatedLinks.push(`<a href="/what-are-programming-languages-written-in" class="discover-link">What are programming languages written in?</a>`);
  relatedLinks.push(`<a href="/questions" class="discover-link">All questions</a>`);

  // JSON-LD
  const faqJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: title, acceptedAnswer: { '@type': 'Answer', text: answerText } }],
  });
  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDescription,
    url,
    datePublished: node.first_release_year ? `${node.first_release_year}-01-01` : '2024-01-01',
    dateModified: BUILD_DATE,
    author: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    publisher: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.question-answer'] },
  });
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: `${SITE}/questions` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  });

  const pubDate = node.first_release_year ? `${node.first_release_year}-01-01` : '2024-01-01';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitleTag)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <link rel="alternate" href="${SITE}/languages/${slug}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(pageTitleTag)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="article:published_time" content="${pubDate}" />
  <meta property="article:modified_time" content="${BUILD_DATE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(pageTitleTag)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
  <script type="application/ld+json">${faqJsonLd}</script>
  <script type="application/ld+json">${articleJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
${NAV_HTML}
<main class="seo-main">
  <nav class="breadcrumb" aria-label="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/questions">Questions</a> &rsaquo; ${escapeHtml(title)}
  </nav>

  <h1>${escapeHtml(title)}</h1>

  <div class="question-answer">${escapeHtml(answerText)}</div>

  ${enrichLine}

  <h2>Implementation</h2>
  <table class="impl-table">
    <thead><tr><th>Layer</th><th>Written in</th><th>Notes</th></tr></thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  ${contextHtml}

  <h2>Explore in the Graph</h2>
  <p>See ${escapeHtml(node.name)}'s full lineage, including all implementation and influence relationships, in the interactive graph.</p>
  <a class="explore-btn" href="/explore">Open Interactive Graph &rarr;</a>
  <p>Or view the <a href="/languages/${slug}">${escapeHtml(node.name)} language page</a> for the complete record.</p>

  <section class="discover-more" data-nosnippet>
    <h2>Related Pages</h2>
    <div class="discover-links">
      ${relatedLinks.join('\n      ')}
    </div>
  </section>

</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildQuestionsIndex(autoPages: AutoQNode[]): string {
  const url = `${SITE}/questions`;
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Questions', item: url },
    ],
  });
  const autoLinks = autoPages
    .sort((a, b) => a.node.name.localeCompare(b.node.name))
    .map(aqn => {
      const s = idToSlug(aqn.node.id);
      return `<a href="/questions/what-is-${s}-written-in" class="related-card">What is ${escapeHtml(aqn.node.name)} written in?</a>`;
    }).join('\n    ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Questions Answered | Language Lineage</title>
  <meta name="description" content="Direct answers to common programming language questions: what languages are written in, compiler bootstrapping, self-hosting compilers, and more." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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

  <h2>Featured: what is X written in?</h2>
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

  <h2>More languages (${autoPages.length})</h2>
  <div class="related-grid">
    ${autoLinks}
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
    { q: 'What is a programming language graph?', a: 'A programming language graph is a network visualization showing relationships between programming languages, including influence, ancestry, compiler implementation, runtime implementation, and bootstrapping chains.' },
    { q: 'How many languages are in the Language Lineage graph?', a: `The Language Lineage graph contains ${langCount} programming languages and ${toolCount} compilers/runtimes, connected by ${rels.length} relationships.` },
    { q: 'What relationships does the graph show?', a: 'The graph shows: influence (language A inspired language B), compiler_written_in (the compiler for language A is written in B), runtime_written_in (the runtime is written in B), bootstrap_written_in (A bootstraps via B), transpiled_to (A compiles to B), and rewritten_in.' },
    { q: 'How is this different from HOPL or Wikipedia genealogy charts?', a: 'HOPL and Wikipedia show influence and ancestry. Language Lineage adds implementation relationships, what compilers and runtimes are actually written in, with confidence scores and evidence sources for every relationship.' },
  ];
  const faqJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const breadcrumbJsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Programming Language Graph', item: url }] });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Language Graph | Interactive Language Lineage Map</title>
  <meta name="description" content="Interactive graph of ${langCount} programming languages and ${rels.length} relationships: what languages are written in, how compilers are implemented, and how they influenced each other." />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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

  <div class="answer-box">The Language Lineage graph maps both <strong>influence relationships</strong> (which language inspired which) and <strong>implementation relationships</strong> (what compiler, runtime, or bootstrap chain each language uses), with confidence scores and source citations for every edge.</div>

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
    <li><strong>Implementation data</strong>, what compilers and runtimes are written in</li>
    <li><strong>Bootstrap chains</strong>, which languages can compile their own compilers</li>
    <li><strong>Confidence scores</strong>, every relationship has a confidence value (0–1)</li>
    <li><strong>Evidence sources</strong>, links to Wikipedia, papers, and documentation for every edge</li>
    <li><strong>Interactivity</strong>, click, filter, zoom, switch layouts</li>
  </ul>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Open Interactive Graph &rarr;</a>

  <section class="discover-more" data-nosnippet>
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
    { name: 'Lisp family', members: ['Lisp', 'Scheme', 'Clojure', 'Racket'], desc: 'Languages derived from John McCarthy\'s Lisp, emphasizing homoiconicity and macros.' },
    { name: 'ML family', members: ['ML', 'OCaml', 'Haskell', 'F#', 'SML'], desc: 'Statically typed functional languages with algebraic data types and type inference.' },
    { name: 'JVM family', members: ['Java', 'Scala', 'Kotlin', 'Groovy', 'Clojure'], desc: 'Languages that compile to JVM bytecode and run on the Java Virtual Machine.' },
    { name: 'BEAM family', members: ['Erlang', 'Elixir', 'Gleam'], desc: 'Languages targeting the BEAM (Erlang VM), designed for concurrency and fault tolerance.' },
  ];
  const faqs = [
    { q: 'What is a programming language family tree?', a: 'A programming language family tree shows which languages influenced or descended from other languages. Languages in the same "family" share syntactic, semantic, or conceptual heritage.' },
    { q: 'What is the C family of programming languages?', a: 'The C family includes languages that adopted C\'s syntax (curly braces, semicolons) or systems-programming philosophy: C++, Objective-C, Java, C#, Go, Rust, JavaScript, and many others.' },
    { q: 'What is the Lisp family of languages?', a: 'The Lisp family includes languages derived from John McCarthy\'s original Lisp (1958): Scheme, Common Lisp, Clojure, Racket, and Emacs Lisp. They share s-expression syntax and support for macros.' },
    { q: 'How does Language Lineage differ from a traditional family tree?', a: 'Traditional family trees show influence. Language Lineage also maps implementation relationships: what compilers and runtimes each language uses, bootstrap chains, and transpilation targets, with confidence scores and evidence sources.' },
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Family Tree | Interactive Lineage Graph" />
  <meta property="og:description" content="C family, Lisp family, ML family, JVM family and more, interactive programming language family tree with implementation data." />
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
  <p>The programming language family tree maps how languages descend from and influence each other. Language Lineage extends this with implementation data, what compilers, runtimes, and bootstrap chains each language uses.</p>

  <div class="answer-box">The Language Lineage graph contains ${langCount} programming languages grouped into families by influence, implementation, and conceptual ancestry. It goes beyond influence trees to include <strong>compiler, runtime, and bootstrap relationships</strong>.</div>

  ${families.map(f => `<h2>The ${escapeHtml(f.name)}</h2>
  <p>${escapeHtml(f.desc)}</p>
  <div class="related-grid">
    ${f.members.map(m => {
      const specialSlug: Record<string, string> = { 'C++': 'cxx', 'C#': 'csharp', 'F#': 'fsharp' };
      const fixedSlug = specialSlug[m] ?? m.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      return `<a href="/languages/${fixedSlug}" class="related-card">${escapeHtml(m)}</a>`;
    }).join('\n    ')}
  </div>`).join('\n\n  ')}

  <h2>More than influence, implementation lineage</h2>
  <p>Traditional family trees show only conceptual influence. Language Lineage also tracks:</p>
  <ul>
    <li><a href="/relationships/compiler-written-in"><strong>compiler_written_in</strong></a>, what language each compiler is implemented in</li>
    <li><a href="/relationships/runtime-written-in"><strong>runtime_written_in</strong></a>, what language each runtime or VM is implemented in</li>
    <li><a href="/relationships/bootstrap-written-in"><strong>bootstrap_written_in</strong></a>, how self-hosting compilers bootstrap themselves</li>
    <li><a href="/relationships/transpiled-to"><strong>transpiled_to</strong></a>, which languages compile to other languages</li>
  </ul>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore the Family Tree Interactively &rarr;</a>

  <section class="discover-more" data-nosnippet>
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
    { q: 'What is programming language genealogy?', a: 'Programming language genealogy is the study of how programming languages descend from, influence, and relate to each other, tracing ancestry chains and identifying language families.' },
    { q: 'How is influence different from implementation in language genealogy?', a: 'Influence means one language inspired another\'s design. Implementation means one language was used to build another\'s compiler, runtime, or interpreter. Both are part of a complete language lineage picture.' },
    { q: 'Which programming language has the most descendants?', a: 'C and Lisp are among the most influential languages by direct and indirect influence. Many modern languages, Go, Rust, JavaScript, Java, trace some ancestry to C.' },
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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
  <p>Programming language genealogy traces ancestry, influence, and implementation relationships between languages, from the first high-level languages of the 1950s to modern systems and scripting languages.</p>

  <div class="answer-box">The Language Lineage dataset contains <strong>${influenceCount} influence relationships</strong> across ${languages.filter(l => l.id.startsWith('lang:')).length} programming languages, tracking both conceptual influence and implementation lineage.</div>

  <h2>Influence versus implementation</h2>
  <p>Programming language genealogy has two distinct dimensions:</p>
  <ul>
    <li><strong>Conceptual influence</strong>, language A's design choices inspired language B (syntax, semantics, paradigm). Example: Smalltalk influenced Python's object model.</li>
    <li><strong>Implementation lineage</strong>, language A was used to build B's compiler, runtime, or interpreter. Example: C was used to implement CPython (Python's runtime).</li>
  </ul>
  <p>Most genealogy charts show only influence. Language Lineage shows both, with <a href="/dataset">evidence sources and confidence scores</a>.</p>

  <h2>Major genealogical lines</h2>
  <ul>
    <li><strong>FORTRAN → COBOL → PL/1 → ALGOL 60</strong>, early high-level languages</li>
    <li><strong>ALGOL 60 → CPL → BCPL → B → C</strong>, the path to C</li>
    <li><strong>C → C++ → Java → Kotlin / Scala</strong>, object-oriented mainstream</li>
    <li><strong>Lisp → Scheme → Racket, Common Lisp → Clojure</strong>, functional tradition</li>
    <li><strong>ML → SML → OCaml → F#, ReasonML</strong>, typed functional languages</li>
    <li><strong>Smalltalk → Objective-C, Ruby, Python (OO concepts)</strong>, message-passing OO</li>
  </ul>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore Genealogy Interactively &rarr;</a>

  <section class="discover-more" data-nosnippet>
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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
  <p>From assembly language in ${minYear} to modern systems languages in ${maxYear}, trace how programming languages evolved decade by decade. Each language links to its full lineage page with compiler, runtime, and influence relationships.</p>

  <div class="answer-box">The dataset spans <strong>${minYear}–${maxYear}</strong> with ${langNodes.length} programming languages. See the <a href="/timeline">interactive timeline visualization</a> for a graphical view.</div>

  ${sortedDecades.map(dec => {
    const langs = (decades[dec] ?? []).sort((a, b) => (a.first_release_year ?? 0) - (b.first_release_year ?? 0));
    return `<h2>${dec}s, ${langs.length} language${langs.length !== 1 ? 's' : ''}</h2>
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

  <section class="discover-more" data-nosnippet>
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
    { q: 'Can a language be written in itself?', a: 'Yes, this is called a self-hosting compiler. Rust, Go, TypeScript, Haskell, and Java\'s javac are all self-hosting. The first version must be written in another language, then it bootstraps itself.' },
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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
  <p>When we say "Python is written in C," we mean CPython, the reference implementation, is written in C. The Python <em>language specification</em> doesn't mandate any implementation language. You could write a Python interpreter in JavaScript, and some people have.</p>
  <p>The key terms:</p>
  <ul>
    <li><strong>Language specification</strong>, defines the syntax and semantics (e.g., the Python Reference Manual)</li>
    <li><strong>Compiler</strong>, translates source code to machine code or bytecode (e.g., javac, rustc, tsc)</li>
    <li><strong>Interpreter / runtime</strong>, executes code (e.g., CPython, V8, HotSpot JVM)</li>
    <li><strong>VM (virtual machine)</strong>, an abstract machine that runs bytecode (JVM, CLR, BEAM)</li>
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

  <h2>Four ways a language gets implemented</h2>
  <p>Across the dataset, almost every language falls into one of four implementation patterns:</p>
  <ul>
    <li><strong>Interpreted, runtime written in C:</strong> the classic dynamic-language pattern. <a href="/languages/python">Python</a> (CPython), <a href="/languages/ruby">Ruby</a> (MRI), <a href="/languages/php">PHP</a>, and <a href="/languages/lua">Lua</a> all run on interpreters written in <a href="/languages/c">C</a>.</li>
    <li><strong>Self-hosting and compiled to native code:</strong> the compiler is written in the language itself and emits machine code, often through the <a href="/tools/llvm">LLVM</a> backend. <a href="/languages/rust">Rust</a>, <a href="/languages/go">Go</a>, and <a href="/languages/haskell">Haskell</a> work this way.</li>
    <li><strong>Compiled to a virtual machine:</strong> source compiles to bytecode that runs on a VM written in C/C++. <a href="/languages/java">Java</a> and <a href="/languages/kotlin">Kotlin</a> target the JVM; <a href="/languages/csharp">C#</a> and <a href="/languages/fsharp">F#</a> target the .NET CLR.</li>
    <li><strong>Transpiled to another language:</strong> the "compiler" emits source in a second language rather than machine code. <a href="/languages/typescript">TypeScript</a> and <a href="/languages/coffeescript">CoffeeScript</a> transpile to JavaScript, then run on a JavaScript engine.</li>
  </ul>

  <h2>Self-hosting languages</h2>
  <p>Some languages' compilers are written in the language itself, called self-hosting. This requires bootstrapping: an initial compiler written in another language, which is then used to compile the self-hosted version. Self-hosting languages: <a href="/languages/rust">Rust</a>, <a href="/languages/go">Go</a>, <a href="/languages/typescript">TypeScript</a>, <a href="/languages/haskell">Haskell</a>, <a href="/languages/java">Java (javac)</a>.</p>
  <p>See: <a href="/questions/what-is-compiler-bootstrapping">What is compiler bootstrapping?</a> and <a href="/questions/what-is-a-self-hosting-compiler">What is a self-hosting compiler?</a></p>

  <h2>Frequently Asked Questions</h2>
  ${faqs.map(f => `<div class="faq-item">
    <div class="faq-question">${escapeHtml(f.q)}</div>
    <div class="faq-answer">${escapeHtml(f.a)}</div>
  </div>`).join('\n  ')}

  <a class="explore-btn" href="/explore">Explore Implementation Relationships &rarr;</a>

  <section class="discover-more" data-nosnippet>
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
    { q: 'What is the difference between a compiler and a runtime?', a: 'A compiler translates source code to another form (machine code, bytecode, or another language). A runtime is the environment that executes the program, managing memory, concurrency, and standard library calls at execution time.' },
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Compiler, Runtime, and Bootstrap Relationships Explained" />
  <meta property="og:description" content="Compiler, runtime, bootstrap, transpilation, what they mean and how Language Lineage tracks them." />
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
  <p>A compiler translates source code from one language to another, typically from a high-level language to machine code, bytecode, or another high-level language. Examples: <a href="/tools/gcc">GCC</a> (C/C++ → machine code), <a href="/tools/ghc">GHC</a> (Haskell → machine code), tsc (TypeScript → JavaScript).</p>

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

  <section class="discover-more" data-nosnippet>
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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
  <pre>https://www.languagelineage.org/dataset/v5/lineage_v5.json</pre>

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

const RELATIONSHIP_DEFS: Record<string, { label: string; h1: string; description: string; color: string }> = {
  compiler_written_in: {
    label: 'Compiler Written In',
    h1: 'Compiler Implementation Relationships',
    description: 'These relationships document what programming language each compiler is written in. For example, GCC (the GNU Compiler Collection) is written in C.',
    color: '#e3a008',
  },
  runtime_written_in: {
    label: 'Runtime Written In',
    h1: 'Runtime Implementation Relationships',
    description: 'These relationships document what programming language each runtime or interpreter is written in. For example, CPython (the reference Python interpreter) is written in C.',
    color: '#34d399',
  },
  bootstrap_written_in: {
    label: 'Bootstrap Chain',
    h1: 'Bootstrap and Self-Hosting Chains',
    description: 'Bootstrapping is the process of writing a compiler in the same language it compiles. These relationships show the bootstrap chains, what language was used to write the initial compiler before self-hosting was achieved.',
    color: '#a78bfa',
  },
  influenced: {
    label: 'Influenced',
    h1: 'Language Influence Relationships',
    description: 'Conceptual influence relationships document which design ideas, syntax features, or programming paradigms one language borrowed or adapted from another.',
    color: '#60a5fa',
  },
  transpiled_to: {
    label: 'Transpiled To',
    h1: 'Transpilation Relationships',
    description: 'Transpilation (source-to-source compilation) converts code from one high-level language to another. For example, CoffeeScript transpiles to JavaScript.',
    color: '#22d3ee',
  },
  rewritten_in: {
    label: 'Rewritten In',
    h1: 'Language Rewrites',
    description: 'These relationships document cases where a language runtime or compiler was substantially rewritten in a different implementation language.',
    color: '#fb7185',
  },
};

// Semantic relationship badge for static pages (matches graph + token colors).
function relBadge(type: string): string {
  const def = RELATIONSHIP_DEFS[type];
  if (!def) return '';
  return `<span class="rel-badge" style="--rc:${def.color}">${escapeHtml(def.label)}</span>`;
}

function buildRelationshipPage(type: string, rels: Relationship[], nodeMap: Map<string, Language>): string {
  const def = RELATIONSHIP_DEFS[type] || { label: type, h1: type, description: '' };
  const typeRels = rels.filter(r => r.relationship === type);
  const slug = type.replace(/_/g, '-');
  const url = `${SITE}/relationships/${slug}`;
  const title = `${typeRels.length} ${def.h1} | Language Lineage`;

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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ogImg(`relationships-${slug}.png`)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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

  <div class="rel-page-head">${relBadge(type)}</div>
  <h1>${escapeHtml(def.h1)}</h1>

  <div class="answer-box" style="border-left:3px solid ${def.color}">${escapeHtml(def.description)}</div>

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
    content: `<div class="answer-box">Compiler bootstrapping is the process of building a compiler for a programming language that is <strong>written in that same language</strong>. Because you cannot compile the compiler without already having a compiler, the first version is written in a different, already-working language, and each later version is compiled by the version before it. A language whose compiler can compile its own source code is called <em>self-hosting</em>.</div>

<h2>The chicken-and-egg problem</h2>
<p>A compiler is just a program, and like any program in a compiled language it has to be compiled before it can run. So how do you compile the very first compiler for a brand-new language, when no compiler for that language exists yet? This is the bootstrapping problem, and every self-hosting language has had to solve it.</p>
<p>The answer is to break the circular dependency once, at the beginning, using a language that already works. The first compiler, the <strong>stage 0</strong> or "seed" compiler, is written in an existing language such as C, OCaml, or assembly. It only needs to be good enough to compile the second compiler, which is written in the new language itself. From then on, the language can compile itself and the seed can be retired.</p>

<h2>The three bootstrap stages</h2>
<p>A typical self-hosting build runs in three stages, and the last two are the proof that bootstrapping succeeded:</p>
<ul>
<li><strong>Stage 0 (seed):</strong> An existing compiler, often a previous release of the same compiler downloaded as a binary, or a one-time compiler written in another language.</li>
<li><strong>Stage 1:</strong> Use stage 0 to compile the current compiler source (written in the new language). The result is a working compiler, but it was produced by the older stage-0 compiler, so it may not yet contain the newest optimizations.</li>
<li><strong>Stage 2:</strong> Use the stage-1 compiler to compile the same source again. Now the compiler has compiled itself. Building a <strong>stage 3</strong> and checking that it is byte-for-byte identical to stage 2 is a common correctness test: if a compiler compiled by itself produces the same compiler again, the toolchain is internally consistent.</li>
</ul>

<h2>Bootstrap chain diagram</h2>
<figure class="bootstrap-diagram-wrap" aria-label="Bootstrap chains for Rust and Go">
<svg viewBox="0 0 540 185" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:540px;display:block;margin:0 auto 0.5rem;font-family:inherit">
  <style>
    .bd-lbl{font-size:11px;fill:#9a9a9a;font-weight:600;letter-spacing:.04em}
    .bd-node{font-size:12px;fill:#fafafa;text-anchor:middle;dominant-baseline:middle}
    .bd-node-self{font-size:12px;fill:#4ade80;text-anchor:middle;dominant-baseline:middle;font-weight:600}
    .bd-etype{font-size:10px;fill:#8b5cf6;text-anchor:middle}
    .bd-year{font-size:10px;fill:#5a5a5a;text-anchor:middle}
  </style>
  <!-- Row labels -->
  <text x="4" y="54" class="bd-lbl">RUST</text>
  <text x="4" y="134" class="bd-lbl">GO</text>
  <!-- === RUST CHAIN === -->
  <!-- OCaml node -->
  <rect x="58" y="34" width="88" height="40" rx="5" fill="#161616" stroke="#5a5a5a" stroke-width="1.5"/>
  <text x="102" y="54" class="bd-node">OCaml</text>
  <!-- arrow 1 -->
  <line x1="146" y1="54" x2="192" y2="54" stroke="#8b5cf6" stroke-width="2"/>
  <polygon points="192,50 200,54 192,58" fill="#8b5cf6"/>
  <text x="169" y="47" class="bd-etype">bootstrap</text>
  <!-- rustboot node -->
  <rect x="200" y="34" width="100" height="40" rx="5" fill="#161616" stroke="#5a5a5a" stroke-width="1.5"/>
  <text x="250" y="50" class="bd-node">rustboot</text>
  <text x="250" y="64" class="bd-node" style="font-size:10px;fill:#9a9a9a">(in OCaml)</text>
  <!-- arrow 2 -->
  <line x1="300" y1="54" x2="346" y2="54" stroke="#8b5cf6" stroke-width="2"/>
  <polygon points="346,50 354,54 346,58" fill="#8b5cf6"/>
  <text x="323" y="47" class="bd-etype">bootstrap</text>
  <!-- rustc self-hosting node -->
  <rect x="354" y="34" width="100" height="40" rx="5" fill="#161616" stroke="#4ade80" stroke-width="2"/>
  <text x="404" y="54" class="bd-node-self">rustc (Rust)</text>
  <text x="404" y="84" class="bd-year">self-hosting 2011</text>
  <!-- === GO CHAIN === -->
  <!-- C node -->
  <rect x="58" y="114" width="88" height="40" rx="5" fill="#161616" stroke="#5a5a5a" stroke-width="1.5"/>
  <text x="102" y="134" class="bd-node">C compiler</text>
  <!-- arrow 1 -->
  <line x1="146" y1="134" x2="192" y2="134" stroke="#8b5cf6" stroke-width="2"/>
  <polygon points="192,130 200,134 192,138" fill="#8b5cf6"/>
  <text x="169" y="127" class="bd-etype">bootstrap</text>
  <!-- early gc node -->
  <rect x="200" y="114" width="100" height="40" rx="5" fill="#161616" stroke="#5a5a5a" stroke-width="1.5"/>
  <text x="250" y="130" class="bd-node">gc compiler</text>
  <text x="250" y="144" class="bd-node" style="font-size:10px;fill:#9a9a9a">(in C)</text>
  <!-- arrow 2 -->
  <line x1="300" y1="134" x2="346" y2="134" stroke="#8b5cf6" stroke-width="2"/>
  <polygon points="346,130 354,134 346,138" fill="#8b5cf6"/>
  <text x="323" y="127" class="bd-etype">bootstrap</text>
  <!-- go self-hosting node -->
  <rect x="354" y="114" width="100" height="40" rx="5" fill="#161616" stroke="#4ade80" stroke-width="2"/>
  <text x="404" y="134" class="bd-node-self">gc (Go 1.5)</text>
  <text x="404" y="164" class="bd-year">self-hosting 2015</text>
</svg>
<figcaption>Simplified bootstrap chains. Green border = self-hosting. Violet arrows = bootstrap_written_in edges from the dataset.</figcaption>
</figure>

<h2>Why languages bootstrap</h2>
<p>Self-hosting is a milestone of maturity. It proves the language is expressive and complete enough to build a large, performance-sensitive systems program, a compiler. It also lets the compiler team write the compiler in the language they are designing, so every improvement to the language immediately benefits the tool that builds it. Finally, it removes the long-term dependency on a foreign implementation language.</p>

<h2>Real bootstrap chains from the dataset</h2>
<p>The Language Lineage dataset records the historical implementation language for each toolchain via <code>bootstrap_written_in</code> edges. Here are two chains in detail:</p>
<h3>Rust via OCaml</h3>
<p><a href="/languages/rust">Rust</a> began as Graydon Hoare's personal project in 2006. The first compiler, rustboot, was written in <a href="/languages/ocaml">OCaml</a>. OCaml's algebraic types and pattern matching were well-suited to the experimental type-system work Rust required. Mozilla sponsored the project in 2009, and the team gradually rewrote rustboot in Rust. By 2011, rustc could compile itself: the OCaml dependency was gone. Each rustc release since then has been compiled by the previous stable release. The <a href="/tools/mrustc">mrustc</a> project (written in C++) provides an alternative seed that can compile an early rustc without trusting a prior Rust binary.</p>
<h3>Go via C at version 1.5</h3>
<p><a href="/languages/go">Go</a>'s original toolchain was written in <a href="/languages/c">C</a>. The Go team at Google designed the language starting in 2007 and open-sourced it in November 2009, with a Plan 9-style C compiler as the implementation. In 2013, Russ Cox ran an automated translation of the C compiler sources to Go, producing a Go-syntax compiler that was still structurally C. That translated compiler was refined and shipped as the default compiler in Go 1.5 (August 2015), removing the C toolchain requirement entirely. From Go 1.5 onward, the build tool only needs a previous Go binary as seed.</p>
<p>Other examples: <a href="/languages/haskell">Haskell</a>'s <a href="/tools/ghc">GHC</a> is written in Haskell with a C runtime. <a href="/tools/gcc">GCC</a> is bootstrapped from an earlier C/C++ compiler through exactly the stage 0/1/2 process. <a href="/languages/typescript">TypeScript</a>'s tsc is written in TypeScript and compiles itself.</p>
<p>See <a href="/relationships/bootstrap-written-in">every bootstrap relationship in the dataset</a> for the full list, each with a source and confidence score.</p>

<h2>Glossary</h2>
<dl class="quick-facts">
  <div><dt>Bootstrapping</dt><dd>The process of using a minimal working compiler to compile a more capable compiler, repeating until a language can compile its own full implementation.</dd></div>
  <div><dt>Self-hosting</dt><dd>A compiler is self-hosting when the compiler's own source code can be compiled by that same compiler. Self-hosting is the end-state that bootstrapping achieves.</dd></div>
  <div><dt>Cross-compilation</dt><dd>Compiling a program on one platform (the host) so that it runs on a different platform (the target). Cross-compilation is often used to bootstrap a compiler for a new CPU architecture from an existing one.</dd></div>
  <div><dt>Trusting Trust</dt><dd>Ken Thompson's 1984 observation that a malicious compiler can be made to inject hidden code into programs it compiles, including into copies of itself, in a way that cannot be detected by reading source code. The attack propagates through any binary-distributed compiler chain.</dd></div>
</dl>

<h2>Frequently asked questions</h2>
<div class="faq-block">
<details open>
  <summary><strong>Is Rust's compiler written in Rust?</strong></summary>
  <p>Yes. rustc, the official Rust compiler, is written in Rust and has been self-hosting since 2011. The first Rust compiler was written in OCaml.</p>
</details>
<details>
  <summary><strong>Is Go's compiler written in Go?</strong></summary>
  <p>Yes, since Go 1.5 (August 2015). The original Go compiler was written in C. A mechanical translation produced a Go-syntax version, which became the self-hosted gc compiler shipped in Go 1.5.</p>
</details>
<details>
  <summary><strong>What language was the first Rust compiler written in?</strong></summary>
  <p>OCaml. The initial rustboot compiler was written in OCaml because of its expressive type system. It was replaced by a self-hosted rustc by 2011.</p>
</details>
<details>
  <summary><strong>What is the difference between self-hosting and bootstrapping?</strong></summary>
  <p>Bootstrapping is the process; self-hosting is the result. You bootstrap a compiler by progressively compiling it with earlier versions until it can compile itself. A self-hosting compiler is one that has successfully reached that state.</p>
</details>
</div>

<a class="explore-btn" href="/explore">Explore Bootstrap Chains in Graph &rarr;</a>

<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Rust's compiler written in Rust?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. rustc, the official Rust compiler, is written in Rust and has been self-hosting since 2011. The first Rust compiler was written in OCaml."
      }
    },
    {
      "@type": "Question",
      "name": "Is Go's compiler written in Go?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, since Go 1.5 in August 2015. The original Go compiler was written in C. A mechanical translation produced a Go-syntax version, which became the self-hosted gc compiler shipped in Go 1.5."
      }
    },
    {
      "@type": "Question",
      "name": "What language was the first Rust compiler written in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "OCaml. The initial rustboot compiler was written in OCaml because of its expressive type system. It was replaced by a self-hosted rustc by 2011."
      }
    },
    {
      "@type": "Question",
      "name": "What is the difference between self-hosting and bootstrapping?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bootstrapping is the process; self-hosting is the result. You bootstrap a compiler by progressively compiling it with earlier versions until it can compile itself. A self-hosting compiler is one that has successfully reached that state."
      }
    }
  ]
})}</script>`,
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
<p>Bootstrapping is the process of <em>achieving</em> self-hosting. A self-hosting language is the <em>result</em>. Not all languages are self-hosting, many interpreters are written in C and never become self-hosting.</p>

<a class="explore-btn" href="/explore">Explore in Graph &rarr;</a>`,
  },
  {
    slug: 'compiler-vs-interpreter-vs-runtime',
    title: 'Compiler vs Interpreter vs Runtime | Language Lineage',
    h1: 'Compiler vs Interpreter vs Runtime',
    description: 'Understand the difference between a compiler, interpreter, and runtime, and how these determine what language an implementation is written in.',
    content: `<div class="answer-box">A <strong>compiler</strong> translates source code to machine code ahead of time. An <strong>interpreter</strong> executes source code directly at runtime. A <strong>runtime</strong> is the environment that manages execution, memory, and I/O for a running program.</div>

<h2>Compilers</h2>
<p>A compiler takes source code and produces an executable (machine code, bytecode, or another language). Examples: GCC (C/C++), rustc (Rust), javac (Java). The compiler itself is written in some implementation language, this is what the Language Lineage "compiler_written_in" relationships track.</p>

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
    description: 'The programming language family tree: how Fortran, LISP, and C influenced and implemented the languages that followed, across 75+ years of compiler and runtime history.',
    content: `<div class="answer-box">The programming language family tree traces how languages influenced, implemented, and descended from each other over 75+ years, from <a href="/languages/fortran">Fortran</a> (1957) and <a href="/languages/lisp">Lisp</a> (1958) to <a href="/languages/rust">Rust</a> and beyond. It maps two different kinds of ancestry: <strong>influence</strong> (where a language borrowed ideas) and <strong>implementation</strong> (what a language is actually written in).</div>

<h2>Two kinds of family ties</h2>
<p>Languages are related in two distinct ways, and it helps to keep them separate:</p>
<ul>
<li><strong>Influence</strong>, a design lineage. <a href="/languages/python">Python</a> borrowed readability from <a href="/languages/abc">ABC</a> and list handling from Lisp, but no Python code came from them.</li>
<li><strong>Implementation</strong>, what a language is built in. Python's reference interpreter, CPython, is written in <a href="/languages/c">C</a>. That is a concrete dependency, not just inspiration.</li>
</ul>
<p>Most "family tree" diagrams only show influence. This atlas tracks both, which is why C sits at the center of so much of the graph: dozens of languages were <em>inspired</em> by others but are <em>implemented</em> in C.</p>

<h2>The roots (1950s)</h2>
<p>The first high-level languages established the paradigms everything else descends from. <a href="/languages/fortran">Fortran</a> (1957, John Backus at IBM) pioneered imperative scientific computing and proved a compiler could match hand-written assembly. <a href="/languages/lisp">Lisp</a> (1958, John McCarthy) introduced functional programming, garbage collection, the REPL, and the radical idea of treating code as data. <a href="/languages/cobol">COBOL</a> (1959, Grace Hopper and CODASYL) brought English-like syntax to business computing, and still runs much of the world's banking.</p>

<h2>The ALGOL line and the birth of C (1960s–70s)</h2>
<p><a href="/languages/algol">ALGOL</a> introduced block structure and lexical scoping, the grammar of nearly every modern language. That line ran through <a href="/languages/bcpl">BCPL</a> to <a href="/languages/b">B</a> and then to <a href="/languages/c">C</a> (1972, Dennis Ritchie at Bell Labs). C became the implementation language of choice for operating systems and runtimes, it is what Unix, and later Linux, are written in. Its descendant <a href="/languages/cxx">C++</a> added object orientation and templates, and C became the runtime language for Python, Ruby, PHP, Lua, and many more.</p>

<h2>The functional and object-oriented branches (1970s–90s)</h2>
<p>Two influential branches grew in parallel. On the functional side, <a href="/languages/ml">ML</a> introduced powerful static type inference, leading to <a href="/languages/haskell">Haskell</a>, <a href="/languages/ocaml">OCaml</a>, and later <a href="/languages/fsharp">F#</a>, and OCaml is where the first <a href="/languages/rust">Rust</a> compiler was written. On the object-oriented side, <a href="/languages/smalltalk">Smalltalk</a> defined pure OOP and the modern IDE, shaping Python, Ruby, and Objective-C. <a href="/languages/java">Java</a> (1995) then took managed runtimes and garbage collection mainstream with the JVM, and <a href="/languages/javascript">JavaScript</a> (1995) brought dynamic scripting to the web.</p>

<h2>The modern era (2000s–2020s)</h2>
<p>Today's languages synthesize all of these threads. <a href="/languages/go">Go</a> (2009) revived the simplicity of C with built-in concurrency. <a href="/languages/rust">Rust</a> (2010) combined ML-style types with systems-level control and memory safety without a garbage collector. <a href="/languages/swift">Swift</a> and <a href="/languages/kotlin">Kotlin</a> modernized mobile development, and <a href="/languages/typescript">TypeScript</a> added a type system on top of JavaScript. Each one is a remix of decisions made decades earlier.</p>

<h2>Follow the threads yourself</h2>
<p>Pick any language and trace it both ways: what it borrowed, and what it is built from. See the <a href="/relationships/influenced">full influence map</a>, the <a href="/relationships/compiler-written-in">compiler implementation relationships</a>, or read <a href="/guides/what-is-compiler-bootstrapping">how a language comes to compile itself</a>.</p>

<a class="explore-btn" href="/explore">Explore the Family Tree in Graph &rarr;</a>`,
  },
  {
    slug: 'how-javascript-engines-work',
    title: 'How JavaScript Engines Work | Language Lineage',
    h1: 'How JavaScript Engines Work',
    description: 'JavaScript engines like V8, SpiderMonkey, and JavaScriptCore are written in C++. Learn how they parse, compile, and execute JavaScript code.',
    content: `<div class="answer-box">A JavaScript engine parses JavaScript source, compiles it to bytecode and then to machine code, and executes it. The three major engines, <strong>V8</strong>, <strong>SpiderMonkey</strong>, and <strong>JavaScriptCore</strong>, are written mainly in <strong>C++</strong> (SpiderMonkey also uses Rust). JavaScript the <em>language</em> is defined by the ECMAScript standard; the engines are the implementations.</div>

<h2>The language vs the engine</h2>
<p>"What is JavaScript written in?" is really two questions. <a href="/languages/javascript">JavaScript</a> itself is a specification, ECMAScript, standardized by TC39, so the language is not "written in" anything. What is written in a concrete language is the <em>engine</em> that runs JavaScript, and the performance-critical parts of every major engine are written in C++.</p>

<h2>The execution pipeline</h2>
<p>Modern engines do not simply interpret source line by line. They run a multi-stage pipeline:</p>
<ul>
<li><strong>Parser:</strong> turns source text into an abstract syntax tree (AST).</li>
<li><strong>Bytecode compiler + interpreter:</strong> lowers the AST to bytecode and starts executing it immediately, so code runs without waiting for full optimization. In V8 this interpreter is called Ignition.</li>
<li><strong>Optimizing JIT:</strong> the engine watches which functions run often ("hot" code) and recompiles them to optimized machine code, speculating on the types it has observed. V8 uses TurboFan and Maglev; if a type assumption turns out wrong, the engine "deoptimizes" back to bytecode.</li>
<li><strong>Garbage collector:</strong> reclaims unused memory in the background.</li>
</ul>
<p>All of this needs precise control over memory layout and machine code, which is why these engines are written in C++ rather than in a managed language.</p>

<h2>V8 (Chrome, Node.js, Deno)</h2>
<p>V8 is Google's open-source JavaScript and WebAssembly engine, written in C++. It powers Chrome, <a href="/languages/javascript">Node.js</a>, Electron, and Deno. Note that the runtimes built on top differ in language: Node.js wraps V8 in C++ and JavaScript, while Deno wraps the same V8 engine in <a href="/languages/rust">Rust</a>.</p>

<h2>SpiderMonkey (Firefox)</h2>
<p>SpiderMonkey is Mozilla's engine and the first JavaScript engine ever built, written by Brendan Eich in 1995 alongside the language itself. It is written in C++ with a growing amount of Rust, and powers Firefox.</p>

<h2>JavaScriptCore (Safari, Bun)</h2>
<p>JavaScriptCore (also called Nitro) is Apple's engine, written in C++, with a four-tier JIT. It powers Safari and every browser on iOS, and it is also the engine inside Bun, a runtime whose own code is written in <a href="/languages/zig">Zig</a>.</p>

<a class="explore-btn" href="/explore">Explore JavaScript Relationships in Graph &rarr;</a>`,
  },
  {
    slug: 'how-python-is-implemented',
    title: 'How Python is Implemented | Language Lineage',
    h1: 'How Python is Implemented',
    description: 'CPython is the reference Python implementation, written in C. PyPy uses RPython. Learn how Python interpreters work and what language each is written in.',
    content: `<div class="answer-box"><strong>CPython</strong>, the reference Python implementation, is written in <strong>C</strong>. It compiles Python source to bytecode and runs that bytecode on a virtual machine implemented in C. Python the <em>language</em> is a specification, so other implementations exist: PyPy (in RPython), Jython (in Java), IronPython (in C#), and MicroPython (in C).</div>

<h2>The language vs the implementation</h2>
<p>The Python language is defined by a specification and a reference implementation, not by a single source language. When people ask what Python is "written in," they almost always mean CPython, because it is the interpreter nearly everyone runs. CPython's bytecode interpreter, object model, memory manager, and C API are written in <a href="/languages/c">C</a>. The C standard library underneath gives Python its low-level system access, threading, and file I/O.</p>

<h2>How CPython runs your code</h2>
<p>CPython does not execute Python text directly. It first compiles each module to bytecode (cached as <code>.pyc</code> files) and then runs that bytecode in a loop written in C, the CPython virtual machine. A detail that comes from this design is the Global Interpreter Lock (GIL), a mechanism in the C interpreter that lets only one thread execute Python bytecode at a time; recent CPython releases have begun offering an experimental "free-threaded" build that removes it. The reference source lives at <a href="https://github.com/python/cpython" rel="noopener noreferrer" target="_blank">github.com/python/cpython</a>.</p>

<h2>Alternative Python implementations</h2>
<table class="impl-table">
  <thead><tr><th>Implementation</th><th>Written in</th><th>Why use it</th></tr></thead>
  <tbody>
    <tr><td>CPython</td><td>C</td><td>The reference interpreter and default runtime</td></tr>
    <tr><td>PyPy</td><td>RPython</td><td>JIT compilation, often several times faster on long-running code</td></tr>
    <tr><td>Jython</td><td>Java</td><td>Runs Python on the JVM with Java interop</td></tr>
    <tr><td>IronPython</td><td>C#</td><td>Runs Python on the .NET runtime</td></tr>
    <tr><td>MicroPython</td><td>C</td><td>A tiny Python for microcontrollers</td></tr>
  </tbody>
</table>

<h2>Is Python self-hosting?</h2>
<p>No. The standard interpreter, CPython, is written in C, not Python, so Python is not self-hosting the way <a href="/languages/rust">Rust</a> or <a href="/languages/go">Go</a> are. PyPy comes closest: it is written in RPython, a restricted subset of Python designed to be analyzable and compilable to C.</p>

<h2>History and influences</h2>
<p>Python was created by Guido van Rossum, who began it at CWI in the Netherlands in 1989 and released it in 1991. Its readability and design come directly from the <a href="/languages/abc">ABC</a> language, where van Rossum had previously worked, with further influence from <a href="/languages/modula3">Modula-3</a>, C, and Lisp. Python in turn influenced <a href="/languages/ruby">Ruby</a>, CoffeeScript, Swift, and many others. See the <a href="/languages/python">Python page</a> for the full, sourced relationship map.</p>

<a class="explore-btn" href="/languages/python">View Python in Graph &rarr;</a>`,
  },
  {
    slug: 'how-rust-is-bootstrapped',
    title: 'How Rust is Bootstrapped | Language Lineage',
    h1: 'How Rust is Bootstrapped',
    description: 'Rust is a self-hosting language. The Rust compiler (rustc) is written in Rust itself. Learn how the Rust bootstrap process works.',
    content: `<div class="answer-box">The Rust compiler (<strong>rustc</strong>) is written in Rust. To bootstrap Rust from scratch, you need a prior version of rustc, the compiler bootstraps itself through a stage-based process.</div>

<h2>The Rust Bootstrap Process</h2>
<p>Rust uses a multi-stage bootstrap:</p>
<ul>
<li><strong>Stage 0:</strong> Download a pre-compiled rustc binary (the "beta" channel release)</li>
<li><strong>Stage 1:</strong> Use Stage 0 to compile the current rustc source code</li>
<li><strong>Stage 2:</strong> Use Stage 1 to compile rustc again, this is the final compiler</li>
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
    description: 'Learn how programming languages are designed and implemented. Languages are built using other languages, compilers and interpreters are programs written in existing languages.',
    content: `<div class="answer-box">Programming languages are implemented using other languages. A compiler or interpreter is a program, and every program is written in some language. The first compilers were written in assembly; today most are self-hosting or written in C, C++, or Rust.</div>

<h2>What is a Programming Language Implementation?</h2>
<p>A programming language is defined by its specification (grammar, semantics). Its <em>implementation</em> is a compiler or interpreter that executes code written in that language. CPython implements Python; rustc implements Rust; V8 implements JavaScript.</p>

<h2>What Compilers and Interpreters Do</h2>
<p>A <strong>compiler</strong> translates source code to machine code or bytecode ahead of time. A <strong>interpreter</strong> reads and executes source code directly. Most languages use one or both: Java compiles to bytecode, then the JVM interprets or JIT-compiles that bytecode.</p>

<h2>The Bootstrap Problem</h2>
<p>To write a compiler for a new language, you need an existing language to write it in. Early compilers were written in assembly or C. Once a compiler is stable, it can be rewritten in the language itself, this is called bootstrapping. Languages like Rust, Go, Haskell, and OCaml are self-hosting: their compilers are written in themselves.</p>

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
  {
    slug: 'typescript-vs-javascript-implementation',
    title: 'TypeScript vs JavaScript Compilers: tsc, swc, esbuild | Language Lineage',
    h1: 'TypeScript vs JavaScript Compilers: tsc, swc, and esbuild',
    description: 'TypeScript adds types to JavaScript. The official compiler tsc is self-hosting TypeScript; swc is written in Rust; esbuild is written in Go. All three transpile to JavaScript.',
    content: `<div class="answer-box">TypeScript is a superset of JavaScript with static types. The <strong>official compiler, tsc</strong>, is written in TypeScript (self-hosting). Alternatives such as <strong>swc</strong> (Rust) and <strong>esbuild</strong> (Go) transpile TypeScript at much higher speed but skip type checking. All three output plain JavaScript, which then runs in a JavaScript engine written in C++.</div>

<h2>What TypeScript adds to JavaScript</h2>
<p>TypeScript is not a new runtime. It is JavaScript with an optional static type system layered on top. TypeScript source code is not executed directly; it is compiled, or more precisely transpiled, to plain JavaScript, which then runs in V8, SpiderMonkey, JavaScriptCore, or any other JavaScript engine. The TypeScript compiler removes type annotations and outputs JavaScript that behaves identically at runtime.</p>
<p>This means TypeScript has two implementation layers: the transpiler (what turns TypeScript into JavaScript) and the JavaScript engine (what executes the resulting JavaScript). The <code>transpiled_to</code> relationship in the Language Lineage dataset records the first layer; <code>compiler_written_in</code> and <code>runtime_written_in</code> capture the second.</p>

<h2>tsc: the official TypeScript compiler</h2>
<p>tsc is the TypeScript compiler developed and maintained by Microsoft. Its most important property is that it is <strong>self-hosting</strong>: tsc is written in TypeScript. Each new version of tsc is compiled by the previous version. This mirrors the bootstrap pattern of mature self-hosting compilers like GHC (Haskell) and rustc (Rust).</p>
<p>tsc performs two jobs: type checking and transpilation. Type checking analyzes the type annotations and infers types, catching errors at compile time. Transpilation strips type annotations and transforms TypeScript-only syntax (decorators, enums, parameter properties) to plain JavaScript. Both jobs happen in a single pass, but they can be decoupled: <code>tsc --noEmit</code> only type-checks, while tools like esbuild only transpile.</p>
<p>tsc is not optimized for speed. It builds a full program graph for type checking, which is computationally expensive for large codebases. A cold tsc build on a large TypeScript project (say, 200,000 lines) can take 30 to 60 seconds. The project mode (<code>--build</code>) and incremental compilation (<code>--incremental</code>) reduce this significantly for rebuilds.</p>

<h2>swc: a TypeScript transpiler written in Rust</h2>
<p>swc (Speedy Web Compiler) is a TypeScript and JavaScript transpiler written in <a href="/languages/rust">Rust</a>. It is developed by Donny/강동윤 and sponsored by Vercel. swc is used under the hood in Next.js, Deno (for TypeScript stripping), and several other build tools.</p>
<p>swc does not perform TypeScript type checking. It treats type annotations as syntax to strip, parsing them with a handwritten Rust parser and emitting JavaScript without any type analysis. This limitation is intentional: skipping the type checker is what makes swc 20 to 70 times faster than tsc for transpilation. swc is the right choice when a separate type-checking step runs in CI (via <code>tsc --noEmit</code>) and raw build speed matters for the development loop.</p>
<p>The <code>rewritten_in</code> relationship in the dataset reflects tools that were significantly reimplemented; swc is a distinct project, so the dataset records it as a separate tool with its own <code>compiler_written_in</code> edge to Rust.</p>

<h2>esbuild: a bundler and transpiler written in Go</h2>
<p>esbuild is a JavaScript and TypeScript bundler and transpiler written in <a href="/languages/go">Go</a>. It was created by Evan Wallace (co-founder of Figma) and first released in 2020. esbuild is used by Vite as its development-server transpiler and by many other modern build tools.</p>
<p>Like swc, esbuild does not type-check TypeScript. It strips types and emits JavaScript, relying on the user to run <code>tsc --noEmit</code> separately. esbuild's speed advantage comes from Go's execution model and careful design: a single-pass parser, minimal allocations, and deliberate avoidance of complex AST transformations. An esbuild build that would take 90 seconds in webpack typically takes under a second.</p>
<p>esbuild also bundles: it resolves imports, concatenates modules, and applies tree-shaking. This makes it a bundler plus transpiler in one tool, whereas swc focuses purely on single-file transpilation.</p>

<h2>Comparison</h2>
<table class="impl-table">
  <thead><tr><th>Tool</th><th>Written in</th><th>Type-checks?</th><th>Speed</th><th>Primary use</th></tr></thead>
  <tbody>
    <tr><td>tsc</td><td>TypeScript (self-hosting)</td><td>Yes</td><td>Slow (full program analysis)</td><td>Official compiler, type checking, IDE integration</td></tr>
    <tr><td>swc</td><td>Rust</td><td>No (strip only)</td><td>20-70x faster than tsc</td><td>Fast transpilation in build pipelines (Next.js, Deno)</td></tr>
    <tr><td>esbuild</td><td>Go</td><td>No (strip only)</td><td>10-100x faster than webpack</td><td>Fast bundling and transpilation (Vite dev server)</td></tr>
  </tbody>
</table>

<h2>Type-only transpilation vs full compilation</h2>
<p>One nuance: TypeScript's type system is erased at runtime. There are no type annotations at all in the JavaScript output. This means TypeScript types have no runtime cost and cannot be inspected at runtime via reflection (unlike Java generics, which are mostly erased, but with some residual type information). Runtime type checking (narrowing, <code>instanceof</code>, discriminated unions) in TypeScript is built from ordinary JavaScript constructs, not from preserved type metadata.</p>
<p>This also means TypeScript does not generate any code for its type annotations; the JavaScript output from <code>tsc --noEmit</code> is structurally identical (ignoring whitespace) to what you would get from a fast stripper like swc or esbuild. The type checker is a compile-time analysis tool, not a runtime component.</p>

<h2>The full implementation chain</h2>
<p>TypeScript code runs through two hops before reaching the CPU. First, a transpiler (tsc, swc, or esbuild) converts TypeScript to JavaScript. Second, a JavaScript engine (V8, SpiderMonkey, or JavaScriptCore, all written in C++) executes the JavaScript. So the full chain is: TypeScript source to tsc/swc/esbuild (TypeScript/Rust/Go) to JavaScript to V8 (C++) to machine code. This chain is what "what is TypeScript written in?" is really asking about.</p>
<p>TypeScript is unusual among major languages in that it has no dedicated runtime at all. There is no "TypeScript virtual machine." The language is purely a compile-time layer, and the runtime is whatever JavaScript engine the output runs in. This is fundamentally different from Java or Python, which have dedicated runtimes (the JVM and CPython) that are written in specific languages and have specific performance characteristics.</p>
<p>See the <a href="/languages/typescript">TypeScript language page</a> and the <a href="/relationships/transpiled-to">transpiled_to relationships</a> for the full dataset view.</p>

<a class="explore-btn" href="/explore">Explore TypeScript Relationships in Graph &rarr;</a>`,
  },
  {
    slug: 'graalvm-vs-hotspot',
    title: 'GraalVM vs HotSpot: Two JVM Implementations Compared | Language Lineage',
    h1: 'GraalVM vs HotSpot: Two JVM Implementations Compared',
    description: 'HotSpot (C and C++) is the standard JVM in OpenJDK. GraalVM replaces the C2 JIT with a Java-written compiler and adds polyglot and Native Image support. Both run the same bytecode.',
    content: `<div class="answer-box"><strong>HotSpot</strong> is the standard JVM in OpenJDK, written in C and C++. <strong>GraalVM</strong> is a JDK distribution that replaces HotSpot's C2 JIT compiler with Graal, a JIT written entirely in Java, and adds polyglot support and Native Image (AOT compilation to native executables). Both run the same Java bytecode; the difference is in the implementation and the extended capabilities.</div>

<h2>HotSpot: the standard JVM</h2>
<p>HotSpot is the production JVM inside OpenJDK, which is the open-source basis for Oracle JDK, Amazon Corretto, Eclipse Temurin, Microsoft Build of OpenJDK, and others. The interpreter and JIT compilers are written in C++; the garbage collectors, class-loading mechanism, and much of the JVM infrastructure are also C++, with some C in the lower-level platform integration.</p>
<p>HotSpot uses a tiered compilation model. Cold code starts in the interpreter. Methods that are called often are promoted first to the C1 (client) compiler, which produces lightly optimized machine code quickly, then potentially to the C2 (server) compiler, which applies aggressive optimizations including inlining, loop unrolling, and speculative devirtualization. C2 is a large, complex piece of C++ that took Oracle engineers years to develop.</p>
<p>HotSpot's garbage collectors include: Serial GC (single-threaded, small heaps), Parallel GC (throughput-focused), G1 GC (the default since Java 9, balancing throughput and latency), ZGC (sub-millisecond pauses, generational since Java 21), and Shenandoah (concurrent compaction, contributed by Red Hat). All are written in C++.</p>

<h2>GraalVM: a JVM with a Java-written JIT</h2>
<p>GraalVM is a JDK distribution developed by Oracle Labs (and the open-source TruffleRuby / Graal community). Its defining property is that the Graal JIT compiler is written in Java. It uses the JVM Compiler Interface (JVMCI), which was added to HotSpot in Java 9 to allow plugging in a custom JIT compiler. Graal loads as a regular Java class and replaces the C2 tier.</p>
<p>Writing the JIT in Java has several advantages. Java engineers can contribute to the JIT without knowing C++. The compiler can apply sophisticated speculative optimizations using Java's own type system to represent its abstract interpretation. Graal is also the technology behind Oracle's claim that "GraalVM can run faster than HotSpot's C2" for some workloads: the better escape analysis and inlining decisions possible in Java outweigh the overhead of the JIT itself being managed code.</p>
<p>GraalVM is not a single product but a distribution: it ships HotSpot with Graal replacing C2, plus additional capabilities built on top of the Truffle framework.</p>

<h2>Native Image: AOT compilation for Java</h2>
<p>GraalVM's most distinctive feature is Native Image: a build-time tool that statically analyzes a Java application and compiles it ahead-of-time to a self-contained native executable. The executable does not include a JVM; instead, it includes a minimal runtime (Substrate VM) written in Java that handles garbage collection and threading.</p>
<p>Native Image eliminates JVM startup time: a native Spring Boot application that takes 3 to 5 seconds to start under HotSpot might start in under 100 milliseconds as a native binary. This matters for serverless functions, CLI tools, and container-based deployments where startup latency is a first-class concern.</p>
<p>The tradeoff: Native Image requires closed-world assumption (all reachable classes must be known at build time), which breaks dynamic class loading, reflection, and serialization patterns common in older Java frameworks. Modern frameworks like Micronaut, Quarkus, and (with careful configuration) Spring Boot have addressed this with build-time reflection registration.</p>

<h2>Polyglot: running other languages on Truffle</h2>
<p>GraalVM includes the Truffle language implementation framework, which lets other language runtimes run on GraalVM and benefit from the Graal JIT. Truffle-based language implementations include TruffleRuby (Ruby), Graal.js (JavaScript), GraalPy (Python), and FastR (R). When a Truffle language's code gets hot, Graal JIT-compiles it to native machine code.</p>
<p>This makes GraalVM genuinely polyglot at the runtime level, not just at the API level. A Ruby method called frequently from Java can be JIT-compiled and inlined into the calling Java code's native compilation. HotSpot has no equivalent capability.</p>

<h2>Comparison</h2>
<table class="impl-table">
  <thead><tr><th>Property</th><th>HotSpot JVM</th><th>GraalVM</th></tr></thead>
  <tbody>
    <tr><td>JIT compiler</td><td>C1 and C2 (written in C++)</td><td>C1 and Graal (C1 in C++, Graal in Java)</td></tr>
    <tr><td>Base language</td><td>C and C++</td><td>C++ (HotSpot base) + Java (Graal, Substrate VM)</td></tr>
    <tr><td>AOT compilation</td><td>No (jaotc was experimental, removed in Java 17)</td><td>Yes: Native Image via Substrate VM</td></tr>
    <tr><td>Polyglot</td><td>No</td><td>Yes: Truffle-based Ruby, Python, JavaScript, R</td></tr>
    <tr><td>Startup time</td><td>Standard JVM startup (seconds for large apps)</td><td>Milliseconds for native image builds</td></tr>
    <tr><td>Peak throughput</td><td>Excellent (C2 is highly mature)</td><td>Equal or better for some workloads</td></tr>
    <tr><td>License</td><td>GPL v2 with classpath exception (OpenJDK)</td><td>Community Edition: GPL; Enterprise: Oracle license</td></tr>
  </tbody>
</table>

<h2>Which to use</h2>
<p>Use HotSpot for established enterprise Java applications where compatibility and operational stability matter. It has the longest track record, the most production deployments, and C2 is an extremely well-tuned JIT for traditional long-running services.</p>
<p>Use GraalVM when you need Native Image (serverless, containers, CLI tools), when you want to run Ruby or Python workloads on the same JVM as Java, or when you want to experiment with Graal's JIT on workloads where C2's analysis limits performance. GraalVM Community Edition (free, GPL) is suitable for most use cases.</p>

<h2>The significance of writing a JIT in Java</h2>
<p>The Graal JIT being written in Java is more than a curiosity. It means a JVM JIT compiler can be compiled and optimized by the JVM itself: Graal is a Java program that runs on the JVM and gets JIT-compiled by... Graal. This self-application is called partial evaluation and it is the basis of the Futamura projections, a theoretical framework for deriving efficient interpreters and compilers from each other. The Truffle framework exploits partial evaluation to JIT-compile language interpreters: you write a simple interpreter in Java, Truffle + Graal partially evaluate it against the program being interpreted, and the result is machine code for that specific program.</p>
<p>This is why Truffle-based language implementations can reach competitive performance without writing a JIT compiler from scratch. TruffleRuby and GraalPy do not implement their own compilation pipelines; they implement interpreters that Graal transforms into efficient native code automatically. This represents a different approach to the "what language is the runtime written in?" question: the runtime is Java, and the JIT compiler is also Java, but the JIT-compiled output is architecture-native machine code.</p>
<p>See the <a href="/languages/java">Java language page</a> for the full implementation graph, including the Graal JIT relationship.</p>

<a class="explore-btn" href="/explore">Explore Java Relationships in Graph &rarr;</a>`,
  },
];

function buildGuidePage(guide: (typeof GUIDES)[0]): string {
  const url = `${SITE}/guides/${guide.slug}`;
  const articleJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.h1,
    description: guide.description,
    url,
    datePublished: '2024-01-01',
    dateModified: BUILD_DATE,
    author: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    publisher: { '@type': 'Organization', name: 'Language Lineage', url: SITE },
    about: ['programming languages', 'compiler implementation', 'runtime implementation'],
    inLanguage: 'en',
  });
  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE}/guides` },
      { '@type': 'ListItem', position: 3, name: guide.h1, item: url },
    ],
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title)}</title>
  <meta name="description" content="${escapeHtml(guide.description)}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(guide.title)}" />
  <meta property="og:description" content="${escapeHtml(guide.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ogImg(`guides-${guide.slug}.png`)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="article:published_time" content="2024-01-01" />
  <meta property="article:modified_time" content="${BUILD_DATE}" />
  <script type="application/ld+json">${articleJsonLd}</script>
  <script type="application/ld+json">${breadcrumbJsonLd}</script>
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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
  %%TOC%%

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

  // Group by decade
  const byDecade = new Map<string, typeof langNodes>();
  for (const l of [...langNodes].sort((a, b) => (a.first_release_year ?? 9999) - (b.first_release_year ?? 9999) || a.name.localeCompare(b.name))) {
    const decade = l.first_release_year ? `${Math.floor(l.first_release_year / 10) * 10}s` : 'Unknown';
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push(l);
  }
  const decadeSections = [...byDecade.entries()].map(([decade, members]) => {
    const cards = members.map(l => {
      const slug = idToSlug(l.id);
      return `<a href="/languages/${slug}" class="related-card">${escapeHtml(l.name)}</a>`;
    }).join('\n');
    return `<h2>${escapeHtml(decade)}</h2>\n  <div class="related-grid">${cards}</div>`;
  }).join('\n\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Programming Languages Index | Language Lineage</title>
  <meta name="description" content="Browse all ${langNodes.length} programming languages in the Language Lineage dataset. Find what each language is written in, its compiler, runtime, and lineage." />
  <link rel="canonical" href="${SITE}/languages" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Languages Index | Language Lineage" />
  <meta property="og:url" content="${SITE}/languages" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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

  ${decadeSections}

  <a class="explore-btn" href="/explore">Explore All in Graph &rarr;</a>
</main>
${FOOTER_HTML}
</body>
</html>`;
}

function buildToolsIndex(langs: Language[]): string {
  const toolNodes = langs.filter(l => l.id.startsWith('tool:')).sort((a, b) => a.name.localeCompare(b.name));

  // Group by decade of first_release_year
  const byDecade = new Map<string, typeof toolNodes>();
  for (const l of [...toolNodes].sort((a, b) => (a.first_release_year ?? 9999) - (b.first_release_year ?? 9999) || a.name.localeCompare(b.name))) {
    const decade = l.first_release_year ? `${Math.floor(l.first_release_year / 10) * 10}s` : 'Unknown';
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push(l);
  }
  const decadeSections = [...byDecade.entries()].map(([decade, members]) => {
    const cards = members.map(l => {
      const slug = idToSlug(l.id);
      const intro = l.notes ? `<span class="tool-index-note">${escapeHtml(l.notes.split('.')[0])}.</span>` : '';
      return `<a href="/tools/${slug}" class="tool-index-card">
  <span class="tool-index-name">${escapeHtml(l.name)}</span>
  ${intro}
</a>`;
    }).join('\n');
    return `<h2>${escapeHtml(decade)}</h2>\n  <div class="tool-index-grid">${cards}</div>`;
  }).join('\n\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Compilers, Runtimes, and Tools | Language Lineage</title>
  <meta name="description" content="Browse ${toolNodes.length} compilers, runtimes, and language tools: GCC, LLVM, V8, SpiderMonkey, GHC, HotSpot JVM, and more. Find what each is written in." />
  <link rel="canonical" href="${SITE}/tools" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Compilers, Runtimes, and Tools | Language Lineage" />
  <meta property="og:url" content="${SITE}/tools" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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
  <div class="answer-box">This section covers the ${toolNodes.length} major compiler and runtime tools in the Language Lineage dataset, including GCC, LLVM, V8, SpiderMonkey, GHC, and HotSpot JVM. Each entry documents what the tool is written in, its relationships to languages, and its implementation history.</div>
  ${decadeSections}
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Guides | Language Lineage" />
  <meta property="og:url" content="${SITE}/guides" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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
    return `<a href="/relationships/${slug}" class="rel-card" style="--rc:${def.color}">
  <div class="rel-card-body">
    <div class="rel-card-title"><span class="rel-dot" style="background:${def.color}"></span>${escapeHtml(def.label)}</div>
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Relationship Types | Language Lineage" />
  <meta property="og:url" content="${SITE}/relationships" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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
  <p>Not sure which relationship type to look for? See <a href="/compiler-runtime-bootstrap">Compiler, runtime, and bootstrap explained</a> for a plain-language breakdown of the three most-confused terms.</p>
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

// Phase 3: compute auto-question-page nodes
const IMPL_REL_TYPES_Q = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);
const HAND_AUTHORED_Q = new Set([
  'python','javascript','rust','go','java','c','cxx','typescript','ruby',
]);
const incomingImplMap = new Map<string, Relationship[]>();
for (const rel of rels) {
  if (!IMPL_REL_TYPES_Q.has(rel.relationship)) continue;
  if (!rel.to_language.startsWith('lang:')) continue;
  if (!incomingImplMap.has(rel.to_language)) incomingImplMap.set(rel.to_language, []);
  incomingImplMap.get(rel.to_language)!.push(rel);
}
const AUTO_QUESTION_NODES: AutoQNode[] = [];
for (const node of languages) {
  if (!node.id.startsWith('lang:')) continue;
  const slug = idToSlug(node.id);
  if (HAND_AUTHORED_Q.has(slug)) continue;
  const implEdges = incomingImplMap.get(node.id) ?? [];
  if (implEdges.length === 0) continue;
  if (!ENRICHMENT[node.id]) continue;
  AUTO_QUESTION_NODES.push({ node, implEdges });
}
// Add auto slugs to QUESTION_PAGE_LANGS so language pages get cross-reference links
for (const { node } of AUTO_QUESTION_NODES) {
  QUESTION_PAGE_LANGS.add(idToSlug(node.id));
}

let count = 0;

// Language and tool pages
for (const node of languages) {
  const prefix = idToPrefix(node.id);
  const slug = idToSlug(node.id);
  const html = processPage(buildNodePage(node, rels, nodeMap));
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
    const logoUrl = lang.logo_url ?? (LOGO_MAP as Record<string, string | null>)[lang.id] ?? null;
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="Programming Language Timeline | Language Lineage" />
  <meta property="og:url" content="${SITE}/timeline" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
</head>
<body class="seo-page">
<nav class="seo-nav">
  <a href="/" class="nav-brand">${BRAND_MARK}Language Lineage</a>
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
<!-- Modal, springs from "+" click position -->
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

// "+" button, modal springs from click origin
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

// Graph mode toggle, viewport-fitting decade-column logo circles
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

    // Vertical bezier path, vertical tangents give smooth S-curve flow
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

// Build the C-bootstrap-chain guide from dataset edges (Phase 5 chain pillar)
(function buildChainGuide() {
  const IMPL_TYPES = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in', 'rewritten_in']);
  const STOP_IDS = new Set(['lang:c', 'lang:cxx']);
  const REL_LABELS: Record<string, string> = {
    compiler_written_in: 'compiler written in',
    runtime_written_in: 'runtime written in',
    bootstrap_written_in: 'bootstrapped from',
    rewritten_in: 'rewritten in',
  };
  const relPriority = (r: string) => r === 'bootstrap_written_in' ? 0 : r === 'compiler_written_in' ? 1 : r === 'rewritten_in' ? 2 : 3;

  function traceChain(targetId: string, maxDepth = 7): Array<{from: string; to: string; rel: string}> {
    const chain: Array<{from: string; to: string; rel: string}> = [];
    let current = targetId;
    const visited = new Set<string>([current]);
    while (chain.length < maxDepth) {
      const candidates = rels.filter(e => e.to_language === current && IMPL_TYPES.has(e.relationship) && !visited.has(e.from_language));
      if (candidates.length === 0) break;
      candidates.sort((a, b) => relPriority(a.relationship) - relPriority(b.relationship));
      const best = candidates[0];
      chain.push({ from: best.from_language, to: current, rel: best.relationship });
      if (STOP_IDS.has(best.from_language)) break;
      if (best.from_language === current) break; // self-hosting loop
      visited.add(best.from_language);
      current = best.from_language;
    }
    return chain.reverse();
  }

  function nodeName(id: string): string { return nodeMap.get(id)?.name ?? id.replace(/^(lang|tool):/, ''); }
  function nodeHref(id: string): string { const p = id.startsWith('tool:') ? 'tools' : 'languages'; return `/${p}/${idToSlug(id)}`; }
  function nodeLink(id: string): string { return `<a href="${nodeHref(id)}">${nodeName(id)}</a>`; }

  function renderChain(targetId: string, label: string): string {
    const chain = traceChain(targetId);
    if (chain.length === 0) return '';
    const steps = chain.map(link => {
      const relLabel = REL_LABELS[link.rel] ?? link.rel;
      return `<li>${nodeLink(link.from)} <span class="chain-rel">${relLabel}</span> ${nodeLink(link.to)}</li>`;
    });
    return `<div class="chain-block">
<h3>${label}</h3>
<ol class="impl-chain">${steps.join('')}</ol>
</div>`;
  }

  // Target languages and their display labels
  const chainTargets: Array<[string, string]> = [
    ['lang:python', 'Python (CPython runtime)'],
    ['lang:rust', 'Rust (rustc bootstrap origin)'],
    ['lang:go', 'Go (gc compiler bootstrap origin)'],
    ['lang:javascript', 'JavaScript (V8 engine)'],
    ['lang:java', 'Java (HotSpot JVM)'],
    ['lang:haskell', 'Haskell (GHC runtime)'],
    ['lang:ruby', 'Ruby (CRuby runtime)'],
    ['lang:typescript', 'TypeScript (tsc transpiler chain)'],
  ];

  const chainBlocks = chainTargets.map(([id, label]) => renderChain(id, label)).filter(Boolean).join('\n');
  const chainCount = chainTargets.filter(([id]) => traceChain(id).length > 0).length;

  const content = `<div class="answer-box">C is the implementation language of last resort for most modern programming ecosystems. Python's runtime, Ruby's runtime, and the Go and Rust bootstrap origins all trace back to C or C++ within one or two hops. The chains below are computed directly from the Language Lineage dataset's implementation edges.</div>

<h2>Why C is at the center</h2>
<p>When a new programming language is designed, its first compiler or runtime almost always gets written in C or C++. The reasons are practical: C runs everywhere, has no runtime dependency, can be compiled by GCC or Clang on any system, and gives the implementer direct control over memory layout and calling conventions. Every major operating system exposes its API in C. Every CPU architecture has a C compiler.</p>
<p>This creates a pattern: the first implementation of Language X is written in C. Once X matures, the community rewrites the implementation in X itself (self-hosting), or in a higher-level systems language like C++ or Rust. But the historical chain from X back to C remains encoded in the dataset as bootstrap or implementation edges.</p>
<p>The Language Lineage dataset records <code>compiler_written_in</code>, <code>runtime_written_in</code>, <code>bootstrap_written_in</code>, and <code>rewritten_in</code> edges for 152 languages and tools. The chains below are computed at generation time by following those edges backward until reaching C or C++.</p>

<h2>Implementation chains from the dataset</h2>
<p>${chainCount} out of ${chainTargets.length} target languages have traceable chains to C or C++ in the current dataset. Chains read from root (C or C++) to target language.</p>
${chainBlocks}

<h2>The self-hosting escape hatch</h2>
<p>Several languages in the chains above are now self-hosting: the modern compiler or runtime is written in the language itself. Rust's rustc is written in Rust. Go's gc compiler is written in Go. The TypeScript compiler tsc is written in TypeScript. But each of those languages began with a compiler or runtime written in C, C++, or OCaml. The "chain to C" is a historical record, not a current dependency for most of these languages.</p>
<p>There are exceptions. CPython, the reference Python runtime, is still written in C. CRuby, the reference Ruby implementation, is still written in C. These are ongoing dependencies, not just historical ones. C is not just the bootstrap ancestor; it is the active implementation language for some of the world's most widely used runtimes.</p>

<h2>Why OCaml appears in the Rust chain</h2>
<p>Rust's first compiler, rustboot, was written in OCaml, not C. This is unusual. OCaml's powerful type system was well-suited to the experimental type theory work Rust required in its early years. The chain for Rust therefore goes through OCaml on its way back to C, because OCaml's own runtime is written in C. This shows that "back to C" does not always mean a direct hop; intermediate systems languages appear in some chains.</p>

<h2>Limitations of the chains</h2>
<p>The chains above follow a single path through the implementation graph: at each step, they pick the highest-priority edge type (bootstrap preferred over compiler preferred over runtime). This means some nuance is lost. Python's chain leads to C via its runtime, but Python also has PyPy (RPython/Python), Jython (Java), and GraalPy (Java), each with different implementation chains. The chain here is for the dominant, reference implementation only.</p>
<p>Similarly, the Go chain leads to C via the historical bootstrap origin (the original gc compiler was in C). The modern Go compiler has been self-hosted since Go 1.5. If you followed the current dependency rather than the bootstrap origin, Go would be a one-step self-referential chain. The dataset distinguishes bootstrap origins from current implementation with the <code>bootstrap_written_in</code> edge type.</p>

<h2>What the chains reveal about software architecture</h2>
<p>Looking at these chains together reveals a structural pattern in software: performance-critical runtimes descend from C, while developer-facing tooling tends to be written in the language it serves. CPython and CRuby are written in C because their performance profile demands direct memory control. But the Python standard library is mostly Python, the Ruby standard library is mostly Ruby, and the Rust standard library is Rust. The C layer is a substrate, not the full story.</p>
<p>Another pattern: the higher a language sits in the abstraction hierarchy, the more likely its first implementation is written in a lower-level language, and the more likely it later becomes self-hosting. Rust, Go, Haskell, TypeScript, and Java's javac are all self-hosting today. CPython and CRuby are notable exceptions: they remain C programs by choice, trading the simplicity and performance of C for the ecosystem benefits of being close to the OS and hardware.</p>
<p>The chains also show how knowledge transfers through the ecosystem. OCaml appeared as the original language for the Rust compiler because Graydon Hoare knew OCaml and its type theory was well-matched to Rust's ambitions. Go used C because Rob Pike, Ken Thompson, and the rest of the team were Unix and Plan 9 veterans who designed the language in the C tradition. The choice of bootstrap language leaves a historical record in the dataset that reflects the intellectual genealogy of the project as much as its technical requirements.</p>

<h2>Reading the dataset yourself</h2>
<p>Every edge shown above is in the public dataset at <a href="/dataset">Language Lineage dataset</a>. The relationship pages show all edges of each type: <a href="/relationships/runtime-written-in">runtime_written_in</a>, <a href="/relationships/compiler-written-in">compiler_written_in</a>, <a href="/relationships/bootstrap-written-in">bootstrap_written_in</a>. The <a href="/guides/what-is-compiler-bootstrapping">compiler bootstrapping guide</a> explains the bootstrap pattern in detail. Each language page in the dataset also shows the relationship map at the top, including all implementation edges.</p>

<a class="explore-btn" href="/explore">Explore Implementation Chains in Graph &rarr;</a>`;

  GUIDES.push({
    slug: 'the-c-bootstrap-chain',
    title: 'How Modern Languages Trace Their Toolchains Back to C | Language Lineage',
    h1: 'How Modern Languages Trace Their Toolchains Back to C',
    description: `How Python, Rust, Go, JavaScript, Java, Ruby, and Haskell trace their compiler or runtime implementation back to C or C++. ${chainCount} chains computed from the Language Lineage dataset.`,
    content,
  });
})();

// Guide pages
for (const guide of GUIDES) {
  writeFile(join(PUBLIC, 'guides', guide.slug, 'index.html'), processPage(buildGuidePage(guide)));
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
writeFile(join(PUBLIC, 'questions', 'index.html'), buildQuestionsIndex(AUTO_QUESTION_NODES));
for (const q of QUESTIONS) {
  writeFile(join(PUBLIC, 'questions', q.slug, 'index.html'), processPage(buildQuestionPage(q, nodeMap)));
}
for (const aqn of AUTO_QUESTION_NODES) {
  const slug = idToSlug(aqn.node.id);
  writeFile(join(PUBLIC, 'questions', `what-is-${slug}-written-in`, 'index.html'), processPage(buildAutoQuestionPage(aqn, nodeMap)));
}
console.log(`Generated questions index + ${QUESTIONS.length} hand-authored + ${AUTO_QUESTION_NODES.length} auto question pages`);

console.log('SEO page generation complete.');
