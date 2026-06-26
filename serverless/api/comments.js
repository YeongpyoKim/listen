const { query, getRow, execute } = require('./db');
const crypto = require('crypto');

/**
 * serverless/api/comments.js
 * SQLite (Turso) backed comments API with password-based management.
 */

async function ensureSchema() {
  await execute(`
    CREATE TABLE IF NOT EXISTS comments (
      cid TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT,
      text TEXT NOT NULL,
      password TEXT NOT NULL,
      ts TEXT NOT NULL,
      edited_ts TEXT
    )
  `);
}

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

module.exports = async function (req, res) {
  try {
    await ensureSchema();

    if (req.method === 'GET') {
      const storeId = req.query?.id || new URL(req.url, `http://localhost`).searchParams.get('id');
      if (!storeId) {
        return jsonResponse(res, 400, { error: 'Missing store id' });
      }

      const rows = await query(
        'SELECT cid, name, text, ts, edited_ts FROM comments WHERE store_id = ? ORDER BY ts DESC',
        [storeId]
      );

      return jsonResponse(res, 200, { comments: rows });
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
        await execute(
          'INSERT INTO comments (cid, store_id, name, text, password, ts) VALUES (?, ?, ?, ?, ?, ?)',
          [newCid, storeId, name || '익명', text, password, ts]
        );

        const rows = await query(
          'SELECT cid, name, text, ts, edited_ts FROM comments WHERE store_id = ? ORDER BY ts DESC',
          [storeId]
        );
        return jsonResponse(res, 200, { ok: true, comments: rows });
      }

      if (action === 'edit') {
        if (!cid || !text || !password) {
          return jsonResponse(res, 400, { error: 'Missing cid, text, or password' });
        }

        const existing = await getRow('SELECT password FROM comments WHERE cid = ?', [cid]);
        if (!existing || existing.password !== password) {
          return jsonResponse(res, 403, { error: 'Invalid password' });
        }

        const editedTs = new Date().toISOString();
        await execute('UPDATE comments SET text = ?, edited_ts = ? WHERE cid = ?', [text, editedTs, cid]);

        const rows = await query(
          'SELECT cid, name, text, ts, edited_ts FROM comments WHERE store_id = (SELECT store_id FROM comments WHERE cid = ?) ORDER BY ts DESC',
          [cid]
        );
        return jsonResponse(res, 200, { ok: true, comments: rows });
      }

      if (action === 'delete') {
        if (!cid || !password) {
          return jsonResponse(res, 400, { error: 'Missing cid or password' });
        }

        const existing = await getRow('SELECT store_id, password FROM comments WHERE cid = ?', [cid]);
        if (!existing || existing.password !== password) {
          return jsonResponse(res, 403, { error: 'Invalid password' });
        }

        const currentStoreId = existing.store_id;
        await execute('DELETE FROM comments WHERE cid = ?', [cid]);

        const rows = await query(
          'SELECT cid, name, text, ts, edited_ts FROM comments WHERE store_id = ? ORDER BY ts DESC',
          [currentStoreId]
        );
        return jsonResponse(res, 200, { ok: true, comments: rows });
      }

      return jsonResponse(res, 400, { error: 'Invalid action' });
    }

    return jsonResponse(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
