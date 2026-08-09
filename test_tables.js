import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const r1 = await supabase.from('restaurants').select('id, name').limit(5);
    console.log('restaurants:', r1.data);
    const r2 = await supabase.from('restaurant_profiles').select('id, name').limit(5);
    console.log('restaurant_profiles:', r2.data);
}
test();
