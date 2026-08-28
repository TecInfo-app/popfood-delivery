ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS chat_messages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS has_unread_customer_message BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_chat_enabled BOOLEAN DEFAULT true;
