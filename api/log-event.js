// Recebe eventos da extensão DashPRO Monitor e salva no Supabase
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { eventType, platform, errorCode, url, timestamp } = req.body || {};
    if (!eventType || !platform) return res.status(400).json({ error: 'Dados inválidos' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Tenta identificar o usuário pelo token (opcional — evento anônimo se não tiver)
    let userId = null;
    const auth = (req.headers.authorization || '').replace('Bearer ', '');
    if (auth) {
      const { data: { user } } = await supabase.auth.getUser(auth);
      userId = user?.id || null;
    }

    await supabase.from('platform_events').insert({
      user_id:    userId,
      event_type: eventType,
      platform,
      error_code: errorCode || null,
      page_url:   url || null,
      occurred_at: timestamp || new Date().toISOString(),
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[log-event]', err.message);
    return res.status(500).json({ error: err.message });
  }
};
