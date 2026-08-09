import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('restaurants').select('id').eq('storeId', 'cia-do-chopp').maybeSingle();
    console.log(data, error);
}
test();
