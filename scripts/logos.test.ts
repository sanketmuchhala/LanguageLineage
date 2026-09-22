/**
 * Logo metadata and graph asset integrity.
 *
 * Two real regressions motivated this file: a graph that rendered no logos at
 * all because the logo field was dropped from every node, and a rendering run
 * that silently dropped entries from the manifest after Wikimedia refused the
 * headless browser's user agent. See DATASET.md, "Logos".
 *
 * Partial coverage is fine: a node with no logo renders a letter badge. What is
 * not fine is a node claiming a logo the graph cannot draw.
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataset = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const nodes = dataset.languages as Array<Record<string, any>>;

const GRAPH_DIR = join(ROOT, 'public/logos/graph');
const assetName = (id: string) => `${id.replace(/:/g, '-').replace(/_/g, '-')}.png`;

const manifestSource = readFileSync(join(ROOT, 'src/data/graphLogoAssets.ts'), 'utf8');
const manifestIds = [...manifestSource.matchAll(/^\s+'((?:lang|tool):[a-z0-9_]+)',$/gm)].map((m) => m[1]);

describe('logo metadata', () => {
  it('pairs every logo URL with a kind and a source', () => {
    const bad = nodes
      .filter((n) => n.logo_url && (!n.logo_kind || n.logo_kind === 'none' || !n.logo_source))
      .map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('leaves logo_url null whenever the kind is none', () => {
    const bad = nodes.filter((n) => n.logo_kind === 'none' && n.logo_url !== null).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('records a license for every logo', () => {
    const bad = nodes.filter((n) => n.logo_url && !n.logo_license).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('points devicon logos at the devicon CDN', () => {
    const bad = nodes
      .filter((n) => n.logo_kind === 'devicon' && !String(n.logo_url).startsWith('https://cdn.jsdelivr.net/gh/devicons/devicon'))
      .map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('points wikimedia logos at Commons uploads', () => {
    const bad = nodes
      .filter((n) => n.logo_kind === 'wikimedia' && !String(n.logo_url).startsWith('https://upload.wikimedia.org/'))
      .map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('keeps tracking parameters out of logo URLs', () => {
    const bad = nodes.filter((n) => n.logo_url && String(n.logo_url).includes('utm_')).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('serves logos over https', () => {
    const bad = nodes.filter((n) => n.logo_url && !String(n.logo_url).startsWith('https://')).map((n) => n.id);
    expect(bad).toEqual([]);
  });
});

describe('graph logo assets', () => {
  it('lists only real nodes in the manifest', () => {
    const ids = new Set(nodes.map((n) => n.id));
    expect(manifestIds.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('lists only nodes that actually carry a logo', () => {
    const withLogo = new Set(nodes.filter((n) => n.logo_url).map((n) => n.id));
    expect(manifestIds.filter((id) => !withLogo.has(id))).toEqual([]);
  });

  it('has a rendered PNG on disk for every manifest entry', () => {
    const missing = manifestIds.filter((id) => !existsSync(join(GRAPH_DIR, assetName(id))));
    expect(missing).toEqual([]);
  });

  it('ships no PNG that the manifest does not reference', () => {
    // An orphan file means a node lost its logo but the asset was left behind.
    const referenced = new Set(manifestIds.map(assetName));
    const orphans = readdirSync(GRAPH_DIR).filter((f) => f.endsWith('.png') && !referenced.has(f));
    expect(orphans).toEqual([]);
  });

  it('exposes the logo field the graph draws from', () => {
    // buildElements must keep passing logoUrl into Cytoscape node data. An
    // agent once deleted this to silence a console error, blanking every logo.
    const buildElements = readFileSync(join(ROOT, 'src/graph/buildElements.ts'), 'utf8');
    expect(buildElements).toMatch(/logoUrl/);
  });
});
