const fs = require('fs');

const files = [
  'acompanhamento.html',
  'cliente.html',
  'motoboy.html',
  'pedidos.html',
  'perfil.html'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/const \{ sendPushNotification \} = await import\('\.\/fcm-sender\.js'\);/g, "const sendPushNotification = async () => {};");
  content = content.replace(/import \{ sendPushNotification \} from "\.\/fcm-sender\.js";/g, "const sendPushNotification = async () => {};");
  content = content.replace(/const module = await import\("\.\/fcm-sender\.js"\);/g, "const module = { sendPushNotification: async () => {} };");
  
  fs.writeFileSync(file, content);
  console.log(`Cleaned ${file}`);
}
