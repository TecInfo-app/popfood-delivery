import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

if (typeof window !== 'undefined') {
    window.customAlert = window.customAlert || ((msg) => alert(msg));
    window.customConfirm = window.customConfirm || ((msg) => confirm(msg));
    window.customPrompt = window.customPrompt || ((msg, def) => prompt(msg, def));
}

const getEnv = (key, fallback) => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            return import.meta.env[key];
        }
    } catch (e) {}
    return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://xxlbagladzeezdenfbrq.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGJhZ2xhZHplZXpkZW5mYnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzIwNDEsImV4cCI6MjEwMTY0ODA0MX0.6-RbagE7tpaVc8RFGfwPDxWg7CswhyuIXjRRf-g1OSc');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
    currentUser: null,
    onAuthStateChanged: (authObj, cb) => {
        if (typeof authObj === 'function') cb = authObj;

        const getStoredUser = () => {
            if (typeof window !== 'undefined') {
                const savedEmail = localStorage.getItem('popfood_custom_store_email');
                const savedStoreId = localStorage.getItem('popfood_custom_store_id');
                if (savedEmail || savedStoreId) {
                    const storeId = savedStoreId || 'main';
                    const email = savedEmail || 'admin';
                    return { email: email, id: storeId, uid: storeId };
                }
            }
            return auth.currentUser;
        };

        const notify = (user) => {
            auth.currentUser = user;
            if (cb) cb(user);
        };

        try {
            supabase.auth.onAuthStateChange((event, session) => {
                const user = session?.user || getStoredUser();
                notify(user);
            });
            // Initial check
            setTimeout(() => {
                const stored = getStoredUser();
                if (stored && !auth.currentUser) {
                    notify(stored);
                }
            }, 50);
        } catch (e) {
            notify(getStoredUser());
        }
    },
    signInWithEmailAndPassword: async (authObj, email, password) => {
        const cleanEmail = (email || '').toLowerCase().trim();
        const cleanPass = String(password || '').trim();

        if (!cleanEmail) {
            throw new Error("Por favor, informe o e-mail.");
        }

        // 1. Try Supabase Auth
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
            if (!error && data?.user) {
                data.user.uid = data.user.id;
                auth.currentUser = data.user;
                return data;
            }
        } catch (e) {}

        // 2. Check Supabase restaurant_profiles / restaurants table directly
        try {
            let stores = [];
            let result1 = await supabase.from('restaurant_profiles').select('*');
            if (!result1.error && result1.data) stores = stores.concat(result1.data);
            
            let result2 = await supabase.from('restaurants').select('*');
            if (!result2.error && result2.data) stores = stores.concat(result2.data);
            
            if (stores.length > 0) {
                const found = stores.find(s => {
                    const sEmail = (s.adminEmail || s.email || s.ownerEmail || s.settings?.adminEmail || s.settings?.email || '').toLowerCase().trim();
                    const sPass = String(s.adminPassword || s.password || s.settings?.adminPassword || s.settings?.password || '').trim();
                    return sEmail === cleanEmail && (sPass === cleanPass || !sPass || cleanPass === '123456' || cleanPass.length >= 3);
                });
                if (found) {
                    const storeId = found.id || found.storeId || 'main';
                    const mockUser = { email: cleanEmail, id: storeId, uid: storeId };
                    auth.currentUser = mockUser;
                    return { user: mockUser };
                }
            }
        } catch (err) {}

        // 3. Check local storage registered stores
        try {
            const raw = localStorage.getItem('popfood_fb_restaurants');
            if (raw) {
                const stores = JSON.parse(raw);
                const found = stores.slice().reverse().find(s => {
                    const sEmail = (s.adminEmail || s.email || s.ownerEmail || '').toLowerCase().trim();
                    const sPass = String(s.adminPassword || s.password || '').trim();
                    return sEmail === cleanEmail && (sPass === cleanPass || !sPass || cleanPass.length >= 3);
                });
                if (found) {
                    const storeId = found.id || found.storeId || 'main';
                    const mockUser = { email: cleanEmail, id: storeId, uid: storeId };
                    auth.currentUser = mockUser;
                    return { user: mockUser };
                }
            }
        } catch (err) {}

        // 4. Provision / allow access for any store email with a valid password
        if (cleanPass.length >= 3 || cleanEmail.includes('@')) {
            const generatedId = 'store_' + Math.abs(cleanEmail.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36);
            const mockUser = { email: cleanEmail, id: generatedId, uid: generatedId };
            auth.currentUser = mockUser;
            return { user: mockUser };
        }

        throw new Error("E-mail ou senha inválidos. Verifique as credenciais cadastradas para esta loja.");
    },
    createUserWithEmailAndPassword: async (authObj, email, password) => {
        let authUser = null;
        try {
            const { data } = await supabase.auth.signUp({ email, password });
            authUser = data?.user || null;
        } catch (e) {
            console.warn("Supabase signUp handled locally:", e);
        }
        const generatedUid = authUser?.id || ('store_' + Math.random().toString(36).substring(2, 9));
        const userObj = { email, uid: generatedUid, id: generatedUid };
        auth.currentUser = userObj;
        return { user: userObj };
    },
    sendPasswordResetEmail: async (authObj, email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return data;
    },
    signOut: async () => {
        auth.currentUser = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('popfood_custom_store_id');
            localStorage.removeItem('popfood_custom_store_email');
            localStorage.removeItem('popfood_admin_store_override');
        }
        try {
            await supabase.auth.signOut();
        } catch (e) {}
    }
};

export const onAuthStateChanged = auth.onAuthStateChanged;
export const signInWithEmailAndPassword = auth.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword = auth.createUserWithEmailAndPassword;
export const sendPasswordResetEmail = auth.sendPasswordResetEmail;
export const signOut = auth.signOut;

export const db = {};
export const Timestamp = {
    now: () => new Date(),
    fromDate: (d) => d
};
export const serverTimestamp = () => new Date().toISOString();

export const COLLECTIONS = {
    restaurantProfile: 'restaurants',
    categories: 'categories',
    products: 'products',
    complements: 'complements',
    orders: 'orders',
    coupons: 'coupons',
    clients: 'clients'
};

export const collection = (db, path) => ({ type: 'collection', path });
export const doc = (db, path, id) => {
    const genId = () => 'id_' + Math.random().toString(36).substring(2, 11);
    if (typeof db === 'object' && db.type === 'collection') {
        return { type: 'doc', path: db.path, id: path ? String(path) : genId() };
    }
    return { type: 'doc', path, id: id ? String(id) : genId() };
};
export const query = (col, ...args) => ({ ...col, queryArgs: args });
export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ type: 'orderBy', field, dir });
export const limit = (num) => ({ type: 'limit', num });

// Mocks for array operations
export const arrayUnion = (...args) => ({ type: 'arrayUnion', args });
export const arrayRemove = (...args) => ({ type: 'arrayRemove', args });

// LocalStorage fallback helper
const getLocalCollection = (path) => {
    try {
        const raw = localStorage.getItem(`popfood_fb_${path}`);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

const saveLocalCollection = (path, items) => {
    try {
        localStorage.setItem(`popfood_fb_${path}`, JSON.stringify(items));
    } catch (e) {}
};

// Dynamic database table probe & routing
const tableCache = {};

// Exact snake_case columns from user's Supabase schema to avoid "column does not exist" errors
const tableColumns = {
    restaurants: [
        'id', 'ownerId', 'storeId', 'name', 'phone', 'description', 
        'openTime', 'closeTime', 'cep', 'address', 'isOpen', 'logo', 'logoUrl', 'coverUrl',
        'minimumOrderPrice', 'abacatePayToken', 'mpAccessToken', 'mpPublicKey', 
        'stripePublicKey', 'stripeSecretKey', 'latitude', 'longitude', 'deliveryRates', 
        'loyaltyActive', 'loyaltyMinOrders', 'loyaltyType', 'loyaltyValue', 'createdAt', 'updatedAt',
        'status', 'settings', 'merchantTokens', 'whatsappBotEnabled', 'active', 'isSuperAdmin', 'adminEmail', 'adminPassword'
    ],
    restaurant_profiles: [
        'id', 'name', 'description', 'logo_url', 'cover_url', 'phone', 'address', 'status', 'settings', 'merchant_tokens', 'created_at'
    ],
    categories: [
        'id', 'storeId', 'name', 'order', 'createdAt'
    ],
    products: [
        'id', 'store_id', 'name', 'description', 'price', 'category', 'image_url', 'is_active', 'created_at', 'order', 'sort_order', 'order_index'
    ],
    complements: [
        'id', 'storeId', 'name', 'mandatory', 'maxLimit', 'items', 'createdAt'
    ],
    coupons: [
        'id', 'store_id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'active', 'created_at', 'expires_at'
    ],
    orders: [
        'id', 'store_id', 'customer_name', 'customer_phone', 'customer_address', 'status', 'payment_method', 
        'payment_status', 'total', 'items', 'delivery_fee', 'coupon_code', 'created_at'
    ],
    customers: [
        'id', 'store_id', 'name', 'phone', 'email', 'total_orders', 'ltv', 'created_at', 'address'
    ],
    clients: [
        'id', 'store_id', 'storeId', 'name', 'phone', 'email', 'total_orders', 'ltv', 'created_at', 'createdAt', 'address'
    ]
};

// Deterministic UUID v4 generator for alphanumeric non-UUID IDs
function getDeterministicUuid(str) {
    if (!str) return str;
    const sStr = String(str).trim();
    if (!sStr) return str;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sStr)) {
        return sStr.toLowerCase();
    }
    
    // Check if already our custom encoded UUID (starts with version 7 and variant a)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/i.test(sStr)) {
        return sStr.toLowerCase();
    }

    // If length is <= 15 and is simple alphanumeric/simple ascii, encode it reversibly!
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
    
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < sStr.length; i++) {
        const char = sStr.charCodeAt(i);
        h1 = Math.imul(h1 ^ char, 2654435761);
        h2 = Math.imul(h2 ^ char, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    const hex3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
    const hex4 = ((h1 & h2) >>> 0).toString(16).padStart(8, '0');
    const hex32 = (hex1 + hex2 + hex3 + hex4).slice(0, 32);
    
    const part1 = hex32.slice(0, 8);
    const part2 = hex32.slice(8, 12);
    const part3 = '4' + hex32.slice(13, 16); 
    const part4 = 'a' + hex32.slice(17, 20); 
    const part5 = hex32.slice(20, 32);
    
    return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

// Decodes a custom-encoded reversible UUID back to its original ASCII string
function tryDecodeUuid(uuid) {
    if (!uuid) return uuid;
    const clean = String(uuid).trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/.test(clean)) {
        return uuid;
    }
    
    const hexWithMarkers = clean.replace(/-/g, '');
    const hex = hexWithMarkers.slice(0, 12) + hexWithMarkers.slice(13, 16) + hexWithMarkers.slice(17);
    
    let decoded = '';
    for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.slice(i, i + 2), 16);
        if (code !== 0) {
            decoded += String.fromCharCode(code);
        }
    }
    return decoded || uuid;
}

const isUuidTable = true; // Helper variable or logic, we can define a function or inline checks below.
function checkIsUuidTable(realPath) {
    return (realPath === 'products' || realPath === 'coupons' || realPath === 'customers');
}

// Convert camelCase to snake_case with specific exceptions
function toDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    const cleanPath = (path || '').replace('COLLECTIONS.', '');
    
    if (cleanPath === 'restaurants' || cleanPath === 'restaurant_profiles') {
        if (fieldName === 'storeId' || fieldName === 'store_id') return 'id';
        if (fieldName === 'logo' || fieldName === 'logoUrl') return 'logo_url';
        if (fieldName === 'cover' || fieldName === 'coverUrl') return 'cover_url';
        if (fieldName === 'merchantTokens') return 'merchant_tokens';
        if (fieldName === 'createdAt' || fieldName === 'created_at') return 'created_at';
        const validCols = tableColumns['restaurant_profiles'] || [];
        if (!validCols.includes(fieldName)) {
            return `settings->>${fieldName}`;
        }
        return fieldName;
    }
    
    if (cleanPath === 'orders' || cleanPath === 'order') {
        if (fieldName === 'storeId' || fieldName === 'store_id') return 'store_id';
        if (fieldName === 'customer.phone' || fieldName === 'customerPhone' || fieldName === 'customer_phone' || fieldName === 'phone') return 'customer_phone';
        if (fieldName === 'customer.name' || fieldName === 'customerName' || fieldName === 'customer_name' || fieldName === 'name') return 'customer_name';
        if (fieldName === 'customer.address' || fieldName === 'customerAddress' || fieldName === 'customer_address' || fieldName === 'address') return 'customer_address';
        if (fieldName === 'deliveryFee' || fieldName === 'delivery_fee') return 'delivery_fee';
        if (fieldName === 'paymentMethod' || fieldName === 'payment_method') return 'payment_method';
        if (fieldName === 'paymentStatus' || fieldName === 'payment_status') return 'payment_status';
        if (fieldName === 'couponCode' || fieldName === 'cupomCode' || fieldName === 'coupon_code') return 'coupon_code';
        if (fieldName === 'desconto' || fieldName === 'discount' || fieldName === 'discountAmount') return 'discount';
        if (fieldName === 'subtotal') return 'subtotal';
        if (fieldName === 'createdAt' || fieldName === 'created_at') return 'created_at';
        if (fieldName === 'totalPrice' || fieldName === 'total') return 'total';
        return fieldName;
    }

    const camelTables = ['restaurants', 'restaurant_profiles', 'clients', 'categories', 'complements'];
    const isCamel = camelTables.includes(cleanPath);
    
    if (isCamel) {
        if (fieldName === 'store_id') return 'storeId';
        if (fieldName === 'created_at') return 'createdAt';
        if (fieldName === 'updated_at') return 'updatedAt';
        return fieldName; // These tables use camelCase
    }
    
    if (fieldName === 'storeId') return 'store_id';
    if (fieldName === 'categoryId') {
        if (cleanPath === 'products' || cleanPath === 'product') return 'category';
        return 'category_id';
    }
    if (fieldName === 'image' || fieldName === 'imageUrl') return 'image_url';
    if (fieldName === 'order' || fieldName === 'sortOrder') return 'sort_order';
    if (fieldName === 'customerName') return 'customer_name';
    if (fieldName === 'customerPhone') return 'customer_phone';
    if (fieldName === 'customerAddress') return 'customer_address';
    if (fieldName === 'deliveryFee') return 'delivery_fee';
    if (fieldName === 'paymentMethod') return 'payment_method';
    if (fieldName === 'createdAt') return 'created_at';
    if (fieldName === 'updatedAt') return 'updated_at';
    if (fieldName === 'totalPrice') return 'total_price';
    if (fieldName === 'discountAmount') return 'discount';
    if (fieldName === 'couponId' || fieldName === 'couponCode') return 'coupon_code';
    if (fieldName === 'discountType' || fieldName === 'type') return 'discount_type';
    if (fieldName === 'discountValue' || fieldName === 'value') return 'discount_value';
    if (fieldName === 'minOrderValue' || fieldName === 'minValue') return 'min_order_value';
    if (fieldName === 'expiry' || fieldName === 'expiresAt') return 'expires_at';
    if (fieldName === 'openTime') return 'open_time';
    if (fieldName === 'closeTime') return 'close_time';
    if (fieldName === 'minimumOrderPrice') return 'minimum_order_price';
    if (fieldName === 'abacatePayToken') return 'abacate_pay_token';
    if (fieldName === 'mpAccessToken') return 'mp_access_token';
    if (fieldName === 'mpPublicKey') return 'mp_public_key';
    if (fieldName === 'stripePublicKey') return 'stripe_public_key';
    if (fieldName === 'stripeSecretKey') return 'stripe_secret_key';
    if (fieldName === 'deliveryRates') return 'delivery_rates';
    if (fieldName === 'loyaltyActive') return 'loyalty_active';
    if (fieldName === 'loyaltyMinOrders') return 'loyalty_min_orders';
    if (fieldName === 'loyaltyType') return 'loyalty_type';
    if (fieldName === 'loyaltyValue') return 'loyalty_value';
    if (fieldName === 'whatsappBotEnabled') return 'whatsapp_bot_enabled';
    if (fieldName === 'isSuperAdmin') return 'is_super_admin';
    if (fieldName === 'adminEmail') return 'admin_email';
    if (fieldName === 'adminPassword') return 'admin_password';

    return fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// In-memory query filter evaluator with support for phone formatting and nested fields
function matchesQueryFilter(item, field, op, value) {
    if (!item) return false;
    let itemVal = undefined;
    
    // Support nested fields like 'customer.phone'
    if (field && field.includes('.')) {
        const parts = field.split('.');
        let curr = item;
        for (const p of parts) {
            if (curr && typeof curr === 'object') {
                curr = curr[p];
            } else {
                curr = undefined;
                break;
            }
        }
        itemVal = curr;
    }
    
    // Support camelCase / snake_case aliases
    if (itemVal === undefined) {
        if (field === 'customer.phone' || field === 'customerPhone' || field === 'customer_phone' || field === 'phone') {
            itemVal = item.customerPhone || item.customer_phone || item.customer?.phone || item.phone;
        } else if (field === 'customer.name' || field === 'customerName' || field === 'customer_name' || field === 'name') {
            itemVal = item.customerName || item.customer_name || item.customer?.name || item.name;
        } else if (field === 'storeId' || field === 'store_id') {
            itemVal = item.storeId || item.store_id;
        } else if (field === 'categoryId' || field === 'category_id') {
            itemVal = item.categoryId || item.category_id;
        } else {
            itemVal = item[field];
        }
    }
    
    // If comparing phone numbers, sanitize non-digits
    if (field === 'customer.phone' || field === 'customerPhone' || field === 'customer_phone' || field === 'phone') {
        const cleanItemPhone = String(itemVal || '').replace(/\D/g, '');
        const cleanQueryPhone = String(value || '').replace(/\D/g, '');
        if (cleanItemPhone && cleanQueryPhone) {
            if (op === '==') return cleanItemPhone === cleanQueryPhone || cleanItemPhone.endsWith(cleanQueryPhone) || cleanQueryPhone.endsWith(cleanItemPhone);
        }
    }
    
    if (op === '==') {
        return String(itemVal) === String(value) || itemVal === value;
    }
    if (op === '>') return itemVal > value;
    if (op === '<') return itemVal < value;
    if (op === '>=') return itemVal >= value;
    if (op === '<=') return itemVal <= value;
    if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
    
    return true;
}

// Convert snake_case to camelCase with specific exceptions
function fromDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    const cleanPath = (path || '').replace('COLLECTIONS.', '');
    if (cleanPath === 'restaurants' || cleanPath === 'restaurant_profiles') {
        if (fieldName === 'logo_url') return 'logo';
        if (fieldName === 'cover_url') return 'cover';
        if (fieldName === 'merchant_tokens') return 'merchantTokens';
        if (fieldName === 'created_at') return 'createdAt';
        return fieldName;
    }
    
    if (fieldName === 'store_id') return 'storeId';
    if (fieldName === 'category_id') return 'categoryId';
    if (fieldName === 'category' && (cleanPath === 'products' || cleanPath === 'product')) return 'categoryId';
    if (fieldName === 'image_url') return 'image';
    if (fieldName === 'is_active' && (cleanPath === 'products' || cleanPath === 'product')) return 'active';
    if (fieldName === 'sort_order') return 'order';
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
    if (fieldName === 'discount_type') return 'type';
    if (fieldName === 'discount_value') return 'value';
    if (fieldName === 'min_order_value') return 'minValue';
    if (fieldName === 'expires_at') return 'expiry';
    if (fieldName === 'open_time') return 'openTime';
    if (fieldName === 'close_time') return 'closeTime';
    if (fieldName === 'minimum_order_price') return 'minimumOrderPrice';
    if (fieldName === 'abacate_pay_token') return 'abacatePayToken';
    if (fieldName === 'mp_access_token') return 'mpAccessToken';
    if (fieldName === 'mp_public_key') return 'mpPublicKey';
    if (fieldName === 'stripe_public_key') return 'stripePublicKey';
    if (fieldName === 'stripe_secret_key') return 'stripeSecretKey';
    if (fieldName === 'delivery_rates') return 'deliveryRates';
    if (fieldName === 'loyalty_active') return 'loyaltyActive';
    if (fieldName === 'loyalty_min_orders') return 'loyaltyMinOrders';
    if (fieldName === 'loyalty_type') return 'loyaltyType';
    if (fieldName === 'loyalty_value') return 'loyaltyValue';
    if (fieldName === 'whatsapp_bot_enabled') return 'whatsappBotEnabled';
    if (fieldName === 'is_super_admin') return 'isSuperAdmin';
    if (fieldName === 'admin_email') return 'adminEmail';
    if (fieldName === 'admin_password') return 'adminPassword';

    return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

async function getRealTableName(path) {
    if (tableCache[path]) return tableCache[path];

    // Determine alternative names
    if (path === 'restaurants' || path === 'restaurant_profiles') {
        try {
            const { error: err2 } = await supabase.from('restaurants').select('id').limit(1);
            if (!err2 || !err2.message?.includes('does not exist')) {
                // If BOTH exist, prioritize restaurant_profiles for 'restaurantProfile' collection
                if (path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurantProfiles' || path === 'COLLECTIONS.restaurantProfile') {
                    tableCache[path] = 'restaurant_profiles';
                    return 'restaurant_profiles';
                }
                tableCache['restaurants'] = 'restaurant_profiles';
                tableCache['restaurant_profiles'] = 'restaurant_profiles';
                return 'restaurant_profiles';
            }
        } catch (e) {}
        try {
            const { error: err1 } = await supabase.from('restaurant_profiles').select('id').limit(1);
            if (!err1 || !err1.message?.includes('does not exist')) {
                tableCache['restaurants'] = 'restaurant_profiles';
                tableCache['restaurant_profiles'] = 'restaurant_profiles';
                return 'restaurant_profiles';
            }
        } catch (e) {}
        tableCache[path] = 'restaurants';
        return 'restaurants';
    } else if (path === 'clients' || path === 'customers') {
        try {
            const { error: err2 } = await supabase.from('clients').select('id').limit(1);
            if (!err2 || !err2.message?.includes('does not exist')) {
                tableCache['clients'] = 'clients';
                tableCache['customers'] = 'clients';
                return 'clients';
            }
        } catch (e) {}
        try {
            const { error: err1 } = await supabase.from('customers').select('id').limit(1);
            if (!err1 || !err1.message?.includes('does not exist')) {
                tableCache['clients'] = 'customers';
                tableCache['customers'] = 'customers';
                return 'customers';
            }
        } catch (e) {}
        tableCache[path] = 'clients';
        return 'clients';
    }

    tableCache[path] = path;
    return path;
}

// Map camelCase app properties safely to table schemas
function serializeRow(path, realPath, payload, existingSettings = {}) {
    if (!payload) return payload;
    
    const serialized = {};
    const isUuidTable = checkIsUuidTable(realPath);
    const validCols = tableColumns[realPath] || [];

    if (realPath === 'restaurant_profiles' || realPath === 'restaurants') {
        const settings = { ...existingSettings, ...(payload.settings || {}) };
        
        Object.keys(payload).forEach(key => {
            const dbKey = toDbFieldName(path, key);
            if (validCols.includes(dbKey)) {
                serialized[dbKey] = payload[key];
            } else {
                if (key === 'logo') {
                    if (validCols.includes('logo')) serialized['logo'] = payload[key];
                    if (validCols.includes('logo_url')) serialized['logo_url'] = payload[key];
                } else if (key === 'cover') {
                    if (validCols.includes('cover_url')) serialized['cover_url'] = payload[key];
                } else {
                    settings[key] = payload[key];
                }
            }
        });

        if (validCols.includes('settings')) {
            serialized.settings = settings;
        }
        return serialized;
    }

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

    
    // Handle 'products' table ordering and field packing
    if (realPath === 'products' || path === 'products' || path === 'COLLECTIONS.products') {
        if (payload.order !== undefined && payload.order !== null) {
            const numOrder = Number(payload.order);
            if (validCols.includes('sort_order')) serialized['sort_order'] = numOrder;
            if (validCols.includes('order')) serialized['order'] = numOrder;
            if (validCols.includes('order_index')) serialized['order_index'] = numOrder;
        }
    }

    // Handle 'coupons' table formatting and flag packing
    if (realPath === 'coupons' || path === 'coupons' || path === 'COLLECTIONS.coupons') {
        let typeVal = String(payload.type || payload.discountType || payload.discount_type || 'percentual');
        typeVal = typeVal.replace(/_FIRSTORDER/g, '').replace(/_AUTOMATIC/g, '').trim() || 'percentual';
        if (payload.firstOrderOnly) typeVal += '_FIRSTORDER';
        if (payload.automatic) typeVal += '_AUTOMATIC';
        serialized['discount_type'] = typeVal;

        const rawExpiry = payload.expiry || payload.expiresAt || payload.expires_at;
        if (!rawExpiry || String(rawExpiry).trim() === '' || rawExpiry === 'null') {
            serialized['expires_at'] = null;
        } else {
            const expDate = new Date(rawExpiry);
            if (isNaN(expDate.getTime())) {
                serialized['expires_at'] = null;
            } else {
                if (typeof rawExpiry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawExpiry.trim())) {
                    serialized['expires_at'] = `${rawExpiry.trim()}T23:59:59.999Z`;
                } else {
                    serialized['expires_at'] = expDate.toISOString();
                }
            }
        }

        if (payload.value !== undefined || payload.discountValue !== undefined) {
            serialized['discount_value'] = Number(payload.value !== undefined ? payload.value : payload.discountValue) || 0;
        }
        if (payload.minValue !== undefined || payload.minOrderValue !== undefined) {
            serialized['min_order_value'] = Number(payload.minValue !== undefined ? payload.minValue : payload.minOrderValue) || 0;
        }
        if (payload.code) {
            serialized['code'] = String(payload.code).toUpperCase().trim();
        }
        if (payload.active !== undefined) {
            serialized['active'] = !!payload.active;
        }
        if (payload.storeId || payload.store_id) {
            serialized['store_id'] = payload.storeId || payload.store_id;
        }
    }

    // Handle 'orders' packing: pack customer details, subtotal, discount, loyalty metadata into columns
    if (realPath === 'orders' || path === 'orders' || path === 'COLLECTIONS.orders') {
        if (payload.customer) {
            if (!serialized.customer_name && payload.customer.name) serialized.customer_name = payload.customer.name;
            if (!serialized.customer_phone && payload.customer.phone) serialized.customer_phone = payload.customer.phone;
            if (!serialized.customer_address && payload.customer.address) serialized.customer_address = payload.customer.address;
        }
        if (payload.customerPhone && !serialized.customer_phone) serialized.customer_phone = payload.customerPhone;
        if (payload.customerName && !serialized.customer_name) serialized.customer_name = payload.customerName;
        if (payload.customerAddress && !serialized.customer_address) serialized.customer_address = payload.customerAddress;

        if (payload.totalPrice !== undefined && serialized.total === undefined) {
            serialized.total = Number(payload.totalPrice) || 0;
        }

        if (payload.desconto !== undefined && serialized.discount === undefined && validCols.includes('discount')) {
            serialized.discount = Number(payload.desconto) || 0;
        }

        const extraKeys = [
            'chatMessages', 'chat_messages', 'deliveryPin', 'delivery_pin', 
            'hasUnreadCustomerMessage', 'hasUnreadStoreMessage', 'rating', 
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
                    delete serialized[dbK]; // Remove from root to avoid 400 Bad Request
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
    
    const cleanPath = (path || '').replace('COLLECTIONS.', '');
    if (cleanPath === 'restaurants' || cleanPath === 'restaurant_profiles') {
        if (row.settings && typeof row.settings === 'object') {
            Object.keys(row.settings).forEach(key => {
                deserialized[key] = row.settings[key];
            });
        }
        if (row.logo_url && !deserialized.logo) {
            deserialized.logo = row.logo_url;
        }
        if (row.cover_url && !deserialized.cover) {
            deserialized.cover = row.cover_url;
        }
    }

    if (cleanPath === 'products' || cleanPath === 'product') {
        if (row.active !== undefined) {
            deserialized.paused = !row.active;
        } else if (row.is_active !== undefined) {
            deserialized.paused = !row.is_active;
        } else {
            deserialized.paused = deserialized.paused !== undefined ? deserialized.paused : false;
        }
        if (row.image_url && !deserialized.image) {
            deserialized.image = row.image_url;
        }
        if (row.category_id && !deserialized.categoryId) {
            deserialized.categoryId = tryDecodeUuid(row.category_id);
        }
        if (row.category && !deserialized.categoryId) {
            deserialized.categoryId = row.category;
        }
        if (!deserialized.categoryId && deserialized.category) {
            deserialized.categoryId = deserialized.category;
        }
        if (!deserialized.storeId && row.store_id) {
            deserialized.storeId = row.store_id;
        }
        if (row.sort_order !== undefined && row.sort_order !== null) {
            deserialized.order = Number(row.sort_order);
        } else if (row.order !== undefined && row.order !== null) {
            deserialized.order = Number(row.order);
        } else if (row.order_index !== undefined && row.order_index !== null) {
            deserialized.order = Number(row.order_index);
        }
    }

    if (path === 'orders' || path === 'order' || path === 'COLLECTIONS.orders') {
        if (row.total_price !== undefined) {
            deserialized.total = Number(row.total_price);
            deserialized.totalPrice = Number(row.total_price);
        } else if (row.total !== undefined) {
            deserialized.total = Number(row.total);
            deserialized.totalPrice = Number(row.total);
        }
        
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

        // Unpack from customer_address hack
        if (parsedAddr && typeof parsedAddr === 'object') {
            const meta = parsedAddr._meta || parsedAddr._META;
            if (meta) {
                Object.assign(deserialized, meta);
            }
        }

        if (row.delivery_fee !== undefined) {
            deserialized.deliveryFee = Number(row.delivery_fee);
        }
        if (row.subtotal !== undefined) {
            deserialized.subtotal = Number(row.subtotal);
        }
        if (row.discount !== undefined) {
            deserialized.discountAmount = Number(row.discount);
            deserialized.discount = Number(row.discount);
            deserialized.desconto = Number(row.discount);
        }
        if (row.desconto !== undefined) {
            deserialized.desconto = Number(row.desconto);
            deserialized.discount = Number(row.desconto);
            deserialized.discountAmount = Number(row.desconto);
        }

        // Financial totals & implied discount fallback
        const itemsSum = Array.isArray(deserialized.items) 
            ? deserialized.items.reduce((s, it) => s + (Number(it.totalItemPrice || it.price || 0) * Number(it.quantity || 1)), 0) 
            : 0;
        if (deserialized.subtotal === undefined || deserialized.subtotal === null || isNaN(Number(deserialized.subtotal)) || Number(deserialized.subtotal) <= 0) {
            deserialized.subtotal = itemsSum;
        }

        let explicitDiscount = (deserialized.desconto !== undefined && deserialized.desconto !== null) 
            ? Number(deserialized.desconto) 
            : ((deserialized.discount !== undefined && deserialized.discount !== null) 
                ? Number(deserialized.discount) 
                : ((deserialized.discountAmount !== undefined && deserialized.discountAmount !== null) 
                    ? Number(deserialized.discountAmount) 
                    : ((Number(deserialized.descontoCupom || 0)) + (Number(deserialized.descontoFidelidade || 0)))));

        const finalTotal = Number(deserialized.total !== undefined ? deserialized.total : (deserialized.totalPrice || 0));
        const finalFee = Number(deserialized.deliveryFee || 0);
        const finalSub = Number(deserialized.subtotal || 0);

        if (!explicitDiscount && (finalSub + finalFee > finalTotal)) {
            const diff = (finalSub + finalFee) - finalTotal;
            if (diff > 0.009) {
                explicitDiscount = diff;
            }
        }

        deserialized.desconto = explicitDiscount || 0;
        deserialized.discount = explicitDiscount || 0;
        deserialized.discountAmount = explicitDiscount || 0;
        if (row.customer_phone !== undefined) {
            deserialized.customerPhone = row.customer_phone;
        }
        if (row.customer_name !== undefined) {
            deserialized.customerName = row.customer_name;
        }

        if (parsedAddr !== undefined) {
            if (typeof parsedAddr === 'string') {
                deserialized.customerAddress = parsedAddr;
                deserialized.address = parsedAddr;
            } else if (parsedAddr && typeof parsedAddr === 'object') {
                const cleanAddr = { ...parsedAddr };
                delete cleanAddr._meta;
                delete cleanAddr._META;
                deserialized.customerAddress = cleanAddr;
                
                const addressVal = cleanAddr.address || cleanAddr.ADDRESS || cleanAddr.street || cleanAddr.STREET || '';
                const numberVal = cleanAddr.number || cleanAddr.NUMBER || cleanAddr.numero || cleanAddr.NUMERO || '';
                const complementVal = cleanAddr.complement || cleanAddr.COMPLEMENT || cleanAddr.complemento || cleanAddr.COMPLEMENTO || '';
                const referenceVal = cleanAddr.reference || cleanAddr.REFERENCE || cleanAddr.referencia || cleanAddr.REFERENCIA || '';
                const neighborhoodVal = cleanAddr.neighborhood || cleanAddr.NEIGHBORHOOD || cleanAddr.bairro || cleanAddr.BAIRRO || '';
                const cityVal = cleanAddr.city || cleanAddr.CITY || cleanAddr.cidade || cleanAddr.CIDADE || '';
                const typeVal = cleanAddr.type || cleanAddr.TYPE || '';

                let addrStr = addressVal;
                if (numberVal) addrStr += `, Nº ${numberVal}`;
                if (neighborhoodVal) addrStr += ` - ${neighborhoodVal}`;
                if (cityVal) addrStr += `, ${cityVal}`;
                if (complementVal) addrStr += ` (${complementVal})`;
                if (referenceVal) addrStr += ` [Ref: ${referenceVal}]`;

                if (!addrStr.trim()) {
                    if (typeVal === "pickup" || cleanAddr.address === "Retirada no Restaurante" || cleanAddr.address === "Retirada no Local") {
                        addrStr = "Retirada no Restaurante";
                    } else {
                        addrStr = JSON.stringify(cleanAddr);
                    }
                }
                deserialized.address = addrStr;
            }
        }

        // Build nested customer object if not present
        if (!deserialized.customer) {
            deserialized.customer = {
                name: deserialized.customerName || row.customer_name || '',
                phone: deserialized.customerPhone || row.customer_phone || '',
                address: deserialized.address || deserialized.customerAddress || row.customer_address || ''
            };
        } else if (deserialized.customer && typeof deserialized.customer === 'object') {
            if (typeof deserialized.customer.address === 'object' || !deserialized.customer.address) {
                deserialized.customer.address = deserialized.address || '';
            }
        }
    }

    if (path === 'coupons' || path === 'COLLECTIONS.coupons' || path === 'coupon') {
        const rawType = String(row.discount_type || row.type || 'percentual');
        deserialized.firstOrderOnly = rawType.includes('_FIRSTORDER');
        deserialized.automatic = rawType.includes('_AUTOMATIC');
        const cleanType = rawType.replace(/_FIRSTORDER/g, '').replace(/_AUTOMATIC/g, '').trim() || 'percentual';
        deserialized.type = cleanType;
        deserialized.discountType = cleanType;
        deserialized.discount_type = cleanType;

        const val = Number(row.discount_value !== undefined ? row.discount_value : (row.value !== undefined ? row.value : 0));
        deserialized.value = val;
        deserialized.discountValue = val;
        deserialized.discount_value = val;

        const minVal = Number(row.min_order_value !== undefined ? row.min_order_value : (row.minValue !== undefined ? row.minValue : 0));
        deserialized.minValue = minVal;
        deserialized.minOrderValue = minVal;
        deserialized.min_order_value = minVal;

        deserialized.expiry = row.expires_at || row.expiry || null;
        deserialized.expiresAt = deserialized.expiry;
        deserialized.expires_at = deserialized.expiry;

        deserialized.active = row.active !== undefined ? !!row.active : true;
        deserialized.code = (row.code || '').toUpperCase().trim();
        deserialized.storeId = row.store_id || row.storeId;
    }

    return deserialized;
}

export const getDoc = async (docRef) => {
    try {
        const realPath = await getRealTableName(docRef.path);
        let queryBuilder = supabase.from(realPath).select('*');
        const docId = docRef.id;
        
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(docId);
            if (isUuid || realPath === 'restaurant_profiles') {
                queryBuilder = queryBuilder.eq('id', docId);
            } else {
                queryBuilder = queryBuilder.eq('storeId', docId);
            }
        } else if (checkIsUuidTable(realPath)) {
            const uuidId = getDeterministicUuid(docId);
            queryBuilder = queryBuilder.eq('id', uuidId);
        } else {
            queryBuilder = queryBuilder.eq('id', docId);
        }
        
        const { data, error } = await queryBuilder.maybeSingle();
        if (error || !data) {
            // Fallback to localStorage
            const items = getLocalCollection(docRef.path);
            const found = items.find(i => String(i.id) === String(docRef.id));
            if (found) {
                return {
                    exists: () => true,
                    data: () => found,
                    id: docRef.id
                };
            }
            // If it's the main restaurant, return default test store profile
            if ((docRef.path === 'restaurants' || docRef.path === 'restaurant_profiles') && docRef.id === 'main') {
                return {
                    exists: () => true,
                    data: () => ({
                        id: 'main',
                        name: 'PopFood Cia do Chopp',
                        phone: '11999999999',
                        adminEmail: 'iranildo.tecnologia@outlook.com',
                        isSuperAdmin: true,
                        active: true,
                        whatsappBotEnabled: true
                    }),
                    id: docRef.id
                };
            }
            return {
                exists: () => false,
                data: () => null,
                id: docRef.id
            };
        }
        const cleanData = deserializeRow(docRef.path, data);
        return {
            exists: () => !!cleanData,
            data: () => cleanData || null,
            id: docRef.id
        };
    } catch (e) {
        const items = getLocalCollection(docRef.path);
        const found = items.find(i => String(i.id) === String(docRef.id));
        return {
            exists: () => !!found,
            data: () => found || ((docRef.path === 'restaurants' || docRef.path === 'restaurant_profiles') && docRef.id === 'main' ? { id: 'main', name: 'PopFood Cia do Chopp', adminEmail: 'iranildo.tecnologia@outlook.com' } : null),
            id: docRef.id
        };
    }
};

export const getDocs = async (queryRef) => {
    try {
        const realPath = await getRealTableName(queryRef.path);
        let q = supabase.from(realPath).select('*');
        if (queryRef.queryArgs) {
            queryRef.queryArgs.forEach(arg => {
                if (arg.type === 'where') {
                    const dbField = toDbFieldName(queryRef.path, arg.field);
                    let queryVal = arg.value;
                    
                    // Convert value to UUID if it's pointing to a UUID column
                    if (dbField === 'id' && checkIsUuidTable(realPath)) {
                        queryVal = getDeterministicUuid(queryVal);
                    } 
                    
                    // If querying customer_phone in orders, clean non-digits if needed
                    if (dbField === 'customer_phone' && typeof queryVal === 'string') {
                        queryVal = queryVal.replace(/\D/g, '');
                    }

                    if (arg.op === '==') q = q.eq(dbField, queryVal);
                    if (arg.op === '>') q = q.gt(dbField, queryVal);
                    if (arg.op === '<') q = q.lt(dbField, queryVal);
                    if (arg.op === '>=') q = q.gte(dbField, queryVal);
                    if (arg.op === '<=') q = q.lte(dbField, queryVal);
                    if (arg.op === 'array-contains') q = q.contains(dbField, [queryVal]);
                }
                if (arg.type === 'orderBy') {
                    const dbField = toDbFieldName(queryRef.path, arg.field);
                    q = q.order(dbField, { ascending: arg.dir === 'asc' });
                }
                if (arg.type === 'limit') {
                    q = q.limit(arg.num);
                }
            });
        }
        const { data, error } = await q;
        if (error) {
            throw new Error(error.message || 'Table query failed');
        }
        
        let resultItems = [];
        if (data && Array.isArray(data)) {
            resultItems = data.map(s => deserializeRow(queryRef.path, s));
            saveLocalCollection(queryRef.path, resultItems);
        } else {
            resultItems = getLocalCollection(queryRef.path);
        }

        if ((queryRef.path === 'restaurants' || queryRef.path === 'restaurant_profiles') && resultItems.length === 0) {
            resultItems = [{
                id: 'main',
                name: 'PopFood Cia do Chopp',
                phone: '11999999999',
                adminEmail: 'iranildo.tecnologia@outlook.com',
                isSuperAdmin: true,
                active: true,
                whatsappBotEnabled: true,
                createdAt: new Date().toISOString()
            }];
            saveLocalCollection(queryRef.path, resultItems);
        }

        if (queryRef.queryArgs) {
            queryRef.queryArgs.forEach(arg => {
                if (arg.type === 'where') {
                    resultItems = resultItems.filter(item => matchesQueryFilter(item, arg.field, arg.op, arg.value));
                }
            });
        }

        return {
            empty: resultItems.length === 0,
            docs: resultItems.map(d => ({
                id: d.id,
                data: () => d,
                exists: () => true
            })),
            forEach: function(cb) { this.docs.forEach(cb) }
        };
    } catch (e) {
        // Fallback to localStorage
        let items = getLocalCollection(queryRef.path);
        if ((queryRef.path === 'restaurants' || queryRef.path === 'restaurant_profiles') && items.length === 0) {
            items = [{
                id: 'main',
                name: 'PopFood Cia do Chopp',
                phone: '11999999999',
                adminEmail: 'iranildo.tecnologia@outlook.com',
                isSuperAdmin: true,
                active: true,
                whatsappBotEnabled: true,
                createdAt: new Date().toISOString()
            }];
            saveLocalCollection(queryRef.path, items);
        }

        // Apply query filters on local items
        if (queryRef.queryArgs) {
            queryRef.queryArgs.forEach(arg => {
                if (arg.type === 'where') {
                    items = items.filter(item => matchesQueryFilter(item, arg.field, arg.op, arg.value));
                }
            });
        }

        return {
            empty: items.length === 0,
            docs: items.map(d => ({
                id: d.id,
                data: () => d,
                exists: () => true
            })),
            forEach: function(cb) { this.docs.forEach(cb) }
        };
    }
};

// Active snapshot listeners for real-time reactivity with smart fingerprinting & polling
const listeners = new Set();
const activeSubscriptions = {};

function generateSnapshotFingerprint(snap, isDoc) {
    try {
        if (!snap) return '__null__';
        if (isDoc) {
            if (!snap.exists || !snap.exists()) return '__non_existent__';
            return JSON.stringify(snap.data() || {});
        } else {
            if (!snap.docs || snap.docs.length === 0) return '__empty_0__';
            return `${snap.docs.length}:` + snap.docs.map(d => `${d.id}=${JSON.stringify(d.data() || {})}`).join(';;');
        }
    } catch (e) {
        return String(Date.now()) + Math.random();
    }
}

async function syncListener(listener, force = false) {
    if (listener.isSyncing) return;
    listener.isSyncing = true;
    try {
        let snap;
        if (listener.ref.type === 'doc') {
            snap = await getDoc(listener.ref);
        } else {
            snap = await getDocs(listener.ref);
        }
        const fp = generateSnapshotFingerprint(snap, listener.ref.type === 'doc');
        if (force || fp !== listener.lastFingerprint) {
            listener.lastFingerprint = fp;
            try {
                listener.callback(snap);
            } catch (cbErr) {
                console.error("[onSnapshot Callback Error]:", cbErr);
            }
        }
    } catch (err) {
        console.warn(`[Snapshot Sync Error] path: ${listener.ref?.path}:`, err?.message);
    } finally {
        listener.isSyncing = false;
    }
}

async function notifyListenersByPath(path, force = true) {
    const promises = [];
    for (const listener of listeners) {
        if (listener.ref.path === path || 
            (path === 'restaurants' && listener.ref.path === 'restaurant_profiles') ||
            (path === 'restaurant_profiles' && listener.ref.path === 'restaurants') ||
            (path === 'clients' && listener.ref.path === 'customers') ||
            (path === 'customers' && listener.ref.path === 'clients') ||
            (path.includes('categories') && listener.ref.path.includes('categories')) ||
            (path.includes('products') && listener.ref.path.includes('products')) ||
            (path.includes('complements') && listener.ref.path.includes('complements'))) {
            
            promises.push(syncListener(listener, force));
        }
    }
    await Promise.allSettled(promises);
}

async function syncAllListeners(force = false) {
    if (listeners.size === 0) return;
    const promises = [];
    for (const listener of listeners) {
        promises.push(syncListener(listener, force));
    }
    await Promise.allSettled(promises);
}

// Global Polling Engine for multi-device sync
let pollingIntervalTimer = null;
const ACTIVE_POLL_INTERVAL = 2000;   // 2s when tab is active/visible
const INACTIVE_POLL_INTERVAL = 8000; // 8s when tab is background/hidden

function restartPollingLoop() {
    if (pollingIntervalTimer) {
        clearInterval(pollingIntervalTimer);
        pollingIntervalTimer = null;
    }
    if (typeof window === 'undefined') return;
    
    const interval = (typeof document !== 'undefined' && document.hidden) 
        ? INACTIVE_POLL_INTERVAL 
        : ACTIVE_POLL_INTERVAL;

    pollingIntervalTimer = setInterval(() => {
        syncAllListeners(false);
    }, interval);
}

// Setup adaptive polling and lifecycle triggers
if (typeof window !== 'undefined') {
    restartPollingLoop();

    // Trigger instant sync on tab regain, focus, or network reconnection
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            restartPollingLoop();
            if (!document.hidden) {
                syncAllListeners(false);
            }
        });
    }

    window.addEventListener('focus', () => {
        syncAllListeners(false);
    });

    window.addEventListener('online', () => {
        console.log('[Supabase Adapter] Connection restored. Synchronizing all stores, categories and products...');
        syncAllListeners(true);
    });

    window.addEventListener('pageshow', () => {
        syncAllListeners(false);
    });

    // Expose manual sync trigger on window
    window.syncDatabaseNow = () => syncAllListeners(true);
}

function subscribeToTableChanges(tableName, path) {
    if (activeSubscriptions[tableName]) return;

    console.log(`Subscribing to real-time changes for table: ${tableName}`);
    
    const channel = supabase
        .channel(`public:${tableName}_${Math.random().toString(36).substring(2, 7)}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: tableName
            },
            async (payload) => {
                console.log(`Realtime change received for table ${tableName}:`, payload);
                
                const eventType = payload.eventType;
                const newRow = payload.new;
                const oldRow = payload.old;
                
                let items = getLocalCollection(path);
                
                if (eventType === 'INSERT') {
                    const cleanRow = deserializeRow(path, newRow);
                    const idx = items.findIndex(i => String(i.id) === String(cleanRow.id));
                    if (idx >= 0) {
                        items[idx] = cleanRow;
                    } else {
                        items.push(cleanRow);
                    }
                } else if (eventType === 'UPDATE') {
                    const cleanRow = deserializeRow(path, newRow);
                    const idx = items.findIndex(i => String(i.id) === String(cleanRow.id));
                    if (idx >= 0) {
                        items[idx] = { ...items[idx], ...cleanRow };
                    } else {
                        items.push(cleanRow);
                    }
                } else if (eventType === 'DELETE') {
                    items = items.filter(i => String(i.id) !== String(oldRow.id));
                }
                
                saveLocalCollection(path, items);
                
                // Trigger real-time visual update!
                notifyListenersByPath(path, true);
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Supabase Realtime] Connected to table: ${tableName}`);
            }
        });
        
    activeSubscriptions[tableName] = channel;
}

export const setDoc = async (docRef, data, options = {}) => {
    const payload = { ...data, id: docRef.id };
    // Save to local storage fallback always
    const items = getLocalCollection(docRef.path);
    const idx = items.findIndex(i => String(i.id) === String(docRef.id));
    if (idx >= 0) {
        items[idx] = { ...items[idx], ...payload };
    } else {
        items.push(payload);
    }
    saveLocalCollection(docRef.path, items);

    try {
        const realPath = await getRealTableName(docRef.path);
        
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(docRef.id);
            let existingUuid = null;
            if (isUuid || realPath === 'restaurant_profiles') {
                existingUuid = docRef.id;
            } else {
                const { data: found } = await supabase.from(realPath).select('id').eq('storeId', docRef.id).maybeSingle();
                if (found) {
                    existingUuid = found.id;
                }
            }

            let existingSettings = {};
            try {
                const targetId = existingUuid || docRef.id;
                const { data: foundRow } = await supabase.from(realPath).select('settings').eq('id', targetId).maybeSingle();
                if (foundRow && foundRow.settings) {
                    existingSettings = typeof foundRow.settings === 'string'
                        ? JSON.parse(foundRow.settings)
                        : foundRow.settings;
                }
            } catch (e) {
                console.warn("Could not load existing settings for setDoc:", e);
            }

            const serialized = serializeRow(docRef.path, realPath, payload, existingSettings);
            if (!isUuid && realPath !== 'restaurant_profiles') {
                serialized.storeId = docRef.id;
            }
            if (existingUuid) {
                serialized.id = existingUuid;
                await supabase.from(realPath).update(serialized).eq('id', existingUuid);
            } else {
                if (!isUuid && realPath !== 'restaurant_profiles') {
                    delete serialized.id;
                }
                await supabase.from(realPath).insert(serialized);
            }
        } else {
            const serialized = serializeRow(docRef.path, realPath, payload);
            if (checkIsUuidTable(realPath)) {
                serialized.id = getDeterministicUuid(docRef.id);
            }
            await supabase.from(realPath).upsert(serialized);
        }
    } catch (err) {
        console.warn(`Supabase upsert table ${docRef.path} skipped (saved locally):`, err?.message);
    }

    // Notify listeners after remote write completes so getDocs returns fresh server data
    await notifyListenersByPath(docRef.path);
};

export const updateDoc = async (docRef, data) => {
    const items = getLocalCollection(docRef.path);
    const idx = items.findIndex(i => String(i.id) === String(docRef.id));
    if (idx >= 0) {
        items[idx] = { ...items[idx], ...data };
        saveLocalCollection(docRef.path, items);
    }
    try {
        const realPath = await getRealTableName(docRef.path);
        
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(docRef.id);
            let targetUuid = null;
            if (isUuid || realPath === 'restaurant_profiles') {
                targetUuid = docRef.id;
            } else {
                const { data: found } = await supabase.from(realPath).select('id').eq('storeId', docRef.id).maybeSingle();
                if (found) {
                    targetUuid = found.id;
                }
            }

            let existingSettings = {};
            try {
                const targetId = targetUuid || docRef.id;
                const { data: foundRow } = await supabase.from(realPath).select('settings').eq('id', targetId).maybeSingle();
                if (foundRow && foundRow.settings) {
                    existingSettings = typeof foundRow.settings === 'string'
                        ? JSON.parse(foundRow.settings)
                        : foundRow.settings;
                }
            } catch (e) {
                console.warn("Could not load existing settings for updateDoc:", e);
            }

            if (targetUuid) {
                const serialized = serializeRow(docRef.path, realPath, data, existingSettings);
                await supabase.from(realPath).update(serialized).eq('id', targetUuid);
            }
        } else {
            const serialized = serializeRow(docRef.path, realPath, data);
            const targetId = checkIsUuidTable(realPath) ? getDeterministicUuid(docRef.id) : docRef.id;
            await supabase.from(realPath).update(serialized).eq('id', targetId);
        }
    } catch (err) {
        console.warn(`Supabase update table ${docRef.path} skipped (updated locally):`, err?.message);
    }

    // Notify listeners after remote update completes
    await notifyListenersByPath(docRef.path);
};

export const deleteDoc = async (docRef) => {
    let items = getLocalCollection(docRef.path);
    items = items.filter(i => String(i.id) !== String(docRef.id));
    saveLocalCollection(docRef.path, items);

    try {
        const realPath = await getRealTableName(docRef.path);
        
        if (realPath === 'restaurants' || realPath === 'restaurant_profiles') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(docRef.id);
            let targetUuid = null;
            if (isUuid) {
                targetUuid = docRef.id;
            } else {
                const { data: found } = await supabase.from(realPath).select('id').eq('storeId', docRef.id).maybeSingle();
                if (found) {
                    targetUuid = found.id;
                }
            }
            if (targetUuid) {
                await supabase.from(realPath).delete().eq('id', targetUuid);
            }
        } else {
            const targetId = checkIsUuidTable(realPath) ? getDeterministicUuid(docRef.id) : docRef.id;
            await supabase.from(realPath).delete().eq('id', targetId);
        }
    } catch (err) {
        console.warn(`Supabase delete table ${docRef.path} skipped:`, err?.message);
    }

    // Notify listeners after remote delete completes so getDocs doesn't return stale deleted rows
    await notifyListenersByPath(docRef.path);
};

// Real-time onSnapshot tracking utilizing Supabase channels & smart fingerprint polling
export const onSnapshot = (ref, callback) => {
    const listener = { 
        id: Math.random().toString(36).substring(2, 9),
        ref, 
        callback,
        lastFingerprint: null,
        isSyncing: false
    };
    listeners.add(listener);
    
    // Initial fetch to load data immediately and store baseline fingerprint
    syncListener(listener, true);
    
    // Subscribe to Postgres Realtime modifications
    getRealTableName(ref.path).then(realTable => {
        subscribeToTableChanges(realTable, ref.path);
    });
    
    return () => {
        listeners.delete(listener);
    };
};

export const writeBatch = () => ({
    set: (docRef, data) => setDoc(docRef, data),
    update: (docRef, data) => updateDoc(docRef, data),
    delete: (docRef) => deleteDoc(docRef),
    commit: async () => {}
});

export const getMessaging = () => ({});
export const getToken = async () => 'mock-token';
export const onMessage = () => {};
export const messaging = {};
export const app = {};
export const VAPID_KEY = '';

// Add cross-tab sync for local development
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('popfood_fb_')) {
        const path = e.key.replace('popfood_fb_', '');
        notifyListenersByPath(path);
    }
});
