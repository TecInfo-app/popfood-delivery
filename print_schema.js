const spec = require('./spec.json');
for (const table in spec) {
  if (spec[table].properties) {
    console.log(`\n=== ${table} ===`);
    console.log(Object.keys(spec[table].properties).join(', '));
  }
}
