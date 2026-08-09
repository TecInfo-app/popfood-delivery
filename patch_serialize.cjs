const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

const serializeOld = `    Object.keys(payload).forEach(key => {
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

    return serialized;`;

const serializeNew = `    Object.keys(payload).forEach(key => {
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

    // Hack: Pack missing columns into customer_address JSONB for 'orders'
    if (realPath === 'orders' || path === 'orders' || path === 'COLLECTIONS.orders') {
        const extraKeys = ['chatMessages', 'chat_messages', 'deliveryPin', 'delivery_pin', 'hasUnreadCustomerMessage', 'hasUnreadStoreMessage', 'rating', 'fcmToken', 'fcm_token', 'couponCode', 'coupon_code', 'paymentStatus', 'payment_status'];
        const extraData = {};
        let hasExtra = false;
        
        extraKeys.forEach(k => {
            if (payload[k] !== undefined) {
                let niceKey = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
                extraData[niceKey] = payload[k];
                hasExtra = true;
                delete serialized[toDbFieldName(path, k)]; // Remove from root to avoid 400 Bad Request
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

    return serialized;`;

code = code.replace(serializeOld, serializeNew);

const deserializeOld = `    if (path === 'orders' || path === 'order') {
        if (row.total_price !== undefined) {
            deserialized.total = Number(row.total_price);
        } else if (row.total !== undefined) {
            deserialized.total = Number(row.total);
        }`;

const deserializeNew = `    if (path === 'orders' || path === 'order' || path === 'COLLECTIONS.orders') {
        if (row.total_price !== undefined) {
            deserialized.total = Number(row.total_price);
        } else if (row.total !== undefined) {
            deserialized.total = Number(row.total);
        }
        // Unpack from customer_address hack
        if (row.customer_address && typeof row.customer_address === 'object' && row.customer_address._meta) {
            Object.assign(deserialized, row.customer_address._meta);
        }`;

code = code.replace(deserializeOld, deserializeNew);

fs.writeFileSync('supabase-adapter.js', code);
