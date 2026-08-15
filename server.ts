import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Stripe from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Database is Supabase

import dotenv from 'dotenv';
dotenv.config();
import { initWhatsappBot, getWhatsappQr, getWhatsappStatus, stopWhatsappSession } from './whatsapp-bot.js';


const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace('xx1bagladzeezdenfbrq', 'xxlbagladzeezdenfbrq');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl || 'https://xxlbagladzeezdenfbrq.supabase.co', supabaseServiceKey);

const resolvedDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta.url
      ? path.dirname(fileURLToPath(import.meta.url))
      : process.cwd());

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard robust CORS configuration that handles all preflight requests gracefully
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    optionsSuccessStatus: 200
  }));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // API route for pushing notifications
  app.post("/api/send-notification", async (req, res) => {
    const { token, title, body, data } = req.body;
    
    if (!token || !title || !body) {
      return res.status(400).json({ error: "Faltam parâmetros obrigatórios (token, title, body)." });
    }

    try {
      const message = {
        notification: {
          title: title,
          body: body,
          image: 'favicon.png'
        },
        data: data || {},
        token: token,
      };

      res.json({ success: true, messageId: 'mock-id-push-sent' });
    } catch (error: any) {
      console.error("Erro ao enviar notificação push:", error);
      res.status(500).json({ error: error.message || "Falha ao enviar notificação." });
    }
  });

  // API route for Uber Direct Delivery
  app.post("/api/uber-direct/criar-entrega", async (req, res) => {
    const { orderDetails, storeId } = req.body;
    
    try {
      if (!storeId) {
        return res.status(400).json({ error: "Store ID é necessário." });
      }

      // Fetch Uber Direct config from banco de dados
      const { data: storeData, error } = await supabase.from('restaurants').select('uber_direct_config').eq('store_id', storeId).single();
      
      if (error || !storeData) {
        return res.status(404).json({ error: "Perfil da loja não encontrado." });
      }

      const uberDirectConfig = storeData?.uber_direct_config;

      const clientId = uberDirectConfig?.clientId;
      const clientSecret = uberDirectConfig?.clientSecret;
      const customerId = uberDirectConfig?.customerId;

      if (!clientId || !clientSecret || !customerId) {
        return res.status(400).json({ error: "As credenciais da Uber Direct não foram configuradas no Painel." });
      }

      // 1. Obter Access Token da Uber
      const authResponse = await fetch('https://auth.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'eats.deliveries'
        })
      });
      const authData = await authResponse.json();
      if (!authResponse.ok) throw new Error(`Erro autenticação Uber: ${authData.error_description || JSON.stringify(authData)}`);
      const accessToken = authData.access_token;

      // 2. Criar entrega na Uber
      const uberDeliveryRes = await fetch(`https://api.uber.com/v1/customers/${customerId}/deliveries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderDetails)
      });
      const uberDeliveryData = await uberDeliveryRes.json();
      
      if (!uberDeliveryRes.ok) throw new Error(`Erro na API Uber: ${JSON.stringify(uberDeliveryData)}`);

      res.json({ success: true, delivery: uberDeliveryData });

    } catch (error: any) {
      console.error("Erro na integração Uber Direct:", error);
      res.status(500).json({ error: error.message || "Falha ao solicitar entrega na Uber." });
    }
  });

  // API route for Canceling Uber Direct Delivery
  app.post("/api/uber-direct/cancelar-entrega", async (req, res) => {
    const { deliveryId, storeId } = req.body;
    
    try {
      if (!storeId || !deliveryId) {
        return res.status(400).json({ error: "Store ID e Delivery ID são necessários." });
      }

      // Fetch Uber Direct config from banco de dados
      const { data: storeData, error } = await supabase.from('restaurants').select('uber_direct_config').eq('store_id', storeId).single();
      
      if (error || !storeData) {
        return res.status(404).json({ error: "Perfil da loja não encontrado." });
      }
      const uberDirectConfig = storeData?.uber_direct_config;

      const clientId = uberDirectConfig?.clientId;
      const clientSecret = uberDirectConfig?.clientSecret;
      const customerId = uberDirectConfig?.customerId;

      if (!clientId || !clientSecret || !customerId) {
        return res.status(400).json({ error: "As credenciais da Uber Direct não foram configuradas." });
      }

      // 1. Obter Access Token da Uber
      const authResponse = await fetch('https://auth.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'eats.deliveries'
        })
      });
      const authData = await authResponse.json();
      if (!authResponse.ok) throw new Error(`Erro autenticação Uber: ${authData.error_description || JSON.stringify(authData)}`);
      const accessToken = authData.access_token;

      // 2. Cancelar entrega na Uber
      const uberDeliveryRes = await fetch(`https://api.uber.com/v1/customers/${customerId}/deliveries/${deliveryId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const uberDeliveryData = await uberDeliveryRes.json();
      
      if (!uberDeliveryRes.ok) throw new Error(`Erro na API Uber ao cancelar: ${JSON.stringify(uberDeliveryData)}`);

      res.json({ success: true, delivery: uberDeliveryData });

    } catch (error: any) {
      console.error("Erro na integração Uber Direct (Cancelamento):", error);
      res.status(500).json({ error: error.message || "Falha ao cancelar entrega na Uber." });
    }
  });

  // API route for payments
  app.post("/api/create-payment", async (req, res) => {
    const { amount, paymentMethodType, cardToken, email, description, storeId, orderId, phone, customerName, customerEmail, cpfCnpj, asaasCardData } = req.body;
    
    try {
      const projectId = "";
      const apiKey = "";
      const safeStoreId = storeId || "main";
      
      // Replace banco de dados fetch with Supabase fetch
      let fields: any = {};
      const { data: pData, error: pErr } = await supabase.from('restaurant_profiles').select('*').eq('id', safeStoreId).single();
      if (!pErr && pData) {
        Object.keys(pData).forEach(k => { fields[k] = { stringValue: pData[k] }; });
      } else {
        const { data: pData2, error: pErr2 } = await supabase.from('restaurants').select('*').eq('id', safeStoreId).single();
        if (!pErr2 && pData2) {
          Object.keys(pData2).forEach(k => { fields[k] = { stringValue: pData2[k] }; });
        } else {
          throw new Error('Falha ao buscar perfil do restaurante (Supabase)');
        }
      }

      
      const mpAccessToken = fields.mpAccessToken?.stringValue;
      const stripeSecretKey = fields.stripeSecretKey?.stringValue;
      const abacatePayToken = fields.abacatePayToken?.stringValue;
      const asaasApiKey = fields.asaasApiKey?.stringValue;
      const asaasEnv = fields.asaasEnv?.stringValue || 'production';
      const onlineGateway = fields.onlineGateway?.stringValue || (asaasApiKey ? 'asaas' : 'abacatepay');

      // ASAAS FLOW
      if (onlineGateway === 'asaas' && asaasApiKey) {
        const asaasBaseUrl = asaasEnv === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';

        async function callAsaasApi(endpoint: string, method = 'GET', bodyData: any = null) {
          const res = await fetch(`${asaasBaseUrl}${endpoint}`, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasApiKey,
              'Accept': 'application/json'
            },
            body: bodyData ? JSON.stringify(bodyData) : undefined
          });
          const data = await res.json();
          if (!res.ok || data.errors) {
            const msg = data.errors && data.errors[0] ? data.errors[0].description : JSON.stringify(data);
            throw new Error(`Erro Asaas (${endpoint}): ${msg}`);
          }
          return data;
        }

        let customerId = null;
        const custPhone = (phone || '').replace(/\D/g, '');
        if (custPhone) {
          try {
            const searchRes = await callAsaasApi(`/customers?mobilePhone=${custPhone}`);
            if (searchRes.data && searchRes.data.length > 0) {
              customerId = searchRes.data[0].id;
            }
          } catch (e) { }
        }

        if (!customerId) {
          const newCust = await callAsaasApi('/customers', 'POST', {
            name: customerName || 'Cliente PopFood',
            email: customerEmail || 'cliente@popfood.com',
            mobilePhone: custPhone || '81999999999',
            cpfCnpj: cpfCnpj || undefined,
            notificationDisabled: true
          });
          customerId = newCust.id;
        } else if (cpfCnpj) {
          // Attempt to update customer with CPF/CNPJ if not present
          try {
            await callAsaasApi(`/customers/${customerId}`, 'POST', {
              cpfCnpj: cpfCnpj
            });
          } catch (e) {}
        }

        const dueDateIso = new Date().toISOString().split('T')[0];

        if (paymentMethodType === 'pix') {
          const payRes = await callAsaasApi('/payments', 'POST', {
            customer: customerId,
            billingType: 'PIX',
            value: Number(amount),
            dueDate: dueDateIso,
            description: description || 'Pedido PopFood',
            externalReference: orderId || `ord_${Date.now()}`
          });

          const pixQr = await callAsaasApi(`/payments/${payRes.id}/pixQrCode`);
          let qrImg = pixQr.encodedImage || '';
          if (qrImg && !qrImg.startsWith('data:')) {
            qrImg = 'data:image/png;base64,' + qrImg;
          }

          return res.json({
            provider: 'asaas',
            method: 'pix',
            qrCode: pixQr.payload,
            qrCodeBase64: qrImg,
            paymentId: payRes.id,
            status: payRes.status || 'PENDING'
          });
        } else {
          // If we have custom asaas credit card data, do a transparent card transaction!
          if (asaasCardData) {
            const payRes = await callAsaasApi('/payments', 'POST', {
              customer: customerId,
              billingType: 'CREDIT_CARD',
              value: Number(amount),
              dueDate: dueDateIso,
              description: description || 'Pedido PopFood',
              externalReference: orderId || `ord_${Date.now()}`,
              creditCard: {
                holderName: asaasCardData.holderName,
                number: asaasCardData.number,
                expiryMonth: asaasCardData.expiryMonth,
                expiryYear: asaasCardData.expiryYear,
                ccv: asaasCardData.ccv
              },
              creditCardHolderInfo: {
                name: asaasCardData.holderName,
                email: asaasCardData.email,
                cpfCnpj: asaasCardData.cpfCnpj,
                postalCode: asaasCardData.postalCode,
                addressNumber: asaasCardData.addressNumber,
                phone: custPhone || '81999999999',
                mobilePhone: custPhone || '81999999999'
              }
            });

            return res.json({
              provider: 'asaas',
              method: 'card',
              status: payRes.status || 'CONFIRMED',
              paymentId: payRes.id
            });
          } else {
            // Fallback to Checkout Link if no card data provided
            const payRes = await callAsaasApi('/payments', 'POST', {
              customer: customerId,
              billingType: 'CREDIT_CARD',
              value: Number(amount),
              dueDate: dueDateIso,
              description: description || 'Pedido PopFood',
              externalReference: orderId || `ord_${Date.now()}`
            });

            return res.json({
              provider: 'asaas',
              method: 'checkout',
              url: payRes.invoiceUrl || payRes.bankSlipUrl,
              paymentId: payRes.id
            });
          }
        }
      }

      // ABACATEPAY FLOW
      if (abacatePayToken && onlineGateway === 'abacatepay') {
        let amountCents = Math.round(Number(amount) * 100);
        
        if (paymentMethodType === 'pix') {
          // TRANSPARENT PIX CHECKOUT (Direct QR Code generation)
          const pixPayload = {
              amount: amountCents,
              description: description || 'Pedido PopFood'
          };
          const pixRes = await fetch('https://api.abacatepay.com/v2/transparents/create', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${abacatePayToken}`,
                'Accept': 'application/json'
              },
              body: JSON.stringify(pixPayload)
          });
          const pixData = await pixRes.json();
          if (!pixRes.ok || pixData.error) {
              throw new Error(`Erro AbacatePay (Pix Transparente): ${pixData.error || JSON.stringify(pixData)}`);
          }
          
          const actualPix = pixData.data || pixData;
          return res.json({
              provider: 'abacatepay',
              method: 'pix',
              qrCode: actualPix.brCode,
              qrCodeBase64: actualPix.brCodeBase64,
              paymentId: actualPix.id,
              status: actualPix.status || 'PENDING'
          });
        } else {
          // CREDIT CARD FLOW (FALLBACK - REDIRECT TO CHECKOUT URL)
          // 1. Create a dynamic product for the order
          const prodPayload = {
              externalId: `pedido-${Date.now()}-${Math.floor(Math.random()*1000)}`,
              name: description || 'Pedido PopFood',
              price: amountCents,
              currency: 'BRL'
          };
          const prodRes = await fetch('https://api.abacatepay.com/v2/products/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${abacatePayToken}` },
              body: JSON.stringify(prodPayload)
          });
          const prodData = await prodRes.json();
          if (!prodRes.ok || prodData.error) {
              throw new Error(`Erro AbacatePay (Produto): ${prodData.error || JSON.stringify(prodData)}`);
          }
          
          // 2. Create the checkout
          const origin = req.headers.origin || 'http://localhost:3000';
          const checkoutPayload = {
              items: [{ id: prodData.data.id, quantity: 1 }],
              returnUrl: `${origin}/cliente.html?store=${safeStoreId}&orderId=${orderId || ''}&abacateReturn=1`,
              completionUrl: `${origin}/cliente.html?store=${safeStoreId}&orderId=${orderId || ''}&abacateReturn=1`
          };
          const checkoutRes = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${abacatePayToken}` },
              body: JSON.stringify(checkoutPayload)
          });
          const checkoutData = await checkoutRes.json();
          if (!checkoutRes.ok || checkoutData.error) {
              throw new Error(`Erro AbacatePay (Checkout): ${checkoutData.error || JSON.stringify(checkoutData)}`);
          }
          
          return res.json({
              provider: 'abacatepay',
              method: 'checkout',
              url: checkoutData.data.url,
              paymentId: checkoutData.data.id
          });
        }
      }

      // MERCADO PAGO FLOW (Preferred)
      if (mpAccessToken) {
        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
        const payment = new Payment(client);

        if (paymentMethodType === 'pix') {
          const result = await payment.create({
            body: {
              transaction_amount: Number(amount),
              description: description || 'Pedido PopFood',
              payment_method_id: 'pix',
              payer: {
                email: email || 'cliente@exemplo.com'
              },
            }
          });
          return res.json({ 
            provider: 'mercadopago',
            method: 'pix',
            qrCode: result.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
            paymentId: result.id
          });
        } else if (cardToken) {
          // Card flow
          const result = await payment.create({
            body: {
              transaction_amount: Number(amount),
              token: cardToken,
              description: description || 'Pedido PopFood',
              installments: 1,
              payment_method_id: req.body.paymentMethodId,
              payer: {
                email: email || 'cliente@exemplo.com'
              },
            }
          });
          return res.json({ 
            provider: 'mercadopago',
            method: 'card',
            status: result.status,
            paymentId: result.id
          });
        }
      }

      // STRIPE FLOW (Fallback)
      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'brl',
          payment_method_types: [paymentMethodType === 'pix' ? 'pix' : 'card'],
        });
        return res.json({ 
          provider: 'stripe',
          clientSecret: paymentIntent.client_secret 
        });
      }

      return res.status(400).json({ error: "Nenhum método de pagamento online configurado no perfil do restaurante." });
      
    } catch (error: any) {
      console.error("Erro no processamento do pagamento:", error);
      res.status(500).json({ error: error.message || "Erro interno ao processar pagamento" });
    }
  });

  // Check payment status dynamically (polls both AbacatePay and Mercado Pago)
  app.get("/api/check-payment", async (req, res) => {
    let { paymentId, storeId, orderId } = req.query;
    const safeStoreId = (storeId as string) || "main";
    
    try {
      const projectId = "";
      const apiKey = "";

      // If paymentId is missing but orderId is present, try to find the paymentId in banco de dados
      if (!paymentId && orderId) {
        try {
          
          const { data: orderData, error: orderErr } = await supabase.from('orders').select('payment_id').eq('id', orderId).single();
          if (!orderErr && orderData) {
            paymentId = orderData.payment_id;
          }

        } catch (err) {
          console.error("Erro ao buscar paymentId no banco de dados:", err);
        }
      }

      if (!paymentId) {
        return res.status(400).json({ error: "Parâmetro paymentId é obrigatório ou não pôde ser encontrado." });
      }

      
      // Replace banco de dados fetch with Supabase fetch
      let fields: any = {};
      const { data: pData, error: pErr } = await supabase.from('restaurant_profiles').select('*').eq('id', safeStoreId).single();
      if (!pErr && pData) {
        Object.keys(pData).forEach(k => { fields[k] = { stringValue: pData[k] }; });
      } else {
        const { data: pData2, error: pErr2 } = await supabase.from('restaurants').select('*').eq('id', safeStoreId).single();
        if (!pErr2 && pData2) {
          Object.keys(pData2).forEach(k => { fields[k] = { stringValue: pData2[k] }; });
        } else {
          throw new Error('Falha ao buscar perfil do restaurante (Supabase)');
        }
      }

      const abacatePayToken = fields.abacatePayToken?.stringValue;
      const asaasApiKey = fields.asaasApiKey?.stringValue;
      const asaasEnv = fields.asaasEnv?.stringValue || 'production';
      const onlineGateway = fields.onlineGateway?.stringValue || (asaasApiKey ? 'asaas' : 'abacatepay');
      const mpAccessToken = fields.mpAccessToken?.stringValue;

      let isPaid = false;
      let statusStr = "PENDING";
      let providerStr = "";

      // 1. ASAAS CHECK
      if (asaasApiKey && (onlineGateway === 'asaas' || (paymentId as string).startsWith('pay_'))) {
        providerStr = "asaas";
        const asaasBaseUrl = asaasEnv === 'sandbox' ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';
        const checkRes = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'access_token': asaasApiKey,
            'Accept': 'application/json'
          }
        });
        if (!checkRes.ok) {
          throw new Error(`Erro ao consultar status no Asaas (Status: ${checkRes.status})`);
        }
        const checkData = await checkRes.json();
        const rawStatus = checkData.status || "PENDING";
        if (["RECEIVED", "CONFIRMED", "DUNNING_RECEIVED"].includes(rawStatus)) {
          isPaid = true;
          statusStr = "PAID";
        } else if (rawStatus === "PENDING" || rawStatus === "AWAITING_RISK_ANALYSIS") {
          statusStr = "PENDING";
        } else {
          statusStr = "CANCELLED";
        }
      }
      // 2. ABACATEPAY CHECK
      else if (abacatePayToken) {
        providerStr = "abacatepay";
        const isCheckout = (paymentId as string).startsWith("bill_") || (paymentId as string).startsWith("chk_");
        const abacateUrl = isCheckout 
          ? `https://api.abacatepay.com/v2/checkouts/get?id=${paymentId}`
          : `https://api.abacatepay.com/v2/transparents/check?id=${paymentId}`;

        const checkRes = await fetch(abacateUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${abacatePayToken}`,
            'Accept': 'application/json'
          }
        });
        if (!checkRes.ok) {
          throw new Error(`Erro ao consultar status no AbacatePay (Status: ${checkRes.status})`);
        }
        const checkData = await checkRes.json();
        const actualStatus = checkData.data?.status || checkData.status || "PENDING";
        
        statusStr = actualStatus;
        if (actualStatus === "PAID") {
          isPaid = true;
        }
      }
      // 2. MERCADO PAGO CHECK
      else if (mpAccessToken) {
        providerStr = "mercadopago";
        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
        const payment = new Payment(client);
        const result = await payment.get({ id: Number(paymentId) });
        
        statusStr = result.status || "pending";
        if (result.status === 'approved') {
          isPaid = true;
          statusStr = "PAID";
        } else if (result.status === 'pending' || result.status === 'in_process') {
          statusStr = "PENDING";
        } else {
          statusStr = "CANCELLED";
        }
      } else {
        return res.status(400).json({ error: "Nenhum provedor de pagamento configurado para esta loja." });
      }

      // If paid, update the order in banco de dados directly
      if (isPaid && orderId) {
        try {
          
          const { data: orderData, error: orderFetchErr } = await supabase.from('orders').select('*').eq('id', orderId).single();
          if (!orderFetchErr && orderData) {

            // Somente altera status para Pendente e envia push se estiver em AguardandoPagamento
            if (orderData.status === "AguardandoPagamento") {
              await supabase.from('orders').update({
                status: "Pendente",
                paymentApproved: true,
                isPaid: true,
                paymentStatus: "Aprovado"
              }).eq('id', orderId);
              console.log(`Pedido ${orderId} atualizado de AguardandoPagamento para Pendente.`);

              // Enviar Push Notification de Novo Pedido para os tokens do lojista
              try {
                // /* removed dbAdmin */
                
                const { data: profileData, error: profileErr } = await supabase.from('restaurant_profiles').select('merchantTokens, merchant_tokens').eq('id', safeStoreId).single();
                if (!profileErr && profileData) {

                  const merchantTokens = (profileData as any)?.merchantTokens || (profileData as any)?.merchant_tokens || [];
                  if (merchantTokens.length > 0) {
                    const title = "🚨 Novo Pedido Recebido (Pago)!";
                    const formattedTotal = Number(orderData.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const body = `Pedido #${(orderId as string).substring(0, 5).toUpperCase()} no valor de ${formattedTotal} foi pago e recebido!`;
                    
                    for (const mToken of merchantTokens) {
                      try {
                        const message = {
                          notification: {
                            title,
                            body,
                            image: 'favicon.png'
                          },
                          data: {
                            orderId: orderId as string,
                            type: "new_order"
                          },
                          token: mToken,
                        };
                        // admin.messaging().send(message) disabled
                        console.log(`Push enviado com sucesso para token ${mToken.substring(0, 8)}...`);
                      } catch (pushErr) {
                        console.error("Erro ao enviar push para token do lojista:", pushErr);
                      }
                    }
                  }
                }
              } catch (pushErr) {
                console.error("Erro ao obter tokens para envio de notificação push:", pushErr);
              }
            } else {
              // Se já estiver em outro status (ex: Pendente, Preparando), apenas atualiza os flags de pagamento
              await supabase.from('orders').update({
                paymentApproved: true,
                isPaid: true,
                paymentStatus: "Aprovado"
              }).eq('id', orderId);
              console.log(`Pedido ${orderId} já estava com status ${orderData.status}. Flags de pagamento atualizados.`);
            }
          }
        } catch (dbErr: any) {
          console.error(`Falha ao atualizar documento do pedido no banco de dados:`, dbErr);
        }
      }

      return res.json({
        status: statusStr,
        provider: providerStr,
        isPaid
      });
      
    } catch (error: any) {
      console.error("Erro ao verificar pagamento:", error);
      res.status(500).json({ error: error.message || "Erro interno ao verificar pagamento" });
    }
  });

  // Keep compatibility for older client versions
  app.post("/api/create-payment-intent", async (req, res) => {
    // Redirect to the new unified endpoint
    req.url = "/api/create-payment";
    return app._router.handle(req, res, () => {});
  });

  
  // Scheduler disabled
  // WhatsApp Endpoints
  initWhatsappBot(supabase);

  app.get("/api/whatsapp/qr", async (req, res) => {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) return res.status(400).json({ error: "storeId is required" });
      const result = await getWhatsappQr(storeId);
      res.json(result);
    } catch (e) {
      console.error("WhatsApp QR Error:", e);
      res.status(500).json({ error: "Failed to load WhatsApp session" });
    }
  });

  app.get("/api/whatsapp/status", async (req, res) => {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) return res.status(400).json({ error: "storeId is required" });
      const status = await getWhatsappStatus(storeId);
      res.json(status);
    } catch (e) {
      console.error("WhatsApp Status Error:", e);
      res.status(500).json({ error: "Failed to get status" });
    }
  });

  app.post("/api/whatsapp/logout", async (req, res) => {
    try {
      const { storeId } = req.body;
      if (!storeId) return res.status(400).json({ error: "storeId is required" });
      await stopWhatsappSession(storeId);
      res.json({ success: true });
    } catch (e) {
      console.error("WhatsApp Logout Error:", e);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
