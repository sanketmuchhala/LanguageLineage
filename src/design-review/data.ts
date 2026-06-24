// Design-review prototype data. Dev-only, removed in Phase 11.
// All facts below are derived from dataset/v4/lineage_v4.json (verified, not invented).

export const STATS = {
  nodes: 112,
  languages: 98,
  tools: 14,
  relationships: 347,
  relationshipTypes: 6,
  yearFrom: 1949,
  yearTo: 2023,
};

export type RelKind =
  | 'compiler_written_in'
  | 'runtime_written_in'
  | 'bootstrap_written_in'
  | 'rewritten_in'
  | 'influenced'
  | 'transpiled_to';

// Semantic relationship palette. These category colors are the candidate
// production mapping and are reused by every concept (each concept tunes only
// brightness to its own surface).
export interface RelMeta {
  type: RelKind;
  label: string;
  short: string;
  count: number;
  color: string;
  line: 'solid' | 'dashed' | 'dotted';
  description: string;
}

export const RELATIONSHIPS: RelMeta[] = [
  { type: 'compiler_written_in', label: 'Compiler implementation', short: 'compiler', count: 78, color: '#e3a008', line: 'solid', description: "The compiler that implements a language, written in another language." },
  { type: 'runtime_written_in', label: 'Runtime / VM implementation', short: 'runtime', count: 56, color: '#34d399', line: 'solid', description: "The interpreter, runtime, or virtual machine that executes a language." },
  { type: 'bootstrap_written_in', label: 'Bootstrap', short: 'bootstrap', count: 14, color: '#a78bfa', line: 'dashed', description: "The earlier language a self-hosting toolchain was first bootstrapped from." },
  { type: 'rewritten_in', label: 'Rewritten in', short: 'rewrite', count: 2, color: '#fb7185', line: 'dashed', description: "An implementation later rewritten in a different language." },
  { type: 'influenced', label: 'Influence', short: 'influence', count: 189, color: '#60a5fa', line: 'dotted', description: "Design influence: syntax, semantics, or paradigm carried forward." },
  { type: 'transpiled_to', label: 'Transpilation', short: 'transpile', count: 8, color: '#22d3ee', line: 'dashed', description: "Source compiled to another high-level language as its output target." },
];

export const relColor = (t: RelKind) => RELATIONSHIPS.find((r) => r.type === t)?.color || '#888';

// Confidence bands (already modeled in the dataset as a 0..1 score).
export const CONFIDENCE = {
  high: { label: 'well-documented', min: 0.95, color: '#34d399' },
  med: { label: 'documented', min: 0.85, color: '#e3a008' },
  low: { label: 'reported', min: 0, color: '#9aa0a6' },
};
export function confidenceBand(c: number) {
  if (c >= CONFIDENCE.high.min) return CONFIDENCE.high;
  if (c >= CONFIDENCE.med.min) return CONFIDENCE.med;
  return CONFIDENCE.low;
}

export interface ImplRecord {
  rel: RelKind;
  from: string; // implementation language / tool
  to: string; // implemented language
  detail: string;
  confidence: number;
  source: string;
}

// Verified example records used across the concept previews.
export const PYTHON = {
  id: 'lang:python',
  name: 'Python',
  year: 1991,
  typing: 'dynamic',
  runtime: 'interpreted',
  selfHosting: false,
  primaryImpl: 'C',
  paradigms: ['imperative', 'object-oriented', 'functional'],
  answer: 'CPython, the reference implementation, is written in C.',
  records: [
    { rel: 'runtime_written_in', from: 'C', to: 'Python', detail: 'CPython reference interpreter', confidence: 0.98, source: 'github.com/python/cpython' },
    { rel: 'influenced', from: 'ABC', to: 'Python', detail: 'Indentation, core syntax model', confidence: 0.95, source: 'wikipedia.org/wiki/Python' },
    { rel: 'influenced', from: 'C', to: 'Python', detail: 'Implementation language, C API', confidence: 0.9, source: 'docs.python.org' },
  ] as ImplRecord[],
  influenced: ['JavaScript', 'Ruby', 'Go', 'Swift', 'Julia', 'Groovy'],
};

export const HERO_EXAMPLES = [
  { q: 'What runs Python?', a: 'CPython, written in C', rel: 'runtime_written_in' as RelKind, conf: 0.98 },
  { q: 'How does Rust bootstrap?', a: 'rustc is self-hosting; bootstrapped from OCaml', rel: 'bootstrap_written_in' as RelKind, conf: 0.88 },
  { q: 'What compiled the first Go compiler?', a: 'C, until Go became self-hosting in 1.5', rel: 'compiler_written_in' as RelKind, conf: 0.98 },
  { q: 'What does TypeScript target?', a: 'Transpiled to JavaScript', rel: 'transpiled_to' as RelKind, conf: 0.99 },
];

// Tools must read as infrastructure, not ordinary languages.
export const TOOLS = [
  { name: 'LLVM', kind: 'Compiler infrastructure', impl: 'C++', users: 'Rust, Swift, Clang, Julia' },
  { name: 'V8', kind: 'JavaScript engine', impl: 'C++', users: 'Node.js, Chrome, Deno' },
  { name: 'GCC', kind: 'Compiler collection', impl: 'C, C++', users: 'C, C++, Fortran, Go' },
  { name: 'HotSpot', kind: 'Java virtual machine', impl: 'C++', users: 'Java, Kotlin, Scala' },
];

// A small directed subgraph (real edges) for the hero / workspace compositions.
export interface GNode { id: string; label: string; kind: 'lang' | 'tool'; x: number; y: number; }
export interface GEdge { from: string; to: string; rel: RelKind; }

export const SUBGRAPH: { nodes: GNode[]; edges: GEdge[] } = {
  nodes: [
    { id: 'c', label: 'C', kind: 'lang', x: 50, y: 50 },
    { id: 'py', label: 'Python', kind: 'lang', x: 24, y: 24 },
    { id: 'rb', label: 'Ruby', kind: 'lang', x: 22, y: 74 },
    { id: 'go', label: 'Go', kind: 'lang', x: 78, y: 28 },
    { id: 'rust', label: 'Rust', kind: 'lang', x: 80, y: 70 },
    { id: 'llvm', label: 'LLVM', kind: 'tool', x: 58, y: 88 },
    { id: 'ocaml', label: 'OCaml', kind: 'lang', x: 50, y: 12 },
  ],
  edges: [
    { from: 'c', to: 'py', rel: 'runtime_written_in' },
    { from: 'c', to: 'rb', rel: 'runtime_written_in' },
    { from: 'c', to: 'go', rel: 'compiler_written_in' },
    { from: 'ocaml', to: 'rust', rel: 'bootstrap_written_in' },
    { from: 'llvm', to: 'rust', rel: 'compiler_written_in' },
    { from: 'c', to: 'rust', rel: 'influenced' },
    { from: 'c', to: 'go', rel: 'influenced' },
  ],
};
