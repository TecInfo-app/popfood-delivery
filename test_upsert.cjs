const { createClient } = require('@supabase/supabase-js');
const url = 'https://xxlbagladzeezdenfbrq.supabase.co';
const key = require('dotenv').config().parsed.SUPABASE_SERVICE_KEY;
const supabase = createClient(url, key);

// Import serializeRow logic
function getDeterministicUuid(str) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
        return str;
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    const hex = Math.abs(hash).toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${hex.padEnd(12, '0')}`;
}

const tableColumns = {
    products: [
        'id', 'store_id', 'category_id', 'name', 'description', 'price', 'promotional_price', 
        'image_url', 'active', 'is_active', 'sort_order', 'complements', 'created_at', 'updated_at', 'category'
    ]
};

function toDbFieldName(path, fieldName) {
    if (fieldName === 'storeId') return 'store_id';
    if (fieldName === 'categoryId') return 'category_id';
    return fieldName;
}

function serializeRow(payload) {
    const serialized = {};
    const validCols = tableColumns.products;
    Object.keys(payload).forEach(key => {
        let dbKey = toDbFieldName('products', key);
        let val = payload[key];
        
        if (key === 'id') val = getDeterministicUuid(val);
        else if (key === 'categoryId') {
            if (validCols.includes('category_id')) {
                serialized['category_id'] = getDeterministicUuid(val);
                return;
            }
        }
        
        if (validCols.includes(dbKey)) {
            serialized[dbKey] = val;
        }
    });
    return serialized;
}

const prdId = "PRD-" + Date.now().toString(36);
const catId = "CAT-" + Date.now().toString(36);

const productBlock = {
    id: prdId,
    name: 'Test Burger',
    pdvCode: '123',
    price: 20.00,
    stock: null,
    originalPrice: null,
    categoryId: catId,
    description: 'A test burger',
    image: '',
    paused: false,
    exclusivo: false,
    availableDays: [0, 1],
    availableTimeStart: null,
    availableTimeEnd: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    storeId: 'cia-do-chopp'
};

async function test() {
    const serialized = serializeRow(productBlock);
    console.log("Serialized payload:", serialized);
    const { data, error } = await supabase.from('products').upsert(serialized);
    console.log('Result:', data, 'error:', error);
}

test();
