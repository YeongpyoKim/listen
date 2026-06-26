/**
 * serverless/api/comments.js
 * Comments API using GitHub Issues as backend storage
 */

const db = require('./db');
const crypto = require('crypto');

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

module.exports = async function (req, res) {
  try {
    // Validate environment
    if (!process.env.GITHUB_TOKEN) {
      return jsonResponse(res, 500, { error: 'Server configuration error: GITHUB_TOKEN not set' });
    }

    if (req.method === 'GET') {
      const storeId = req.query?.id || new URL(req.url, 'http://localhost').searchParams.get('id');
      if (!storeId) {
        return jsonResponse(res, 400, { error: 'Missing store id' });
      }

      const comments = await db.comments.list(storeId);
      return jsonResponse(res, 200, { comments });
    }

    if (req.method === 'POST') {
      const body = req.body || (await new Promise((resolve) => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end', () => resolve(JSON.parse(d || '{}')));
      }));

      const { action, id: storeId, cid, name, text, password } = body;

      if (action === 'add') {
        if (!storeId || !text || !password) {
          return jsonResponse(res, 400, { error: 'Missing store id, text, or password' });
        }
        if (password.length < 4) {
          return jsonResponse(res, 400, { error: 'Password must be at least 4 characters' });
        }

        const newCid = crypto.randomUUID();
        const ts = new Date().toISOString();

        await db.comments.add(storeId, newCid, name || '익명', text, password, ts);

        // Return updated list
        const comments = await db.comments.list(storeId);
        return jsonResponse(res, 200, { ok: true, cid: newCid, comments });
      }

      if (action === 'edit') {
        if (!cid || !text || !password) {
          return jsonResponse(res, 400, { error: 'Missing cid, text, or password' });
        }

        // Verify ownership by finding the comment and checking password
        const existing = await db.comments.getByCid(cid);
        if (!existing || existing.password !== password) {
          return jsonResponse(res, 403, { error: 'Invalid password' });
        }

        const editedTs = new Date().toISOString();
        await db.comments.update(cid, text, editedTs);

        // Return updated list for the store
        const comments = await db.comments.list(existing.store_id);
        return jsonResponse(res, 200, { ok: true, comments });
      }

      if (action === 'delete') {
        if (!cid || !password) {
          return jsonResponse(res, 400, { error: 'Missing cid or password' });
        }

        // Verify ownership by finding the comment and checking password
        const existing = await db.comments.getByCid(cid);
        if (!existing || existing.password !== password) {
          return jsonResponse(res, 403, { error: 'Invalid password' });
        }

        const storeId = existing.store_id;
        await db.comments.delete(cid);

        // Return updated list
        const comments = await db.comments.list(storeId);
        return jsonResponse(res, 200, { ok: true, comments });
      }

      return jsonResponse(res, 400, { error: 'Invalid action. Use: add, edit, delete' });
    }

    return jsonResponse(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('Comments API error:', e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
