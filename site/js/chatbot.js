/* =====================================================================
 * 동네 길잡이 — 로컬 데이터 기반 챗봇 (보조 수단)
 *
 * 설계 메모 (실제 적용 가능한 구조):
 *  - 기본은 100% 클라이언트 사이드 + 오프라인. stores.json 만으로 동작.
 *  - 외부 호스팅/외부 API 없음 (POC 로컬 전용 요구사항 준수).
 *  - 추후 실제 LLM 백엔드로 확장하려면 Chatbot.endpoint 에 로컬 서버 URL 만
 *    지정하면 그쪽으로 질의를 보냅니다. (예: 사내/로컬 FastAPI + RAG)
 *    기본값 null → 규칙기반 검색 응답.
 * ===================================================================== */
window.Chatbot = (function () {
  let stores = [];
  let current = null;
  let booted = false;
  const endpoint = null; // ← 로컬 백엔드 붙일 때만 URL 지정 (예: "http://127.0.0.1:8001/chat")

  const SUN_TXT = {
    open: "주일 영업 ✅",
    biweekly: "주일 격주 휴무 ⚠️",
    check: "주일 확인 필요 📞",
    closed: "주일 휴무 🚫",
  };

  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function ensureUI() {
    if (booted) return;
    booted = true;
    const panel = el(`
      <div class="chat-panel" id="chatPanel">
        <div class="chat-head">
          <div class="av">🧺</div>
          <div><div class="ti">동네 길잡이</div><div class="su">은혜 한 바구니 · 가게 안내</div></div>
          <button class="x" id="chatClose">×</button>
        </div>
        <div class="chat-body" id="chatBody"></div>
        <div class="quick" id="chatQuick"></div>
        <div class="chat-input">
          <input id="chatText" type="text" placeholder="예: 주일에 여는 곳 알려줘" autocomplete="off" />
          <button id="chatSend">전송</button>
        </div>
      </div>`);
    document.body.appendChild(panel);

    const fab = document.getElementById("chatFab");
    if (fab) fab.addEventListener("click", () => toggle());
    document.getElementById("chatClose").addEventListener("click", () => toggle(false));
    document.getElementById("chatSend").addEventListener("click", send);
    document.getElementById("chatText").addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });

    const quick = [
      "주일에 여는 곳",
      "주차 되는 곳",
      "아기의자 있는 곳",
      "카페·디저트",
      "가성비 한 끼",
      "오늘 뭐 먹지?",
    ];
    const q = document.getElementById("chatQuick");
    quick.forEach((t) => {
      const b = el(`<button>${t}</button>`);
      b.addEventListener("click", () => {
        document.getElementById("chatText").value = t;
        send();
      });
      q.appendChild(b);
    });
  }

  function toggle(force) {
    ensureUI();
    const p = document.getElementById("chatPanel");
    const on = force === undefined ? !p.classList.contains("on") : force;
    p.classList.toggle("on", on);
    if (on && document.getElementById("chatBody").childElementCount === 0) greet();
  }

  function greet() {
    bot(
      "안녕하세요, **동네 길잡이**예요. 🧺\n주일 나들이에 딱 맞는 가게를 찾아 드릴게요.\n무엇이 궁금하세요? 아래 버튼을 눌러도 좋아요."
    );
    if (current) {
      bot(`지금 보고 계신 **${current.name}** 에 대해 물어보셔도 돼요. (예: "여기 주일에 열어?", "주차 돼?")`);
    }
  }

  function scroll() {
    const b = document.getElementById("chatBody");
    b.scrollTop = b.scrollHeight;
  }
  function fmt(t) {
    return t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  }
  function bot(text) {
    const b = document.getElementById("chatBody");
    b.appendChild(el(`<div class="msg bot">${fmt(text)}</div>`));
    scroll();
  }
  function me(text) {
    const b = document.getElementById("chatBody");
    b.appendChild(el(`<div class="msg me">${escapeHtml(text)}</div>`));
    scroll();
  }
  function escapeHtml(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function miniCard(s) {
    const media = s.placeholder
      ? `<div class="mph" style="background:linear-gradient(150deg,${s.accent},${shade(
          s.accent,
          -28
        )});display:grid;place-items:center;font-size:22px">${s.emoji}</div>`
      : `<img src="${s.main_image}" alt="${escapeHtml(s.name)}" />`;
    return `<a class="store-mini" href="store.html?id=${s.id}">
      ${media}
      <div class="mt"><b>${s.emoji} ${escapeHtml(s.name)}</b>
      <span>${escapeHtml(s.type || "")} · ${window.SundayCalc ? (SundayCalc.resolve(s).isOpenThisSunday ? "주일 영업 ✅" : SundayCalc.resolve(s).isOpenThisSunday === false ? "주일 휴무 🚫" : "주일 확인 📞") : (SUN_TXT[s.sunday] || "")}</span></div>
    </a>`;
  }
  function botCards(text, list) {
    const b = document.getElementById("chatBody");
    const cards = list.map(miniCard).join("");
    b.appendChild(el(`<div class="msg bot">${fmt(text)}${cards}</div>`));
    scroll();
  }

  function shade(hex, amt) {
    const c = hex.replace("#", "");
    const num = parseInt(c.length === 3 ? c.replace(/(.)/g, "$1$1") : c, 16);
    let r = (num >> 16) + amt,
      g = ((num >> 8) & 0xff) + amt,
      b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  /* ---------- 규칙 기반 응답 엔진 ---------- */
  function findByName(q) {
    return stores.find((s) => q.includes(s.name) || s.name.includes(q.replace(/\s/g, "")));
  }

  function answer(q) {
    const t = q.toLowerCase();

    // 1) 특정 가게 직접 언급
    const named = findByName(q);
    if (named && q.length <= 14) {
      return storeDetail(named, q);
    }

    // 2) 주일/일요일
    if (/(주일|일요일|일욜|sunday)/.test(t)) {
      const open = stores.filter((s) => {
        if (window.SundayCalc) return SundayCalc.isOpenOnSunday(s) === true;
        return s.sunday === "open";
      });
      const dynamic = stores.filter((s) => {
        if (!window.SundayCalc) return s.sunday === "biweekly" || s.sunday === "monthly_off";
        return SundayCalc.isOpenOnSunday(s) === false && (s.sunday === "biweekly" || s.sunday === "monthly_off");
      });
      let txt = `주일에 **문을 여는 곳**이에요. (총 ${open.length}곳)`;
      botCards(txt, open);
      if (dynamic.length) {
        const names = dynamic.map((s) => {
          const r = SundayCalc.resolve(s);
          return `${s.name}(${r.isOpenThisSunday ? "영업" : "휴무"})`;
        });
        bot(`⚠️ 이번 주일 기준: **${names.join(", ")}** — 격주·월별 휴무 패턴이 있어요. 상세 페이지에서 확인하세요.`);
      }
      bot("그 외 가게는 정기휴무가 확정되지 않아, 상세 페이지의 전화번호로 확인하시는 게 안전해요.");
      return null;
    }

    // 3) 주차
    if (/(주차|차|파킹)/.test(t)) {
      const list = stores.filter((s) => s.parking && !/없|불가/.test(s.parking));
      return ["🚗 **주차가 가능하거나 팁이 있는 곳**이에요.", list];
    }

    // 4) 아기의자 / 아이
    if (/(아기|아이|유아|애기|키즈|아기의자)/.test(t)) {
      const list = stores.filter((s) => /있/.test(s.baby_chair));
      return ["🍼 **아기의자가 있는 곳**이에요. 아이와 함께 가기 좋아요.", list];
    }

    // 5) 카페/디저트/빵/커피
    if (/(카페|커피|디저트|빵|베이커리|케이크|도너츠|도넛|꽈배기|라떼)/.test(t)) {
      const list = stores.filter((s) => /카페|베이커리/.test(s.type) || /빵|도너츠|케이크|라떼|타르트/.test(s.signature + s.tagline));
      return ["☕ **카페 · 디저트 · 베이커리**를 모았어요.", list];
    }

    // 6) 가성비/저렴
    if (/(가성비|저렴|싸|가격|만원|저렴한)/.test(t)) {
      const list = stores.filter((s) => /4,?000|5,?000|6,?000|만원|가성비|저렴/.test(s.price + s.tip + s.charm + s.tagline));
      return ["💳 **부담 없이 즐기는 가성비 한 끼**예요.", list.slice(0, 8)];
    }

    // 7) 메뉴/종류 키워드 검색
    const list = stores.filter((s) =>
      (s.name + s.type + s.signature + s.tagline + s.story).toLowerCase().includes(t)
    );
    if (q.trim() && list.length) {
      return [`'${escapeHtml(q)}' 와(과) 어울리는 곳을 찾았어요.`, list.slice(0, 8)];
    }

    // 8) 추천 / 기본
    if (/(추천|뭐|메뉴|먹|골라|어디)/.test(t) || !q.trim()) {
      const picks = shuffle(stores).slice(0, 4);
      return ["오늘은 이런 곳 어떠세요? 마음 가는 사진을 눌러 이야기를 만나 보세요. ✨", picks];
    }

    bot(
      "음, 잘 못 알아들었어요. 😅\n'주일에 여는 곳', '주차 되는 곳', '카페', '가성비' 처럼 물어보거나 가게 이름을 적어 주세요."
    );
    return null;
  }

  function storeDetail(s, q) {
    const resolved = window.SundayCalc ? SundayCalc.resolve(s) : null;
    const sunTxt = resolved
      ? (resolved.isOpenThisSunday ? "주일 영업 ✅" : resolved.isOpenThisSunday === false ? "주일 휴무 🚫" : "주일 확인 필요 📞")
      : (SUN_TXT[s.sunday] || "");
    const sunNote = resolved
      ? [resolved.dynamic, resolved.note].filter(Boolean).join(" · ")
      : (s.sunday_note || "");
    const lines = [
      `**${s.emoji} ${s.name}** — ${s.type}`,
      `${sunTxt} · ${sunNote}`,
    ];
    if (/주차/.test(q) && s.parking) lines.push(`🚗 주차: ${s.parking}`);
    else if (/시간|영업|휴무|문|열/.test(q) && s.hours) lines.push(`🕒 ${s.hours}`);
    else {
      if (s.signature) lines.push(`⭐ ${s.signature}`);
      if (s.hours) lines.push(`🕒 ${s.hours}`);
      if (s.price) lines.push(`💳 ${s.price}`);
    }
    botCards(lines.join("\n"), [s]);
    return null;
  }

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function send() {
    const inp = document.getElementById("chatText");
    const q = inp.value.trim();
    if (!q) return;
    me(q);
    inp.value = "";

    // 실제 백엔드(로컬)가 연결된 경우에만 사용. 기본은 규칙기반.
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q, context: current ? current.id : null }),
        });
        const data = await res.json();
        bot(data.reply || "(응답 없음)");
        return;
      } catch (e) {
        bot("로컬 챗봇 서버에 연결하지 못해, 기본 안내로 답해 드릴게요.");
      }
    }

    const r = answer(q);
    if (Array.isArray(r)) botCards(r[0], r[1]);
  }

  return {
    init(data, cur) {
      stores = data || [];
      current = cur || null;
      ensureUI();
    },
    open(s) {
      current = s || current;
      toggle(true);
      if (s) {
        bot(`**${s.name}** 에 대해 무엇이 궁금하세요? "주일에 열어?", "주차 돼?", "대표 메뉴" 처럼 물어보세요.`);
      }
    },
  };
})();
