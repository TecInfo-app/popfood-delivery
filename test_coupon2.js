import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
    const payload = {
        id: "248e91d8-04c9-59eb-a1d2-dc12d35f2991",
        code: "TESTE1",
        discount_type: "percentual",
        discount_value: 10,
        min_order_value: 20,
        active: true,
        store_id: "cia-do-chopp"
    };
    const { data, error } = await supabase.from('coupons').upsert(payload);
    console.log("Upsert result:", data, error);
}
test();
