import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function test() {
    const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/', {
        headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY }
    });
    // Check publications
    const { data, error } = await supabase.rpc('get_publications'); // or query pg_publication?
    console.log(data, error);
}
test();
