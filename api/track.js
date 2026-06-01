const GIST_ID       = process.env.GIST_ID;
const GIST_DAILY_ID = process.env.GIST_DAILY_ID;
const GH_TOKEN      = process.env.GH_TOKEN;
const GH_HEADERS    = { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json' };

async function readGist(id) {
  const r = await fetch(`https://api.github.com/gists/${id}`, { headers: GH_HEADERS });
  const d = await r.json();
  const filename = Object.keys(d.files)[0];
  return JSON.parse(d.files[filename].content);
}

async function writeGist(id, filename, data) {
  await fetch(`https://api.github.com/gists/${id}`, {
    method: 'PATCH',
    headers: GH_HEADERS,
    body: JSON.stringify({ files: { [filename]: { content: JSON.stringify(data) } } }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { event } = req.query;
  if (!['call', 'imessage', 'whatsapp'].includes(event)) {
    return res.status(400).json({ error: 'Invalid event' });
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  try {
    const [totals, daily] = await Promise.all([readGist(GIST_ID), readGist(GIST_DAILY_ID)]);

    totals[event] = (totals[event] || 0) + 1;
    if (!daily[today]) daily[today] = { call: 0, imessage: 0, whatsapp: 0 };
    daily[today][event] = (daily[today][event] || 0) + 1;

    await Promise.all([
      writeGist(GIST_ID, 'kevfix-clicks.json', totals),
      writeGist(GIST_DAILY_ID, 'kevfix-daily.json', daily),
    ]);

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Tracking failed' });
  }
}
