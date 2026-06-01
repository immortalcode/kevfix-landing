export default async function handler(req, res) {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const events = ['call', 'imessage', 'whatsapp'];
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  const keys = [
    ...events.map(e => `clicks:total:${e}`),
    ...events.map(e => `clicks:daily:${today}:${e}`),
  ];

  try {
    const results = await Promise.all(
      keys.map(key =>
        fetch(`${base}/get/${key}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.json())
          .then(d => Number(d.result) || 0)
      )
    );

    res.status(200).json({
      date: today,
      total: {
        call: results[0],
        imessage: results[1],
        whatsapp: results[2],
        all: results[0] + results[1] + results[2],
      },
      today: {
        call: results[3],
        imessage: results[4],
        whatsapp: results[5],
        all: results[3] + results[4] + results[5],
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
