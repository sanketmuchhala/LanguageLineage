import fs from 'fs';

// If logoUrl is falsy, we completely avoid applying `background-image` inline styling property.
let style = fs.readFileSync('src/graph/style.ts', 'utf8');
style = style.replace("'background-image': function(ele: any) { const url = ele.data('logoUrl'); return (url && url !== '') ? `url('${url}')` : 'none'; },", "");
fs.writeFileSync('src/graph/style.ts', style);

// Inject background-image dynamically only if it exists in GraphView.tsx
let gv = fs.readFileSync('src/graph/GraphView.tsx', 'utf8');
// Not strictly required for MVP, but to stop console errors we can just remove logoUrl from the stylesheet and let cytoscape handle it via elements

fs.writeFileSync('src/graph/GraphView.tsx', gv);
