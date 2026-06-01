const GIST_ID       = process.env.GIST_ID;
const GIST_DAILY_ID = process.env.GIST_DAILY_ID;
const GH_TOKEN      = process.env.GH_TOKEN;
const GH_HEADERS    = { Authorization: `Bearer ${GH_TOKEN}` };

async function readGist(id) {
  const r = await fetch(`https://api.github.com/gists/${id}`, { headers: GH_HEADERS });
  const d = await r.json();
  const filename = Object.keys(d.files)[0];
  return JSON.parse(d.files[filename].content);
}

export default async function handler(req, res) {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  try {
    const [totals, daily] = await Promise.all([readGist(GIST_ID), readGist(GIST_DAILY_ID)]);
    const todayData = daily[today] || { call: 0, imessage: 0, whatsapp: 0 };

    res.status(200).json({
      date: today,
      total: {
        call:     totals.call     || 0,
        imessage: totals.imessage || 0,
        whatsapp: totals.whatsapp || 0,
        all:      (totals.call || 0) + (totals.imessage || 0) + (totals.whatsapp || 0),
      },
      today: {
        call:     todayData.call     || 0,
        imessage: todayData.imessage || 0,
        whatsapp: todayData.whatsapp || 0,
        all:      (todayData.call || 0) + (todayData.imessage || 0) + (todayData.whatsapp || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
