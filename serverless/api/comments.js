// serverless/api/comments.js
// Vercel / Netlify-compatible serverless function
// Environment variables required:
// - GITHUB_TOKEN: personal access token with repo permissions
// - GITHUB_REPO: owner/repo (e.g., YeongpyoKim/listen)
// - GITHUB_BRANCH: branch to commit to (default: main)
// - GITHUB_FILE: path to comments file (default: site/data/comments.json)

const fetch = global.fetch || require('node-fetch');

const OWNER_REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = process.env.GITHUB_FILE || 'site/data/comments.json';

if (!OWNER_REPO || !TOKEN) {
  // allow function to start but will return 500 on requests
}

async function getFile() {
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${encodeURIComponent(FILE_PATH)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
  if (res.status === 404) return { exists: false };
  if (!res.ok) throw new Error(`GitHub getFile failed: ${res.status}`);
  const j = await res.json();
  const content = Buffer.from(j.content, 'base64').toString('utf8');
  return { exists: true, sha: j.sha, content: content };
}

async function putFile(newContentStr, sha, message) {
  const url = `https://api.github.com/repos/${OWNER_REPO}/contents/${encodeURIComponent(FILE_PATH)}`;
  const body = {
    message: message || `Update comments ${new Date().toISOString()}`,
    content: Buffer.from(newContentStr, 'utf8').toString('base64'),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub putFile failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

function jsonResponse(status, obj) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

module.exports = async function (req, res) {
  // Express-like signature (Netlify). If Vercel, adapt export default.
  try {
    if (!OWNER_REPO || !TOKEN) {
      return res.status(500).json({ error: 'Server not configured: set GITHUB_REPO and GITHUB_TOKEN' });
    }

    if (req.method === 'GET') {
      const file = await getFile();
      if (!file.exists) return res.status(200).json({});
      return res.status(200).json(JSON.parse(file.content || '{}'));
    }

    if (req.method === 'POST') {
      const body = req.body || (await new Promise((r) => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d||'{}'))); }));
      const { id, name, text } = body;
      if (!id || !text) return res.status(400).json({ error: 'Missing id or text' });

      const file = await getFile();
      let data = {};
      if (file.exists) data = JSON.parse(file.content || '{}');
      if (!data[id]) data[id] = [];
      data[id].unshift({ name: name || '익명', text: text, ts: new Date().toISOString() });

      const newStr = JSON.stringify(data, null, 2);
      await putFile(newStr, file.exists ? file.sha : undefined, `Add comment to ${id}`);
      return res.status(200).json({ ok: true, comments: data[id] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
};
