/**
 * 제보 관리 대시보드 JS
 */

const API_BASE = (window.LH_API_BASE || '') + '/api/reports';

let currentReport = null;
let reportsData = [];

// 페이지 로드 시 데이터 호출
document.addEventListener('DOMContentLoaded', () => {
  loadReports();
  
  // 필터 이벤트 리스너
  document.getElementById('searchInput').addEventListener('input', filterReports);
  document.getElementById('typeFilter').addEventListener('change', filterReports);
});

async function loadReports() {
  const listEl = document.getElementById('reportList');
  
  try {
    const res = await fetch(API_BASE + '?_include=all&status=all');
    const data = await res.json();
    
    reportsData = data.reports || [];
    
    if (reportsData.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p style="font-size: 1.2rem;">😇 아직 제보가 없습니다!</p>
          <p>우리 동네 맛집의 변화를 알려주세요</p>
        </div>`;
      
      updateStats(0, 0, 0);
      return;
    }
    
    renderReports(reportsData);
    filterReports();
    
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    listEl.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">❌ 데이터를 불러오는 중 오류가 발생했습니다.</p>
        <button class="btn primary" onclick="loadReports()">다시 시도</button>
      </div>`;
  }
}

function updateStats(total, pending, processed) {
  document.getElementById('totalCount').textContent = total;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('processedCount').textContent = processed;
}

function renderReports(data) {
  const listEl = document.getElementById('reportList');
  
  if (!data || data.length === 0) {
    listEl.innerHTML = '<div class="empty-state">필터 조건에 맞는 제보가 없습니다.</div>';
    return;
  }
  
  listEl.innerHTML = `
    <div class="dash-eyebrow" style="margin-bottom: 1rem;">총 ${data.length}개의 제보</div>
    <div class="report-list">
      ${data.map(report => `
        <div class="report-item" data-id="${report.id || report.ts}">
          <div class="report-header">
            <span class="report-store">${escapeHtml(report.store_name || '알 수 없음')}</span>
            <span class="report-type">${escapeHtml(report.report_type || '일반')}</span>
          </div>
          
          <div class="report-details">
            <div class="detail-row">
              <span class="detail-label">제보자:</span>
              <span>${escapeHtml(report.reporter || '익명')}</span>
            </div>
            <div class="detail-row">
              <span class=".detail-label">신고일:</span>
              <span>${formatDate(report.ts)}</span>
            </div>
            <div class="detail-row" style="grid-column: span 2;">
              <span class="detail-label">제보 내용:</span>
              <span>${escapeHtml((report.report_content || '').substring(0, 100))}${(report.report_content || '').length > 100 ? '...' : ''}</span>
            </div>
          </div>
          
          <div class="report-actions">
            <button class="btn-sm" onclick="showDetail('${report.id || report.ts}')">📖 상세보기</button>
            ${!report.status || report.status === 'pending' ? 
              `<button class="btn-sm primary" onclick="quickProcess('${report.id || report.ts}')">✅ 처리완료</button>` : ''}
            <button class="btn-sm danger" onclick="deleteReportItem('${report.id || report.ts}')">🗑️ 삭제</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  updateStats(
    reportsData.length,
    reportsData.filter(r => !r.status || r.status === 'pending').length,
    reportsData.filter(r => r.status === 'processed').length
  );
}

function filterReports() {
  const searchText = document.getElementById('searchInput').value.toLowerCase();
  const typeFilter = document.getElementById('typeFilter').value;
  
  let filtered = [...reportsData];
  
  if (searchText) {
    filtered = filtered.filter(report => 
      (report.store_name || '').toLowerCase().includes(searchText) ||
      (report.report_content || '').toLowerCase().includes(searchText) ||
      (report.reporter || '').toLowerCase().includes(searchText)
    );
  }
  
  if (typeFilter) {
    filtered = filtered.filter(report => report.report_type === typeFilter);
  }
  
  renderReports(filtered);
}

function showDetail(id) {
  const report = reportsData.find(r => r.id === id || r.ts === id);
  if (!report) return;
  
  currentReport = report;
  
  document.getElementById('modalTitle').textContent = `📋 ${escapeHtml(report.store_name)} - ${escapeHtml(report.report_type || '일반')}`;
  
  document.getElementById('modalContent').innerHTML = `
    <div style="display: grid; gap: 1rem;">
      <div>
        <strong>제보자:</strong> ${escapeHtml(report.reporter || '익명')}
      </div>
      <div>
        <strong>신고일시:</strong> ${formatDate(report.ts)}
      </div>
      <div>
        <strong>제보 유형:</strong> ${escapeHtml(report.report_type || '일반')}
      </div>
      <div>
        <strong>현재 정보:</strong><br/>
        <textarea readonly style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; resize: vertical;" rows="3">${escapeHtml(report.current_info || '')}</textarea>
      </div>
      <div>
        <strong>제보 내용:</strong><br/>
        <textarea readonly style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; resize: vertical;" rows="4">${escapeHtml(report.report_content || '')}</textarea>
      </div>
      ${report.reference ? `
        <div>
          <strong>참고 자료:</strong><br/>
          <a href="${escapeHtml(report.reference)}" target="_blank" style="color: #8B654E; word-break: break-all;">${escapeHtml(report.reference)}</a>
        </div>
      ` : ''}
      ${report.status ? `
        <div>
          <strong>상태:</strong> 
          <span style="background: ${report.status === 'processed' ? '#27ae60' : '#f39c12'}; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.9rem;">
            ${report.status === 'processed' ? '처리 완료' : '대기 중'}
          </span>
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('detailModal').style.display = 'flex';
}

function closeDetail() {
  document.getElementById('detailModal').style.display = 'none';
  currentReport = null;
}

async function deleteReportItem(id) {
  if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  
  // 관리자 비밀번호 또는 사용자 비밀번호 입력 요청
  const masterPw = prompt('관리자 비밀번호를 입력하시면 바로 삭제됩니다.\n(입력하지 않으면 개별 비밀번호를 물어요:)');
  
  let password = '';
  if (!masterPw) {
    password = prompt('이 제보를 삭제하려면 작성 시 사용한 비밀번호를 입력해 주세요:');
  } else {
    password = `MASTER:${masterPw}`; // 마스터 비밀번호로 표시
  }
  
  if (!password && !masterPw) return alert('삭제를 취소했습니다.');
  
  try {
    let requestBody;
    if (password.startsWith('MASTER:')) {
      // 관리자 비밀번호 사용
      const actualMasterPw = password.replace('MASTER:', '');
      requestBody = { action: 'delete', id, master_password: actualMasterPw };
    } else {
      // 개별 비밀번호 사용
      requestBody = { action: 'delete', id, password };
    }
    
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const data = await res.json();
    
    if (data.ok) {
      alert('삭제되었습니다.');
      loadReports();
    } else {
      alert(`삭제 실패: ${data.error || '알 수 없는 오류'}`);
    }
  } catch (err) {
    console.error(err);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

async function deleteReport() {
  if (!currentReport) return;
  
  if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  
  // 관리자 비밀번호 또는 사용자 비밀번호 입력 요청
  const masterPw = prompt('관리자 비밀번호를 입력하시면 바로 삭제됩니다.\n(입력하지 않으면 개별 비밀번호를 물어요:)');
  
  let password = '';
  if (!masterPw) {
    password = prompt('이 제보를 삭제하려면 작성 시 사용한 비밀번호를 입력해 주세요:');
  } else {
    password = `MASTER:${masterPw}`;
  }
  
  if (!password && !masterPw) return alert('삭제를 취소했습니다.');
  
  try {
    let requestBody;
    if (password.startsWith('MASTER:')) {
      const actualMasterPw = password.replace('MASTER:', '');
      requestBody = { action: 'delete', id: currentReport.id || currentReport.ts, master_password: actualMasterPw };
    } else {
      requestBody = { action: 'delete', id: currentReport.id || currentReport.ts, password };
    }
    
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const data = await res.json();
    
    if (data.ok) {
      alert('삭제되었습니다.');
      closeDetail();
      loadReports();
    } else {
      alert(`삭제 실패: ${data.error || '알 수 없는 오류'}`);
    }
  } catch (err) {
    console.error(err);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

async function processReport() {
  if (!currentReport) return;
  
  const masterPw = prompt('상태를 변경하려면 관리자 비밀번호를 입력해 주세요:');
  if (!masterPw || masterPw.length < 4) return alert('작업을 취소했습니다.');
  
  try {
    const res = await fetch(API_BASE + '?_include=all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'update', 
        id: currentReport.id || currentReport.ts, 
        status: 'processed',
        master_password: masterPw
      })
    });
    
    const data = await res.json();
    
    if (data.ok) {
      alert('처리 완료 상태로 변경되었습니다.');
      closeDetail();
      loadReports();
    } else {
      alert(`변경 실패: ${data.error || '알 수 없는 오류'}`);
    }
  } catch (err) {
    console.error(err);
    alert('상태 변경 중 오류가 발생했습니다.');
  }
}

async function quickProcess(id) {
  if (!confirm('해당 제보를 처리 완료로 표시하시겠습니까?')) return;
  
  const masterPw = prompt('상태를 변경하려면 관리자 비밀번호를 입력해 주세요:');
  if (!masterPw || masterPw.length < 4) return alert('작업을 취소했습니다.');
  
  try {
    const res = await fetch(API_BASE + '?_include=all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'update', 
        id, 
        status: 'processed',
        master_password: masterPw
      })
    });
    
    const data = await res.json();
    
    if (data.ok) {
      alert('처리 완료로 변경되었습니다.');
      loadReports();
    } else {
      alert(`변경 실패: ${data.error || '알 수 없는 오류'}`);
    }
  } catch (err) {
    console.error(err);
    alert('상태 변경 중 오류가 발생했습니다.');
  }
}

function refreshData() {
  loadReports();
}

// 유틸리티 함수
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(ts) {
  try {
    const date = new Date(ts);
    return date.toLocaleString('ko-KR', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    return ts || '';
  }
}
