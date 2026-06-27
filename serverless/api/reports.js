/**
 * serverless/api/reports.js
 * Reports API - 변경된 정보 제보하기
 * Uses GitHub Issues as backend storage + SMS notifications via TextBelt
 */

const db = require('./db');

// Free SMS service: TextBelt (free tier: 1 text/day)
// Alternative: https://textbelt.com/
const TEXTBELT_KEY = process.env.TEXTBELOT_API_KEY || '';
const ADMIN_PHONE = '01023538408'; // 010-2353-8408

function jsonResponse(res, status, obj) {
  return res.status(status).json(obj);
}

// Send SMS notification via TextBelt (Korean carrier support)
async function sendSMS(message) {
  if (!TEXTBELT_KEY) {
    console.log('SMS not sent: TEXTBELOT_API_KEY not configured');
    return { success: false, reason: 'API key not configured' };
  }

  try {
    // TextBelt supports Korean carriers with proper formatting
    // Format: +8210XXXXYYYY (remove leading 0 from 010)
    const formattedPhone = '+82' + ADMIN_PHONE.replace(/^0/, '');

    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: `[동네 한 바퀴 - 정보 제보] ${message}`,
        key: TEXTBELT_KEY,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('SMS sent successfully to', formattedPhone);
      return { success: true };
    } else {
      console.error('SMS failed:', data);
      return { success: false, reason: data.err || 'Unknown error' };
    }
  } catch (e) {
    console.error('Error sending SMS:', e.message);
    return { success: false, reason: e.message };
  }
}

// Alternative: Email notification via GitHub Issues comment
async function sendEmailNotification(reportData) {
  // Create a special issue for admin notifications
  const title = `📢 정보 제보 알림 - ${reportData.store_name}`;
  const body = JSON.stringify({
    type: 'admin_notification',
    store_name: reportData.store_name,
    report_type: reportData.report_type,
    current_info: reportData.current_info || '',
    report_content: reportData.report_content,
    reference: reportData.reference || '',
    reporter: reportData.reporter || '익명',
    ts: Date.now().toString(),
  }, null, 2);

  try {
    await db.createIssue('report', title, body);
    console.log('Admin notification created via GitHub issue');
    return { success: true };
  } catch (e) {
    console.error('Error creating admin notification:', e.message);
    return { success: false, reason: e.message };
  }
}

module.exports = async function (req, res) {
  try {
    // Validate environment
    if (!process.env.GITHUB_TOKEN) {
      return jsonResponse(res, 500, { error: 'Server configuration error: GITHUB_TOKEN not set' });
    }

    // ---------- GET — list reports (for admin) ----------
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const statusFilter = url.searchParams.get('status');
      
      let stateParam = statusFilter === 'all' ? 'all' : 'open';
      const issues = await db.githubRequest(`/repos/${process.env.GITHUB_REPO}/issues?labels=report&state=${stateParams}&per_page=100`);
      
      const reports = issues.map(issue => {
        let data;
        try {
          data = JSON.parse(issue.body || '{}');
        } catch (e) {
          data = {};
        }
        const parts = issue.title.split(':');
        
        // 상태 결정: admin_status 가 있으면 그것을 사용, 없으면 GitHub issue state 로 역추적
        let status;
        if (data.admin_status) {
          status = data.admin_status;
        } else if (issue.state === 'closed') {
          status = 'processed';  // 과거 데이터 호환성
        } else {
          status = 'pending';
        }
        
        return {
          id: parts[1] || data.report_id,
          store_name: data.store_name || '',
          report_type: data.report_type || '',
          current_info: data.current_info || '',
          report_content: data.report_content || '',
          reference: data.reference || '',
          reporter: data.reporter || '익명',
          password: data.password || '',  // 삭제 시 필요하지만 실제 DB 에는 보관하지 않아도 좋음
          ts: data.ts || issue.created_at,
          status: status,
        };
      }).sort((a, b) => Number(b.ts) - Number(a.ts));

      return jsonResponse(res, 200, { reports });
    }

    // ---------- POST — create report ----------
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

    // Add new report
    if (!action || action === 'add') {
      const storeName = String(body.store_name || '').trim();
      const reportType = String(body.report_type || '');
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
      const ts = Date.now().toString();

      const data = {
        report_id,
        store_name: storeName,
        report_type: reportType,
        current_info: currentInfo,
        report_content: reportContent,
        reference: reference,
        reporter: reporter,
        password: password,
        ts,
      };

      // Save to GitHub Issues
      const title = `report:${report_id}`;
      await db.createIssue('report', title, data);

      // Send SMS notification (best effort - free tier limited)
      const smsMessage = `${reporter}님께서 "${storeName}" 가게의 정보를 제보하셨습니다.\n유형: ${getReportTypeLabel(reportType)}\n내용: ${reportContent}`;
      await sendSMS(smsMessage);

      // Also create GitHub issue notification as backup
      await sendEmailNotification(data);

      return jsonResponse(res, 201, { ok: true, report: data });
    }

    // 상태 업데이트 (관리자 전용)
    if (action === 'update') {
      const reportId = String(body.id || '').trim();
      const status = body.status;
      const masterPassword = String(body.master_password || '');

      if (!reportId) return jsonResponse(res, 400, { error: '"id" 이 필요합니다.' });
      if (!status || !['pending', 'processed'].includes(status)) {
        return jsonResponse(res, 400, { error: '유효하지 않은 상태값입니다.' });
      }

      // 마스터 비밀번호 검증 (관리자 인증)
      const expectedMaster = process.env.MASTER_PASSWORD || '';
      if (!expectedMaster) {
        console.warn('⚠️ MASTER_PASSWORD 가 환경 변수에 설정되지 않았습니다!');
        return jsonResponse(res, 500, { error: '서버 설정이 완료되지 않았습니다.' });
      }

      if (masterPassword !== expectedMaster) {
        return jsonResponse(res, 403, { error: '관리자 비밀번호가 일치하지 않습니다.' });
      }

      // 제보 찾기
      const issues = await db.githubRequest(`/repos/${process.env.GITHUB_REPO}/issues?labels=report&state=all&per_page=100`);
      const issue = issues.find(i => {
        try {
          const data = JSON.parse(i.body || '{}');
          return i.title === `report:${reportId}` || data.report_id === reportId;
        } catch (e) {
          return false;
        }
      });

      if (!issue) return jsonResponse(res, 404, { error: '제보를 찾을 수 없습니다.' });

      // 상태 업데이트
      let issueData;
      try {
        issueData = JSON.parse(issue.body || '{}');
      } catch (e) {
        return jsonResponse(res, 500, { error: '데이터 오류' });
      }

      // GitHub Issue 의 body 에 상태 정보 추가
      issueData.admin_status = status;
      issueData.updated_by_admin = true;
      issueData.admin_updated_at = Date.now().toString();

      // 이슈 본체에 다시 저장 (GitHub API 로 patch)
      await db.githubRequest(`/repos/${process.env.GITHUB_REPO}/issues/${issue.number}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: issueData })
      });

      return jsonResponse(res, 200, { ok: true, updated_id: reportId, new_status: status });
    }

    // Delete report (마스터 비밀번호 또는 개별 비밀번호)
    if (action === 'delete') {
      const reportId = String(body.report_id || body.id || '').trim();
      const password = String(body.password || '');
      const masterPassword = String(body.master_password || '');

      if (!reportId) return jsonResponse(res, 400, { error: '"report_id" 또는 "id" 가 필요합니다.' });

      // 관리자 비밀번호로 삭제 가능한지 확인
      const isMasterDelete = process.env.MASTER_PASSWORD && masterPassword === process.env.MASTER_PASSWORD;

      if (!isMasterDelete && !password) {
        return jsonResponse(res, 400, { error: '비밀번호를 입력해 주세요.' });
      } else if (!isMasterDelete && password.length < 4) {
        return jsonResponse(res, 400, { error: '비밀번호는 4 자 이상이어야 합니다.' });
      }

      // 제보 찾기
      const issues = await db.githubRequest(`/repos/${process.env.GITHUB_REPO}/issues?labels=report&state=all&per_page=100`);
      const issue = issues.find(i => i.title === `report:${reportId}`);

      if (!issue) return jsonResponse(res, 404, { error: '제보를 찾을 수 없습니다.' });

      let reportData;
      try {
        reportData = JSON.parse(issue.body || '{}');
      } catch (e) {
        return jsonResponse(res, 500, { error: '데이터 오류' });
      }

      // 인증 확인: 관리자 비밀번호 또는 개별 비밀번호 중 하나라도 일치하면 삭제 허용
      let authorized = false;
      if (isMasterDelete) {
        authorized = true;
      } else if (reportData.password === password) {
        authorized = true;
      }

      if (!authorized) {
        return jsonResponse(res, 403, { error: '비밀번호가 일치하지 않습니다.' });
      }

      // Close the issue (soft delete)
      await db.closeIssue(issue.number);

      return jsonResponse(res, 200, { ok: true, deleted_id: reportId });
    }

    return jsonResponse(res, 400, { error: `"${action}" is not a valid action.` });
  } catch (e) {
    console.error('Reports API error:', e);
    return jsonResponse(res, 500, { error: String(e.message || e) });
  }
};

// Helper function to get Korean label for report type
function getReportTypeLabel(type) {
  const labels = {
    hours: '영업시간 변경',
    closed: '휴업/폐점',
    moved: '이동 (주소 변경)',
    menu: '메뉴 변경',
    price: '가격 변경',
    phone: '전화번호 변경',
    other: '기타'
  };
  return labels[type] || type;
}
