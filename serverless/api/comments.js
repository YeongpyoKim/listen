/**
 * serverless/api/comments.js
 * Comments API using GitHub Issues as backend storage
 */

const db = require('./db');
const crypto = require('crypto');
const { Buffer } = require('buffer');

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

// Image upload helper
async function uploadPhotos(commentId, photos) {
  const urls = [];
  for (const p of photos) {
    if (!p) continue;
    if (/^https?:\/\//.test(p)) {
      urls.push(p);
      continue;
    }
    const match = String(p).match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) continue;
    const ext = match[1] === 'jpeg' ? '.jpg' : `.${match[1]}`;
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 2 * 1024 * 1024) continue; // 2MB limit
    const url = await db.images.upload(`comments/${commentId}`, buffer, ext);
    urls.push(url);
  }
  return urls;
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
        req.setEncoding('utf8');
        req.on('data', c => d += c);
        req.on('end', () => resolve(JSON.parse(d || '{}')));
      }));

      const { action, id: storeId, cid, name, text, password, photos } = body;

      if (action === 'add') {
        if (!storeId || !text || !password) {
          return jsonResponse(res, 400, { error: 'Missing store id, text, or password' });
        }
        if (password.length < 4) {
          return jsonResponse(res, 400, { error: 'Password must be at least 4 characters' });
        }

        const newCid = crypto.randomUUID();
        const ts = new Date().toISOString();

        // Upload photos first
        const photoUrls = await uploadPhotos(newCid, Array.isArray(photos) ? photos : []);

        await db.comments.add(storeId, newCid, name || '익명', text, password, ts, photoUrls);

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
        const masterPassword = String(body.master_password || '');
        
        if (!cid) {
          return jsonResponse(res, 400, { error: 'Missing cid' });
        }
        
        // 마스터 비밀번호 검증 (고정 값: 1230984567)
        const MASTER_PASSWORD = '1230984567';
        const isMasterDelete = masterPassword && masterPassword === MASTER_PASSWORD;
        
        if (!isMasterDelete && !password) {
          return jsonResponse(res, 400, { error: 'Missing cid or password' });
        }

        // Verify ownership by finding the comment and checking password
        const existing = await db.comments.getByCid(cid);
        
        if (!existing) {
          return jsonResponse(res, 404, { error: '댓글을 찾을 수 없습니다' });
        }
        
        // Password check (allow master password or original password)
        if (!isMasterDelete && existing.password !== password) {
          return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다' });
        }

        const storeId = existing.store_id;
        await db.comments.delete(cid); // Use normal delete, auth already verified above

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
