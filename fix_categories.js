import fs from 'fs';

let content = fs.readFileSync('supabase-adapter.js', 'utf8');

// Inside serializeRow, if it's categories and image is passed, it won't be serialized to validCols because validCols doesn't have image.
// We can intercept the image write in `updateDoc` and `setDoc`.

const setDocCode = `
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
`;
const newSetDocCode = `
        if ((realPath === 'categories' || docRef.path.includes('categories')) && payload.image !== undefined) {
            try {
                const storeId = payload.storeId || payload.store_id || window.currentStoreId;
                if (storeId) {
                    const { data: profile } = await supabase.from('restaurant_profiles').select('settings').eq('id', storeId).maybeSingle();
                    const settings = profile?.settings || {};
                    if (!settings.categoryImages) settings.categoryImages = {};
                    settings.categoryImages[docRef.id] = payload.image;
                    await supabase.from('restaurant_profiles').update({ settings }).eq('id', storeId);
                }
            } catch(e) {}
        }
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
`;

content = content.replace(setDocCode, newSetDocCode);

const updateDocCode = `
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
`;
const newUpdateDocCode = `
        if ((realPath === 'categories' || docRef.path.includes('categories')) && data.image !== undefined) {
            try {
                const items = getLocalCollection(docRef.path);
                const idx = items.findIndex(i => String(i.id) === String(docRef.id));
                const storeId = data.storeId || data.store_id || (items[idx]?.storeId) || window.currentStoreId;
                if (storeId) {
                    const { data: profile } = await supabase.from('restaurant_profiles').select('settings').eq('id', storeId).maybeSingle();
                    const settings = profile?.settings || {};
                    if (!settings.categoryImages) settings.categoryImages = {};
                    settings.categoryImages[docRef.id] = data.image;
                    await supabase.from('restaurant_profiles').update({ settings }).eq('id', storeId);
                }
            } catch(e) {}
        }
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
`;

// we need to replace only the updateDoc one, but it's identical string.
// let's do it carefully.
content = content.replace(
    /export const updateDoc = async \(docRef, data\) => \{[\s\S]*?if \(realPath === 'restaurants' \|\| realPath === 'restaurant_profiles'\) \{/,
    (match) => {
        return match.replace(
            "if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {",
            newUpdateDocCode.trim()
        );
    }
);

// Now for reading in `deserializeRow` or `getDocs`:
// Actually, `deserializeRow` doesn't have access to profile.
// But `getDocs` does. Let's find `getDocs` `return n && Array.isArray(n)`
const deserializeCode = `        Object.keys(row).forEach(key => {`;
const newDeserializeCode = `
        if (realPath === 'categories' || path.includes('categories')) {
            try {
                const storeId = row.store_id || row.storeId || window.currentStoreId;
                const profiles = getLocalCollection('restaurant_profiles');
                const profile = profiles.find(p => String(p.id) === String(storeId));
                if (profile?.settings?.categoryImages?.[row.id]) {
                    deserialized.image = profile.settings.categoryImages[row.id];
                }
            } catch(e) {}
        }
        Object.keys(row).forEach(key => {`;

content = content.replace(deserializeCode, newDeserializeCode);

fs.writeFileSync('supabase-adapter.js', content);
