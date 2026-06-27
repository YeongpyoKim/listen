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
    const resolved = window.SundayCalc ? SundayCalc.resolve(s) : null;
    const sun = resolved ? resolved.detail : (SUNDAY[s.sunday] || SUNDAY.check);
    const sundayNote = resolved
      ? [resolved.dynamic, resolved.note].filter(Boolean).join("\n")
      : (s.sunday_note || "");
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
          <div><div class="t">${sun.t}</div><div class="d">${esc(sundayNote).replace(/\n/g, "<br />")}</div></div>
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
            <label class="cf-upload">
              첨부 사진 (선택, 최대 3 장, 각 2MB 까지)
              <input type="file" id="c_photos" accept="image/*" multiple />
              <div class="cf-preview" id="cPreview"></div>
            </label>
            <div class="cf-actions">
              <button class="btn primary" id="c_post">남기기</button>
              <button class="btn" id="c_clear">지우기</button>
              <button class="btn" id="c_delAll">전체삭제</button>
            </div>
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
      const photosEl = document.getElementById("c_photos");
      const previewEl = document.getElementById("cPreview");

      // Image upload constants
      const MAX_PHOTOS = 3;
      const MAX_BYTES = 2 * 1024 * 1024; // 2MB
      let photoData = []; // base64 data URLs

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
            (c) => {
              const photos = (c.photos || []).filter(Boolean);
              const photosHTML = photos.length
                ? `<div class='c-photos'>${photos.map(p => `<img src="${p}" alt="" data-zoom />`).join("")}</div>`
                : "";
              return `<div class='c-item' data-cid='${c.cid}'>
                <div class='c-h'><b>${esc(c.name || "익명")}</b><span class='c-t'>${fmt(c.ts)}${c.edited_ts ? " · 수정됨" : ""}</span></div>
                <div class='c-b'>${esc(c.text)}</div>
                ${photosHTML}
              </div>`;
            }
          )
          .join("");
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
          body: JSON.stringify({ action: "add", id: s.id, name: (nameEl.value || "").trim(), text: txt, password: pw, photos: photoData }),
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
          .then(({ ok, d }) => {
            if (!ok) return alert(d.error || "등록에 실패했어요.");
            textEl.value = "";
            pwEl.value = "";
            nameEl.value = "";
            photoData = [];
            renderPreview();
            load(); // 즉시 업데이트된 목록 표시
          })
          .catch((err) => {
            console.error("댓글 등록 오류:", err);
            alert("등록 중 문제가 발생했습니다. (Error: " + (err.message || "unknown") + ")");
          })
          .finally(() => (postBtn.disabled = false));
      }

      function delAll() {
        const countInput = prompt("전체 댓글을 지우려면 삭제하려는 개수를 입력해 주세요.\n현재 표시된 댓글 수: " + listEl.querySelectorAll('.c-item').length);
        if (!countInput) return;
        const count = parseInt(countInput, 10);
        if (isNaN(count) || count <= 0) return alert("유효한 숫자를 입력해 주세요.");

        const pw = prompt("전체 삭제를 확인하려면 등록 시 사용한 비밀번호 중 하나를 입력해 주세요.");
        if (!pw || pw.length < 4) return alert("비밀번호는 4 자 이상이어야 합니다.");

        // 현재 표시된 댓글 목록을 가져와서 순차 삭제
        const items = Array.from(listEl.querySelectorAll('.c-item'));
        if (items.length === 0) return alert("삭제할 댓글이 없습니다.");

        // 최대 10 개까지만 한 번에 삭제
        const toDelete = Math.min(count, 10);
        if (toDelete > items.length) {
          return alert(`현재 표시된 댓글은 ${items.length}개입니다. 더 많은 삭제가 필요하면 페이지를 새로고침 후 다시 시도해 주세요.`);
        }

        // 병렬로 삭제 요청 (최대 5 개 동시)
        let deletedCount = 0;
        let failedCount = 0;
        const promises = [];

        for (let i = 0; i < toDelete && i < items.length; i++) {
          const cid = items[i].getAttribute('data-cid');
          if (!cid) continue;

          const p = fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", id: s.id, cid, password: pw.trim() }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.ok) deletedCount++;
              else failedCount++;
            })
            .catch(() => failedCount++);

          promises.push(p);
        }

        Promise.all(promises).then(() => {
          load(); // 목록 새로고침
          alert(`삭제 완료: ${deletedCount}개 성공, ${failedCount}개 실패\n실패한 댓글은 비밀번호가 일치하지 않거나 이미 삭제되었을 수 있습니다.`);
        });
      }

      // Image upload handlers
      function readFile(file) {
        return new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result);
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
      }

      function renderPreview() {
        previewEl.innerHTML = photoData
          .map((src, i) => `<div class="cf-thumb"><img src="${src}" alt="" /><button type="button" class="cf-x" data-i="${i}">✕</button></div>`)
          .join("");
        previewEl.querySelectorAll(".cf-x").forEach((b) =>
          b.addEventListener("click", () => {
            photoData.splice(Number(b.getAttribute("data-i")), 1);
            renderPreview();
          })
        );
      }

      photosEl.addEventListener("change", async () => {
        const files = Array.from(photosEl.files || []);
        for (const f of files) {
          if (photoData.length >= MAX_PHOTOS) break;
          if (!/^image\//.test(f.type)) continue;
          if (f.size > MAX_BYTES) {
            alert(`"${f.name}" 사진이 너무 큽니다 (최대 2MB).`);
            continue;
          }
          try {
            photoData.push(await readFile(f));
          } catch (e) {
            /* skip */
          }
        }
        photosEl.value = "";
        renderPreview();
      });

      const delAllBtn = document.getElementById("c_delAll");

      postBtn.addEventListener("click", post);
      clearBtn.addEventListener("click", () => {
        nameEl.value = "";
        pwEl.value = "";
        textEl.value = "";
        photoData = [];
        renderPreview();
      });
      if (delAllBtn) delAllBtn.addEventListener("click", delAll);
      load();
    })();
  }
})();
