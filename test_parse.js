const str = '{"ADDRESS":"AVENIDA CONSELHEIRO AGUIAR, BOA VIAGEM - RECIFE/PE, Nº 2775","_META":{"DELIVERYPIN":"5962","FCMTOKEN":"foo"}}';
const parsed = JSON.parse(str);
const clean = { ...parsed };
delete clean._meta;
delete clean._META;

const addressVal = clean.address || clean.ADDRESS || clean.street || clean.STREET || '';
const numberVal = clean.number || clean.NUMBER || clean.numero || clean.NUMERO || '';
const complementVal = clean.complement || clean.COMPLEMENT || clean.complemento || clean.COMPLEMENTO || '';
const referenceVal = clean.reference || clean.REFERENCE || clean.referencia || clean.REFERENCIA || '';
const neighborhoodVal = clean.neighborhood || clean.NEIGHBORHOOD || clean.bairro || clean.BAIRRO || '';
const cityVal = clean.city || clean.CITY || clean.cidade || clean.CIDADE || '';
const typeVal = clean.type || clean.TYPE || '';

let addrStr = addressVal;
if (numberVal) addrStr += `, Nº ${numberVal}`;
if (neighborhoodVal) addrStr += ` - ${neighborhoodVal}`;
if (cityVal) addrStr += `, ${cityVal}`;
if (complementVal) addrStr += ` (${complementVal})`;
if (referenceVal) addrStr += ` [Ref: ${referenceVal}]`;

console.log(addrStr);
