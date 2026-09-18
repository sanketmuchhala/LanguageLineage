import fs from 'fs';

let embed = fs.readFileSync('src/app/EmbedGraph.tsx', 'utf8');

// I left a call to normalizeDataset(raw) in here from an earlier search and replace, but loadDatasetV6 already returns normalized data.
embed = embed.replace(/const dataset = normalizeDataset\(raw\);/, "const dataset = raw;");
// fix the `e.data().from` to `e.from` and `e.data().to` to `e.to`
embed = embed.replace(/e\.data\(\)\.from/g, "e.from");
embed = embed.replace(/e\.data\(\)\.to/g, "e.to");

fs.writeFileSync('src/app/EmbedGraph.tsx', embed);
