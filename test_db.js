import { supabase } from './supabase-adapter.js';

async function test() {
  const r1 = await supabase.from('restaurant_profiles').select('id, adminEmail, email').limit(5);
  console.log("restaurant_profiles:", r1.data);
  const r2 = await supabase.from('restaurants').select('id, adminEmail, email').limit(5);
  console.log("restaurants:", r2.data);
}
test();
