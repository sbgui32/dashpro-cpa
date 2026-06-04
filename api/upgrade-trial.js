module.exports = async (req, res) => {
  const Stripe = require('stripe');
  const { createClient } = require('@supabase/supabase-js');

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verificar user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

    // 2. Pegar subscription atual (trial)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription) {
      return res.status(400).json({ error: 'Nenhum trial encontrado para este usuário' });
    }

    const appUrl = process.env.APP_URL || 'https://dashpro-cpa.vercel.app';

    // 3. Criar ou reutilizar Stripe customer
    let customerId = subscription.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    // 4. Criar checkout session para upgrade
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        // Não há trial aqui — já está em trial
        metadata: { user_id: user.id, is_upgrade: 'true' }
      },
      metadata: { user_id: user.id, is_upgrade: 'true' },
      success_url: `${appUrl}/app.html?payment=success`,
      cancel_url: `${appUrl}/app.html?payment=canceled`,
      allow_promotion_codes: true,
      locale: 'pt-BR'
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error('[upgrade-trial error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
