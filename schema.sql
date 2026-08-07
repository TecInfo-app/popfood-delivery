-- schema.sql
-- Create tables for PopFood Supabase Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurants (Store Profiles)
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    store_id TEXT UNIQUE NOT NULL, -- Used for vanity URLs (e.g. /cliente.html?store=mystore)
    name TEXT NOT NULL,
    phone TEXT,
    description TEXT,
    open_time TEXT,
    close_time TEXT,
    cep TEXT,
    address TEXT,
    is_open BOOLEAN DEFAULT true,
    logo TEXT,
    minimum_order_price NUMERIC(10, 2) DEFAULT 0.0,
    abacate_pay_token TEXT,
    mp_access_token TEXT,
    mp_public_key TEXT,
    stripe_public_key TEXT,
    stripe_secret_key TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    delivery_rates JSONB DEFAULT '{}'::jsonb,
    loyalty_active BOOLEAN DEFAULT false,
    loyalty_min_orders INTEGER,
    loyalty_type TEXT,
    loyalty_value NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT REFERENCES restaurants(store_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT REFERENCES restaurants(store_id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    promotional_price NUMERIC(10, 2),
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    complements JSONB DEFAULT '[]'::jsonb, -- Store complements structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT REFERENCES restaurants(store_id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentual' or 'fixed'
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, code)
);

-- 5. Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT REFERENCES restaurants(store_id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    status TEXT NOT NULL DEFAULT 'Pendente',
    total_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2),
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    payment_method TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    chat_messages JSONB DEFAULT '[]'::jsonb,
    delivery_pin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In Supabase you will need to enable Realtime for the 'orders' table.
