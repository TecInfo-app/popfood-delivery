const tableColumns = {
    orders: [
        'id', 'store_id', 'customer_name', 'customer_phone', 'customer_address', 'status', 'payment_method', 
        'payment_status', 'total', 'items', 'delivery_fee', 'coupon_code', 'created_at', 'chat_messages', 'has_unread_customer_message', 'has_unread_store_message', 'ai_chat_enabled'
    ]
};

function toDbFieldName(path, fieldName) {
    if (fieldName === 'chatMessages') return 'chat_messages';
    if (fieldName === 'hasUnreadCustomerMessage') return 'has_unread_customer_message';
    if (fieldName === 'hasUnreadStoreMessage') return 'has_unread_store_message';
    if (fieldName === 'aiChatEnabled') return 'ai_chat_enabled';
    return fieldName; // simplified for test
}

function checkIsUuidTable() { return false; }

function serializeRow(path, realPath, payload, existingSettings = {}) {
    if (!payload) return payload;
    
    const serialized = {};
    const isUuidTable = checkIsUuidTable(realPath);
    const validCols = tableColumns[realPath] || [];

    Object.keys(payload).forEach(key => {
        let dbKey = toDbFieldName(path, key);
        let val = payload[key];
        
        if (validCols.includes(dbKey)) {
            serialized[dbKey] = val;
        }
    });
    
    // Handle 'orders' packing
    if (realPath === 'orders' || path === 'orders' || path === 'COLLECTIONS.orders') {
        const extraKeys = [
            'deliveryPin', 'delivery_pin', 
            'rating', 
            'fcmToken', 'fcm_token', 'couponCode', 'coupon_code', 'cupomCode', 'cupom_code', 'cupomId',
            'subtotal', 'discount', 'discountAmount', 'desconto', 'descontoCupom', 'descontoFidelidade', 
            'fidelidadeAtivo', 'observacao', 'changeFor', 'trocoPara', 'troco', 'customer', 'isFirstOrder', 'cpf'
        ];
        
        const extraData = {};
        let hasExtra = false;
        
        extraKeys.forEach(k => {
            if (payload[k] !== undefined) {
                let niceKey = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
                extraData[niceKey] = payload[k];
                hasExtra = true;
                const dbK = toDbFieldName(path, k);
                if (!validCols.includes(dbK)) {
                    delete serialized[dbK];
                }
            }
        });
        
        if (hasExtra) {
            let addrObj = serialized.customer_address || payload.customerAddress || payload.customer_address || {};
            if (typeof addrObj === 'string') {
                addrObj = { address: addrObj };
            }
            if (typeof addrObj === 'object') {
                serialized.customer_address = { 
                    ...addrObj, 
                    _meta: { ...(addrObj._meta || {}), ...extraData } 
                };
            }
        }
    }
    
    return serialized;
}

const data = {
  chatMessages: [{ sender: 'customer', text: 'oi' }],
  hasUnreadCustomerMessage: true
};

console.log(serializeRow('COLLECTIONS.orders', 'orders', data));
