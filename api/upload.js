const GH_TOKEN      = process.env.GH_TOKEN;
const GIST_PHOTOS   = process.env.GIST_PHOTOS_ID;
const DEPLOY_HOOK   = process.env.DEPLOY_HOOK;
const GH_HEADERS    = { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json' };
const REPO          = 'immortalcode/kevfix-landing';

async function readPhotosGist() {
  const r = await fetch(`https://api.github.com/gists/${GIST_PHOTOS}`, { headers: GH_HEADERS });
  const d = await r.json();
  const filename = Object.keys(d.files)[0];
  return JSON.parse(d.files[filename].content);
}

async function writePhotosGist(data) {
  await fetch(`https://api.github.com/gists/${GIST_PHOTOS}`, {
    method: 'PATCH', headers: GH_HEADERS,
    body: JSON.stringify({ files: { 'kevfix-photos.json': { content: JSON.stringify(data) } } }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { filename, content, alt } = req.body; // content = base64 string
  if (!filename || !content) return res.status(400).json({ error: 'Missing filename or content' });

  // Sanitize filename
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const photoPath = `photos/${safeName}`;

  try {
    // Check if file already exists (need SHA to update)
    let sha;
    const check = await fetch(`https://api.github.com/repos/${REPO}/contents/${photoPath}`, { headers: GH_HEADERS });
    if (check.ok) {
      const existing = await check.json();
      sha = existing.sha;
    }

    // Commit the image to the repo
    const body = {
      message: `Upload photo: ${safeName}`,
      content: content.replace(/^data:[^;]+;base64,/, ''), // strip data URI prefix if present
    };
    if (sha) body.sha = sha;

    const commit = await fetch(`https://api.github.com/repos/${REPO}/contents/${photoPath}`, {
      method: 'PUT', headers: GH_HEADERS, body: JSON.stringify(body),
    });
    if (!commit.ok) {
      const err = await commit.json();
      return res.status(500).json({ error: err.message || 'GitHub commit failed' });
    }

    // Add to photo config gist
    const config = await readPhotosGist();
    const alreadyIn = config.photos.some(p => p.file === safeName);
    if (!alreadyIn) {
      config.photos.push({ file: safeName, alt: alt || safeName, visible: true });
      await writePhotosGist(config);
    }

    // Trigger Vercel redeploy
    await fetch(DEPLOY_HOOK, { method: 'POST' });

    res.status(200).json({ ok: true, file: safeName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
