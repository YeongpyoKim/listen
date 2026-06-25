/* 동네 한 바퀴 — 맛집 등록(성도 제안) 모달 */
(function () {
  const fab = document.getElementById("submitFab");
  const modal = document.getElementById("submitModal");
  if (!fab || !modal) return;

  const form = document.getElementById("submitForm");
  const photosEl = document.getElementById("smPhotos");
  const thumbsEl = document.getElementById("smThumbs");
  const msgEl = document.getElementById("smMsg");
  const submitBtn = document.getElementById("smSubmit");
  const API = (window.LH_API_BASE || "") + "/api/submissions";

  const MAX_PHOTOS = 6;
  const MAX_BYTES = 4 * 1024 * 1024;
  let photoData = []; // base64 data URLs

  function open() {
    modal.classList.add("on");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    modal.classList.remove("on");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  fab.addEventListener("click", open);
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("on")) close();
  });

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  photosEl.addEventListener("change", async () => {
    const files = Array.from(photosEl.files || []);
    for (const f of files) {
      if (photoData.length >= MAX_PHOTOS) break;
      if (!/^image\//.test(f.type)) continue;
      if (f.size > MAX_BYTES) {
        alert(`"${f.name}" 사진이 너무 큽니다(최대 4MB).`);
        continue;
      }
      try {
        photoData.push(await readFile(f));
      } catch (e) {
        /* skip */
      }
    }
    photosEl.value = "";
    renderThumbs();
  });

  function renderThumbs() {
    thumbsEl.innerHTML = photoData
      .map(
        (src, i) =>
          `<div class="sm-thumb"><img src="${src}" alt="" /><button type="button" class="sm-thumb-x" data-i="${i}">✕</button></div>`
      )
      .join("");
    thumbsEl.querySelectorAll(".sm-thumb-x").forEach((b) =>
      b.addEventListener("click", () => {
        photoData.splice(Number(b.getAttribute("data-i")), 1);
        renderThumbs();
      })
    );
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      store_name: (fd.get("store_name") || "").toString().trim(),
      category: (fd.get("category") || "").toString().trim(),
      signature: (fd.get("signature") || "").toString().trim(),
      address: (fd.get("address") || "").toString().trim(),
      phone: (fd.get("phone") || "").toString().trim(),
      hours: (fd.get("hours") || "").toString().trim(),
      reason: (fd.get("reason") || "").toString().trim(),
      submitter: (fd.get("submitter") || "").toString().trim(),
      password: (fd.get("password") || "").toString().trim(),
      photos: photoData,
    };
    if (!payload.store_name) {
      msg("가게 이름은 꼭 입력해 주세요.", true);
      return;
    }
    if (payload.password.length < 4) {
      msg("나중에 직접 지울 수 있도록 4자 이상 비밀번호를 입력해 주세요.", true);
      return;
    }
    submitBtn.disabled = true;
    msg("등록하는 중…", false);
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          msg(d.error || "등록에 실패했어요.", true);
          return;
        }
        msg("소중한 추천 고맙습니다! 관리자가 확인 후 반영할게요. 🌿", false);
        form.reset();
        photoData = [];
        renderThumbs();
        loadSuggestions();
        setTimeout(close, 1600);
      })
      .catch(() => msg("등록 중 문제가 발생했어요. 로컬 서버(python serve.py)로 열어 주세요.", true))
      .finally(() => (submitBtn.disabled = false));
  });

  function msg(text, isErr) {
    msgEl.textContent = text;
    msgEl.classList.toggle("err", !!isErr);
  }

  // ---- 이웃이 추천한 맛집(검토 중) 공개 목록 ----
  const section = document.getElementById("suggestSection");
  const grid = document.getElementById("suggestGrid");

  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function suggestCard(s) {
    const photos = (s.photos || []).filter(Boolean);
    const main = photos[0] || "";
    const media = main
      ? `<div class="sg-thumb"><img loading="lazy" src="${main}" alt="${esc(s.store_name)}" /></div>`
      : `<div class="sg-thumb sg-ph"><span>🍽️</span></div>`;
    const gallery =
      photos.length > 1
        ? `<div class="sg-gallery">${photos
            .slice(1)
            .map((p) => `<img loading="lazy" src="${p}" alt="" />`)
            .join("")}</div>`
        : "";
    const lines = [];
    if (s.category) lines.push(esc(s.category));
    if (s.signature) lines.push(esc(s.signature));
    const meta = lines.join(" · ");
    const rows = [];
    if (s.address) rows.push(`<div class="sg-row">📍 ${esc(s.address)}</div>`);
    if (s.phone) rows.push(`<div class="sg-row">☎️ ${esc(s.phone)}</div>`);
    if (s.hours) rows.push(`<div class="sg-row">🕒 ${esc(s.hours)}</div>`);
    const reason = s.reason ? `<p class="sg-reason">${esc(s.reason)}</p>` : "";
    return `<article class="sg-card">
        ${media}
        <div class="sg-body">
          <div class="sg-badge">검토 중</div>
          <h3>${esc(s.store_name)}</h3>
          ${meta ? `<div class="sg-meta">${meta}</div>` : ""}
          ${rows.join("")}
          ${reason}
          ${gallery}
          <div class="sg-foot">
            <span class="sg-by">추천 · ${esc(s.submitter || "익명")}</span>
            <button type="button" class="sg-del" data-sid="${esc(s.sub_id)}">지우기</button>
          </div>
        </div>
      </article>`;
  }

  function delSuggestion(subId) {
    if (!subId) return;
    const pw = prompt("이 추천 글을 지우려면 등록할 때 입력한 비밀번호를 알려 주세요.");
    if (pw == null) return;
    fetch((window.LH_API_BASE || "") + "/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", sub_id: subId, password: pw.trim() }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) return alert(d.error || "삭제에 실패했어요.");
        loadSuggestions();
      })
      .catch(() => alert("삭제 중 문제가 발생했어요."));
  }

  function loadSuggestions() {
    if (!section || !grid) return;
    fetch((window.LH_API_BASE || "") + "/api/submissions")
      .then((r) => r.json())
      .then((d) => {
        // 아직 정식 등록 전(pending)인 추천만 노출. 정식 등록되면 메인 갤러리에 표시됨.
        const pending = (d.submissions || []).filter((s) => (s.status || "pending") === "pending");
        if (!pending.length) {
          section.hidden = true;
          return;
        }
        grid.innerHTML = pending.map(suggestCard).join("");
        section.hidden = false;
        grid.querySelectorAll(".sg-del").forEach((b) =>
          b.addEventListener("click", () => delSuggestion(b.getAttribute("data-sid")))
        );
      })
      .catch(() => {});
  }

  loadSuggestions();
})();
