/* 동적 주일 영업 계산 — 격주·월별 패턴 지원 */
window.SundayCalc = (function () {
  function getUpcomingSunday(fromDate) {
    const d = new Date(fromDate || Date.now());
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
    return d;
  }

  function formatDateKo(d) {
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getMonth() + 1}월 ${d.getDate()}일(${weekdays[d.getDay()]})`;
  }

  function getSundayWeekOfMonth(d) {
    let count = 0;
    const year = d.getFullYear();
    const month = d.getMonth();
    for (let day = 1; day <= d.getDate(); day++) {
      if (new Date(year, month, day).getDay() === 0) count++;
    }
    return count;
  }

  function isBiweeklyOpen(refDateStr, targetSunday) {
    const ref = new Date(refDateStr + "T00:00:00");
    ref.setHours(0, 0, 0, 0);
    const target = new Date(targetSunday);
    target.setHours(0, 0, 0, 0);
    const weekDiff = Math.round((target - ref) / (7 * 24 * 60 * 60 * 1000));
    return weekDiff % 2 === 0;
  }

  function isOpenOnSunday(store, fromDate) {
    const upcoming = getUpcomingSunday(fromDate);
    const type = store.sunday;
    const rule = store.sunday_rule || {};

    if (type === "open") return true;
    if (type === "closed") return false;
    if (type === "biweekly") {
      return isBiweeklyOpen(rule.open_ref || "2026-06-28", upcoming);
    }
    if (type === "monthly_off") {
      const closedWeeks = rule.closed_weeks || [1, 3];
      return !closedWeeks.includes(getSundayWeekOfMonth(upcoming));
    }
    return null;
  }

  function resolve(store, fromDate) {
    const upcoming = getUpcomingSunday(fromDate);
    const dateStr = formatDateKo(upcoming);
    const type = store.sunday;
    const rule = store.sunday_rule || {};
    const baseNote = store.sunday_note || "";

    if (type === "open") {
      return {
        badge: { label: "주일 영업", cls: "open" },
        detail: { ico: "🕊️", t: "주일에 문을 엽니다", cls: "s-open" },
        note: baseNote,
        dynamic: `다가오는 주일(${dateStr}): 영업 ✅`,
        isOpenThisSunday: true,
      };
    }

    if (type === "closed") {
      return {
        badge: { label: "주일 휴무", cls: "closed" },
        detail: { ico: "🚫", t: "주일에는 휴무입니다", cls: "s-closed" },
        note: baseNote,
        dynamic: `다가오는 주일(${dateStr}): 휴무 🚫`,
        isOpenThisSunday: false,
      };
    }

    if (type === "biweekly") {
      const isOpen = isBiweeklyOpen(rule.open_ref || "2026-06-28", upcoming);
      return {
        badge: { label: isOpen ? "이번 주일 영업" : "이번 주일 휴무", cls: isOpen ? "open" : "biweekly" },
        detail: {
          ico: isOpen ? "🕊️" : "⚠️",
          t: isOpen ? `이번 주일(${dateStr})은 영업합니다` : `이번 주일(${dateStr})은 휴무입니다`,
          cls: isOpen ? "s-open" : "s-biweekly",
        },
        note: baseNote,
        dynamic: isOpen
          ? `다가오는 주일(${dateStr}): 영업 ✅ (격주 휴무 — 이번 주는 여는 주)`
          : `다가오는 주일(${dateStr}): 휴무 🚫 (격주 휴무 — 이번 주는 쉬는 주)`,
        isOpenThisSunday: isOpen,
      };
    }

    if (type === "monthly_off") {
      const closedWeeks = rule.closed_weeks || [1, 3];
      const weekNum = getSundayWeekOfMonth(upcoming);
      const isOpen = !closedWeeks.includes(weekNum);
      const ordinals = ["", "첫째", "둘째", "셋째", "넷째", "다섯째"];
      const weekLabel = ordinals[weekNum] || `${weekNum}째`;
      return {
        badge: { label: isOpen ? "이번 주일 영업" : "이번 주일 휴무", cls: isOpen ? "open" : "closed" },
        detail: {
          ico: isOpen ? "🕊️" : "🚫",
          t: isOpen
            ? `이번 주일(${dateStr}, ${weekLabel} 주)은 영업합니다`
            : `이번 주일(${dateStr}, ${weekLabel} 주)은 휴무입니다`,
          cls: isOpen ? "s-open" : "s-closed",
        },
        note: baseNote,
        dynamic: isOpen
          ? `다가오는 주일(${dateStr}): 영업 ✅ (${weekLabel} 일요일 — 영업 주)`
          : `다가오는 주일(${dateStr}): 휴무 🚫 (${weekLabel} 일요일 — 휴무 주)`,
        isOpenThisSunday: isOpen,
      };
    }

    return {
      badge: { label: "주일 확인 필요", cls: "check" },
      detail: { ico: "📞", t: "주일 방문 전 확인을 권합니다", cls: "s-check" },
      note: baseNote,
      dynamic: "",
      isOpenThisSunday: null,
    };
  }

  return { resolve, getUpcomingSunday, formatDateKo, isOpenOnSunday };
})();
