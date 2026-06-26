/**
 * serverless/api/submissions.js
 * Submissions API using GitHub Issues as backend storage
 */

const db = require('./db');
const { Buffer } = require('buffer');

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

async function uploadPhotos(subId, photos) {
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
    if (buffer.length > 4 * 1024 * 1024) continue;
    const url = await db.images.upload(`submissions/${subId}`, buffer, ext);
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

    // ---------- GET — list submissions ----------
    if (req.method === 'GET') {
      const submissions = await db.submissions.list();
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

    // Determine if this is an 'add' request (payload contains store_name)
    if (!action || action === 'add') {
      const storeName = String(body.store_name || '').trim();
      const text = String(body.reason || '').trim();
      const submitter = String(body.submitter || '').trim() || '익명';
      const password = String(body.password || '');

      if (!storeName) return jsonResponse(res, 400, { error: '가게 이름을 입력해 주세요.' });
      if (password.length < 4) return jsonResponse(res, 400, { error: '비밀번호는 4 자 이상이어야 합니다.' });

      // Deduplicate near-duplicates by store_name + submitter within last 2 hours
      const twoHoursAgo = Date.now() - 7200000;
      const existing = await db.submissions.findByStoreNameAndSubmitter(storeName, submitter, twoHoursAgo);

      if (existing && existing.length > 0) {
        return jsonResponse(res, 409, { error: '같은 가게에 대한 추천은 이미 등록되어 있습니다.' });
      }

      const sub_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const photosJson = Array.isArray(body.photos) ? body.photos.filter(Boolean) : [];
      const ts = Date.now().toString();

      const photoUrls = await uploadPhotos(sub_id, photosJson);

      const data = {
        sub_id,
        store_name: storeName,
        category: String(body.category || '').trim(),
        signature: String(body.signature || '').trim(),
        address: String(body.address || '').trim(),
        phone: String(body.phone || '').trim(),
        hours: String(body.hours || '').trim(),
        reason: text,
        submitter,
        password,
        photos: photoUrls,
        ts
      };

      await db.submissions.add(data);

      return jsonResponse(res, 201, { ok: true, submission: data });
    }

    // ---------- Delete submission ----------
    if (action === 'delete') {
      const subId = String(body.sub_id || '').trim();
      const password = String(body.password || '');

      if (!subId) return jsonResponse(res, 400, { error: '"sub_id" is required.' });

      const current = await db.submissions.getBySubId(subId);
      if (!current) return jsonResponse(res, 404, { error: 'Recommendation not found.' });
      if (current.password !== password) return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다.' });

      await db.submissions.delete(subId);
      return jsonResponse(res, 200, { ok: true, deleted_id: subId });
    }

    // ---------- Edit submission ----------
    if (action === 'edit') {
      const subId = String(body.sub_id || '').trim();
      const password = String(body.password || '');

      if (!subId) return jsonResponse(res, 400, { error: '"sub_id" is required.' });

      const current = await db.submissions.getBySubId(subId);
      if (!current) return jsonResponse(res, 404, { error: 'Recommendation not found.' });
      if (current.password !== password) return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다.' });

      const photosJson = Array.isArray(body.photos) ? body.photos.filter(Boolean) : [];
      const photoUrls = await uploadPhotos(subId, photosJson);

      const updated = {
        ...current,
        store_name: String(body.store_name || '').trim(),
        category: String(body.category || '').trim(),
        signature: String(body.signature || '').trim(),
        address: String(body.address || '').trim(),
        phone: String(body.phone || '').trim(),
        hours: String(body.hours || '').trim(),
        reason: String(body.reason || '').trim(),
        photos: photoUrls,
        updated_at: Date.now().toString()
      };

      await db.submissions.update(subId, updated);

      return jsonResponse(res, 200, { ok: true, submission: updated });
    }

    return jsonResponse(res, 400, { error: `"${action}" is not a valid action.` });
  } catch (e) {
    console.error('Submissions API error:', e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
