module.exports = async (req, res) => {
  // Inicializar dentro do handler para evitar crash no cold start
  const Stripe = require('stripe');
  const { createClient } = require('@supabase/supabase-js');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

    const appUrl = process.env.APP_URL || 'https://dashpro-cpa.vercel.app';

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 3,
        metadata: { user_id: user.id }
      },
      metadata: { user_id: user.id },
      success_url: `${appUrl}/app.html?payment=success`,
      cancel_url:  `${appUrl}/app.html?payment=canceled`,
      allow_promotion_codes: true,
      locale: 'pt-BR',
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('[checkout error]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
