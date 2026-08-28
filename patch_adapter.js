import fs from 'fs';

let content = fs.readFileSync('supabase-adapter.js', 'utf8');

// Add the new columns to the allowed orders columns array
content = content.replace(
    /'payment_status', 'total', 'items', 'delivery_fee', 'coupon_code', 'created_at'/g,
    "'payment_status', 'total', 'items', 'delivery_fee', 'coupon_code', 'created_at', 'chat_messages', 'has_unread_customer_message', 'ai_chat_enabled'"
);

// Add mapping to snake_case in translatePayloadToSupabase
content = content.replace(
    /if \(fieldName === 'customerName'\) return 'customer_name';/g,
    `if (fieldName === 'customerName') return 'customer_name';
    if (fieldName === 'chatMessages') return 'chat_messages';
    if (fieldName === 'hasUnreadCustomerMessage') return 'has_unread_customer_message';
    if (fieldName === 'aiChatEnabled') return 'ai_chat_enabled';`
);

// Add mapping to camelCase in translateRowFromSupabase
content = content.replace(
    /if \(fieldName === 'customer_name'\) return 'customerName';/g,
    `if (fieldName === 'customer_name') return 'customerName';
    if (fieldName === 'chat_messages') return 'chatMessages';
    if (fieldName === 'has_unread_customer_message') return 'hasUnreadCustomerMessage';
    if (fieldName === 'ai_chat_enabled') return 'aiChatEnabled';`
);

fs.writeFileSync('supabase-adapter.js', content, 'utf8');
console.log("Supabase Adapter Patched for Chat");
