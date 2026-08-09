const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

code = code.replace(/const p = path.replace\('COLLECTIONS\.', ''\);/g, `const p = (path || '').replace('COLLECTIONS.', '');`);

fs.writeFileSync('supabase-adapter.js', code);
