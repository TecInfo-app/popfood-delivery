const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

code = code.replace(
    /'updated_at', 'coupon_code', 'payment_status', 'chat_messages', 'delivery_pin'/,
    `'updated_at'`
);

fs.writeFileSync('supabase-adapter.js', code);
