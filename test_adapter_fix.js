import fs from 'fs';

let content = fs.readFileSync('supabase-adapter.js', 'utf8');

// fix setDoc
content = content.replace(
    /const serialized = serializeRow\(docRef.path, realPath, payload\);\s*serialized.id = docRef.id;\s*await supabase\.from\(realPath\)\.upsert\(serialized, \{ onConflict: 'id' \}\);/,
    "const { data: existingData } = await supabase.from(realPath).select('settings').eq('id', docRef.id).maybeSingle();\n            const existingSettings = existingData?.settings || {};\n            const serialized = serializeRow(docRef.path, realPath, payload, existingSettings);\n            serialized.id = docRef.id;\n            await supabase.from(realPath).upsert(serialized, { onConflict: 'id' });"
);

// fix updateDoc
content = content.replace(
    /if \(realPath === 'restaurants' \|\| realPath === 'restaurant_profiles'\) \{\s*const serialized = serializeRow\(docRef\.path, realPath, data\);\s*await supabase\.from\(realPath\)\.update\(serialized\)\.eq\('id', docRef\.id\);\s*\}/,
    "if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {\n            const { data: existingData } = await supabase.from(realPath).select('settings').eq('id', docRef.id).maybeSingle();\n            const existingSettings = existingData?.settings || {};\n            const serialized = serializeRow(docRef.path, realPath, data, existingSettings);\n            await supabase.from(realPath).update(serialized).eq('id', docRef.id);\n        }"
);

fs.writeFileSync('supabase-adapter-fixed.js', content);
