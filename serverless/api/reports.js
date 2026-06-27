/**
 * serverless/api/reports.js
 * Reports API - 변경된 정보 제보하기
 * Uses GitHub Issues as backend storage
 */

const db = require('./db');

const MASTER_PASSWORD = '1230984567';

const TYPE_LABELS = {
  hours: '영업시간 변경',
  closed: '휴업/폐점',
  moved: '이동 (주소 변경)',
  menu: '메뉴 변경',
  price: '가격 변경',
  phone: '전화번호 변경',
  other: '기타',
};

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

function getReportTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

function normalizeReportType(type) {
  const t = String(type || '').trim();
  if (TYPE_LABELS[t]) return getReportTypeLabel(t);
  const rev = Object.entries(TYPE_LABELS).find(([, label]) => label === t);
  return rev ? t : (t || 'other');
}

function parseIssueBody(issue) {
  try {
    return JSON.parse(issue.body || '{}');
  } catch (e) {
    return {};
  }
}

function toReport(issue) {
  if (!issue.title.startsWith('report:')) return null;
  const data = parseIssueBody(issue);
  if (data.type === 'admin_notification') return null;

  const parts = issue.title.split(':');
  let status;
  if (data.admin_status) {
    status = data.admin_status;
  } else if (issue.state === 'closed') {
    status = 'processed';
  } else {
    status = 'pending';
  }

  const rawType = data.report_type || '';
  return {
    id: parts[1] || data.report_id,
    store_name: data.store_name || '',
    report_type: getReportTypeLabel(rawType),
    report_type_code: normalizeReportType(rawType),
    current_info: data.current_info || '',
    report_content: data.report_content || '',
    reference: data.reference || '',
    reporter: data.reporter || '익명',
    ts: data.ts || issue.created_at,
    status,
  };
}

module.exports = async function (req, res) {
  try {
    if (!process.env.GITHUB_TOKEN) {
      return jsonResponse(res, 500, { error: 'Server configuration error: GITHUB_TOKEN not set' });
    }

    if (req.method === 'GET') {
      const issues = await db.githubRequest(
        `/repos/${process.env.GITHUB_REPO || 'YeongpyoKim/listen'}/issues?labels=report&state=all&per_page=100`
      );
      const reports = issues.map(toReport).filter(Boolean).sort((a, b) => Number(b.ts) - Number(a.ts));
      return jsonResponse(res, 200, { reports });
    }

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

    if (!action || action === 'add') {
      const storeName = String(body.store_name || '').trim();
      const reportType = normalizeReportType(body.report_type || '');
      const currentInfo = String(body.current_info || '').trim();
      const reportContent = String(body.report_content || '').trim();
      const reference = String(body.reference || '').trim();
      const reporter = String(body.reporter || '').trim() || '익명';
      const password = String(body.password || '');

      if (!storeName) return jsonResponse(res, 400, { error: '가게 이름을 입력해 주세요.' });
      if (!reportType) return jsonResponse(res, 400, { error: '제보 유형을 선택해 주세요.' });
      if (!reportContent) return jsonResponse(res, 400, { error: '제보할 내용을 입력해 주세요.' });
      if (password.length < 4) return jsonResponse(res, 400, { error: '비밀번호는 4 자 이상이어야 합니다.' });

      const report_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const data = {
        report_id,
        store_name: storeName,
        report_type: reportType,
        current_info: currentInfo,
        report_content: reportContent,
        reference,
        reporter,
        password,
        ts: Date.now().toString(),
      };

      await db.createIssue('report', `report:${report_id}`, data);

      return jsonResponse(res, 201, {
        ok: true,
        report: {
          id: report_id,
          store_name: storeName,
          report_type: getReportTypeLabel(reportType),
          report_type_code: reportType,
          current_info: currentInfo,
          report_content: reportContent,
          reference,
          reporter,
          ts: data.ts,
          status: 'pending',
        },
      });
    }

    if (action === 'delete') {
      const reportId = String(body.report_id || body.id || '').trim();
      const password = String(body.password || '');
      const masterPassword = String(body.master_password || '');

      if (!reportId) return jsonResponse(res, 400, { error: '"report_id" 또는 "id" 가 필요합니다.' });

      const isMaster = masterPassword === MASTER_PASSWORD;
      if (!isMaster && password.length < 4) {
        return jsonResponse(res, 400, { error: '비밀번호를 입력해 주세요.' });
      }

      const issues = await db.githubRequest(
        `/repos/${process.env.GITHUB_REPO}/issues?labels=report&state=all&per_page=100`
      );
      const issue = issues.find(i => i.title === `report:${reportId}`);
      if (!issue) return jsonResponse(res, 404, { error: '제보를 찾을 수 없습니다.' });

      const reportData = parseIssueBody(issue);
      if (!isMaster && reportData.password !== password) {
        return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다.' });
      }

      await db.closeIssue(issue.number);
      return jsonResponse(res, 200, { ok: true, deleted_id: reportId });
    }

    return jsonResponse(res, 400, { error: `"${action}" is not a valid action.` });
  } catch (e) {
    console.error('Reports API error:', e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};
