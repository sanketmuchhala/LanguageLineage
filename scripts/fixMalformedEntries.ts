import fs from 'fs';

const data = JSON.parse(fs.readFileSync('dataset/v4/lineage_v4.json', 'utf-8'));

let fixedCount = 0;

data.languages = data.languages.map((lang: any) => {
  let fixed = false;

  // Fix year -> first_release_year
  if (lang.hasOwnProperty('year') && !lang.hasOwnProperty('first_release_year')) {
    lang.first_release_year = lang.year;
    delete lang.year;
    fixed = true;
  }

  // Fix year_created -> first_release_year
  if (lang.hasOwnProperty('year_created') && !lang.hasOwnProperty('first_release_year')) {
    lang.first_release_year = lang.year_created;
    delete lang.year_created;
    fixed = true;
  }

  // Add missing required fields with sensible defaults
  if (!lang.hasOwnProperty('current_primary_implementation_language')) {
    lang.current_primary_implementation_language = 'unspecified';
    fixed = true;
  }

  if (!lang.hasOwnProperty('runtime_model')) {
    lang.runtime_model = 'none';
    fixed = true;
  }

  if (!lang.hasOwnProperty('self_hosting')) {
    lang.self_hosting = false;
    fixed = true;
  }

  if (!lang.hasOwnProperty('notes')) {
    lang.notes = lang.description || null;
    delete lang.description;
    fixed = true;
  }

  if (!lang.hasOwnProperty('cluster_hint')) {
    lang.cluster_hint = 'other';
    fixed = true;
  }

  // Remove non-standard fields
  const standardFields = [
    'id',
    'name',
    'first_release_year',
    'current_primary_implementation_language',
    'paradigm',
    'typing',
    'runtime_model',
    'self_hosting',
    'notes',
    'cluster_hint',
    'company',
    'garbage_collected',
    'logo_url',
    'peak_year',
    'current_users_estimate',
  ];

  const extraFields = Object.keys(lang).filter((key) => !standardFields.includes(key));
  if (extraFields.length > 0) {
    extraFields.forEach((field) => {
      delete lang[field];
      fixed = true;
    });
  }

  if (fixed) {
    fixedCount++;
  }

  return lang;
});

fs.writeFileSync('dataset/v4/lineage_v4.json', JSON.stringify(data, null, 2) + '\n');

console.log(`✅ Fixed ${fixedCount} malformed language entries`);
console.log('   - Normalized field names (year/year_created → first_release_year)');
console.log('   - Added missing required fields with defaults');
console.log('   - Removed non-standard fields');
