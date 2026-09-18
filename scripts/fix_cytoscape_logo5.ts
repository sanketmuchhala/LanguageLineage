import fs from 'fs';

// Remove the background-image dynamic function that's breaking offscreencanvas
// Let cytoscape manage images correctly without our hack if it fails.
let style = fs.readFileSync('src/graph/style.ts', 'utf8');
style = style.replace("'background-image': function(ele: any) { const url = ele.data('logoUrl'); return (url && url !== '') ? `url('${url}')` : 'none'; },", "");
fs.writeFileSync('src/graph/style.ts', style);

// Instead of passing a broken or blank URL, completely omit logoUrl if not available.
let be = fs.readFileSync('src/graph/buildElements.ts', 'utf8');
be = be.replace("logoUrl: logoUrl ? logoUrl : undefined,", "");
fs.writeFileSync('src/graph/buildElements.ts', be);
