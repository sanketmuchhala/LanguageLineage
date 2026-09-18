import fs from 'fs';

let style = fs.readFileSync('src/graph/style.ts', 'utf8');

// The crash is because `ele.data('logoUrl') || 'none'` results in `'none'`, which is a valid value,
// but cytoscape expects a url() wrapper or absolutely nothing.
style = style.replace("'background-image': function(ele: any) { return ele.data('logoUrl') || 'none'; },", "'background-image': function(ele: any) { const url = ele.data('logoUrl'); return url ? `url('${url}')` : 'none'; },");

fs.writeFileSync('src/graph/style.ts', style);

let be = fs.readFileSync('src/graph/buildElements.ts', 'utf8');
be = be.replace("logoUrl: logoUrl || '',", "logoUrl: logoUrl || undefined,");
fs.writeFileSync('src/graph/buildElements.ts', be);
