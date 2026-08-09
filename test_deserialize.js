import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function tryDecodeUuid(str) {
    if (!str) return str;
    if (String(str).length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-7005-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
        return "cia-do-chopp"; 
    }
    return str;
}

function fromDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    if (path === 'restaurants' || path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurants' || path === 'COLLECTIONS.restaurantProfiles') return fieldName;
    if (fieldName === 'customer_name') return 'customerName';
    if (fieldName === 'customer_phone') return 'customerPhone';
    if (fieldName === 'customer_address') return 'customerAddress';
    if (fieldName === 'delivery_fee') return 'deliveryFee';
    if (fieldName === 'payment_method') return 'paymentMethod';
    if (fieldName === 'created_at') return 'createdAt';
    if (fieldName === 'updated_at') return 'updatedAt';
    if (fieldName === 'total_price') return 'totalPrice';
    if (fieldName === 'discount') return 'discountAmount';
    if (fieldName === 'coupon_code') return 'couponCode';
    if (fieldName === 'discount_type') return 'discountType';
    if (fieldName === 'discount_value') return 'discountValue';
    if (fieldName === 'min_order_value') return 'minOrderValue';

    return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function deserializeRow(path, row) {
    if (!row) return row;
    let deserialized = {};
    
    Object.keys(row).forEach(dbKey => {
        const camelKey = fromDbFieldName(path, dbKey);
        let val = row[dbKey];
        if (camelKey === 'id') {
            val = tryDecodeUuid(val);
        }
        deserialized[camelKey] = val;
    });
    
    if (path === 'orders' || path === 'order' || path === 'COLLECTIONS.orders') {
        if (row.total_price !== undefined) {
            deserialized.total = Number(row.total_price);
        } else if (row.total !== undefined) {
            deserialized.total = Number(row.total);
        }
        // Unpack from customer_address hack
        if (row.customer_address && typeof row.customer_address === 'object' && row.customer_address._meta) {
            Object.assign(deserialized, row.customer_address._meta);
        }
        if (row.delivery_fee !== undefined) {
            deserialized.deliveryFee = Number(row.delivery_fee);
        }
        if (row.subtotal !== undefined) {
            deserialized.subtotal = Number(row.subtotal);
        }
        if (row.discount !== undefined) {
            deserialized.discountAmount = Number(row.discount);
        }
        if (row.customer_address !== undefined) {
            if (typeof row.customer_address === 'string') {
                deserialized.customerAddress = row.customer_address;
                deserialized.address = row.customer_address;
            } else if (row.customer_address && typeof row.customer_address === 'object') {
                const copy = { ...row.customer_address };
                delete copy._meta;
                deserialized.customerAddress = copy;
                deserialized.address = copy;
            }
        }
        if (row.items && Array.isArray(row.items)) {
            deserialized.items = row.items;
        }
    }
    
    return deserialized;
}

async function test() {
    const { data, error } = await supabase.from('orders').select('*').eq('id', '00000000-0000-7005-a046-363536343535').single();
    console.log("DB Row:", JSON.stringify(data));
    const deserialized = deserializeRow('orders', data);
    console.log("Deserialized:", deserialized);
}
test();
