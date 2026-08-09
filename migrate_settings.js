import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrate() {
    console.log("Starting migration of restaurant settings...");
    const { data: rests, error: fetchErr } = await supabase.from('restaurants').select('*');
    if (fetchErr) {
        console.error("Error fetching restaurants:", fetchErr);
        return;
    }
    if (!rests || rests.length === 0) {
        console.log("No restaurants found to migrate.");
        return;
    }
    
    for (const r of rests) {
        console.log("Processing store:", r.id);
        
        // Fetch existing profile to get current settings
        const { data: profile } = await supabase.from('restaurant_profiles').select('*').eq('id', r.id).maybeSingle();
        
        const existingSettings = profile?.settings || {};
        
        // Pack all extra columns from restaurants table
        const packedSettings = {
            ...existingSettings,
            openTime: r.openTime || r.open_time || existingSettings.openTime || null,
            closeTime: r.closeTime || r.close_time || existingSettings.closeTime || null,
            cep: r.cep || existingSettings.cep || null,
            isOpen: r.isOpen !== undefined ? r.isOpen : (existingSettings.isOpen !== undefined ? existingSettings.isOpen : true),
            minimumOrderPrice: r.minimumOrderPrice !== undefined ? r.minimumOrderPrice : (existingSettings.minimumOrderPrice || 0),
            abacatePayToken: r.abacatePayToken || existingSettings.abacatePayToken || "",
            mpAccessToken: r.mpAccessToken || existingSettings.mpAccessToken || "",
            mpPublicKey: r.mpPublicKey || existingSettings.mpPublicKey || "",
            stripePublicKey: r.stripePublicKey || existingSettings.stripePublicKey || "",
            stripeSecretKey: r.stripeSecretKey || existingSettings.stripeSecretKey || "",
            latitude: r.latitude !== undefined ? r.latitude : existingSettings.latitude || null,
            longitude: r.longitude !== undefined ? r.longitude : existingSettings.longitude || null,
            whatsappBotEnabled: r.whatsappBotEnabled !== undefined ? r.whatsappBotEnabled : (existingSettings.whatsappBotEnabled || false),
            deliveryRates: r.deliveryRates || existingSettings.deliveryRates || null,
            active: r.active !== undefined ? r.active : (existingSettings.active !== undefined ? existingSettings.active : true),
            isSuperAdmin: r.isSuperAdmin !== undefined ? r.isSuperAdmin : (existingSettings.isSuperAdmin || false),
            adminEmail: r.adminEmail || existingSettings.adminEmail || "",
            adminPassword: r.adminPassword || existingSettings.adminPassword || "",
        };
        
        const { error } = await supabase.from('restaurant_profiles').upsert({
            id: r.id,
            name: r.name || profile?.name,
            description: r.description || profile?.description,
            logo_url: r.logo || profile?.logo_url || "",
            phone: r.phone || profile?.phone || "",
            address: r.address || profile?.address || "",
            status: profile?.status || 'aberto',
            settings: packedSettings,
            created_at: r.createdAt || r.created_at || profile?.created_at || new Date().toISOString()
        });
        
        if (error) {
            console.error("Error upserting profile:", r.id, error);
        } else {
            console.log("Successfully migrated profile settings for:", r.id);
        }
    }
    console.log("Migration finished.");
}

migrate();
