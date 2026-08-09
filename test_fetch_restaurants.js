import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing eq(storeId)");
    const { data, error } = await supabase.from('restaurants').select('*').eq('storeId', 'cia-do-chopp').limit(1);
    console.log(data, error);
}
test();
