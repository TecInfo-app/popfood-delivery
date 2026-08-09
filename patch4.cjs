const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');
const regex = /if \(!err2 \|\| !err2\.message\?\.includes\('does not exist'\)\) \{[\s\S]*?return 'restaurants';\n\s*\}/;
const replacement = `if (!err2 || !err2.message?.includes('does not exist')) {
                // If BOTH exist, prioritize restaurant_profiles for 'restaurantProfile' collection
                if (path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurantProfiles' || path === 'COLLECTIONS.restaurantProfile') {
                    tableCache[path] = 'restaurant_profiles';
                    return 'restaurant_profiles';
                }
                tableCache['restaurants'] = 'restaurants';
                tableCache['restaurant_profiles'] = 'restaurants';
                return 'restaurants';
            }`;
code = code.replace(regex, replacement);
fs.writeFileSync('supabase-adapter.js', code);
