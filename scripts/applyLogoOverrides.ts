import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Applies logo data to lineage_v5.json in-place without regenerating from v4.
// Safe to run repeatedly; existing devicon/preferred-wikimedia logos are not overwritten.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');
const OVERRIDES_PATH = join(ROOT, 'dataset/v5/wikimedia_logo_overrides.json');

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';
const DEVICON_SOURCE = 'https://github.com/devicons/devicon';
const DEVICON_LICENSE = 'Devicon MIT; trademarks retained by owners';

// Additional Devicon logos for nodes not covered by Wikimedia or the original dataset:v5 script.
const EXTRA_DEVICON: Record<string, { slug: string; variant?: string }> = {
  'lang:haxe': { slug: 'haxe', variant: 'original' },
  'lang:nix': { slug: 'nixos', variant: 'plain' },
};

interface Node {
  id: string;
  logo_url: string | null;
  logo_kind?: 'devicon' | 'wikimedia' | 'proxy' | 'none' | null;
  logo_source?: string | null;
  logo_license?: string | null;
}

const dataset = JSON.parse(readFileSync(DATASET_PATH, 'utf8')) as { languages: Node[] };
const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8')) as {
  logos: Record<string, { url: string; source: string; license: string }>;
};

let applied = 0;
let skipped = 0;

for (const node of dataset.languages) {
  // Apply Wikimedia overrides only to nodes with no logo (logo_kind === 'none').
  // Nodes with 'devicon' kind keep their existing logo.
  if (node.logo_kind === 'none' && overrides.logos[node.id]) {
    const logo = overrides.logos[node.id];
    node.logo_url = logo.url;
    node.logo_kind = 'wikimedia';
    node.logo_source = logo.source;
    node.logo_license = logo.license;
    applied++;
    continue;
  }

  // Apply extra Devicon entries for nodes still missing a logo.
  if (node.logo_kind === 'none' && EXTRA_DEVICON[node.id]) {
    const { slug, variant = 'original' } = EXTRA_DEVICON[node.id];
    node.logo_url = `${DEVICON_BASE}/${slug}/${slug}-${variant}.svg`;
    node.logo_kind = 'devicon';
    node.logo_source = `${DEVICON_SOURCE}/tree/master/icons/${slug}`;
    node.logo_license = DEVICON_LICENSE;
    applied++;
    continue;
  }

  if (node.logo_kind !== 'none') skipped++;
}

writeFileSync(DATASET_PATH, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Applied ${applied} logo(s); skipped ${skipped} nodes already with logos.`);
