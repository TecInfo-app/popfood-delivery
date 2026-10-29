import fs from 'fs';

const filePath = 'supabase-adapter.js';
let content = fs.readFileSync(filePath, 'utf8');

const uploadFunc = `
export const uploadImageToStorage = async (file, folder = 'uploads') => {
    try {
        const ext = file.name.split('.').pop();
        const fileName = \`\${folder}/\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}.\${ext}\`;
        
        const { data, error } = await supabase.storage.from('images').upload(fileName, file, {
            cacheControl: '31536000, public, immutable',
            upsert: false
        });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
        return urlData.publicUrl;
    } catch (e) {
        console.error('Error uploading image:', e);
        throw e;
    }
};
`;

if (!content.includes('uploadImageToStorage')) {
    content += '\n' + uploadFunc;
    
    // add it to exports
    content = content.replace(
        "export { db, supabase };",
        "export { db, supabase, uploadImageToStorage };"
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Storage func added to adapter");
}
