const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');
code = code.replace(
  /tableCache\['restaurants'\] = 'restaurants';\s*tableCache\['restaurant_profiles'\] = 'restaurants';\s*return 'restaurants';/,
  `tableCache['restaurants'] = 'restaurant_profiles';\n                tableCache['restaurant_profiles'] = 'restaurant_profiles';\n                return 'restaurant_profiles';`
);
fs.writeFileSync('supabase-adapter.js', code);
