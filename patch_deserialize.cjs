const fs = require('fs');
let code = fs.readFileSync('supabase-adapter.js', 'utf8');

const oldStr = `            } else if (row.customer_address && typeof row.customer_address === 'object') {
                deserialized.customerAddress = row.customer_address;
                deserialized.address = row.customer_address.address || row.customer_address.street || JSON.stringify(row.customer_address);
            }`;

const newStr = `            } else if (row.customer_address && typeof row.customer_address === 'object') {
                const cleanAddr = { ...row.customer_address };
                delete cleanAddr._meta;
                deserialized.customerAddress = cleanAddr;
                deserialized.address = cleanAddr.address || cleanAddr.street || JSON.stringify(cleanAddr);
            }`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('supabase-adapter.js', code);
