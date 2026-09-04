import { supabase, updateDoc } from './supabase-adapter.js';
console.log("Mocking updateDoc...");

const docRef = { path: 'COLLECTIONS.orders', id: '123' };
const data = {
  chatMessages: [{ sender: 'cliente', text: 'Hello!' }],
  hasUnreadStoreMessage: false,
  hasUnreadCustomerMessage: true
};

import fs from 'fs';
let adapterContent = fs.readFileSync('supabase-adapter.js', 'utf8');

// We just need to check what serializeRow produces.
function simulateSerializeRow(payload) {
    const validCols = [ 'id', 'chat_messages', 'has_unread_customer_message', 'has_unread_store_message' ];
    const serialized = {};
    Object.keys(payload).forEach(key => {
        let dbKey = key;
        if (key === 'chatMessages') dbKey = 'chat_messages';
        if (key === 'hasUnreadCustomerMessage') dbKey = 'has_unread_customer_message';
        if (key === 'hasUnreadStoreMessage') dbKey = 'has_unread_store_message';
        
        if (validCols.includes(dbKey)) {
            serialized[dbKey] = payload[key];
        }
    });
    
    // Simulate extraKeys
    const extraKeys = [ 'deliveryPin', 'rating' ];
    const extraData = {};
    let hasExtra = false;
    extraKeys.forEach(k => {
        if (payload[k] !== undefined) {
            extraData[k] = payload[k];
            hasExtra = true;
            if (!validCols.includes(k)) {
                delete serialized[k];
            }
        }
    });
    if (hasExtra) {
        serialized.customer_address = { _meta: extraData };
    }
    return serialized;
}

console.log(simulateSerializeRow(data));
