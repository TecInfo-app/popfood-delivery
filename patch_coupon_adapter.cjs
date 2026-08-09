const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

// Update toDbFieldName
code = code.replace(
  /if \(fieldName === 'discountType'\) return 'discount_type';/,
  "if (fieldName === 'discountType' || fieldName === 'type') return 'discount_type';"
);
code = code.replace(
  /if \(fieldName === 'discountValue'\) return 'discount_value';/,
  "if (fieldName === 'discountValue' || fieldName === 'value') return 'discount_value';"
);
code = code.replace(
  /if \(fieldName === 'minOrderValue'\) return 'min_order_value';/,
  "if (fieldName === 'minOrderValue' || fieldName === 'minValue') return 'min_order_value';"
);
if (!code.includes("fieldName === 'expiry'")) {
    code = code.replace(
        /if \(fieldName === 'minOrderValue' \|\| fieldName === 'minValue'\) return 'min_order_value';/,
        "if (fieldName === 'minOrderValue' || fieldName === 'minValue') return 'min_order_value';\n    if (fieldName === 'expiry' || fieldName === 'expiresAt') return 'expires_at';"
    );
}

// Update fromDbFieldName
code = code.replace(
  /if \(fieldName === 'discount_type'\) return 'discountType';/,
  "if (fieldName === 'discount_type') return 'type';"
);
code = code.replace(
  /if \(fieldName === 'discount_value'\) return 'discountValue';/,
  "if (fieldName === 'discount_value') return 'value';"
);
code = code.replace(
  /if \(fieldName === 'min_order_value'\) return 'minOrderValue';/,
  "if (fieldName === 'min_order_value') return 'minValue';"
);
if (!code.includes("fieldName === 'expires_at'")) {
    code = code.replace(
        /if \(fieldName === 'min_order_value'\) return 'minValue';/,
        "if (fieldName === 'min_order_value') return 'minValue';\n    if (fieldName === 'expires_at') return 'expiry';"
    );
}

// Update tableColumns
code = code.replace(
    /'id', 'store_id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'active', 'created_at'/,
    "'id', 'store_id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'active', 'created_at', 'expires_at'"
);

fs.writeFileSync('supabase-adapter.js', code);
