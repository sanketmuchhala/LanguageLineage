import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE = 'https://www.languagelineage.org';

interface Language { id: string; name: string }
interface Relationship { relationship: string }

const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const languages: Language[] = raw.languages ?? [];
const rels: Relationship[] = raw.relationships ?? [];

const langCount = languages.filter(l => l.id.startsWith('lang:')).length;
const toolCount = languages.filter(l => l.id.startsWith('tool:')).length;

const relTypeCounts: Record<string, number> = {};
rels.forEach(r => { relTypeCounts[r.relationship] = (relTypeCounts[r.relationship] || 0) + 1; });

function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}
function idToPrefix(id: string): string {
  return id.startsWith('tool:') ? 'tools' : 'languages';
}

const popularIds = ['lang:python', 'lang:javascript', 'lang:c', 'lang:rust', 'lang:go', 'lang:java', 'lang:cxx', 'lang:haskell'];
const popularLinks = popularIds
  .filter(id => languages.some(l => l.id === id))
  .map(id => {
    const lang = languages.find(l => l.id === id)!;
    return `- ${lang.name}: ${SITE}/${idToPrefix(id)}/${idToSlug(id)}`;
  })
  .join('\n');

const relTableRows = Object.entries(relTypeCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `| ${type.replace(/_/g, ' ')} | ${count} |`)
  .join('\n');

const content = `# Language Lineage

> An open dataset and interactive graph explorer documenting what programming languages are written in, how they are bootstrapped, and how they influenced each other.

## About

Language Lineage is a structured knowledge base of programming language implementation and influence relationships. It answers questions like "What is Python written in?", "How is Rust bootstrapped?", and "Which languages influenced JavaScript?".

The dataset covers ${languages.length} programming languages and tools, ${rels.length} documented relationships, and spans from 1949 (Fortran) to 2023.

## Dataset Facts

- **Total nodes:** ${languages.length} (${langCount} language nodes, ${toolCount} tool nodes)
- **Total relationships:** ${rels.length}
- **Date range:** 1949–2023
- **Evidence coverage:** 100% (all relationships have at least one evidence source)

## Relationship Types

| Type | Count |
|---|---|
${relTableRows}

## Key Pages

- Home: ${SITE}/
- Graph Explorer: ${SITE}/explore
- Dataset: ${SITE}/dataset
- Timeline: ${SITE}/timeline
- Sitemap: ${SITE}/sitemap.xml

## Main Concept Pages

- Programming Language Graph: ${SITE}/programming-language-graph
- Programming Language Family Tree: ${SITE}/programming-language-family-tree
- Programming Language Genealogy: ${SITE}/programming-language-genealogy
- Programming Language Evolution Timeline: ${SITE}/programming-language-evolution
- What Are Programming Languages Written In: ${SITE}/what-are-programming-languages-written-in
- Compiler Runtime and Bootstrap Explained: ${SITE}/compiler-runtime-bootstrap

## High-Value Question Pages

- What is Python written in: ${SITE}/questions/what-is-python-written-in
- What is JavaScript written in: ${SITE}/questions/what-is-javascript-written-in
- What is Rust written in: ${SITE}/questions/what-is-rust-written-in
- What is Go written in: ${SITE}/questions/what-is-go-written-in
- What is Java written in: ${SITE}/questions/what-is-java-written-in
- What is C written in: ${SITE}/questions/what-is-c-written-in
- What is C++ written in: ${SITE}/questions/what-is-cpp-written-in
- What is TypeScript written in: ${SITE}/questions/what-is-typescript-written-in
- What is Ruby written in: ${SITE}/questions/what-is-ruby-written-in
- What is V8 written in: ${SITE}/questions/what-is-v8-written-in
- What is CPython written in: ${SITE}/questions/what-is-cpython-written-in
- What is compiler bootstrapping: ${SITE}/questions/what-is-compiler-bootstrapping
- What is a self-hosting compiler: ${SITE}/questions/what-is-a-self-hosting-compiler
- All questions: ${SITE}/questions

### Popular Language Pages

${popularLinks}

### Relationship Guides

- What is compiler bootstrapping: ${SITE}/guides/what-is-compiler-bootstrapping
- What is self-hosting: ${SITE}/guides/what-is-self-hosting
- Compiler vs interpreter vs runtime: ${SITE}/guides/compiler-vs-interpreter-vs-runtime
- Programming language family tree: ${SITE}/guides/programming-language-family-tree
- How Python is implemented: ${SITE}/guides/how-python-is-implemented
- How Rust is bootstrapped: ${SITE}/guides/how-rust-is-bootstrapped
- How JavaScript engines work: ${SITE}/guides/how-javascript-engines-work
- GCC vs LLVM: ${SITE}/guides/gcc-vs-llvm

## Data Schema

Each language node has: id, label, cluster, first_release_year, paradigm, typing, description.
Each relationship has: from_language, to_language, relationship type, start_year, end_year, confidence (0–1), evidence_source (URL), notes.

## Citation

If you reference Language Lineage data, please cite as:
"Language Lineage dataset (languagelineage.org). Accessed [date]."

## Source

Dataset source code and raw JSON: https://github.com/sanketmuchhala/LanguageLineage
`;

writeFileSync(join(ROOT, 'public', 'llms.txt'), content, 'utf8');
console.log(`Generated llms.txt (${languages.length} nodes, ${rels.length} relationships)`);
