import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxlbagladzeezdenfbrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGJhZ2xhZHplZXpkZW5mYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzIwNDEsImV4cCI6MjEwMTY0ODA0MX0.6-RbagE7tpaVc8RFGfwPDxWg7CswhyuIXjRRf-g1OSc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('products').upsert({
     id: '3773173d-9d48-43fc-b0b3-f6617a2517de',
     store_id: 'cia-do-chopp',
     name: 'Test Product',
     price: 10,
     image_url: 'data:image/jpeg;base64,abc'
  });
  console.log("Upsert error:", error);
}
run();
