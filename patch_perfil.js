import fs from 'fs';

let content = fs.readFileSync('perfil.html', 'utf8');

if (!content.includes('uploadImageToStorage')) {
    content = content.replace(
        "where",
        "where,\n        uploadImageToStorage"
    );
}

const blobHelper = `
      window.base64ToBlob = function(base64, mimeType = 'image/jpeg') {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeType });
      };
`;

if (!content.includes('window.base64ToBlob')) {
    content = content.replace('window.optimizeAndConvertToBase64 =', blobHelper + '\n      window.optimizeAndConvertToBase64 =');
}

// Banner uploads
content = content.replace(
    /let base64;\n\s*if\s*\(file\.size > \d+\)\s*\{\n\s*base64 = await window\.optimizeAndConvertToBase64\(file, 950\);\n\s*\}\s*else\s*\{\n\s*base64 = await new Promise\(\(resolve, reject\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\);\n\s*\}/g,
    `let base64;
          if (file.size > 800000) {
            let b64 = await window.optimizeAndConvertToBase64(file, 950);
            const blob = window.base64ToBlob(b64, file.type || 'image/jpeg');
            blob.name = file.name || 'image.jpg';
            base64 = await uploadImageToStorage(blob, 'banners');
          } else {
            base64 = await uploadImageToStorage(file, 'banners');
          }`
);

// We should do the same for cardapio.html (or index.html if that's where products are added)
fs.writeFileSync('perfil.html', content, 'utf8');
console.log("Perfil Patched");
