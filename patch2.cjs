const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

code = code.replace(
    /restaurants: \[\n        'id', 'owner_id'[^\]]+\]/,
    `restaurants: [
        'id', 'ownerId', 'storeId', 'name', 'phone', 'description', 
        'openTime', 'closeTime', 'cep', 'address', 'isOpen', 'logo', 'logoUrl', 'coverUrl',
        'minimumOrderPrice', 'abacatePayToken', 'mpAccessToken', 'mpPublicKey', 
        'stripePublicKey', 'stripeSecretKey', 'latitude', 'longitude', 'deliveryRates', 
        'loyaltyActive', 'loyaltyMinOrders', 'loyaltyType', 'loyaltyValue', 'createdAt', 'updatedAt',
        'status', 'settings', 'merchantTokens', 'whatsappBotEnabled', 'active', 'isSuperAdmin', 'adminEmail', 'adminPassword'
    ]`
);

code = code.replace(
    /restaurant_profiles: \[\n        'id', 'owner_id'[^\]]+\]/,
    `restaurant_profiles: [
        'id', 'ownerId', 'storeId', 'name', 'phone', 'description', 
        'openTime', 'closeTime', 'cep', 'address', 'isOpen', 'logo', 'logoUrl', 'coverUrl',
        'minimumOrderPrice', 'abacatePayToken', 'mpAccessToken', 'mpPublicKey', 
        'stripePublicKey', 'stripeSecretKey', 'latitude', 'longitude', 'deliveryRates', 
        'loyaltyActive', 'loyaltyMinOrders', 'loyaltyType', 'loyaltyValue', 'createdAt', 'updatedAt',
        'status', 'settings', 'merchantTokens', 'whatsappBotEnabled', 'active', 'isSuperAdmin', 'adminEmail', 'adminPassword'
    ]`
);

fs.writeFileSync('supabase-adapter.js', code);
