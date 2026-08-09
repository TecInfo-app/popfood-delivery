const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');
code = code.replace(
  /return \(realPath === 'categories' \|\| realPath === 'products' \|\| realPath === 'coupons' \|\| realPath === 'customers' \|\| realPath === 'clients' \|\| realPath === 'orders'\);/,
  "return (realPath === 'products' || realPath === 'coupons' || realPath === 'customers');"
);
fs.writeFileSync('supabase-adapter.js', code);
