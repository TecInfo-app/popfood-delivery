function fromDbFieldName(path, fieldName) {
    if (fieldName === 'chat_messages') return 'chatMessages';
    if (fieldName === 'has_unread_customer_message') return 'hasUnreadCustomerMessage';
    if (fieldName === 'has_unread_store_message') return 'hasUnreadStoreMessage';
    return fieldName; // simplified for test
}

function deserializeRow(path, row) {
    if (!row) return row;
    let deserialized = {};
    
    Object.keys(row).forEach(dbKey => {
        const camelKey = fromDbFieldName(path, dbKey);
        let val = row[dbKey];
        deserialized[camelKey] = val;
    });
    
    let parsedAddr = row.customer_address;
    let depth = 0;
    while (typeof parsedAddr === 'string' && depth < 3) {
        try {
            const next = JSON.parse(parsedAddr);
            parsedAddr = next;
        } catch (e) {
            break;
        }
        depth++;
    }

    if (parsedAddr && typeof parsedAddr === 'object') {
        const meta = parsedAddr._meta || parsedAddr._META;
        if (meta) {
            Object.assign(deserialized, meta);
        }
    }
    
    return deserialized;
}

const dbRow = {
  id: '123',
  chat_messages: [{ sender: 'customer', text: 'oi' }],
  has_unread_customer_message: true,
  customer_address: { address: 'Rua 1', _meta: { discount: 5 } }
};

console.log(deserializeRow('COLLECTIONS.orders', dbRow));
