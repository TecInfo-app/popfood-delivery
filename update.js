import { supabase, updateDoc } from './supabase-adapter.js';

console.log('Sending message to Supabase...');

updateDoc({ path: 'COLLECTIONS.orders', id: 'TEST1234' }, {
    chatMessages: [{sender: 'store', text: 'test'}],
    hasUnreadCustomerMessage: true
}).then(() => console.log('Done')).catch(e => console.error(e));
