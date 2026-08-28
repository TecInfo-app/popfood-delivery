import fs from 'fs';
let content = fs.readFileSync('index.html', 'utf8');

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

fs.writeFileSync('index.html', content, 'utf8');
