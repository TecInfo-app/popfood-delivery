import { config } from 'dotenv';
config();
async function test() {
    const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/', { headers: { 'apikey': process.env.VITE_SUPABASE_ANON_KEY } });
    const spec = await res.json();
    for(const key of Object.keys(spec.definitions)) {
        if(spec.definitions[key].properties.store_id) {
             console.log(key, spec.definitions[key].properties.store_id.description);
        }
    }
}
test();
