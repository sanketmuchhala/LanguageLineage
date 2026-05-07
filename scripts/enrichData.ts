import fs from 'fs';
import type { Dataset, Language, CurrentUsersEstimate } from './schema.js';

const data = JSON.parse(fs.readFileSync('dataset/v4/lineage_v4.json', 'utf-8')) as Dataset;

// Helper to extract company from notes or by language ID
function extractCompany(lang: Language): string | null {
  const notes = lang.notes || '';
  const name = lang.name;

  // Explicit company mappings from notes
  if (notes.includes('IBM') && notes.match(/^[^.]*IBM/i)) return 'IBM';
  if (notes.includes('Sun Microsystems')) return 'Sun Microsystems';
  if (notes.includes('Bell Labs')) return 'Bell Labs';
  if (notes.includes('Xerox PARC')) return 'Xerox PARC';
  if (notes.includes('DoD')) return 'U.S. Department of Defense';
  if (notes.includes('Ericsson')) return 'Ericsson';
  if (notes.includes('INRIA')) return 'INRIA';

  // Known company-created languages
  const companyMap: Record<string, string> = {
    'lang:go': 'Google',
    'lang:dart': 'Google',
    'lang:kotlin': 'JetBrains',
    'lang:swift': 'Apple',
    'lang:typescript': 'Microsoft',
    'lang:csharp': 'Microsoft',
    'lang:fsharp': 'Microsoft',
    'lang:rust': 'Mozilla',
    'lang:scala': 'École Polytechnique Fédérale de Lausanne',
    'lang:clojure': null, // Rich Hickey (individual)
    'lang:elixir': null, // José Valim (individual)
    'lang:crystal': null, // Community
    'lang:nim': null, // Community
    'lang:zig': null, // Community
    'lang:v': null, // Community
  };

  if (companyMap.hasOwnProperty(lang.id)) {
    return companyMap[lang.id];
  }

  // Don't guess - prefer null
  return null;
}

// Determine if language is garbage collected
function isGarbageCollected(lang: Language): boolean | null {
  const name = lang.name;
  const id = lang.id;

  // Manual memory management (definitely false)
  const manualMem = ['C', 'C++', 'Rust', 'Zig', 'Assembly', 'Machine Code', 'B', 'BCPL', 'Fortran'];
  if (manualMem.includes(name)) return false;

  // Garbage collected (definitely true)
  const gcLangs = [
    'Java', 'JavaScript', 'Python', 'Ruby', 'PHP', 'Go', 'C#', 'F#', 'Scala', 'Kotlin',
    'Clojure', 'Erlang', 'Elixir', 'Haskell', 'OCaml', 'Lisp', 'Common Lisp', 'Scheme',
    'Smalltalk', 'Dart', 'TypeScript', 'Swift', 'Lua', 'Perl', 'R', 'Julia',
    'Groovy', 'Elm', 'PureScript', 'Idris', 'Crystal', 'Nim', 'D', 'Racket'
  ];
  if (gcLangs.includes(name)) return true;

  // Uncertain or special cases
  return null;
}

// Determine peak year (only for well-documented cases)
function getPeakYear(lang: Language): number | null {
  // Only populate if historically well-documented
  // Most should remain null
  const peaks: Record<string, number> = {
    'lang:cobol': 1980,
    'lang:perl': 2000,
    'lang:pascal': 1985,
  };

  return peaks[lang.id] || null;
}

// Estimate current user base
function getCurrentUsersEstimate(lang: Language): CurrentUsersEstimate | null {
  const name = lang.name;

  // Dominant (>10M developers)
  const dominant = ['JavaScript', 'Python', 'Java', 'C', 'C++', 'C#', 'PHP', 'TypeScript'];
  if (dominant.includes(name)) return 'dominant';

  // Large (1M-10M developers)
  const large = ['Ruby', 'Go', 'Kotlin', 'Swift', 'R', 'Rust', 'Dart', 'Scala', 'Objective-C', 'Perl'];
  if (large.includes(name)) return 'large';

  // Moderate (100k-1M developers)
  const moderate = ['Elixir', 'Clojure', 'Haskell', 'Erlang', 'F#', 'OCaml', 'Lua', 'Julia', 'Groovy', 'Common Lisp'];
  if (moderate.includes(name)) return 'moderate';

  // Niche (<100k developers)
  const niche = ['Elm', 'Crystal', 'Nim', 'PureScript', 'Idris', 'Zig', 'V', 'Racket', 'Scheme', 'Prolog', 'ML', 'Standard ML'];
  if (niche.includes(name)) return 'niche';

  // Historical or uncertain - leave null
  const historical = ['COBOL', 'Fortran', 'Lisp', 'Smalltalk', 'Pascal', 'Ada', 'ALGOL', 'Simula', 'BCPL', 'B', 'Machine Code', 'Assembly'];
  if (historical.includes(name)) return null;

  return null;
}

// Enrich each language
let enrichedCount = 0;
data.languages = data.languages.map((lang) => {
  const company = extractCompany(lang);
  const garbage_collected = isGarbageCollected(lang);
  const peak_year = getPeakYear(lang);
  const current_users_estimate = getCurrentUsersEstimate(lang);

  // Count non-null enrichments
  if (company !== null || garbage_collected !== null || peak_year !== null || current_users_estimate !== null) {
    enrichedCount++;
  }

  return {
    ...lang,
    company,
    garbage_collected,
    logo_url: null, // Always null per plan
    peak_year,
    current_users_estimate,
  };
});

// Write enriched dataset
fs.writeFileSync('dataset/v4/lineage_v4.json', JSON.stringify(data, null, 2) + '\n');

console.log(`✅ Enriched ${enrichedCount} languages with high-confidence values`);
console.log(`   - company: populated where clearly stated or well-known`);
console.log(`   - garbage_collected: populated for languages with clear memory management`);
console.log(`   - logo_url: all set to null (as per plan)`);
console.log(`   - peak_year: populated only for historically well-documented peaks`);
console.log(`   - current_users_estimate: populated based on current adoption`);
console.log(`   - Prefer null over guessing: ${112 - enrichedCount} languages left with all nulls`);
