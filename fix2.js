import fs from 'fs';
let content = fs.readFileSync('supabase-adapter-fixed.js', 'utf8');

content = content.replace(
    /updatePayload = \{ logo: logoVal, settings \};/g,
    "updatePayload = { settings }; if (realPath === 'restaurant_profiles') updatePayload.logo_url = logoVal; else updatePayload.logo = logoVal;"
);

fs.writeFileSync('supabase-adapter-fixed.js', content);
