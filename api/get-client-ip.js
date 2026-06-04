module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Obter IP do cliente (suporta vários headers de proxy)
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  // Remover IPv6 wrapper se existir (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.includes('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  res.json({ ip });
};
