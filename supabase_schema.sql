-- Tabela de Perfil do Restaurante (Lojas)
CREATE TABLE restaurant_profiles (
    id TEXT PRIMARY KEY, -- storeId
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'aberto',
    settings JSONB,
    merchant_tokens JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de Produtos (Cardápio)
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de Clientes
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    email TEXT,
    total_orders INTEGER DEFAULT 0,
    ltv NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(store_id, phone) -- Evitar clientes duplicados por loja e telefone
);

-- Tabela de Cupons
CREATE TABLE coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id TEXT REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage' ou 'fixed'
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(store_id, code)
);

-- Tabela de Pedidos
CREATE TABLE orders (
    id TEXT PRIMARY KEY, -- Pode manter o ID alfanumérico antigo ou UUID
    store_id TEXT REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    status TEXT NOT NULL DEFAULT 'Aguardando',
    payment_method TEXT,
    payment_status TEXT,
    total NUMERIC(10, 2) NOT NULL,
    items JSONB NOT NULL, -- Array de itens do pedido
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    coupon_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Configuração do Realtime para o Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
