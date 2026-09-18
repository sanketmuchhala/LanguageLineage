import fs from 'fs';

// If logoUrl is truly not present or empty string, we should just return none.
// The browser log indicates that elements WITHOUT a logo are resolving to empty string and Cytoscape throws TypeError reading its value.
let style = fs.readFileSync('src/graph/style.ts', 'utf8');
style = style.replace("'background-image': function(ele: any) { const url = ele.data('logoUrl'); return url ? `url('${url}')` : 'none'; },", "'background-image': function(ele: any) { const url = ele.data('logoUrl'); return (url && url !== '') ? `url('${url}')` : 'none'; },");
fs.writeFileSync('src/graph/style.ts', style);

let be = fs.readFileSync('src/graph/buildElements.ts', 'utf8');
// For build elements, if logoUrl is missing or falsy, set it to undefined explicitly so Cytoscape knows it has no data.
be = be.replace("logoUrl: logoUrl || undefined,", "logoUrl: logoUrl ? logoUrl : undefined,");
fs.writeFileSync('src/graph/buildElements.ts', be);
