import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function getDeterministicUuid(str) {
    const sStr = String(str).trim();
    if (!sStr) return str;
    if (sStr.length <= 15 && /^[\w-]+$/.test(sStr)) {
        let hex = '';
        for (let i = 0; i < sStr.length; i++) {
            hex += sStr.charCodeAt(i).toString(16).padStart(2, '0');
        }
        hex = hex.padStart(30, '0');
        
        const part1 = hex.slice(0, 8);
        const part2 = hex.slice(8, 12);
        const part3 = '7' + hex.slice(12, 15);
        const part4 = 'a' + hex.slice(15, 18);
        const part5 = hex.slice(18, 30);
        
        return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
    }
    return str;
}

const tableColumns = {
    'orders': ['id', 'store_id', 'customer_name', 'customer_phone', 'customer_address', 'status', 'total_price', 'subtotal', 'delivery_fee', 'discount', 'payment_method', 'items', 'created_at', 'updated_at']
};
function toDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    return fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function serializeRow(path, realPath, payload) {
    if (!payload) return payload;
    const serialized = {};
    const isUuidTable = true;
    const validCols = tableColumns[realPath] || [];

    Object.keys(payload).forEach(key => {
        let dbKey = toDbFieldName(path, key);
        let val = payload[key];
        
        if (key === 'id' && isUuidTable) {
            val = getDeterministicUuid(val);
        } else if (key === 'paused') {
            if (validCols.includes('active')) {
                serialized['active'] = !val;
            }
            if (validCols.includes('is_active')) {
                serialized['is_active'] = !val;
            }
            return;
        } else if (key === 'active') {
            if (validCols.includes('active')) {
                serialized['active'] = !!val;
            }
            if (validCols.includes('is_active')) {
                serialized['is_active'] = !!val;
            }
            return;
        } else if (key === 'categoryId') {
            if (validCols.includes('category_id')) {
                serialized['category_id'] = getDeterministicUuid(val);
                return;
            }
        }
        
        if (validCols.includes(dbKey)) {
            serialized[dbKey] = val;
        }
    });

    if (realPath === 'orders' || path === 'orders' || path === 'COLLECTIONS.orders') {
        const extraKeys = ['chatMessages', 'chat_messages', 'deliveryPin', 'delivery_pin', 'hasUnreadCustomerMessage', 'hasUnreadStoreMessage', 'rating', 'fcmToken', 'fcm_token', 'couponCode', 'coupon_code', 'paymentStatus', 'payment_status'];
        const extraData = {};
        let hasExtra = false;
        
        extraKeys.forEach(k => {
            if (payload[k] !== undefined) {
                let niceKey = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
                extraData[niceKey] = payload[k];
                hasExtra = true;
                delete serialized[toDbFieldName(path, k)];
            }
        });
        
        if (hasExtra) {
            serialized.customer_address = serialized.customer_address || payload.customerAddress || payload.customer_address || {};
            if (typeof serialized.customer_address === 'object') {
                serialized.customer_address = { ...serialized.customer_address };
                serialized.customer_address._meta = { ...(serialized.customer_address._meta || {}), ...extraData };
            }
        }
    }

    return serialized;
}

async function test() {
    const data = { 
        status: 'Finalizado', 
        chatMessages: [{text: 'oi'}]
    };
    const targetId = '00000000-0000-7005-a046-363536343535';
    const serialized = serializeRow('COLLECTIONS.orders', 'orders', data);
    console.log("Serialized:", serialized);
    const { error } = await supabase.from('orders').update(serialized).eq('id', targetId);
    console.log("Error:", error);
}
test();
