import { config } from 'dotenv';
config();
async function test() {
    const res = await fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/', {
        headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY }
    });
    const spec = await res.json();
    console.log(JSON.stringify(spec.definitions, null, 2));
}
test();
