import fs from 'fs';

let content = fs.readFileSync('supabase-adapter.js', 'utf8');

// Remove chat-related keys from extraKeys so they don't get packed into customer_address
content = content.replace(
    /'chatMessages', 'chat_messages', /g,
    ''
);
content = content.replace(
    /'hasUnreadCustomerMessage', 'hasUnreadStoreMessage', /g,
    ''
);
content = content.replace(
    /'aiChatEnabled', /g, // just in case it's there
    ''
);

fs.writeFileSync('supabase-adapter.js', content, 'utf8');
console.log("Supabase Adapter Keys Patched");
