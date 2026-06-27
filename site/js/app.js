/* 동네 한 바퀴 — 메인 그리드 */
(function () {
  const SUNDAY = {
    open: { label: "주일 영업", cls: "open" },
    biweekly: { label: "주일 격주 휴무", cls: "biweekly" },
    check: { label: "주일 확인 필요", cls: "check" },
    closed: { label: "주일 휴무", cls: "closed" },
  };

  const grid = document.getElementById("grid");
  const filtersEl = document.getElementById("filters");
  const searchEl = document.getElementById("search");

  let stores = [];
  let activeType = "전체";
  let commentCounts = {};
  let favoriteCounts = {};

  fetch("data/stores.json")
    .then((r) => r.json())
    .then((data) => {
      stores = data.stores;
      window.__STORES__ = stores; // 챗봇 공유
      buildFilters();
      render();
      if (window.Chatbot) window.Chatbot.init(stores);
      loadCommentCounts();
      loadFavoriteCounts();
    })
    .catch((e) => {
      grid.innerHTML =
        '<p style="color:#b33">데이터를 불러오지 못했습니다. 로컬 서버(python serve.py)로 열어 주세요.</p>';
      console.error(e);
    });

  function loadCommentCounts() {
    fetch((window.LH_API_BASE || "") + "/api/comments")
      .then((r) => r.json())
      .then((cm) => {
        commentCounts = Object.fromEntries(
          Object.entries(cm || {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
        );
        render();
      })
      .catch(() => {});
  }

  function loadFavoriteCounts() {
    fetch((window.LH_API_BASE || "") + "/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        // data should be an array of favorite entries or {store_id: count} object
        if (Array.isArray(data)) {
          favoriteCounts = {};
          data.forEach(f => {
            if (f.store_id) {
              favoriteCounts[f.store_id] = (favoriteCounts[f.store_id] || 0) + 1;
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          favoriteCounts = data;
        }
        render();
      })
      .catch(() => {});
  }

  function buildFilters() {
    const types = ["전체", ...Array.from(new Set(stores.map((s) => s.type).filter(Boolean)))];
    filtersEl.innerHTML = types
      .map(
        (t) =>
          `<button class="chip${t === "전체" ? " active" : ""}" data-type="${t}">${t}</button>`
      )
      .join("");
    filtersEl.querySelectorAll(".chip").forEach((c) =>
      c.addEventListener("click", () => {
        activeType = c.dataset.type;
        filtersEl.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        render();
      })
    );
  }

  function matches(s) {
    const q = (searchEl.value || "").trim().toLowerCase();
    const typeOk = activeType === "전체" || s.type === activeType;
    if (!q) return typeOk;
    const hay = [s.name, s.type, s.signature, s.tagline].join(" ").toLowerCase();
    return typeOk && hay.includes(q);
  }

  function cardHTML(s) {
    const resolved = window.SundayCalc ? SundayCalc.resolve(s) : null;
    const sun = resolved ? resolved.badge : (SUNDAY[s.sunday] || SUNDAY.check);
    const badge = `<span class="badge ${sun.cls}">${sun.label}</span>`;
    const communityBadge = s.community ? `<span class="badge community">이웃 추천</span>` : "";
    let media;
    if (s.placeholder) {
      const grad = `linear-gradient(150deg, ${s.accent}, ${shade(s.accent, -28)})`;
      media = `<div class="ph" style="background:${grad}">
                 <div class="ph-emoji">${s.emoji}</div>
                 <div class="ph-name">${s.name}</div>
                 <div class="ph-tag">${s.tagline || s.type}</div>
               </div>`;
    } else {
      // gallery 의 첫 번째 이미지를 "우리 가게 한 장면" 으로 사용
      const firstGalleryImg = (s.gallery && s.gallery.length > 0) ? s.gallery[0] : s.main_image;
      media = `<img loading="lazy" src="${firstGalleryImg}" alt="${s.name}" />`;
    }
    const ccount = commentCounts[s.id] || 0;
    const fcount = favoriteCounts[s.id] || 0;
    let badges = "";
    if (fcount > 0) badges += `<div class="fav-count">❤️ ${fcount}</div>`;
    if (ccount > 0) badges += `<div class="cmt-count">💬 ${ccount}</div>`;
    return `<a class="card" href="store.html?id=${s.id}">
        <div class="thumb">${badge}${communityBadge}${media}
          <div class="overlay"><div class="meta">
            <div class="nm">${s.emoji} ${s.name}</div>
            <div class="ty">${s.type || ""}${s.signature ? " · " + firstPart(s.signature) : ""}</div>
            ${(sun.cls === 'biweekly' || sun.cls === 'closed') ? `<div class="sunday-info">${sun.label}</div>` : ''}
          </div></div>
          ${badges}
        </div>
      </a>`;
  }

  function firstPart(t) {
    return String(t).split(/[,\n]/)[0].trim().slice(0, 22);
  }

  function render() {
    const list = stores.filter(matches);
    grid.innerHTML = list.map(cardHTML).join("") || '<p style="color:var(--ink-soft)">검색 결과가 없어요.</p>';
  }

  searchEl.addEventListener("input", render);

  // 색 음영 헬퍼
  function shade(hex, amt) {
    const c = hex.replace("#", "");
    const num = parseInt(c.length === 3 ? c.replace(/(.)/g, "$1$1") : c, 16);
    let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }
  window.__shade = shade;

  // ========== 제보 현황 대시보드 (메인 페이지) ==========
  const API_BASE = window.LH_API_BASE || '';
  let allReports = [];

  function initReportDashboard() {
    const sectionEl = document.getElementById('suggestSection');
    if (!sectionEl) return;

    fetch(API_BASE + '/api/reports')
      .then(r => r.json())
      .then(data => {
        allReports = Array.isArray(data.reports) ? data.reports : [];
        const active = allReports.filter(r => r.status !== 'processed');
        sectionEl.hidden = active.length === 0;
        renderReportStats();
        renderReportGrid();
      })
      .catch(err => {
        console.error('제보 데이터 로드 실패:', err);
      });

    document.getElementById('typeFilter')?.addEventListener('change', renderReportGrid);
    document.getElementById('searchInput')?.addEventListener('input', renderReportGrid);
    document.getElementById('csvDownloadBtn')?.addEventListener('click', downloadReportsCsv);
    document.getElementById('suggestGrid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.sg-del-report');
      if (btn) deleteReport(btn.getAttribute('data-id'));
    });
  }

  function formatDateKo(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch (e) { return ''; }
  }

  function renderReportStats() {
    const totalEl = document.getElementById('totalCount');
    if (!totalEl) return;
    totalEl.textContent = allReports.filter(r => r.status !== 'processed').length;
  }

  function getFilteredReports() {
    const searchText = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    let filtered = allReports.filter(r => r.status !== 'processed');

    if (typeFilter) {
      filtered = filtered.filter(r => r.report_type === typeFilter);
    }
    if (searchText) {
      filtered = filtered.filter(r =>
        (r.store_name || '').toLowerCase().includes(searchText) ||
        (r.report_content || '').toLowerCase().includes(searchText) ||
        (r.current_info || '').toLowerCase().includes(searchText)
      );
    }
    return filtered;
  }

  function renderReportGrid() {
    const gridEl = document.getElementById('suggestGrid');
    const sectionEl = document.getElementById('suggestSection');
    if (!gridEl || !sectionEl) return;

    const filtered = getFilteredReports();
    sectionEl.hidden = allReports.filter(r => r.status !== 'processed').length === 0;

    if (filtered.length === 0) {
      gridEl.innerHTML = allReports.length
        ? '<div class="dash-empty">📭 표시할 제보가 없어요.</div>'
        : '';
      return;
    }

    const TYPE_ICO = {
      '영업시간 변경': '⏰', '휴업/폐점': '🚪', '이동 (주소 변경)': '📦',
      '메뉴 변경': '🍽️', '가격 변경': '💷', '전화번호 변경': '☎️', '기타': '📝',
    };

    gridEl.innerHTML = filtered.map(r => {
      const ico = TYPE_ICO[r.report_type] || '📝';
      return `<article class="sg-card sg-item" data-id="${escapeHtml(r.id)}">
        <div class="sg-body">
          <div class="sg-top">
            <span class="sg-badge">${ico} ${escapeHtml(r.store_name || '')}</span>
            <span class="sg-status pending">제보 접수</span>
          </div>
          <div class="sg-meta">${escapeHtml(r.report_type || '')} · ${escapeHtml(r.reporter || '익명')}</div>
          <div class="sg-row">📅 ${formatDateKo(r.ts)}</div>
          ${r.current_info ? `<div class="sg-reason"><b>현재:</b> ${escapeHtml(r.current_info)}</div>` : ''}
          <div class="sg-reason"><b>제보:</b> ${escapeHtml(r.report_content || '')}</div>
          ${r.reference ? `<div class="sg-row">🔗 ${escapeHtml(r.reference)}</div>` : ''}
          <div class="sg-foot">
            <button type="button" class="sg-del sg-del-report" data-id="${escapeHtml(r.id)}">지우기</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function deleteReport(id) {
    if (!id) return;
    const pw = prompt('지우려면 비밀번호를 입력해 주세요.');
    if (pw == null) return;
    fetch(API_BASE + '/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id, password: pw.trim(), master_password: pw.trim() }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) return alert(d.error || '삭제에 실패했어요.');
        allReports = allReports.filter(r => r.id !== id);
        renderReportStats();
        renderReportGrid();
      })
      .catch(() => alert('삭제 중 문제가 발생했어요.'));
  }

  function downloadReportsCsv() {
    const rows = getFilteredReports();
    if (!rows.length) return alert('다운로드할 제보가 없어요.');
    const header = ['가게이름', '제보유형', '현재정보', '제보내용', '참고', '제보자', '일시'];
    const escCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.map(escCsv).join(',')];
    rows.forEach(r => {
      lines.push([
        r.store_name, r.report_type, r.current_info, r.report_content,
        r.reference, r.reporter, formatDateKo(r.ts),
      ].map(escCsv).join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `동네제보_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  initReportDashboard();
})();
