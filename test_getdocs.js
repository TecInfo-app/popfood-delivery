import { config } from 'dotenv';
config();
import { getDocs, query, collection, where } from './supabase-adapter.js';

async function test() {
    console.log("Testing categories (camel table):");
    const q1 = query(collection(null, 'categories'), where('storeId', '==', 'cia-do-chopp'));
    const r1 = await getDocs(q1);
    console.log("Categories docs length:", r1.docs.length);

    console.log("Testing products (snake table):");
    const q2 = query(collection(null, 'products'), where('storeId', '==', 'cia-do-chopp'));
    const r2 = await getDocs(q2);
    console.log("Products docs length:", r2.docs.length);
}
test();
