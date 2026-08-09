import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function test() {
    const { data: rests } = await supabase.from('restaurants').select('*');
    if (rests) {
        for (const r of rests) {
            console.log("Copying", r.id);
            const { error } = await supabase.from('restaurant_profiles').upsert({
                id: r.id,
                name: r.name,
                description: r.description,
                logo_url: r.logo,
                phone: r.phone,
                address: r.address,
                created_at: r.createdAt || r.created_at || new Date().toISOString()
            });
            if (error) console.error("Error for", r.id, error);
        }
    }
}
test();
