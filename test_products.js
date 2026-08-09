import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
    const r1 = await supabase.from('products').select('*').limit(5);
    console.log('products:', r1.data);
}
test();
