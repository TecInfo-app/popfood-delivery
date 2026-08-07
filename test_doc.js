import { doc, collection } from './supabase-adapter.js';
console.log(doc({}, 'products', '123'));
console.log(doc(collection({}, 'products')));
