import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
    const { data, error } = await supabase.from('categories').select('*').eq('store_id', 'cia-do-chopp');
    console.log("Categories with store_id:", data, error);
    
    const { data: d2, error: e2 } = await supabase.from('categories').select('*').eq('storeId', 'cia-do-chopp');
    console.log("Categories with storeId:", d2, e2);
}
test();
