export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { event } = req.query;
  const valid = ['call', 'imessage', 'whatsapp'];
  if (!valid.includes(event)) return res.status(400).json({ error: 'Invalid event' });

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  try {
    await Promise.all([
      fetch(`${base}/incr/clicks:total:${event}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${base}/incr/clicks:daily:${today}:${event}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track' });
  }
}
