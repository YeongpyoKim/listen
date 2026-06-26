/**
 * serverless/api/favorites.js
 * Manage global store like counts (Favorites) using GitHub Issues as backend.
 */

const db = require('./db');

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

      // If specific store ID requested, return count for that store
      if (storeId) {
        const count = await db.favorites.getCount(storeId);
        return jsonResponse(res, 200, { count });
      }

      // Otherwise, return all favorites as an array
      const favorites = await db.favorites.getAll();
      return jsonResponse(res, 200, favorites);
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

      // Add to favorites (increment count)
      await db.favorites.add(storeId);

      const count = await db.favorites.getCount(storeId);
      return jsonResponse(res, 200, { ok: true, count });
    }

    return jsonResponse(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('Favorites API error:', e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
