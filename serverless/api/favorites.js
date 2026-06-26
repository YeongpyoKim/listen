const { query, execute } = require('./db');

/**
 * serverless/api/favorites.js
 * Manage global store like counts (Favorites).
 */

async function ensureSchema() {
  await execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      store_id TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0
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

      const rows = await query('SELECT count FROM favorites WHERE store_id = ?', [storeId]);
      const count = rows.length > 0 ? rows[0].count : 0;
      return jsonResponse(res, 200, { count });
    }

    if (req.method === 'POST') {
      const body = req.body || (await new Promise((resolve) => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end', () => resolve(JSON.parse(d || '{}')));
      }));

      const { id: storeId } = body;
      if (!storeId) {
        return jsonResponse(res, 400, { error: 'Missing store id' });
      }

      // Upsert: increment like count
      await execute(
        'INSERT INTO favorites (store_id, count) VALUES (?, 1) ON CONFLICT(store_id) DO UPDATE SET count = count + 1',
        [storeId]
      );

      const rows = await query('SELECT count FROM favorites WHERE store_id = ?', [storeId]);
      return jsonResponse(res, 200, { ok: true, count: rows[0]?.count || 1 });
    }

    return jsonResponse(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
