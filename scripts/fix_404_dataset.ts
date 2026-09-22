import fs from 'fs';
let load = fs.readFileSync('src/data/loadDataset_v6.ts', 'utf8');
load = load.replace(/fetch\(entitiesPath\)/, "fetch(`${entitiesPath}?t=${Date.now()}`)");
load = load.replace(/fetch\(relationshipsPath\)/, "fetch(`${relationshipsPath}?t=${Date.now()}`)");
fs.writeFileSync('src/data/loadDataset_v6.ts', load);
