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
      media = `<img loading="lazy" src="${s.main_image}" alt="${s.name}" />`;
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
})();
