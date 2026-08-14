const str = '"{\\"ADDRESS\\":\\"AVENIDA CONSELHEIRO AGUIAR, BOA VIAGEM - RECIFE/PE, Nº 2775\\",\\"_META\\":{\\"DELIVERYPIN\\":\\"5962\\",\\"FCMTOKEN\\":\\"foo\\"}}"';
let parsed = str;
if (typeof str === 'string' && str.trim().startsWith('{')) {
  try {
    parsed = JSON.parse(str);
  } catch(e) {}
}
console.log(typeof parsed);
console.log(parsed);
