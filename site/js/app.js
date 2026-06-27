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

  // ========== 제보 현황 대시보드 (메인 페이지 통합) ==========
  const API_BASE = window.LH_API_BASE || '';
  let allReports = [];
  let activeReportFilter = 'all'; // 'all' | 'pending' | 'processed'

  function initReportDashboard() {
    const sectionEl = document.getElementById('suggestSection');
    if (!sectionEl) return;

    fetch(API_BASE + '/api/reports')
      .then(r => r.json())
      .then(data => {
        allReports = Array.isArray(data.reports) ? data.reports : [];
        renderReportStats();
        renderReportGrid();
      })
      .catch(err => {
        console.error('제보 데이터 로드 실패:', err);
        const gridEl = document.getElementById('suggestGrid');
        if (gridEl) gridEl.innerHTML = '<div class="dash-empty">제보 데이터를 불러오지 못했어요. 나중에 다시 시도해 주세요 🌿</div>';
      });

    // 필터 이벤트 바인딩
    const filterEl = document.getElementById('typeFilter');
    if (filterEl) {
      filterEl.addEventListener('change', function() {
        activeReportFilter = this.value;
        renderReportGrid();
      });
    }

    const searchEl = document.getElementById('searchInput');
    if (searchEl) {
      searchEl.addEventListener('input', function() {
        renderReportGrid();
      });
    }
  }

  function formatDateKo(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return ''; }
  }

  function renderReportStats() {
    const totalEl = document.getElementById('totalCount');
    const pendingEl = document.getElementById('pendingCount');
    const processedEl = document.getElementById('processedCount');
    if (!totalEl || !pendingEl || !processedEl) return;

    const total = allReports.length;
    const pending = allReports.filter(r => r.status === 'pending').length;
    const processed = allReports.filter(r => r.status === 'processed').length;

    totalEl.textContent = total;
    pendingEl.textContent = pending;
    processedEl.textContent = processed;
  }

  function renderReportGrid() {
    const gridEl = document.getElementById('suggestGrid');
    if (!gridEl) return;

    // 검색어 필터링
    const searchText = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    let filtered = [...allReports];

    // 유형 필터링
    const typeFilter = document.getElementById('typeFilter')?.value;
    if (activeReportFilter === 'pending') {
      filtered = filtered.filter(r => r.status === 'pending');
    } else if (activeReportFilter === 'processed') {
      filtered = filtered.filter(r => r.status === 'processed');
    }

    // 검색어 필터링
    if (searchText) {
      filtered = filtered.filter(r =>
        (r.store_name || '').toLowerCase().includes(searchText) ||
        (r.report_content || '').toLowerCase().includes(searchText) ||
        (r.current_info || '').toLowerCase().includes(searchText)
      );
    }

    // 유형 필터링 (드롭다운) + 대기/처리 상태 탭
    if (typeFilter) {
      filtered = filtered.filter(r => r.report_type === typeFilter);
    }

    // 통계 업데이트
    const pendingEl = document.getElementById('pendingCount');
    const processedEl = document.getElementById('processedCount');
    if (pendingEl && processedEl) {
      const allPending = allReports.filter(r => r.status === 'pending').length;
      const allProcessed = allReports.filter(r => r.status === 'processed').length;
      pendingEl.textContent = activeReportFilter === 'all' ? allPending : filtered.filter(r => r.status === 'pending').length;
      processedEl.textContent = activeReportFilter === 'all' ? allProcessed : filtered.filter(r => r.status === 'processed').length;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = '<div class="dash-empty">📭 현재 제보가 없어요.</div>';
      return;
    }

    const TYPE_ICO = {
      '영업시간 변경': '⏰',
      '휴업/폐점': '🚪',
      '이동 (주소 변경)': '📦',
      '메뉴 변경': '🍽️',
      '가격 변경': '💷',
      '전화번호 변경': '☎️',
      '기타': '📝'
    };

    gridEl.innerHTML = filtered.map(r => {
      const statusClass = r.status === 'processed' ? 'processed' : 'pending';
      const statusLabel = r.status === 'processed' ? '처리 완료' : '대기 중';
      const ico = TYPE_ICO[r.report_type] || '📝';
      return `<div class="sg-card sg-item" data-rstatus="${r.status}">
        <div class="sg-body">
          <span class="sg-badge">${ico} ${escapeHtml(r.store_name || '')}</span>
          <span class="sg-status ${statusClass}">${statusLabel}</span>
          <div class="sg-meta">${escapeHtml(r.report_type || '일반')}</div>
          <div class="sg-row">📅 ${formatDateKo(r.ts)}</div>
          <div class="sg-reason">${escapeHtml((r.current_info || '').substring(0, 80))}${(r.current_info || '').length > 80 ? '...' : ''}</div>
          <div class="sg-row" style="margin-top:4px; white-space: pre-wrap;">${escapeHtml((r.report_content || '').replace(/\n/g, ' '))}</div>
        </div>
      </div>`;
    }).join('');
  }

 function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 대시보드 초기화
  initReportDashboard();
})();
