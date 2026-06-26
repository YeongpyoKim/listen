const { query, getRow, execute } = require('./db');

/**
 * serverless/api/submissions.js
 * SQLite (Turso) backed submissions API for store recommendations.
 */

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

module.exports = async function (req, res) {
  try {
    // ---------- GET — list submissions ----------
    if (req.method === 'GET') {
      const rows = await query('SELECT * FROM submissions ORDER BY ts DESC');

      // Convert stored JSON string for photos back to array
      const submissions = rows.map(s => ({
        ...s,
        photos: s.photos ? JSON.parse(s.photos) : []
      }));

      return jsonResponse(res, 200, { submissions });
    }

    // ---------- POST — create / delete / edit ----------
    if (req.method !== 'POST') {
      return jsonResponse(res, 405, { error: 'Method not allowed' });
    }

    const body = req.body || (await new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', c => (buf += c));
      req.on('end', () => resolve(JSON.parse(buf || '{}')));
      req.on('error', reject);
    }));

    const action = body.action;
    if (!action && !body.store_name) {
        // The frontend for "add" might not send an 'action' field,
        // but the previous implementation checked for it or looked at payload.
        // In submit.js, it just sends the payload without action='add'.
    }

    // Determine if this is an 'add' request (payload contains store_name)
    if (!action || action === 'add') {
      const storeName = String(body.store_name || '').trim();
      const text = String(body.reason || '').trim(); // reason maps to the content in submissions
      const submitter = String(body.submitter || '').trim() || '익명';
      const password = String(body.password || '');

      if (!storeName) return jsonResponse(res, 400, { error: '가게 이름을 입력해 주세요.' });
      if (password.length < 4) return jsonResponse(res, 400, { error: '비밀번호는 4자 이상이어야 합니다.' });

      // Deduplicate near-duplicates by store_name + submitter within last 2 hours
      const twoHoursAgo = Date.now() - 7200000;
      const existing = await getRow(
        'SELECT sub_id FROM submissions WHERE store_name = ? AND submitter = ? AND CAST(ts AS INTEGER) > ? LIMIT 1',
        [storeName, submitter, twoHoursAgo]
      );

      if (existing) {
        return jsonResponse(res, 409, { error: '같은 가게에 대한 추천은 이미 등록되어 있습니다.' });
      }

      const sub_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const photosJson = JSON.stringify(Array.isArray(body.photos) ? body.photos.filter(Boolean) : []);
      const ts = Date.now().toString();

      await execute(
        `INSERT INTO submissions (sub_id, store_name, category, signature, address, phone, hours, reason, submitter, password, photos, ts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sub_id,
          storeName,
          String(body.category || '').trim(),
          String(body.signature || '').trim(),
          String(body.address || '').trim(),
          String(body.phone || '').trim(),
          String(body.hours || '').trim(),
          text,
          submitter,
          password,
          photosJson,
          ts
        ]
      );

      const newSub = {
        sub_id, store_name: storeName, category: body.category, signature: body.signature,
        address: body.address, phone: body.phone, hours: body.hours, reason: text,
        submitter, password, photos: JSON.parse(photosJson), ts
      };

      return jsonResponse(res, 201, { ok: true, submission: newSub });
    }

    // ---------- Delete submission ----------
    if (action === 'delete') {
      const subId = String(body.sub_id || '').trim();
      const password = String(body.password || '');

      if (!subId) return jsonResponse(res, 400, { error: '"sub_id" is required.' });

      const current = await getRow('SELECT password FROM submissions WHERE sub_id = ?', [subId]);
      if (!current) return jsonResponse(res, 404, { error: 'Recommendation not found.' });
      if (current.password !== password) return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다.' });

      await execute('DELETE FROM submissions WHERE sub_id = ?', [subId]);
      return jsonResponse(res, 200, { ok: true, deleted_id: subId });
    }

    // ---------- Edit submission ----------
    if (action === 'edit') {
      const subId = String(body.sub_id || '').trim();
      const password = String(body.password || '');

      if (!subId) return jsonResponse(res, 400, { error: '"sub_id" is required.' });

      const current = await getRow('SELECT password FROM submissions WHERE sub_id = ?', [subId]);
      if (!current) return jsonResponse(res, 404, { error: 'Recommendation not found.' });
      if (current.password !== password) return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다.' });

      const photosJson = JSON.stringify(Array.isArray(body.photos) ? body.photos.filter(Boolean) : []);

      await execute(
        `UPDATE submissions SET store_name = ?, category = ?, signature = ?, address = ?, phone = ?, hours = ?, reason = ?, photos = ? WHERE sub_id = ?`,
        [
          String(body.store_name || '').trim(),
          String(body.category || '').trim(),
          String(body.signature || '').trim(),
          String(body.address || '').trim(),
          String(body.phone || '').trim(),
          String(body.hours || '').trim(),
          String(body.reason || '').trim(),
          photosJson,
          subId
        ]
      );

      const updated = await getRow('SELECT * FROM submissions WHERE sub_id = ?', [subId]);
      return jsonResponse(res, 200, { ok: true, submission: { ...updated, photos: JSON.parse(updated.photos) } });
    }

    return jsonResponse(res, 400, { error: `"${action}" is not a valid action.` });
  } catch (e) {
    console.error(e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
