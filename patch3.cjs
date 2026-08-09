const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

code = code.replace(/function fromDbFieldName\(path, fieldName\) {\n    if \(!fieldName\) return fieldName;/, `function fromDbFieldName(path, fieldName) {\n    if (!fieldName) return fieldName;\n    if (path === 'restaurants' || path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurants' || path === 'COLLECTIONS.restaurantProfiles') return fieldName;`);

fs.writeFileSync('supabase-adapter.js', code);
