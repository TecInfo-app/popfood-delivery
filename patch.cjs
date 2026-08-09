const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

code = code.replace(/if \(!fieldName\) return fieldName;/, `if (!fieldName) return fieldName;\n    if (path === 'restaurants' || path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurants' || path === 'COLLECTIONS.restaurantProfiles') return fieldName;`);

code = code.replace(/if \(!dbFieldName\) return dbFieldName;/, `if (!dbFieldName) return dbFieldName;\n    if (path === 'restaurants' || path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurants' || path === 'COLLECTIONS.restaurantProfiles') return dbFieldName;`);

fs.writeFileSync('supabase-adapter.js', code);
