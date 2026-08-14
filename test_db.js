import { supabase } from './supabase-adapter.js';

async function test() {
  const r1 = await supabase.from('categories').select('*');
  console.log("Categories in Supabase:", r1.data, r1.error);
  
  const r2 = await supabase.from('products').select('*');
  console.log("Products in Supabase count:", r2.data ? r2.data.length : 0, r2.error);
  if (r2.data) {
    console.log("Products list:", r2.data.map(p => ({ id: p.id, name: p.name, store_id: p.store_id, image_url: p.image_url ? p.image_url.substring(0, 30) + '...' : null })));
  }
}
test();

