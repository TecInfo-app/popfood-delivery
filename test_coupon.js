import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
import { setDoc, doc, collection } from './supabase-adapter.js';

async function test() {
    const payload = {
      code: "TESTE1",
      discountType: "percentual",
      discountValue: 10,
      minOrderValue: 20,
      active: true,
      storeId: "cia-do-chopp"
    };
    try {
      await setDoc(doc(collection(null, "coupons"), "TESTE1"), payload);
      console.log("Success");
    } catch(e) {
      console.error(e);
    }
}
test();
