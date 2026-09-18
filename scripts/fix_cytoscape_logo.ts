import fs from 'fs';

let style = fs.readFileSync('src/graph/style.ts', 'utf8');

// The console log complains about `logoUrl` missing on some elements causing background-image failures.
// Let's ensure logoUrl is always defined even if empty string or we default it gracefully.
style = style.replace("'background-image': 'data(logoUrl)',", "'background-image': function(ele: any) { return ele.data('logoUrl') || 'none'; },");

fs.writeFileSync('src/graph/style.ts', style);

let be = fs.readFileSync('src/graph/buildElements.ts', 'utf8');
be = be.replace("logoUrl,", "logoUrl: logoUrl || '',");
fs.writeFileSync('src/graph/buildElements.ts', be);
