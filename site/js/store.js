/* 동네 한 바퀴 — 상점 상세(감성 서브 페이지) */
(function () {
  const SUNDAY = {
    open: { ico: "🕊️", t: "주일에 문을 엽니다", cls: "s-open" },
    biweekly: { ico: "⚠️", t: "주일은 격주로 휴무입니다", cls: "s-biweekly" },
    check: { ico: "📞", t: "주일 방문 전 확인을 권합니다", cls: "s-check" },
    closed: { ico: "🚫", t: "주일에는 휴무입니다", cls: "s-closed" },
  };

  const app = document.getElementById("app");
  const id = new URLSearchParams(location.search).get("id");

  fetch("data/stores.json")
    .then((r) => r.json())
    .then((data) => {
      const stores = data.stores;
      window.__STORES__ = stores;
      const s = stores.find((x) => x.id === id) || stores[0];
      document.title = `${s.name} — 동네 한 바퀴`;
      render(s);
      if (window.Chatbot) window.Chatbot.init(stores, s);
    })
    .catch((e) => {
      app.innerHTML =
        '<div class="wrap section"><p style="color:#b33">데이터를 불러오지 못했습니다. 로컬 서버로 열어 주세요.</p></div>';
      console.error(e);
    });

  function shade(hex, amt) {
    const c = hex.replace("#", "");
    const num = parseInt(c.length === 3 ? c.replace(/(.)/g, "$1$1") : c, 16);
    let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  function infoItem(k, v, ico, span) {
    if (!v) return "";
    return `<div class="item${span ? " span2" : ""}"><div class="k">${ico} ${k}</div><div class="v">${esc(v)}</div></div>`;
  }
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(s) {
    const sun = SUNDAY[s.sunday] || SUNDAY.check;
    let hero;
    if (s.placeholder) {
      const grad = `linear-gradient(150deg, ${s.accent}, ${shade(s.accent, -30)})`;
      hero = `<div class="ph-bg" style="background:${grad}"></div>
        <div class="ph-bg" style="display:grid;place-items:center;">
          <div style="font-size:90px;filter:drop-shadow(0 8px 16px rgba(0,0,0,.3))">${s.emoji}</div>
        </div>`;
    } else {
      hero = `<div class="bg" style="background-image:url('${s.main_image}')"></div>`;
    }

    const galleryImgs = (s.gallery || []).slice(1);
    const galleryHTML = galleryImgs.length
      ? `<section class="section"><div class="wrap">
           <div class="gallery-label">우리 가게 한 장면</div>
           <div class="gallery">${galleryImgs
             .map((g) => `<img loading="lazy" src="${g}" alt="${esc(s.name)}" data-zoom />`)
             .join("")}</div>
         </div></section>`
      : "";

    const naverBtn = s.naver_url
      ? `<a class="btn primary" href="${s.naver_url}" target="_blank" rel="noopener">📍 네이버 지도에서 보기</a>`
      : "";
    const callBtn = s.phone
      ? `<a class="btn" href="tel:${s.phone.replace(/[^0-9+]/g, "")}">📞 ${esc(s.phone)}</a>`
      : "";

    // 메뉴 이미지 처리: 폴더 내에 '메뉴'가 포함된 파일이 있으면 별도 섹션으로 노출
    const menuImg = (s.gallery || []).find((g) => g.toLowerCase().includes("메뉴"));
    const menuSection = menuImg
      ? `<section class="section"><div class="wrap"><div class="gallery-label">메뉴</div><div class="menu-img"><img src="${menuImg}" alt="${esc(s.name)} 메뉴" /></div></div></section>`
      : "";

    app.innerHTML = `
      <header class="detail-hero">
        ${hero}
        <div class="inner">
          <div class="kind">${esc(s.type || "")}</div>
          <h1>${s.emoji} ${esc(s.name)}</h1>
          <div class="tagline">${esc(s.tagline || "")}</div>
        </div>
      </header>

      <div class="wrap">
        <div class="sunday ${sun.cls}">
          <div class="ico">${sun.ico}</div>
          <div><div class="t">${sun.t}</div><div class="d">${esc(s.sunday_note || "")}</div></div>
        </div>
      </div>

      <section class="section"><div class="wrap">
        <div class="story-label">Story</div>
        <p class="story">${esc(s.story || "")}</p>
        ${s.review ? `<blockquote class="review">${esc(s.review)}<span class="review-src">— 이웃들의 한줄평</span></blockquote>` : ""}
        <div class="cta">
          <button class="btn" id="favBtn">🤍 <span id="favCount">0</span></button>
          ${naverBtn}${callBtn}
          <button class="btn" id="askBot">💬 이 가게, 챗봇에게 물어보기</button>
        </div>
      </div></section>

      ${galleryHTML}

      ${menuSection}

      <section class="section"><div class="wrap">
        <div class="comments-label">이웃들이 남긴 따뜻한 한마디</div>
        <p class="comments-help">이 가게에 대한 작은 후기를 나눠 주세요. 로그인은 없지만, 나중에 직접 수정하거나 지울 수 있도록 비밀번호를 함께 적어 주세요.</p>
        <div id="commentsRoot">
          <div id="commentsList">불러오는 중…</div>
          <div class="comment-form">
            <div class="cf-row">
              <input id="c_name" maxlength="40" placeholder="이름(선택)" />
              <input id="c_pw" type="password" maxlength="40" placeholder="비밀번호(수정·삭제용, 4자 이상)" />
            </div>
            <textarea id="c_text" maxlength="1000" placeholder="따뜻한 한마디를 남겨 보세요"></textarea>
            <div class="cf-actions"><button class="btn primary" id="c_post">남기기</button><button class="btn" id="c_clear">지우기</button></div>
          </div>
        </div>
      </div></section>

      <section class="section"><div class="wrap">
        <div class="info-label">정확히 알고 가요</div>
        <div class="info">
          ${infoItem("대표 · 시그니처 메뉴", s.signature, "⭐", true)}
          ${infoItem("평균 가격대", s.price, "💳")}
          ${infoItem("영업시간 · 정기휴무", s.hours, "🕒")}
          ${infoItem("좌석 형태", s.seats, "🪑")}
          ${infoItem("아기의자", s.baby_chair, "🍼")}
          ${infoItem("주차", s.parking, "🚗")}
          ${infoItem("주소", s.address, "📍", true)}
          ${infoItem("전화", s.phone, "☎️")}
          ${infoItem("가게의 역사", s.history, "📜")}
          ${infoItem("100% 즐기는 팁", s.tip, "💡", true)}
          ${infoItem("이 집만의 매력", s.charm, "✨", true)}
        </div>
      </div></section>

      <footer class="foot">
        <div class="sig">동네 한 바퀴, 은혜 한 바구니</div>
        <div>표시된 정보는 변동될 수 있어요. 특히 주일 방문 전, 안내된 휴무 정보를 꼭 확인해 주세요.</div>
      </footer>
    `;

    initFavorites(s);

    // lightbox
    const lb = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightboxImg");
    app.querySelectorAll("[data-zoom]").forEach((img) =>
      img.addEventListener("click", () => {
        lbImg.src = img.src;
        lb.classList.add("on");
      })
    );
    lb.addEventListener("click", () => lb.classList.remove("on"));

    const askBtn = document.getElementById("askBot");
    if (askBtn) askBtn.addEventListener("click", () => window.Chatbot && window.Chatbot.open(s));

    // Favorites: 개인 선호 상점 (localStorage) + 글로벌 좋아요 수 (API)
    function initFavorites(s) {
      const API = (window.LH_API_BASE || "") + "/api/favorites";
      const btnEl = document.getElementById("favBtn");
      const countEl = document.getElementById("favCount");

      function updateUI(isFav, count) {
        btnEl.innerHTML = `${isFav ? "❤️" : "🤍"} <span id="favCount">${count}</span>`;
        // Redefine the element since innerHTML replaced it
        window._currentFavCountEl = document.getElementById("favCount");
      }

      function load() {
        const favs = JSON.parse(localStorage.getItem("fav_stores") || "[]");
        const isFav = favs.includes(s.id);
        fetch(`${API}?id=${encodeURIComponent(s.id)}`)
          .then((r) => r.json())
          .then((d) => updateUI(isFav, d.count || 0))
          .catch(() => updateUI(isFav, 0));
      }

      function toggle() {
        let favs = JSON.parse(localStorage.getItem("fav_stores") || "[]");
        const isFav = favs.includes(s.id);
        if (isFav) {
          favs = favs.filter((x) => x !== s.id);
        } else {
          favs.push(s.id);
          fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: s.id }),
          })
            .then((r) => r.json())
            .then((d) => updateUI(true, d.count))
            .catch(() => updateUI(true, 0)); // optimistic
          return;
        }
        localStorage.setItem("fav_stores", JSON.stringify(favs));
        load();
      }

      btnEl.addEventListener("click", toggle);
      load();
    }

    // Comments: 깃허브 리포지토리를 DB로 사용하는 API 기반 댓글

    (function initComments() {
      const API = (window.LH_API_BASE || "") + "/api/comments";
      const listEl = document.getElementById("commentsList");
      const nameEl = document.getElementById("c_name");
      const pwEl = document.getElementById("c_pw");
      const textEl = document.getElementById("c_text");
      const postBtn = document.getElementById("c_post");
      const clearBtn = document.getElementById("c_clear");

      function fmt(ts) {
        try { return new Date(ts).toLocaleString("ko-KR"); } catch (e) { return ""; }
      }

      function renderList(arr) {
        if (!arr || !arr.length) {
          listEl.innerHTML = "<div class='empty'>아직 한마디가 없어요. 가장 먼저 따뜻한 마음을 남겨 주세요. 🌿</div>";
          return;
        }
        listEl.innerHTML = arr
          .map(
            (c) => `<div class='c-item' data-cid='${c.cid}'>
              <div class='c-h'><b>${esc(c.name || "익명")}</b><span class='c-t'>${fmt(c.ts)}${c.edited_ts ? " · 수정됨" : ""}</span></div>
              <div class='c-b'>${esc(c.text)}</div>
              <div class='c-actions'>
                <button class='c-edit' data-cid='${c.cid}'>수정</button>
                <button class='c-del' data-cid='${c.cid}'>삭제</button>
              </div>
            </div>`
          )
          .join("");
        bindItemActions();
      }

      function load() {
        listEl.innerHTML = "불러오는 중…";
        fetch(`${API}?id=${encodeURIComponent(s.id)}`)
          .then((r) => r.json())
          .then((d) => renderList(d.comments || []))
          .catch(() => {
            listEl.innerHTML =
              "<div class='empty'>댓글을 불러오지 못했어요. 로컬 서버(python serve.py)로 열어 주세요.</div>";
          });
      }

      function post() {
        const txt = (textEl.value || "").trim();
        const pw = (pwEl.value || "").trim();
        if (!txt) return alert("한마디 내용을 입력해 주세요.");
        if (pw.length < 4) return alert("수정·삭제를 위해 4자 이상 비밀번호를 입력해 주세요.");
        postBtn.disabled = true;
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", id: s.id, name: (nameEl.value || "").trim(), text: txt, password: pw }),
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
          .then(({ ok, d }) => {
            if (!ok) return alert(d.error || "등록에 실패했어요.");
            textEl.value = "";
            pwEl.value = "";
            renderList(d.comments || []);
          })
          .catch(() => alert("등록 중 문제가 발생했어요."))
          .finally(() => (postBtn.disabled = false));
      }

      function del(cid) {
        const pw = prompt("이 한마디를 지우려면 작성 시 입력한 비밀번호를 알려 주세요.");
        if (pw == null) return;
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: s.id, cid, password: pw.trim() }),
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
          .then(({ ok, d }) => {
            if (!ok) return alert(d.error || "삭제에 실패했어요.");
            renderList(d.comments || []);
          })
          .catch(() => alert("삭제 중 문제가 발생했어요."));
      }

      function edit(cid) {
        const item = listEl.querySelector(`.c-item[data-cid='${cid}'] .c-b`);
        const current = item ? item.textContent : "";
        const next = prompt("새로운 내용을 입력해 주세요.", current);
        if (next == null) return;
        const txt = next.trim();
        if (!txt) return alert("내용을 입력해 주세요.");
        const pw = prompt("수정하려면 작성 시 입력한 비밀번호를 알려 주세요.");
        if (pw == null) return;
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "edit", id: s.id, cid, text: txt, password: pw.trim() }),
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
          .then(({ ok, d }) => {
            if (!ok) return alert(d.error || "수정에 실패했어요.");
            renderList(d.comments || []);
          })
          .catch(() => alert("수정 중 문제가 발생했어요."));
      }

      function bindItemActions() {
        listEl.querySelectorAll(".c-del").forEach((b) =>
          b.addEventListener("click", () => del(b.getAttribute("data-cid")))
        );
        listEl.querySelectorAll(".c-edit").forEach((b) =>
          b.addEventListener("click", () => edit(b.getAttribute("data-cid")))
        );
      }

      postBtn.addEventListener("click", post);
      clearBtn.addEventListener("click", () => {
        nameEl.value = "";
        pwEl.value = "";
        textEl.value = "";
      });
      load();
    })();
  }
})();
