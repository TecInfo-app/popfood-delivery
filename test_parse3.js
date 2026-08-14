let str = '"{\\"ADDRESS\\":\\"AVENIDA\\"}"';
let depth = 0;
while (typeof str === 'string' && depth < 3) {
  try {
    const next = JSON.parse(str);
    if (typeof next === 'object' || typeof next === 'string') {
      str = next;
    } else {
      break;
    }
  } catch(e) {
    break;
  }
  depth++;
}
console.log(typeof str);
console.log(str);
