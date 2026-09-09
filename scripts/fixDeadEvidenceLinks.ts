/**
 * One-shot follow-up to Stage 1 item 8 of IMPLEMENTATION_PLAN.md.
 *
 * scripts/checkEvidenceLinks.ts found 10 dead evidence_source URLs (after
 * fixing a false positive in the checker itself — see that script's history).
 * This applies researched, verified replacements for 9 of them and, for the
 * 10th (Roc), makes a content correction rather than a citation swap: the
 * dataset claimed "Roc's compiler is written in Rust", which is no longer
 * true — the compiler was rewritten to Zig starting 2025. Every replacement
 * URL was fetched and confirmed to state the specific claim it supports
 * before being used here; see the commit message for citations and the one
 * fact this could NOT confirm (Haskell's influence on Roc), which is left
 * untouched rather than given a low-confidence citation.
 *
 * Per CLAUDE.md, evidence_source and confidence values require human review
 * before landing — this script only prepares the change; review the diff
 * before committing.
 *
 * Run once: npx tsx scripts/fixDeadEvidenceLinks.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');

interface Language {
  id: string;
  current_primary_implementation_language: string;
}

interface Relationship {
  from_language: string;
  to_language: string;
  relationship: string;
  start_year: number | null;
  end_year: number | null;
  confidence: number;
  evidence_source: string;
  notes?: string | null;
}

interface Dataset {
  languages: Language[];
  relationships: Relationship[];
}

function findRel(rels: Relationship[], from: string, to: string, type: string): Relationship {
  const rel = rels.find((r) => r.from_language === from && r.to_language === to && r.relationship === type);
  if (!rel) throw new Error(`Relationship not found: ${from} -> ${to} (${type})`);
  return rel;
}

// [from, to, relationship, new evidence_source]
const URL_SWAPS: Array<[string, string, string, string]> = [
  ['lang:c', 'lang:odin', 'influenced', 'https://odin-lang.org/docs/faq/'],
  ['lang:pascal', 'lang:odin', 'influenced', 'https://odin-lang.org/docs/faq/'],
  ['lang:go', 'lang:odin', 'influenced', 'https://odin-lang.org/docs/faq/'],
  ['lang:cxx', 'lang:odin', 'compiler_written_in', 'https://odin-lang.org/docs/faq/'],
  ['lang:rust', 'tool:swc', 'compiler_written_in', 'https://github.com/swc-project/swc'],
  ['tool:chez_scheme', 'lang:racket', 'runtime_written_in', 'https://blog.racket-lang.org/2019/01/racket-on-chez-status.html'],
  ['lang:scala', 'lang:scala', 'compiler_written_in', 'https://www.scala-lang.org/blog/2015/10/23/dotty-compiler-bootstraps.html'],
  ['lang:ada', 'lang:ada', 'compiler_written_in', 'https://en.wikipedia.org/wiki/GNAT'],
  ['lang:c', 'lang:hare', 'bootstrap_written_in', 'https://slackbuilds.org/repository/15.0/development/harec/'],
  ['lang:c', 'lang:hare', 'influenced', 'https://harelang.org/documentation/faq.html'],
  ['lang:lua', 'lang:wren', 'influenced', 'https://github.com/wren-lang/wren'],
  ['lang:smalltalk', 'lang:wren', 'influenced', 'https://github.com/wren-lang/wren'],
  ['lang:c', 'lang:wren', 'runtime_written_in', 'https://github.com/wren-lang/wren'],
  ['lang:haskell', 'lang:unison', 'influenced', 'https://www.unison-lang.org/docs/usage-topics/general-faqs/'],
  ['lang:haskell', 'lang:unison', 'compiler_written_in', 'https://www.unison-lang.org/docs/usage-topics/general-faqs/'],
  ['lang:elm', 'lang:roc', 'influenced', 'https://www.roc-lang.org/faq'],
  ['lang:lazy_ml', 'tool:ghc', 'bootstrap_written_in', 'https://www.microsoft.com/en-us/research/wp-content/uploads/2016/07/history.pdf'],
];

function main() {
  const raw = readFileSync(DATASET_PATH, 'utf8');
  const data: Dataset = JSON.parse(raw);

  for (const [from, to, type, url] of URL_SWAPS) {
    const rel = findRel(data.relationships, from, to, type);
    rel.evidence_source = url;
  }

  // Content correction, not a citation swap: Roc's compiler was rewritten
  // from Rust to Zig starting 2025. Historically accurate rather than a
  // silent overwrite — Rust keeps its edge with an end_year, and Zig gets
  // its own edge starting where Rust's ends.
  const rustToRoc = findRel(data.relationships, 'lang:rust', 'lang:roc', 'compiler_written_in');
  rustToRoc.end_year = 2025;
  rustToRoc.evidence_source = 'https://linkedlist.org/2025/02/06/roc-zig-rewrite';
  rustToRoc.notes = "Roc's compiler was originally written in Rust, from the project's start until the 2025 rewrite to Zig.";

  data.relationships.push({
    from_language: 'lang:zig',
    to_language: 'lang:roc',
    relationship: 'compiler_written_in',
    start_year: 2025,
    end_year: null,
    confidence: 0.85,
    evidence_source: 'https://gist.github.com/rtfeldman/77fb430ee57b42f5f2ca973a3992532f',
    notes: "Roc's compiler was rewritten from Rust to Zig starting 2025, announced by creator Richard Feldman, for faster incremental builds and simpler memory management.",
  });

  // Same defect class as Stage 1 item 6: this scalar must reflect the
  // current (no end_year) primary implementer, and it still said "Rust"
  // after Rust's edge above just gained an end_year.
  const roc = data.languages.find((l) => l.id === 'lang:roc');
  if (roc) roc.current_primary_implementation_language = 'Zig';

  // NOT touched: lang:haskell -> lang:roc (influenced). No reliable source
  // was found confirming this; one primary source (a Feldman interview)
  // arguably cuts against it, contrasting Roc's philosophy from Haskell's
  // rather than describing an influence. Left with its dead citation rather
  // than given a citation that doesn't actually support the claim -
  // flagged for human review instead of guessed at.

  writeFileSync(DATASET_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Applied ${URL_SWAPS.length} URL swaps, 1 historical split (Rust/Zig -> Roc), 1 new edge.`);
  console.log('Left untouched: lang:haskell -> lang:roc (influenced) - no reliable source found.');
}

main();
