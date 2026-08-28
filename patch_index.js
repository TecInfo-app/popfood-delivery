import fs from 'fs';

let content = fs.readFileSync('index.html', 'utf8');

// 1. Category Image Upload
content = content.replace(
    /let base64;\n\s*if\s*\(window\.optimizeAndConvertToBase64\)\s*\{\n\s*base64\s*=\s*await\s*window\.optimizeAndConvertToBase64\(file, 950\);\n\s*\}\s*else\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\);\n\s*\}/,
    `let base64;
          if (window.optimizeAndConvertToBase64) {
            let b64 = await window.optimizeAndConvertToBase64(file, 950);
            const blob = window.base64ToBlob(b64, file.type || 'image/jpeg');
            blob.name = file.name || 'image.jpg';
            base64 = await uploadImageToStorage(blob, 'categories');
          } else {
            base64 = await uploadImageToStorage(file, 'categories');
          }`
);

// 2. Product Image Upload
content = content.replace(
    /if\s*\(window\.optimizeAndConvertToBase64\)\s*\{\n\s*imageBase64Data\s*=\s*await\s*window\.optimizeAndConvertToBase64\(file, 950\);\n\s*\}\s*else\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\);\n\s*\}/,
    `if (window.optimizeAndConvertToBase64) {
          let b64 = await window.optimizeAndConvertToBase64(file, 950);
          const blob = window.base64ToBlob(b64, file.type || 'image/jpeg');
          blob.name = file.name || 'image.jpg';
          imageBase64Data = await uploadImageToStorage(blob, 'products');
        } else {
          imageBase64Data = await uploadImageToStorage(file, 'products');
        }`
);

// 3. Complement Option Image Upload (Directly)
content = content.replace(
    /let base64;\n\s*if\s*\(window\.optimizeAndConvertToBase64\)\s*\{\n\s*base64\s*=\s*await\s*window\.optimizeAndConvertToBase64\(file, 950\);\n\s*\}\s*else\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\);\n\s*\}/,
    `let base64;
        if (window.optimizeAndConvertToBase64) {
          let b64 = await window.optimizeAndConvertToBase64(file, 950);
          const blob = window.base64ToBlob(b64, file.type || 'image/jpeg');
          blob.name = file.name || 'image.jpg';
          base64 = await uploadImageToStorage(blob, 'complements');
        } else {
          base64 = await uploadImageToStorage(file, 'complements');
        }`
);

// 4. Complement Option Image Upload (New option)
content = content.replace(
    /if\s*\(window\.optimizeAndConvertToBase64\)\s*\{\n\s*optionImage\s*=\s*await\s*window\.optimizeAndConvertToBase64\(file, 950\);\n\s*\}\s*else\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}\);\n\s*\}/,
    `if (window.optimizeAndConvertToBase64) {
            let b64 = await window.optimizeAndConvertToBase64(file, 950);
            const blob = window.base64ToBlob(b64, file.type || 'image/jpeg');
            blob.name = file.name || 'image.jpg';
            optionImage = await uploadImageToStorage(blob, 'complements');
          } else {
            optionImage = await uploadImageToStorage(file, 'complements');
          }`
);

fs.writeFileSync('index.html', content, 'utf8');
console.log("INDEX PATCHED");
