import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxlbagladzeezdenfbrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGJhZ2xhZHplZXpkZW5mYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzIwNDEsImV4cCI6MjEwMTY0ODA0MX0.6-RbagE7tpaVc8RFGfwPDxWg7CswhyuIXjRRf-g1OSc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: c } = await supabase.from('restaurant_profiles').select('*').limit(1);
  console.log("restaurant_profiles keys:", c && c.length ? Object.keys(c[0]) : "no data");
  const { data: r } = await supabase.from('restaurants').select('*').limit(1);
  console.log("restaurants keys:", r && r.length ? Object.keys(r[0]) : "no data");
}
run();
