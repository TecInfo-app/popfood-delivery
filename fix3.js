import fs from 'fs';
let content = fs.readFileSync('supabase-adapter-fixed.js', 'utf8');

// Inside getDocs (G) function, intercept categories:
content = content.replace(
    /return n&&Array\.isArray\(n\)\?\(o=n\.map\(i=>\$\(r\.path,i\)\),E\(r\.path,o\)\):o=v\(r\.path\),/g,
    `return n&&Array.isArray(n)?(o=n.map(i=>{
        let mapped = $(r.path, i);
        if (r.path === 'categories' || r.path === 'COLLECTIONS.categories') {
            const storeId = mapped.storeId || window.currentStoreId;
            if (storeId) {
                const profiles = v('restaurant_profiles') || [];
                const profile = profiles.find(p => String(p.id) === String(storeId));
                if (profile && profile.settings && profile.settings.categoryImages && profile.settings.categoryImages[mapped.id]) {
                    mapped.image = profile.settings.categoryImages[mapped.id];
                }
            }
        }
        return mapped;
    }),E(r.path,o)):o=v(r.path),`
);

// We need to do this in the unminified version, not the minified one!
