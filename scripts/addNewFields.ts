import fs from 'fs';

const dataset = JSON.parse(fs.readFileSync('dataset/v4/lineage_v4.json', 'utf-8'));

dataset.languages = dataset.languages.map((lang: any) => ({
  ...lang,
  company: null,
  garbage_collected: null,
  logo_url: null,
  peak_year: null,
  current_users_estimate: null
}));

fs.writeFileSync('dataset/v4/lineage_v4.json', JSON.stringify(dataset, null, 2) + '\n');

console.log(`✅ Added 5 new fields to ${dataset.languages.length} languages`);
console.log('Fields added: company, garbage_collected, logo_url, peak_year, current_users_estimate');
console.log('All fields initialized to null');
