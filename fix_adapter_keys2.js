import fs from 'fs';

let content = fs.readFileSync('supabase-adapter.js', 'utf8');

if (!content.includes('has_unread_store_message')) {
    content = content.replace(
        /'has_unread_customer_message', 'ai_chat_enabled'/g,
        "'has_unread_customer_message', 'has_unread_store_message', 'ai_chat_enabled'"
    );

    content = content.replace(
        /if \(fieldName === 'hasUnreadCustomerMessage'\) return 'has_unread_customer_message';/g,
        `if (fieldName === 'hasUnreadCustomerMessage') return 'has_unread_customer_message';
    if (fieldName === 'hasUnreadStoreMessage') return 'has_unread_store_message';`
    );

    content = content.replace(
        /if \(fieldName === 'has_unread_customer_message'\) return 'hasUnreadCustomerMessage';/g,
        `if (fieldName === 'has_unread_customer_message') return 'hasUnreadCustomerMessage';
    if (fieldName === 'has_unread_store_message') return 'hasUnreadStoreMessage';`
    );

    fs.writeFileSync('supabase-adapter.js', content, 'utf8');
    console.log("Supabase Adapter Keys 2 Patched");
}
