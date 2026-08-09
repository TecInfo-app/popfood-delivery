import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function test() {
    console.log(process.env.VITE_SUPABASE_URL);
    // Actually we don't have direct SQL access through supabase-js unless rpc.
}
test();
