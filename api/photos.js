const GIST_ID  = process.env.GIST_PHOTOS_ID;
const GH_TOKEN = process.env.GH_TOKEN;
const HEADERS  = { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json' };

async function readGist() {
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers: HEADERS });
  const d = await r.json();
  const filename = Object.keys(d.files)[0];
  return JSON.parse(d.files[filename].content);
}

async function writeGist(data) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ files: { 'kevfix-photos.json': { content: JSON.stringify(data) } } }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const data = await readGist();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    if (req.query.secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { photos } = req.body;
    if (!Array.isArray(photos)) return res.status(400).json({ error: 'Invalid' });
    await writeGist({ photos });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
