const GIST_ID       = process.env.GIST_ID;
const GIST_DAILY_ID = process.env.GIST_DAILY_ID;
const GH_TOKEN      = process.env.GH_TOKEN;
const GH_HEADERS    = { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await Promise.all([
      fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: GH_HEADERS,
        body: JSON.stringify({ files: { 'kevfix-clicks.json': { content: JSON.stringify({ call: 0, imessage: 0, whatsapp: 0 }) } } }),
      }),
      fetch(`https://api.github.com/gists/${GIST_DAILY_ID}`, {
        method: 'PATCH',
        headers: GH_HEADERS,
        body: JSON.stringify({ files: { 'kevfix-daily.json': { content: JSON.stringify({}) } } }),
      }),
    ]);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
}
