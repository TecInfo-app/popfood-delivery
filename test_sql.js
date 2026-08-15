import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxlbagladzeezdenfbrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGJhZ2xhZHplZXpkZW5mYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzIwNDEsImV4cCI6MjEwMTY0ODA0MX0.6-RbagE7tpaVc8RFGfwPDxWg7CswhyuIXjRRf-g1OSc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE categories ADD COLUMN image_url TEXT;' });
  console.log("RPC result:", error || data);
}
run();
