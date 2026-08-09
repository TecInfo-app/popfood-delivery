const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

const regexSerialize = /\/\/ Hack: Pack missing columns into customer_address JSONB for 'orders'/;
const replaceSerialize = `
    // Hack: pack firstOrderOnly and automatic into discount_type for 'coupons'
    if (realPath === 'coupons' || path === 'coupons' || path === 'COLLECTIONS.coupons') {
        let typeVal = serialized['discount_type'] || payload['type'] || payload['discountType'] || 'percentual';
        if (payload.firstOrderOnly) typeVal += '_FIRSTORDER';
        if (payload.automatic) typeVal += '_AUTOMATIC';
        serialized['discount_type'] = typeVal;
    }

    // Hack: Pack missing columns into customer_address JSONB for 'orders'`;

code = code.replace(regexSerialize, replaceSerialize);
fs.writeFileSync('supabase-adapter.js', code);
