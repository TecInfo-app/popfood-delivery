const fromDbFieldName = (path, fieldName) => {
    if (fieldName === 'chat_messages') return 'chatMessages';
    if (fieldName === 'has_unread_customer_message') return 'hasUnreadCustomerMessage';
    if (fieldName === 'has_unread_store_message') return 'hasUnreadStoreMessage';
    return fieldName;
};

const deserializeRow = (path, row) => {
    if (!row) return row;
    let deserialized = {};
    
    Object.keys(row).forEach(dbKey => {
        const camelKey = fromDbFieldName(path, dbKey);
        let val = row[dbKey];
        deserialized[camelKey] = val;
    });

    return deserialized;
};

const row = {
    id: "123",
    chat_messages: [{ text: "Teste supabase ok" }],
    has_unread_store_message: true
};

console.log(deserializeRow('COLLECTIONS.orders', row));
