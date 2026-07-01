import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Harvests non-copyrightable structured facts (designers, developers, license,
// website, file extensions, influenced-by) plus the short Wikidata description
// tagline for every dataset node, with Wikipedia + Wikidata source URLs.
// Wikipedia prose (CC BY-SA) is never stored or rendered; on-page narrative is
// synthesized from these facts in generateSeoPages.ts.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');
const OUTPUT_PATH = join(ROOT, 'dataset/v5/enrichment_v5.json');
const REPORT_PATH = join(ROOT, 'reports/wikipedia-enrichment-audit.md');

const USER_AGENT = 'LanguageLineageContentEnrich/0.1 (https://languagelineage.org)';

interface LanguageNode {
  id: string;
  name: string;
}

// Curated Wikipedia titles / Wikidata QIDs for nodes whose name does not resolve
// cleanly by itself (disambiguation, single letters, tools). Extends the curated
// map proven by scripts/harvestWikimediaLogos.ts.
const CURATED: Record<string, { title?: string; qid?: string }> = {
  // Ambiguous names that otherwise hit disambiguation pages / unrelated items.
  'lang:raku': { title: 'Raku (programming language)' },
  'lang:hack': { title: 'Hack (programming language)' },
  'lang:vala': { title: 'Vala (programming language)' },
  'lang:eiffel': { title: 'Eiffel (programming language)' },
  'lang:forth': { title: 'Forth (programming language)' },
  'lang:io': { title: 'Io (programming language)' },
  'lang:clean': { title: 'Clean (programming language)' },
  'lang:occam': { title: 'Occam (programming language)' },
  'lang:ats': { title: 'ATS (programming language)' },
  'lang:roc': { title: 'Roc (programming language)' },
  'lang:lean': { title: 'Lean (proof assistant)' },
  'lang:coq': { title: 'Coq (software)' },
  'lang:qsharp': { title: 'Q Sharp' },
  'lang:factor': { title: 'Factor (programming language)' },
  'lang:nix': { title: 'Nix (package manager)' },
  'lang:move': { title: 'Move (programming language)' },
  'lang:solidity': { title: 'Solidity' },
  'lang:logo': { title: 'Logo (programming language)' },
  'lang:hope': { title: 'Hope (programming language)' },
  'lang:mesa': { title: 'Mesa (programming language)' },
  'lang:snobol': { title: 'SNOBOL' },
  'lang:speedcoding': { title: 'Speedcoding' },
  'lang:basic': { title: 'BASIC' },
  'lang:wren': { title: 'Wren (programming language)' },
  'lang:pony': { title: 'Pony (programming language)' },
  'lang:odin': { title: 'Odin (programming language)' },
  'lang:hare': { title: 'Hare (programming language)' },
  'lang:chapel': { title: 'Chapel (programming language)' },
  'lang:haxe': { title: 'Haxe' },
  'lang:actionscript': { title: 'ActionScript' },
  'lang:powershell': { title: 'PowerShell' },
  'tool:quickjs': { title: 'QuickJS' },
  'tool:swc': { title: 'SWC (software)' },
  'tool:babel': { title: 'Babel (transcompiler)' },
  'tool:hhvm': { title: 'HHVM' },
  'tool:moarvm': { title: 'MoarVM' },
  'tool:graalvm': { title: 'GraalVM' },
  'tool:esbuild': { title: 'Esbuild' },
  'lang:machine_code': { title: 'Machine code' },
  'lang:assembly': { title: 'Assembly language' },
  'lang:lisp': { title: 'Lisp (programming language)' },
  'lang:algol': { title: 'ALGOL' },
  'lang:simula': { title: 'Simula' },
  'lang:bcpl': { title: 'BCPL' },
  'lang:b': { title: 'B (programming language)' },
  'lang:pascal': { title: 'Pascal (programming language)' },
  'lang:smalltalk': { title: 'Smalltalk' },
  'lang:c': { title: 'C (programming language)' },
  'lang:ml': { title: 'ML (programming language)' },
  'lang:scheme': { title: 'Scheme (programming language)' },
  'lang:prolog': { title: 'Prolog' },
  'lang:ada': { title: 'Ada (programming language)' },
  'lang:cxx': { title: 'C++' },
  'lang:objective_c': { title: 'Objective-C' },
  'lang:erlang': { title: 'Erlang (programming language)' },
  'lang:perl': { title: 'Perl' },
  'lang:sml': { title: 'Standard ML' },
  'lang:haskell': { title: 'Haskell' },
  'lang:python': { title: 'Python (programming language)' },
  'lang:common_lisp': { title: 'Common Lisp' },
  'lang:ocaml': { title: 'OCaml' },
  'lang:java': { title: 'Java (programming language)' },
  'lang:javascript': { title: 'JavaScript' },
  'lang:ruby': { title: 'Ruby (programming language)' },
  'lang:php': { title: 'PHP' },
  'lang:r': { title: 'R (programming language)' },
  'lang:racket': { title: 'Racket (programming language)' },
  'lang:csharp': { title: 'C Sharp (programming language)' },
  'lang:lua': { title: 'Lua (programming language)' },
  'lang:d': { qid: 'Q319268' },
  'lang:scala': { title: 'Scala (programming language)' },
  'lang:fsharp': { title: 'F Sharp (programming language)' },
  'lang:clojure': { title: 'Clojure' },
  'lang:go': { title: 'Go (programming language)' },
  'lang:coffeescript': { title: 'CoffeeScript' },
  'lang:rust': { title: 'Rust (programming language)' },
  'lang:kotlin': { title: 'Kotlin (programming language)' },
  'lang:typescript': { title: 'TypeScript' },
  'lang:dart': { title: 'Dart (programming language)' },
  'lang:elixir': { title: 'Elixir (programming language)' },
  'lang:elm': { title: 'Elm (programming language)' },
  'lang:julia': { title: 'Julia (programming language)' },
  'lang:swift': { title: 'Swift (programming language)' },
  'lang:crystal': { title: 'Crystal (programming language)' },
  'lang:purescript': { title: 'PureScript' },
  'lang:nim': { title: 'Nim (programming language)' },
  'lang:reasonml': { qid: 'Q63565848' },
  'lang:zig': { title: 'Zig (programming language)' },
  'lang:v': { title: 'V (programming language)' },
  'lang:carbon': { title: 'Carbon (programming language)' },
  'lang:mojo': { qid: 'Q118152673' },
  'lang:groovy': { title: 'Apache Groovy' },
  'lang:vb_net': { title: 'Visual Basic (.NET)' },
  'tool:gcc': { title: 'GNU Compiler Collection' },
  'tool:llvm': { title: 'LLVM' },
  'tool:clang': { title: 'Clang' },
  'tool:hotspot': { title: 'HotSpot (virtual machine)' },
  'tool:dotnet_runtime': { title: '.NET' },
  'tool:roslyn': { title: 'Roslyn (compiler)' },
  'tool:v8': { title: 'V8 (JavaScript engine)' },
  'tool:spidermonkey': { title: 'SpiderMonkey' },
  'tool:javascriptcore': { title: 'JavaScriptCore' },
  'tool:ghc': { title: 'Glasgow Haskell Compiler' },
  'tool:mrustc': { title: 'MRustC' },
  'tool:beam': { title: 'BEAM (Erlang virtual machine)' },
  'tool:chez_scheme': { title: 'Chez Scheme' },
  'tool:femtolisp': { qid: 'Q105840370' },
  'lang:flow_matic': { title: 'FLOW-MATIC' },
  'lang:comtran': { title: 'COMTRAN' },
  'lang:planner': { title: 'Planner (programming language)' },
  'lang:lazy_ml': { title: 'Lazy ML' },
  'lang:newsqueak': { title: 'Newsqueak' },
  'lang:limbo': { title: 'Limbo (programming language)' },
  'lang:oberon2': { title: 'Oberon-2' },
  'lang:alef': { title: 'Alef (programming language)' },
  'lang:cyclone': { title: 'Cyclone (programming language)' },
  'lang:clu': { title: 'CLU (programming language)' },
  'lang:gleam': { title: 'Gleam (programming language)' },
  'lang:oberon': { title: 'Oberon (programming language)' },
  'lang:abc': { title: 'ABC (programming language)' },
  'lang:modula3': { title: 'Modula-3' },
  'lang:icon': { title: 'Icon (programming language)' },
  'lang:dylan': { title: 'Dylan (programming language)' },
  'lang:modula2': { title: 'Modula-2' },
  'lang:self': { title: 'Self (programming language)' },
  'lang:miranda': { title: 'Miranda (programming language)' },
  'lang:matlab': { title: 'MATLAB' },
  'lang:idris': { title: 'Idris (programming language)' },
  'lang:agda': { title: 'Agda (programming language)' },
  'lang:cython': { qid: 'Q975594' },
  'lang:apl': { title: 'APL (programming language)' },
  'lang:delphi': { title: 'Delphi (software)' },
  'lang:j': { title: 'J (programming language)' },
  'lang:mercury': { title: 'Mercury (programming language)' },
  'lang:algol68': { title: 'ALGOL 68' },
  'lang:pl1': { title: 'PL/I' },
  'lang:bash': { title: 'Bash (Unix shell)' },
  'lang:tcl': { title: 'Tcl' },
  'lang:awk': { title: 'AWK' },
  'lang:sh': { title: 'Bourne shell' },
  'lang:angular': { title: 'Angular (web framework)' },
  'lang:luajit': { title: 'LuaJIT' },
  'lang:s': { title: 'S (programming language)' },
  'lang:pharo': { title: 'Pharo' },
  'lang:guile': { qid: 'Q1486208' },
  'lang:mypy': { title: 'Mypy' },
  'lang:freepascal': { title: 'Free Pascal' },
  'lang:fortran95': { title: 'Fortran 95' },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string, attempt = 1): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
  const body = await response.text();
  if ((!response.ok || !body.trim().startsWith('{')) && attempt < 4) {
    await sleep(600 * attempt);
    return fetchJson<T>(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 160)}`);
  if (!body.trim().startsWith('{')) throw new Error(`Non-JSON for ${url}: ${body.slice(0, 160)}`);
  return JSON.parse(body) as T;
}

function apiUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

interface Resolved {
  qid: string | null;
  title: string | null;
  reason?: string;
}

async function resolveNode(node: LanguageNode): Promise<Resolved> {
  const curated = CURATED[node.id];
  if (curated?.qid) {
    // Resolve canonical title from the QID's enwiki sitelink.
    const data = await fetchJson<{ entities?: Record<string, { sitelinks?: { enwiki?: { title?: string } } }> }>(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(curated.qid)}.json`
    );
    const title = data.entities?.[curated.qid]?.sitelinks?.enwiki?.title ?? curated.title ?? node.name;
    return { qid: curated.qid, title };
  }

  const candidates = curated?.title
    ? [curated.title]
    : [node.name, `${node.name} (programming language)`];

  for (const candidate of candidates) {
    const result = await fetchJson<{
      query?: { pages?: Array<{ missing?: boolean; title?: string; pageprops?: { wikibase_item?: string } }> };
    }>(
      apiUrl('https://en.wikipedia.org/w/api.php', {
        action: 'query', format: 'json', formatversion: '2', redirects: '1', prop: 'pageprops', titles: candidate,
      })
    );
    const page = result.query?.pages?.[0];
    if (page && !page.missing && page.pageprops?.wikibase_item) {
      return { qid: page.pageprops.wikibase_item, title: page.title ?? candidate };
    }
    await sleep(120);
  }
  return { qid: null, title: candidates[0], reason: 'no Wikipedia page with a Wikidata item' };
}

type Claim = { rank?: string; mainsnak?: { datavalue?: { value?: unknown } } };

interface RawFacts {
  description: string | null;
  designerQids: string[];
  developerQids: string[];
  licenseQids: string[];
  influencedByQids: string[];
  implementedInQids: string[];
  website: string | null;
  fileExtensions: string[];
}

function claimQids(claims: Record<string, Claim[]>, prop: string): string[] {
  return (claims[prop] ?? [])
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter((v): v is { id: string } => !!v && typeof v === 'object' && 'id' in (v as object))
    .map((v) => v.id);
}

function claimStrings(claims: Record<string, Claim[]>, prop: string): string[] {
  return (claims[prop] ?? [])
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter((v): v is string => typeof v === 'string');
}

async function getRawFacts(qid: string): Promise<RawFacts> {
  const data = await fetchJson<{
    entities?: Record<string, {
      descriptions?: { en?: { value?: string } };
      claims?: Record<string, Claim[]>;
    }>;
  }>(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`);

  const entity = data.entities?.[qid];
  const claims = entity?.claims ?? {};
  return {
    description: entity?.descriptions?.en?.value ?? null,
    designerQids: [...new Set([...claimQids(claims, 'P287'), ...claimQids(claims, 'P170')])],
    developerQids: claimQids(claims, 'P178'),
    licenseQids: claimQids(claims, 'P275'),
    influencedByQids: claimQids(claims, 'P737'),
    implementedInQids: claimQids(claims, 'P277'),
    website: claimStrings(claims, 'P856')[0] ?? null,
    fileExtensions: claimStrings(claims, 'P1195'),
  };
}

// Batch-resolve QID -> human label. Prefers the English label, then the English
// Wikipedia sitelink title (with any trailing disambiguation removed), so even
// entities with sparse labels (e.g. organizations) resolve cleanly.
async function resolveLabels(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(qids)];
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await fetchJson<{
      entities?: Record<string, {
        labels?: { en?: { value?: string } };
        sitelinks?: { enwiki?: { title?: string } };
      }>;
    }>(
      apiUrl('https://www.wikidata.org/w/api.php', {
        action: 'wbgetentities', format: 'json', formatversion: '2',
        props: 'labels|sitelinks', languages: 'en', sitefilter: 'enwiki', ids: batch.join('|'),
      })
    );
    for (const [qid, ent] of Object.entries(data.entities ?? {})) {
      const label = ent.labels?.en?.value
        ?? ent.sitelinks?.enwiki?.title?.replace(/\s*\(.*\)$/, '');
      if (label) out.set(qid, label);
    }
    await sleep(150);
  }
  return out;
}

interface Enriched {
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

function mapLabels(qids: string[], labels: Map<string, string>, cap: number): string[] {
  return [...new Set(qids.map((q) => labels.get(q)).filter((x): x is string => !!x))].slice(0, cap);
}

async function main() {
  const dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as { languages: LanguageNode[] };
  const nodes = dataset.languages;

  // Incremental: preserve already-curated entries, only fetch nodes not yet enriched.
  let existingEnrichment: Record<string, Enriched> = {};
  try {
    const prev = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8')) as { enrichment?: Record<string, Enriched> };
    existingEnrichment = prev.enrichment ?? {};
  } catch { /* no prior enrichment file */ }
  const toProcess = nodes.filter((n) => !existingEnrichment[n.id]);
  console.log(`Enriching ${toProcess.length} new node(s); preserving ${Object.keys(existingEnrichment).length} existing.`);

  const resolved: Array<{ node: LanguageNode; r: Resolved; facts?: RawFacts }> = [];
  const unresolved: Array<{ id: string; name: string; reason: string }> = [];
  const allQids = new Set<string>();

  for (const node of toProcess) {
    try {
      await sleep(140);
      const r = await resolveNode(node);
      if (!r.qid) {
        unresolved.push({ id: node.id, name: node.name, reason: r.reason ?? 'unresolved' });
        continue;
      }
      await sleep(140);
      const facts = await getRawFacts(r.qid);
      [...facts.designerQids, ...facts.developerQids, ...facts.licenseQids, ...facts.influencedByQids, ...facts.implementedInQids]
        .forEach((q) => allQids.add(q));
      resolved.push({ node, r, facts });
      process.stdout.write('.');
    } catch (error) {
      unresolved.push({ id: node.id, name: node.name, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  process.stdout.write('\n');

  console.log(`Resolving ${allQids.size} referenced entity labels...`);
  const labels = await resolveLabels([...allQids]);

  const enrichment: Record<string, Enriched> = { ...existingEnrichment };
  for (const { node, r, facts } of resolved) {
    if (!r.qid || !r.title || !facts) continue;
    const wikipedia_url = `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`;
    enrichment[node.id] = {
      name: node.name,
      wikidata_id: r.qid,
      wikipedia_title: r.title,
      wikipedia_url,
      tagline: facts.description,
      facts: {
        designers: mapLabels(facts.designerQids, labels, 4),
        developers: mapLabels(facts.developerQids, labels, 3),
        license: mapLabels(facts.licenseQids, labels, 3),
        influenced_by: mapLabels(facts.influencedByQids, labels, 8),
        implemented_in: mapLabels(facts.implementedInQids, labels, 4),
        website: facts.website,
        file_extensions: facts.fileExtensions.slice(0, 6).map((e) => (e.startsWith('.') ? e : `.${e}`)),
      },
      sources: { wikidata: `https://www.wikidata.org/wiki/${r.qid}`, wikipedia: wikipedia_url },
    };
  }

  const ordered = Object.fromEntries(Object.keys(enrichment).sort().map((k) => [k, enrichment[k]]));
  writeFileSync(OUTPUT_PATH, `${JSON.stringify({
    policy: {
      source: 'Wikidata structured claims + Wikidata English description tagline',
      note: 'Non-copyrightable facts only. Wikipedia prose is never stored; on-page narrative is synthesized from these facts and cited.',
    },
    enrichment: ordered,
  }, null, 2)}\n`);

  // Audit report
  const factCount = (e: Enriched) =>
    e.facts.designers.length + e.facts.developers.length + e.facts.license.length +
    e.facts.influenced_by.length + e.facts.file_extensions.length + (e.facts.website ? 1 : 0) + (e.tagline ? 1 : 0);
  const rows = Object.entries(ordered)
    .map(([id, e]) => `| \`${id}\` | ${e.name} | ${e.wikidata_id} | ${factCount(e)} | ${e.facts.designers.join(', ') || '-'} |`)
    .join('\n');
  const unresolvedRows = unresolved.map((u) => `| \`${u.id}\` | ${u.name} | ${u.reason.replace(/\|/g, ' ')} |`).join('\n')
    || '| _None_ |  |  |';

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `# Wikipedia / Wikidata Content Enrichment Audit

Source: Wikidata structured claims (designers P287/P170, developers P178, license P275,
influenced-by P737, implemented-in P277, website P856, file extensions P1195) plus the
Wikidata English description tagline. Wikipedia prose is never stored; on-page narrative is
synthesized from these facts and cited to Wikipedia + Wikidata.

## Summary

- Nodes enriched: ${Object.keys(ordered).length} / ${nodes.length}
- Unresolved: ${unresolved.length}

## Enriched

| ID | Name | Wikidata | Facts | Designers |
|----|------|----------|-------|-----------|
${rows}

## Unresolved

| ID | Name | Reason |
|----|------|--------|
${unresolvedRows}
`);

  console.log(`Enriched ${Object.keys(ordered).length} nodes; ${unresolved.length} unresolved`);
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
