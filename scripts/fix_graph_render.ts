import fs from 'fs';

let gv = fs.readFileSync('src/graph/GraphView.tsx', 'utf8');
gv = gv.replace("dataset.languageMap", "dataset.entityMap");
gv = gv.replace("dataset.languages", "dataset.entities");
gv = gv.replace("dataset.edges", "dataset.relationships");
fs.writeFileSync('src/graph/GraphView.tsx', gv);

let sel = fs.readFileSync('src/graph/selectors.ts', 'utf8');
sel = sel.replace("edge.from_language", "edge.from");
sel = sel.replace("edge.to_language", "edge.to");
fs.writeFileSync('src/graph/selectors.ts', sel);
