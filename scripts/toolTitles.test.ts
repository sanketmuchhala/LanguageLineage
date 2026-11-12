/**
 * Tool pages answer "what is X written in?" (issue #67): tools have no question pages,
 * so their title is built from the data. These tests recompute the expected answer from
 * lineage_v5.json, so a title can never name a language the data does not support, or
 * call a tool dependency (LLVM, XLA, PyTorch) something a tool is "written in".
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const names = new Map<string, string>(data.languages.map((n: { id: string; name: string }) => [n.id, n.name]));
const IMPL = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);
// Hand-written titles (PRIORITY_TITLES in generateSeoPages.ts) win over the generated one.
const generator = readFileSync(join(ROOT, 'scripts/generateSeoPages.ts'), 'utf8');
const priorityBlock = generator.slice(generator.indexOf('const PRIORITY_TITLES'), generator.indexOf('\n};', generator.indexOf('const PRIORITY_TITLES')));
const OVERRIDDEN = new Set([...priorityBlock.matchAll(/^ {2}'?([a-z0-9-]+)'?: \{/gm)].map(m => m[1]));

type Rel = { from_language: string; to_language: string; relationship: string; end_year: number | null; confidence: number };
const rels = data.relationships as Rel[];
const tools = (data.languages as Array<{ id: string; name: string }>).filter(n => n.id.startsWith('tool:'));
const slug = (id: string) => id.replace(/^tool:/, '').replace(/_/g, '-');
const unescape = (s: string) => s.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
const page = (id: string) => readFileSync(join(ROOT, 'public/tools', slug(id), 'index.html'), 'utf8');
const title = (id: string) => unescape(page(id).match(/<title>([^<]+)<\/title>/)![1]);
const description = (id: string) => unescape(page(id).match(/<meta name="description" content="([^"]+)"/)![1]);

function implementation(id: string) {
  const incoming = rels.filter(r => r.to_language === id && IMPL.has(r.relationship));
  const current = incoming.some(r => r.end_year == null) ? incoming.filter(r => r.end_year == null) : incoming;
  const sorted = [...current].sort((a, b) => b.confidence - a.confidence);
  const of = (prefix: string) => [...new Set(sorted.filter(r => r.from_language.startsWith(prefix)).map(r => names.get(r.from_language)!))];
  return { languages: of('lang:'), builtOn: of('tool:') };
}

describe('tool pages answer "what is X written in?"', () => {
  it.each(tools.filter(t => !OVERRIDDEN.has(slug(t.id))).map(t => [t.id, t] as const))('%s', (id, tool) => {
    const { languages, builtOn } = implementation(id);
    if (languages.length === 0) {
      // Nothing to answer from the data (e.g. CUDA, whose only edge is LLVM): keep the generic title.
      expect(title(id)).toBe(`${tool.name}: Implementation, History, and Lineage | Language Lineage`);
      return;
    }
    const t = title(id);
    expect(t.startsWith(`What is ${tool.name} written in? `), t).toBe(true);
    expect(t.length).toBeLessThanOrEqual(75);
    const answer = t.slice(`What is ${tool.name} written in? `.length).replace(/ \| Language Lineage$/, '');
    // The answer lists the top languages, most confident first, and never a tool dependency.
    expect(answer.split(/, | and /)).toEqual(languages.slice(0, 3));
    for (const dep of builtOn) expect(answer.split(/, | and /)).not.toContain(dep);
    expect(description(id).startsWith(`${tool.name} is written in `)).toBe(true);
  });

  it('describes dependencies as "built on", never as what a tool is written in', () => {
    for (const tool of tools) {
      if (OVERRIDDEN.has(slug(tool.id))) continue;
      const writtenIn = description(tool.id).match(/written in (.*?)(?:, built on |\. )/)?.[1] ?? '';
      for (const dep of implementation(tool.id).builtOn) expect(writtenIn.split(/, | and /), tool.id).not.toContain(dep);
    }
    expect(description('tool:jax')).toContain('built on XLA');
    expect(description('tool:cuda')).toContain("CUDA's compiler is built on LLVM");
    expect(description('tool:ollama')).toBe('Ollama is written in Go. Ollama was first released in 2023. Explore the full lineage.');
  });
});
