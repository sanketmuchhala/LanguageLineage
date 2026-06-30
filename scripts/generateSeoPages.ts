import { readFileSync, mkdirSync, writeFileSync } from 'fs';
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
  const sentenceEnd = Math.max(clipped.lastIndexOf('.'), clipped.lastIndexOf('?'), clipped.lastIndexOf('!'));
  if (sentenceEnd >= 80) return `${clipped.slice(0, sentenceEnd + 1)}`;

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
        body: `<p>When people ask what Python is written in, they usually mean CPython, the reference implementation maintained by the Python Software Foundation. CPython includes the bytecode interpreter, object model, memory management, and C API, and those core pieces are implemented primarily in C.</p>
<p>The Python language itself is a specification. That specification does not require C. A compatible Python implementation can be written in another language as long as it follows the same language behavior.</p>`,
      },
      {
        heading: 'Python implementations compared',
        body: `<table class="impl-table">
  <thead><tr><th>Implementation</th><th>Written in</th><th>Role</th></tr></thead>
  <tbody>
    <tr><td>CPython</td><td>C and Python</td><td>Reference implementation and most common runtime</td></tr>
    <tr><td>PyPy</td><td>RPython and Python</td><td>Alternative runtime with JIT compilation</td></tr>
    <tr><td>Jython</td><td>Java</td><td>Python implementation for the JVM</td></tr>
    <tr><td>IronPython</td><td>C#</td><td>Python implementation for .NET</td></tr>
  </tbody>
</table>`,
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
        body: `<p>JavaScript source code runs inside an engine. The ECMAScript specification defines the language, but engines such as V8, SpiderMonkey, and JavaScriptCore implement parsing, bytecode generation, JIT compilation, garbage collection, and runtime behavior.</p>
<p>That is why the most useful answer is about engines: V8 powers Chrome and Node.js, SpiderMonkey powers Firefox, and JavaScriptCore powers Safari. Their performance-sensitive implementation code is primarily C++.</p>`,
      },
      {
        heading: 'Major JavaScript engines',
        body: `<table class="impl-table">
  <thead><tr><th>Engine</th><th>Written in</th><th>Used by</th></tr></thead>
  <tbody>
    <tr><td>V8</td><td>C++</td><td>Chrome, Node.js, Deno, Electron</td></tr>
    <tr><td>SpiderMonkey</td><td>C++, Rust, JavaScript</td><td>Firefox</td></tr>
    <tr><td>JavaScriptCore</td><td>C++</td><td>Safari and WebKit</td></tr>
  </tbody>
</table>`,
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
        heading: 'How Rust bootstraps itself',
        body: `<p>Rustc is written in Rust, so building a new rustc needs an existing compiler. The normal bootstrap chain uses a previous rustc snapshot to compile the current compiler source. This is the standard self-hosting pattern for mature compiled languages.</p>
<p>The historical path matters: Rust did not start self-hosted. The early compiler was written in OCaml, then the project moved to a Rust-in-Rust compiler once the language was capable enough to compile itself.</p>`,
      },
      {
        heading: 'Rust implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>rustc frontend and compiler driver</td><td>Rust</td><td>Parses, analyzes, type-checks, and drives compilation</td></tr>
    <tr><td>Historical rustboot compiler</td><td>OCaml</td><td>Original compiler before Rust became self-hosting</td></tr>
    <tr><td>LLVM backend</td><td>C++</td><td>Optimization and machine-code generation backend used by rustc</td></tr>
    <tr><td>mrustc</td><td>C++</td><td>Alternative compiler useful in bootstrap discussions</td></tr>
  </tbody>
</table>`,
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
        body: `<p>The original Go toolchain was written in C. In Go 1.5, the project completed the move to a self-hosted compiler written in Go. That transition made the compiler easier for Go contributors to maintain and aligned the toolchain with the language it compiles.</p>
<p>The Go runtime is also mostly Go, including scheduler and garbage collector code, with architecture-specific assembly where direct machine-level control is needed.</p>`,
      },
      {
        heading: 'Go implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Modern compiler</td><td>Go</td><td>Self-hosted since Go 1.5</td></tr>
    <tr><td>Historical compiler</td><td>C</td><td>Used before the Go 1.5 rewrite</td></tr>
    <tr><td>Runtime</td><td>Go and assembly</td><td>Scheduler, garbage collector, low-level architecture support</td></tr>
  </tbody>
</table>`,
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
        body: `<p>Java source code is compiled by javac into JVM bytecode. Javac itself is written in Java, so the Java compiler is self-hosting in the practical sense: new compiler versions are built using an existing Java toolchain.</p>
<p>Running Java bytecode is a different job. The HotSpot JVM includes an interpreter, JIT compiler, garbage collectors, class loading, and platform integration. Those runtime layers are implemented mainly in C and C++.</p>`,
      },
      {
        heading: 'Java implementation layers',
        body: `<table class="impl-table">
  <thead><tr><th>Layer</th><th>Written in</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td>javac</td><td>Java</td><td>Compiles Java source to JVM bytecode</td></tr>
    <tr><td>HotSpot JVM</td><td>C and C++</td><td>Runs bytecode, JIT-compiles hot code, manages memory</td></tr>
    <tr><td>Java standard library</td><td>Java</td><td>Core APIs such as java.lang and java.util</td></tr>
  </tbody>
</table>`,
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
        body: `<p>C compiles directly to machine code, with no managed runtime of its own. That makes it the implementation language for operating-system kernels, language runtimes, and the compilers themselves. Many interpreters on this site — including CPython, the reference Ruby (MRI), and PHP — have runtimes written in C.</p>
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
      { label: 'Self-hosting', value: 'Yes — C++ compilers are written in C++' },
    ],
    sections: [
      {
        heading: 'C++ compilers and the LLVM backend',
        body: `<p>C++ has no single reference compiler. The three dominant toolchains — GCC's g++, Clang, and Microsoft's MSVC — each parse C++ and emit native code. Clang is a C++ front end for LLVM, and LLVM's optimizer and code generator are also written in C++. That same LLVM backend is used by Rust, Swift, and Julia.</p>
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
    answerHtml: '<strong>TypeScript</strong> is self-hosting: the TypeScript compiler (<strong>tsc</strong>) is written in <strong>TypeScript</strong>. It does not have its own runtime — it transpiles to JavaScript, which then runs on engines such as V8.',
    faqAnswer: 'The TypeScript compiler, tsc, is written in TypeScript itself, so TypeScript is self-hosting. TypeScript has no separate runtime; it compiles (transpiles) to JavaScript, which runs on JavaScript engines like V8.',
    facts: [
      { label: 'Short answer', value: 'tsc is written in TypeScript' },
      { label: 'Created by', value: 'Anders Hejlsberg, Microsoft, 2012' },
      { label: 'Output', value: 'Transpiles to JavaScript' },
      { label: 'Runtime', value: 'None of its own — runs on JS engines' },
    ],
    sections: [
      {
        heading: 'TypeScript transpiles, it does not run',
        body: `<p>TypeScript is a typed superset of JavaScript. The compiler checks types and then strips them away, emitting plain JavaScript. There is no TypeScript virtual machine: the generated JavaScript executes on whatever engine the target uses — V8 in Node.js and Chrome, JavaScriptCore in Safari.</p>
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
        body: `<p>JavaScript is a high-level, dynamically typed language, but the engine that runs it needs direct memory control, manual layout of objects, and tight machine-code generation. C++ provides that. V8 parses JavaScript, generates bytecode for its Ignition interpreter, and hot paths are optimized to native code by the TurboFan and Maglev compilers — all implemented in C++.</p>`,
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
    out += ` Reaching self-hosting — where a language is mature enough to compile itself — is a milestone that proves the language can handle a large, real-world program.`;
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
  haskell: `<p>Haskell is a purely functional language used in academia, research, and industries that prize correctness — finance, compilers, and formal verification. Its strong type system and laziness make it a laboratory for language ideas later adopted elsewhere.</p>
<p>Notable software: the Cardano blockchain, parts of financial trading systems, and the pandoc document converter.</p>`,
  lua: `<p>Lua is a tiny, fast, embeddable scripting language designed to be dropped into larger programs — especially games and configuration. Its small footprint makes it ideal for extending C/C++ applications.</p>
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
  fortran: `<p>Fortran remains the language of high-performance numerical and scientific computing — weather prediction, computational physics, and engineering simulations — where decades of optimized math libraries still run.</p>
<p>Notable software: climate and weather models, and core linear-algebra libraries (BLAS, LAPACK) that underpin much of modern scientific computing.</p>`,
  cobol: `<p>COBOL still runs a huge share of the world's banking, insurance, and government batch systems, prized for stable, readable business data processing on mainframes.</p>
<p>Notable software: core transaction systems at banks and government agencies — an estimated majority of daily business transactions still touch COBOL.</p>`,
  lisp: `<p>Lisp pioneered ideas — the REPL, garbage collection, macros, treating code as data — that shaped every language after it. It was historically central to artificial-intelligence research and remains influential in language design.</p>
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
  prolog: `<p>Prolog is the leading logic-programming language, used for artificial intelligence, expert systems, natural-language processing, and theorem proving — you state facts and rules and let the engine search for answers.</p>
<p>Notable use: parts of IBM Watson, scheduling and constraint systems, and academic AI research (often via SWI-Prolog).</p>`,
  ada: `<p>Ada is built for safety-critical, real-time systems where failure is not an option: avionics, defense, rail signaling, and spacecraft. Its strong typing and runtime checks catch errors early.</p>
<p>Notable use: aircraft flight software (Boeing, Airbus), air-traffic control, and rail and defense systems.</p>`,
  pascal: `<p>Pascal was designed for teaching structured programming and dominated computer-science education for years; its Object Pascal descendant (Delphi) became a popular tool for Windows desktop apps.</p>
<p>Notable software: early Apple Macintosh system software, and the original Skype client (built in Delphi).</p>`,
  groovy: `<p>Groovy is a dynamic scripting language for the JVM, used heavily for build automation and writing concise glue code alongside Java.</p>
<p>Notable software: the Gradle build system and Jenkins pipeline scripts are written in Groovy.</p>`,
  matlab: `<p>MATLAB is a numerical-computing environment used across engineering and science for matrix math, signal and image processing, control systems, and simulation. Its toolboxes and Simulink make it standard in many labs and industries.</p>
<p>Notable use: control-system and signal-processing design in automotive, aerospace, and academic research.</p>`,
  delphi: `<p>Delphi (Object Pascal) is a rapid application development tool for native Windows — and now cross-platform — desktop software, known for fast compilation and visual form design.</p>
<p>Notable software: the original Skype client and many long-lived business and point-of-sale applications.</p>`,
  fsharp: `<p>F# is a functional-first language on .NET, used for data processing, finance, and analytics where its concise syntax and strong types reduce bugs.</p>
<p>Notable use: quantitative finance, data pipelines, and analytics teams on the .NET platform.</p>`,
  elm: `<p>Elm is a pure functional language for building reliable web front-ends; its compiler is famous for friendly errors and for eliminating runtime exceptions in production.</p>
<p>Notable software: front-end applications at companies like NoRedInk that value crash-free UIs.</p>`,
  crystal: `<p>Crystal offers Ruby-like syntax with static typing and native compilation, aimed at developers who want Ruby's productivity with much higher performance.</p>
<p>Notable use: web APIs and tools where teams want Ruby ergonomics without the runtime cost.</p>`,
  nim: `<p>Nim is a general-purpose language with Python-like readability that compiles to C, C++, or JavaScript, giving native speed with a small runtime — handy for systems tools, games, and embedded work.</p>
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

// The integrated page header: logo, name, tagline, a horizontal spec rail of key data
// (written in, released, developer, typing, license), and the curated succession notes —
// woven into the top of the article rather than boxed into a card.
function buildLanguageHeader(node: Language, rels: Relationship[], nodeMap: Map<string, Language>): string {
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

  // Horizontal spec rail — the page's key data, read like an instrument readout rather
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
  ${logo}
  <div class="lang-head-main">
    <p class="lang-head-eyebrow">${kind}${year}</p>
    <h1>${escapeHtml(node.name)}</h1>
    ${tagline ? `<p class="lang-head-tagline">${escapeHtml(tagline)}</p>` : ''}
  </div>
  ${website ? `<a class="lang-head-site" href="${escapeHtml(website)}" rel="nofollow noopener noreferrer" target="_blank">Official site &rsaquo;</a>` : ''}
</header>
${rail}
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
      a: `Yes, ${node.name} is self-hosting — its compiler can compile itself.`,
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
  const title = priorityOverride ? priorityOverride.title : `What is ${node.name} written in? | Language Lineage`;
  const implRels = rels.filter(r => r.to_language === node.id && ['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in'].includes(r.relationship));
  const implLangs = [...new Set(implRels.map(r => nameFromId(r.from_language, nodeMap)))];
  const enrich = ENRICHMENT[node.id];
  const descParts: string[] = [enrich?.tagline ? `${node.name} is ${aOrAn(enrich.tagline)} ${enrich.tagline}` : node.name];
  if (implLangs.length > 0) descParts.push(`implemented in ${implLangs.slice(0, 2).join(' and ')}`);
  if (node.first_release_year && node.first_release_year > 0) descParts.push(`first released in ${node.first_release_year}`);
  const descriptionBase = `${descParts.join(', ')}.`;
  const description = truncateMetaDescription(priorityOverride ? priorityOverride.description : descriptionBase, 160);
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
  <meta property="og:image" content="${SITE}/og-image.png" />
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

  ${buildLanguageHeader(node, rels, nodeMap)}

  ${buildToolIntro(node)}

  <h2 class="lang-written-q">What is ${escapeHtml(node.name)} written in?</h2>
  ${buildAnswerBox(node, rels, nodeMap)}

  ${buildUseCases(node)}
${priorityContentHtml ? `

  ${priorityContentHtml}
` : `
`}  ${buildGraphSection(node)}

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
    answer: "The Java compiler (javac) is written in Java — making it partially self-hosting. The HotSpot JVM, the primary Java runtime, is written in C and C++. The Java standard library (java.lang, java.util, etc.) is written in Java itself.",
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
  {
    slug: 'is-javascript-written-in-c',
    title: 'Is JavaScript written in C?',
    answer: "No, modern JavaScript engines like V8 and JavaScriptCore are written in C++, not C. Historically, the very first engine (SpiderMonkey) was written in C, but it has since been rewritten in C++, Rust, and JavaScript.",
    details: `<p>A common misconception is that JavaScript is written in C. While C heavily influenced JavaScript's syntax, the engines that actually execute JavaScript code are almost universally written in C++ today.</p>
<p>Google's V8 (used in Chrome and Node.js) and Apple's JavaScriptCore (used in Safari) are both implemented in C++. Mozilla's SpiderMonkey, the original JavaScript engine, was initially written in C by Brendan Eich, but has evolved into a complex codebase of C++, Rust, and JavaScript itself.</p>`,
    relatedLangs: ['javascript', 'cxx', 'c'],
    relatedTools: ['v8', 'javascriptcore', 'spidermonkey'],
  },
  {
    slug: 'is-rustc-written-in-rust',
    title: 'Is rustc written in Rust?',
    answer: "Yes, rustc (the official Rust compiler) is written entirely in Rust. It is a self-hosting compiler, meaning it compiles its own source code.",
    details: `<p>The Rust compiler, <code>rustc</code>, is a classic example of a self-hosting compiler. The source code for <code>rustc</code> is written in Rust, and it uses an older version of itself (a bootstrap compiler) to compile the newest version.</p>
<p>However, <code>rustc</code> relies on LLVM as its backend to generate optimized machine code. LLVM itself is written in C++.</p>`,
    relatedLangs: ['rust', 'cxx'],
    relatedTools: ['llvm', 'mrustc'],
  },
  {
    slug: 'is-rust-compiled',
    title: 'Is Rust a compiled language?',
    answer: "Yes, Rust is a compiled language. The Rust compiler (rustc) translates Rust source code ahead-of-time (AOT) directly into native machine code using the LLVM backend.",
    details: `<p>Unlike interpreted languages (like Python or JavaScript) or bytecode-compiled languages (like Java or C#), Rust is an ahead-of-time (AOT) compiled language.</p>
<p>When you run <code>cargo build</code> or <code>rustc</code>, the compiler parses your Rust code and passes it to the LLVM infrastructure, which generates highly optimized, native machine code for your specific target architecture (e.g., x86_64, ARM). This results in a standalone binary executable that does not require a runtime or interpreter to run.</p>`,
    relatedLangs: ['rust'],
    relatedTools: ['llvm'],
  }
];

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
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(q.title)} | Language Lineage</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" href="/favicon.svg" />
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  ${matchingLangSlug && QUESTION_PAGE_LANGS.has(matchingLangSlug) ? `<link rel="alternate" href="${SITE}/languages/${matchingLangSlug}" />` : ''}
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(q.title)} | Language Lineage" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="article:published_time" content="2024-01-01" />
  <meta property="article:modified_time" content="${BUILD_DATE}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(q.title)}" />
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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

  <h2>Four ways a language gets implemented</h2>
  <p>Across the dataset, almost every language falls into one of four implementation patterns:</p>
  <ul>
    <li><strong>Interpreted, runtime written in C:</strong> the classic dynamic-language pattern. <a href="/languages/python">Python</a> (CPython), <a href="/languages/ruby">Ruby</a> (MRI), <a href="/languages/php">PHP</a>, and <a href="/languages/lua">Lua</a> all run on interpreters written in <a href="/languages/c">C</a>.</li>
    <li><strong>Self-hosting and compiled to native code:</strong> the compiler is written in the language itself and emits machine code, often through the <a href="/tools/llvm">LLVM</a> backend. <a href="/languages/rust">Rust</a>, <a href="/languages/go">Go</a>, and <a href="/languages/haskell">Haskell</a> work this way.</li>
    <li><strong>Compiled to a virtual machine:</strong> source compiles to bytecode that runs on a VM written in C/C++. <a href="/languages/java">Java</a> and <a href="/languages/kotlin">Kotlin</a> target the JVM; <a href="/languages/csharp">C#</a> and <a href="/languages/fsharp">F#</a> target the .NET CLR.</li>
    <li><strong>Transpiled to another language:</strong> the "compiler" emits source in a second language rather than machine code. <a href="/languages/typescript">TypeScript</a> and <a href="/languages/coffeescript">CoffeeScript</a> transpile to JavaScript, then run on a JavaScript engine.</li>
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
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
    description: 'Bootstrapping is the process of writing a compiler in the same language it compiles. These relationships show the bootstrap chains — what language was used to write the initial compiler before self-hosting was achieved.',
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
  ${FONTS_HEAD}<link rel="stylesheet" href="/seo.css" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${url}" />
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
<p>The answer is to break the circular dependency once, at the beginning, using a language that already works. The first compiler — the <strong>stage 0</strong> or "seed" compiler — is written in an existing language such as C, OCaml, or assembly. It only needs to be good enough to compile the second compiler, which is written in the new language itself. From then on, the language can compile itself and the seed can be retired.</p>

<h2>The three bootstrap stages</h2>
<p>A typical self-hosting build runs in three stages, and the last two are the proof that bootstrapping succeeded:</p>
<ul>
<li><strong>Stage 0 (seed):</strong> An existing compiler, often a previous release of the same compiler downloaded as a binary, or a one-time compiler written in another language.</li>
<li><strong>Stage 1:</strong> Use stage 0 to compile the current compiler source (written in the new language). The result is a working compiler, but it was produced by the older stage-0 compiler, so it may not yet contain the newest optimizations.</li>
<li><strong>Stage 2:</strong> Use the stage-1 compiler to compile the same source again. Now the compiler has compiled itself. Building a <strong>stage 3</strong> and checking that it is byte-for-byte identical to stage 2 is a common correctness test: if a compiler compiled by itself produces the same compiler again, the toolchain is internally consistent.</li>
</ul>

<h2>Why languages bootstrap</h2>
<p>Self-hosting is a milestone of maturity. It proves the language is expressive and complete enough to build a large, performance-sensitive systems program — a compiler. It also lets the compiler team write the compiler in the language they are designing, so every improvement to the language immediately benefits the tool that builds it. Finally, it removes the long-term dependency on a foreign implementation language.</p>

<h2>Real bootstrap chains</h2>
<p>The Language Lineage dataset records the historical implementation language for each toolchain. A few well-documented chains:</p>
<ul>
<li><a href="/languages/rust">Rust</a>: the first compiler (rustboot) was written in <a href="/languages/ocaml">OCaml</a>; once the language was capable enough, rustc was rewritten in Rust and has been self-hosting since 2011. Each release is built by the previous release, and the <a href="/tools/mrustc">mrustc</a> project (written in C++) can compile an early rustc to break the dependency on prior binaries.</li>
<li><a href="/languages/go">Go</a>: the original compiler was written in <a href="/languages/c">C</a>; in Go 1.5 (2015) the toolchain was translated to Go, making it self-hosting.</li>
<li><a href="/languages/haskell">Haskell</a>: <a href="/tools/ghc">GHC</a> is written in Haskell, with a runtime system in C.</li>
<li><a href="/languages/c">C</a> and <a href="/languages/cxx">C++</a>: <a href="/tools/gcc">GCC</a> is bootstrapped from an earlier C/C++ compiler through exactly the stage 0/1/2 process described above.</li>
</ul>
<p>See <a href="/relationships/bootstrap-written-in">every bootstrap relationship in the dataset</a> for the full list, each with a source and confidence score.</p>

<h2>Trust, reproducibility, and breaking the binary chain</h2>
<p>Because each compiler is built by an earlier compiler, you are ultimately trusting a long chain of binaries you did not build yourself. Ken Thompson's classic lecture "Reflections on Trusting Trust" showed that a malicious compiler could inject code into programs — including into future copies of itself — invisibly. Modern projects respond with reproducible builds and "diverse double-compilation," and with seed compilers like <a href="/tools/mrustc">mrustc</a> that let you rebuild a toolchain from source in a different language rather than from a pre-built binary.</p>

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
    description: 'The programming language family tree: how Fortran, LISP, and C influenced and implemented the languages that followed, across 75+ years of compiler and runtime history.',
    content: `<div class="answer-box">The programming language family tree traces how languages influenced, implemented, and descended from each other over 75+ years, from <a href="/languages/fortran">Fortran</a> (1957) and <a href="/languages/lisp">Lisp</a> (1958) to <a href="/languages/rust">Rust</a> and beyond. It maps two different kinds of ancestry: <strong>influence</strong> (where a language borrowed ideas) and <strong>implementation</strong> (what a language is actually written in).</div>

<h2>Two kinds of family ties</h2>
<p>Languages are related in two distinct ways, and it helps to keep them separate:</p>
<ul>
<li><strong>Influence</strong> — a design lineage. <a href="/languages/python">Python</a> borrowed readability from <a href="/languages/abc">ABC</a> and list handling from Lisp, but no Python code came from them.</li>
<li><strong>Implementation</strong> — what a language is built in. Python's reference interpreter, CPython, is written in <a href="/languages/c">C</a>. That is a concrete dependency, not just inspiration.</li>
</ul>
<p>Most "family tree" diagrams only show influence. This atlas tracks both, which is why C sits at the center of so much of the graph: dozens of languages were <em>inspired</em> by others but are <em>implemented</em> in C.</p>

<h2>The roots (1950s)</h2>
<p>The first high-level languages established the paradigms everything else descends from. <a href="/languages/fortran">Fortran</a> (1957, John Backus at IBM) pioneered imperative scientific computing and proved a compiler could match hand-written assembly. <a href="/languages/lisp">Lisp</a> (1958, John McCarthy) introduced functional programming, garbage collection, the REPL, and the radical idea of treating code as data. <a href="/languages/cobol">COBOL</a> (1959, Grace Hopper and CODASYL) brought English-like syntax to business computing — and still runs much of the world's banking.</p>

<h2>The ALGOL line and the birth of C (1960s–70s)</h2>
<p><a href="/languages/algol">ALGOL</a> introduced block structure and lexical scoping, the grammar of nearly every modern language. That line ran through <a href="/languages/bcpl">BCPL</a> to <a href="/languages/b">B</a> and then to <a href="/languages/c">C</a> (1972, Dennis Ritchie at Bell Labs). C became the implementation language of choice for operating systems and runtimes — it is what Unix, and later Linux, are written in. Its descendant <a href="/languages/cxx">C++</a> added object orientation and templates, and C became the runtime language for Python, Ruby, PHP, Lua, and many more.</p>

<h2>The functional and object-oriented branches (1970s–90s)</h2>
<p>Two influential branches grew in parallel. On the functional side, <a href="/languages/ml">ML</a> introduced powerful static type inference, leading to <a href="/languages/haskell">Haskell</a>, <a href="/languages/ocaml">OCaml</a>, and later <a href="/languages/fsharp">F#</a> — and OCaml is where the first <a href="/languages/rust">Rust</a> compiler was written. On the object-oriented side, <a href="/languages/smalltalk">Smalltalk</a> defined pure OOP and the modern IDE, shaping Python, Ruby, and Objective-C. <a href="/languages/java">Java</a> (1995) then took managed runtimes and garbage collection mainstream with the JVM, and <a href="/languages/javascript">JavaScript</a> (1995) brought dynamic scripting to the web.</p>

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
    content: `<div class="answer-box">A JavaScript engine parses JavaScript source, compiles it to bytecode and then to machine code, and executes it. The three major engines — <strong>V8</strong>, <strong>SpiderMonkey</strong>, and <strong>JavaScriptCore</strong> — are written mainly in <strong>C++</strong> (SpiderMonkey also uses Rust). JavaScript the <em>language</em> is defined by the ECMAScript standard; the engines are the implementations.</div>

<h2>The language vs the engine</h2>
<p>"What is JavaScript written in?" is really two questions. <a href="/languages/javascript">JavaScript</a> itself is a specification — ECMAScript, standardized by TC39 — so the language is not "written in" anything. What is written in a concrete language is the <em>engine</em> that runs JavaScript, and the performance-critical parts of every major engine are written in C++.</p>

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
  <meta property="og:image" content="${SITE}/og-image.png" />
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
