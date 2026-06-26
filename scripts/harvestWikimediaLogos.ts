import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');
const OVERRIDES_PATH = join(ROOT, 'dataset/v5/wikimedia_logo_overrides.json');
const REPORT_PATH = join(ROOT, 'reports/wikimedia-logo-audit.md');

const USER_AGENT = 'LanguageLineageLogoAudit/0.1 (https://languagelineage.org)';

interface LanguageNode {
  id: string;
  name: string;
  logo_url: string | null;
  logo_kind?: 'devicon' | 'wikimedia' | 'proxy' | 'none' | null;
}

interface Target {
  id: string;
  title?: string;
  qid?: string;
}

interface AcceptedLogo {
  id: string;
  name: string;
  action: 'filled' | 'replaced_proxy';
  url: string;
  source: string;
  license: string;
  kind: 'wikimedia';
  wikidata_item: string;
  commons_file: string;
}

interface UnresolvedLogo {
  id: string;
  name: string;
  reason: string;
  title?: string;
  qid?: string;
}

const TARGETS: Target[] = [
  { id: 'lang:machine_code', title: 'Machine code' },
  { id: 'lang:assembly', title: 'Assembly language' },
  { id: 'lang:lisp', title: 'Lisp (programming language)' },
  { id: 'lang:algol', title: 'ALGOL' },
  { id: 'lang:simula', title: 'Simula' },
  { id: 'lang:bcpl', title: 'BCPL' },
  { id: 'lang:b', title: 'B (programming language)' },
  { id: 'lang:pascal', title: 'Pascal (programming language)' },
  { id: 'lang:smalltalk', title: 'Smalltalk' },
  { id: 'lang:ml', title: 'ML (programming language)' },
  { id: 'lang:scheme', title: 'Scheme (programming language)' },
  { id: 'lang:ada', title: 'Ada (programming language)' },
  { id: 'lang:sml', title: 'Standard ML' },
  { id: 'lang:common_lisp', title: 'Common Lisp' },
  { id: 'lang:d', qid: 'Q319268' },
  { id: 'lang:reasonml', qid: 'Q63565848' },
  { id: 'lang:v', title: 'V (programming language)' },
  { id: 'lang:mojo', qid: 'Q118152673' },
  { id: 'tool:clang', title: 'Clang' },
  { id: 'tool:hotspot', title: 'HotSpot' },
  { id: 'tool:roslyn', title: 'Roslyn (compiler)' },
  { id: 'tool:spidermonkey', title: 'SpiderMonkey' },
  { id: 'tool:javascriptcore', title: 'JavaScriptCore' },
  { id: 'tool:ghc', title: 'Glasgow Haskell Compiler' },
  { id: 'tool:mrustc', title: 'MRustC' },
  { id: 'tool:beam', title: 'BEAM (Erlang virtual machine)' },
  { id: 'tool:chez_scheme', title: 'Chez Scheme' },
  { id: 'tool:femtolisp', title: 'FemtoLisp' },
  { id: 'lang:flow_matic', title: 'FLOW-MATIC' },
  { id: 'lang:comtran', title: 'COMTRAN' },
  { id: 'lang:planner', title: 'Planner (programming language)' },
  { id: 'lang:lazy_ml', title: 'Lazy ML' },
  { id: 'lang:newsqueak', title: 'Newsqueak' },
  { id: 'lang:limbo', title: 'Limbo (programming language)' },
  { id: 'lang:oberon2', title: 'Oberon-2' },
  { id: 'lang:alef', title: 'Alef (programming language)' },
  { id: 'lang:cyclone', title: 'Cyclone (programming language)' },
  { id: 'lang:clu', title: 'CLU (programming language)' },
  { id: 'lang:oberon', title: 'Oberon (programming language)' },
  { id: 'lang:abc', title: 'ABC (programming language)' },
  { id: 'lang:modula3', title: 'Modula-3' },
  { id: 'lang:icon', title: 'Icon (programming language)' },
  { id: 'lang:dylan', title: 'Dylan (programming language)' },
  { id: 'lang:modula2', title: 'Modula-2' },
  { id: 'lang:self', title: 'Self (programming language)' },
  { id: 'lang:miranda', title: 'Miranda (programming language)' },
  { id: 'lang:idris', title: 'Idris (programming language)' },
  { id: 'lang:agda', title: 'Agda (programming language)' },
  { id: 'lang:cython', qid: 'Q975594' },
  { id: 'lang:j', title: 'J (programming language)' },
  { id: 'lang:mercury', title: 'Mercury (programming language)' },
  { id: 'lang:algol68', title: 'ALGOL 68' },
  { id: 'lang:pl1', title: 'PL/I' },
  { id: 'lang:tcl', title: 'Tcl' },
  { id: 'lang:sh', title: 'Bourne shell' },
  { id: 'lang:luajit', title: 'LuaJIT' },
  { id: 'lang:s', title: 'S (programming language)' },
  { id: 'lang:pharo', title: 'Pharo' },
  { id: 'lang:guile', qid: 'Q1486208' },
  { id: 'lang:mypy', title: 'mypy' },
  { id: 'lang:freepascal', title: 'Free Pascal' },
  { id: 'lang:fortran95', title: 'Fortran 95' },
];

const targetById = new Map(TARGETS.map((target) => [target.id, target]));

const REJECTED_P154_BY_ID: Record<string, string> = {
  'lang:icon': 'Wikidata P154 resolves to an unrelated magazine logo, not the Icon programming language.',
  'lang:mypy': 'Wikipedia title resolution points at Python and returns Python branding, not mypy branding.',
  'tool:femtolisp': 'Wikidata P154 resolves to Julia branding, not a FemtoLisp-specific logo.',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string, attempt = 1): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  const body = await response.text();

  if ((!response.ok || !body.trim().startsWith('{')) && attempt < 4) {
    await sleep(500 * attempt);
    return fetchJson<T>(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 160)}`);
  }

  if (!body.trim().startsWith('{')) {
    throw new Error(`Non-JSON response for ${url}: ${body.slice(0, 160)}`);
  }

  return JSON.parse(body) as T;
}

function wikiApiUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function resolveQid(target: Target): Promise<{ qid: string | null; title?: string; reason?: string }> {
  if (target.qid) return { qid: target.qid, title: target.title };
  if (!target.title) return { qid: null, reason: 'no curated title or QID' };

  const result = await fetchJson<{
    query?: {
      pages?: Array<{
        missing?: boolean;
        title?: string;
        pageprops?: { wikibase_item?: string };
      }>;
    };
  }>(
    wikiApiUrl('https://en.wikipedia.org/w/api.php', {
      action: 'query',
      format: 'json',
      formatversion: '2',
      redirects: '1',
      prop: 'pageprops',
      titles: target.title,
    })
  );

  const page = result.query?.pages?.[0];
  if (!page || page.missing) return { qid: null, title: target.title, reason: 'Wikipedia page not found' };
  const qid = page.pageprops?.wikibase_item ?? null;
  return qid ? { qid, title: page.title ?? target.title } : { qid: null, title: page.title, reason: 'Wikipedia page has no Wikidata item' };
}

async function getLogoFile(qid: string): Promise<string | null> {
  const entityData = await fetchJson<{
    entities?: Record<string, {
      claims?: Record<string, Array<{
        rank?: string;
        mainsnak?: { datavalue?: { value?: unknown } };
      }>>;
    }>;
  }>(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`);

  const claims = entityData.entities?.[qid]?.claims?.P154 ?? [];
  const claim = claims.find((item) => item.rank === 'preferred') ?? claims[0];
  const value = claim?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : null;
}

function cleanMetadata(value: string | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getCommonsMetadata(file: string): Promise<{ url: string; source: string; license: string } | null> {
  const result = await fetchJson<{
    query?: {
      pages?: Array<{
        missing?: boolean;
        imageinfo?: Array<{
          url?: string;
          descriptionurl?: string;
          mime?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }>;
    };
  }>(
    wikiApiUrl('https://commons.wikimedia.org/w/api.php', {
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      titles: `File:${file}`,
    })
  );

  const imageInfo = result.query?.pages?.[0]?.imageinfo?.[0];
  if (!imageInfo?.url || !imageInfo.mime?.startsWith('image/')) return null;

  const metadata = imageInfo.extmetadata ?? {};
  const license =
    cleanMetadata(metadata.LicenseShortName?.value) ||
    cleanMetadata(metadata.UsageTerms?.value) ||
    cleanMetadata(metadata.License?.value) ||
    'Wikimedia Commons';

  return {
    url: imageInfo.url,
    source: imageInfo.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replace(/%20/g, '_')}`,
    license,
  };
}

function markdownCell(value: string | undefined): string {
  return (value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function buildReport(accepted: AcceptedLogo[], unresolved: UnresolvedLogo[]): string {
  const acceptedRows = accepted
    .map((item) => `| \`${item.id}\` | ${markdownCell(item.name)} | ${item.action} | [${markdownCell(item.commons_file)}](${item.source}) | ${markdownCell(item.license)} |`)
    .join('\n') || '| _None_ |  |  |  |  |';

  const unresolvedRows = unresolved
    .map((item) => `| \`${item.id}\` | ${markdownCell(item.name)} | ${markdownCell(item.reason)} | ${markdownCell(item.qid ?? item.title)} |`)
    .join('\n') || '| _None_ |  |  |';

  return `# Wikimedia Logo Audit

Policy: deterministic curated title/QID mapping, Wikidata P154 only, Commons URLs only. P18 representative images are intentionally excluded.

## Summary

- Accepted: ${accepted.length}
- Unresolved: ${unresolved.length}
- Replacement policy: fill missing logos and replace proxy logos only; preserve direct Devicon logos.

## Accepted Logos

| ID | Name | Action | Commons file | License |
|----|------|--------|--------------|---------|
${acceptedRows}

## Unresolved

| ID | Name | Reason | Mapping |
|----|------|--------|---------|
${unresolvedRows}
`;
}

async function main() {
  const dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as { languages: LanguageNode[] };
  const targetNodes = dataset.languages.filter((lang) => lang.logo_kind === 'none' || lang.logo_kind === 'proxy');
  const accepted: AcceptedLogo[] = [];
  const unresolved: UnresolvedLogo[] = [];

  for (const lang of targetNodes) {
    const target = targetById.get(lang.id);
    if (!target) {
      unresolved.push({ id: lang.id, name: lang.name, reason: 'no curated mapping' });
      continue;
    }

    try {
      await sleep(150);
      const resolved = await resolveQid(target);
      if (!resolved.qid) {
        unresolved.push({ id: lang.id, name: lang.name, reason: resolved.reason ?? 'could not resolve Wikidata item', title: resolved.title ?? target.title });
        continue;
      }

      await sleep(150);
      const file = await getLogoFile(resolved.qid);
      if (!file) {
        unresolved.push({ id: lang.id, name: lang.name, reason: 'Wikidata item has no P154 logo image', qid: resolved.qid });
        continue;
      }

      const rejectionReason = REJECTED_P154_BY_ID[lang.id];
      if (rejectionReason) {
        unresolved.push({ id: lang.id, name: lang.name, reason: rejectionReason, qid: resolved.qid });
        continue;
      }

      await sleep(150);
      const commons = await getCommonsMetadata(file);
      if (!commons) {
        unresolved.push({ id: lang.id, name: lang.name, reason: 'Commons file metadata missing or not an image', qid: resolved.qid });
        continue;
      }

      accepted.push({
        id: lang.id,
        name: lang.name,
        action: lang.logo_kind === 'proxy' ? 'replaced_proxy' : 'filled',
        url: commons.url,
        source: commons.source,
        license: commons.license,
        kind: 'wikimedia',
        wikidata_item: resolved.qid,
        commons_file: file,
      });
    } catch (error) {
      unresolved.push({
        id: lang.id,
        name: lang.name,
        reason: error instanceof Error ? error.message : String(error),
        qid: target.qid,
        title: target.title,
      });
    }
  }

  const logos = Object.fromEntries(
    accepted
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => [
        item.id,
        {
          url: item.url,
          source: item.source,
          license: item.license,
          kind: item.kind,
          wikidata_item: item.wikidata_item,
          commons_file: item.commons_file,
        },
      ])
  );

  mkdirSync(dirname(OVERRIDES_PATH), { recursive: true });
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(
    OVERRIDES_PATH,
    `${JSON.stringify({
      policy: {
        source: 'Wikidata P154 logo image only',
        storage: 'Wikimedia Commons original file URLs',
        replacement: 'fill missing logos and replace proxy logos only',
      },
      logos,
    }, null, 2)}\n`
  );
  writeFileSync(REPORT_PATH, buildReport(accepted.sort((a, b) => a.id.localeCompare(b.id)), unresolved.sort((a, b) => a.id.localeCompare(b.id))));

  console.log(`Accepted ${accepted.length} Wikimedia logos`);
  console.log(`Unresolved ${unresolved.length} targets`);
  console.log(`Wrote ${OVERRIDES_PATH}`);
  console.log(`Wrote ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
