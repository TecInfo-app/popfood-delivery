const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

const tablesWithStoreId = ['complements', 'restaurants', 'restaurant_profiles', 'clients', 'categories', 'COLLECTIONS.restaurants', 'COLLECTIONS.restaurantProfiles', 'COLLECTIONS.clients', 'COLLECTIONS.categories', 'COLLECTIONS.complements'];
const tablesWithStore_id = ['orders', 'customers', 'products', 'coupons', 'COLLECTIONS.orders', 'COLLECTIONS.customers', 'COLLECTIONS.products', 'COLLECTIONS.coupons'];

// Replace the hardcoded .eq('store_id' with .eq('storeId' for restaurants
code = code.replace(/\.eq\('store_id'/g, `.eq('storeId'`);
// Also need to fix where store_id is set manually on serialized:
code = code.replace(/serialized\.store_id = docRef\.id/g, `serialized.storeId = docRef.id`);

const oldToDb = `function toDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    if (path === 'restaurants' || path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurants' || path === 'COLLECTIONS.restaurantProfiles') return fieldName;
    
    if (fieldName === 'storeId') return 'store_id';
    if (fieldName === 'categoryId') return 'category_id';
    if (fieldName === 'customerName') return 'customer_name';
    if (fieldName === 'customerPhone') return 'customer_phone';
    if (fieldName === 'customerAddress') return 'customer_address';
    if (fieldName === 'deliveryFee') return 'delivery_fee';
    if (fieldName === 'paymentMethod') return 'payment_method';
    if (fieldName === 'createdAt') return 'created_at';
    if (fieldName === 'updatedAt') return 'updated_at';
    if (fieldName === 'totalPrice') return 'total_price';
    if (fieldName === 'discountAmount') return 'discount';
    if (fieldName === 'couponCode') return 'coupon_code';
    if (fieldName === 'discountType') return 'discount_type';
    if (fieldName === 'discountValue') return 'discount_value';
    if (fieldName === 'minOrderValue') return 'min_order_value';
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

    return fieldName.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
}`;

const newToDb = `function toDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    
    const camelTables = ['restaurants', 'restaurant_profiles', 'clients', 'categories', 'complements'];
    const p = path.replace('COLLECTIONS.', '');
    const isCamel = camelTables.includes(p);
    
    if (isCamel) {
        if (fieldName === 'store_id') return 'storeId';
        if (fieldName === 'created_at') return 'createdAt';
        if (fieldName === 'updated_at') return 'updatedAt';
        return fieldName; // These tables use camelCase
    }
    
    if (fieldName === 'storeId') return 'store_id';
    if (fieldName === 'categoryId') return 'category_id';
    if (fieldName === 'customerName') return 'customer_name';
    if (fieldName === 'customerPhone') return 'customer_phone';
    if (fieldName === 'customerAddress') return 'customer_address';
    if (fieldName === 'deliveryFee') return 'delivery_fee';
    if (fieldName === 'paymentMethod') return 'payment_method';
    if (fieldName === 'createdAt') return 'created_at';
    if (fieldName === 'updatedAt') return 'updated_at';
    if (fieldName === 'totalPrice') return 'total_price';
    if (fieldName === 'discountAmount') return 'discount';
    if (fieldName === 'couponCode') return 'coupon_code';
    if (fieldName === 'discountType') return 'discount_type';
    if (fieldName === 'discountValue') return 'discount_value';
    if (fieldName === 'minOrderValue') return 'min_order_value';
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

    return fieldName.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
}`;

code = code.replace(oldToDb, newToDb);

const oldFromDb = `function fromDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    if (path === 'restaurants' || path === 'restaurant_profiles' || path === 'COLLECTIONS.restaurants' || path === 'COLLECTIONS.restaurantProfiles') return fieldName;
    
    if (fieldName === 'store_id') return 'storeId';
    if (fieldName === 'category_id') return 'categoryId';
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
}`;

const newFromDb = `function fromDbFieldName(path, fieldName) {
    if (!fieldName) return fieldName;
    const camelTables = ['restaurants', 'restaurant_profiles', 'clients', 'categories', 'complements'];
    const p = path.replace('COLLECTIONS.', '');
    const isCamel = camelTables.includes(p);
    if (isCamel) return fieldName;
    
    if (fieldName === 'store_id') return 'storeId';
    if (fieldName === 'category_id') return 'categoryId';
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
}`;

code = code.replace(oldFromDb, newFromDb);

fs.writeFileSync('supabase-adapter.js', code);
