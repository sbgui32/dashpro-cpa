module.exports = async (req, res) => {
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

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verificar user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

    // 2. Pegar o IP do cliente
    let ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');

    // 3. Verificar se já tem trial ativo COM ESTE IP
    const { data: existingTrial, error: queryError } = await supabase
      .from('subscriptions')
      .select('user_id, status, trial_started_at, current_period_end, is_trial_only')
      .eq('ip_address', ip)
      .eq('is_trial_only', true)
      .eq('status', 'trialing')
      .maybeSingle();

    if (queryError && !queryError.message.includes('column')) {
      throw queryError;
    }

    // 4. Se já tem trial em aberto, bloqueia
    if (existingTrial) {
      const now = new Date();
      const trialEnd = existingTrial.current_period_end ? new Date(existingTrial.current_period_end) : null;

      if (trialEnd && trialEnd > now) {
        return res.json({
          canTrial: false,
          reason: 'Este IP já possui um trial ativo',
          existingTrialUser: existingTrial.user_id,
          trialEndsAt: trialEnd.toISOString()
        });
      }
    }

    // 5. Se chegou aqui, pode fazer trial — CRIAR OU ATUALIZAR subscription
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 dias

    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        ip_address: ip,
        status: 'trialing',
        trial_started_at: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        is_trial_only: true,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        trial_end: null,
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) throw upsertError;

    return res.json({
      canTrial: true,
      message: 'Trial ativado com sucesso',
      ip: ip,
      trialEndsAt: trialEnd.toISOString(),
      daysRemaining: 3
    });

  } catch (err) {
    console.error('[check-trial] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
