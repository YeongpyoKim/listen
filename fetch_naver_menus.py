# -*- coding: utf-8 -*-
"""
네이버 지도(Playwright)에서 점포별 메뉴·가격 텍스트를 수집합니다.

실행:  python fetch_naver_menus.py
결과:  site/data/naver_menus.json
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

import openpyxl
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
XLSX = ROOT / "상점 리스트.xlsx"
OUT = ROOT / "site" / "data" / "naver_menus.json"

PRICE_RE = re.compile(r"^(\d{1,3}(,\d{3})*|\d+)원$")

EXTRACT_JS = """
() => {
  const items = [];
  document.querySelectorAll('.place_section_content li').forEach(li => {
    const lines = li.innerText.split('\\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) return;
    let badge = '';
    if (lines[0] === '\\uB300\\uD45C' || lines[0] === '\\uC778\\uAE30') {
      badge = lines[0];
      lines.shift();
    }
    let name = '';
    let price = '';
    const last = lines[lines.length - 1] || '';
    if (/\\d+[,\\d]*\\uC6D0$/.test(last)) {
      price = last;
      const body = lines.slice(0, -1);
      name = body[0] || '';
    } else {
      return;
    }
    if (name) items.push({ name, price, badge });
  });
  return items;
}
"""


def read_stores():
    wb = openpyxl.load_workbook(XLSX)
    ws = wb.active
    stores = []
    for row in ws.iter_rows(min_row=4, values_only=False):
        cell = row[1]
        if not cell.value:
            continue
        stores.append({
            "name": str(cell.value).strip(),
            "naver_url": cell.hyperlink.target if cell.hyperlink else "",
        })
    return stores


def place_id_from_url(url: str) -> str | None:
    m = re.search(r"/place/(\d+)", url or "")
    return m.group(1) if m else None


def is_valid_item(item: dict) -> bool:
    name = (item.get("name") or "").strip()
    price = (item.get("price") or "").strip()
    if not name or not price or len(name) > 55:
        return False
    if not PRICE_RE.match(price):
        return False
    bad = ("다이닝코드", "동영상", "http", "블로그")
    if any(b in name for b in bad):
        return False
    return True


def normalize_items(raw: list) -> list:
    out = []
    seen = set()
    for item in raw:
        if not is_valid_item(item):
            continue
        name = item["name"].strip()
        if name in seen:
            continue
        seen.add(name)
        entry = {"name": name, "price": item["price"].strip()}
        badge = (item.get("badge") or "").strip()
        if badge:
            entry["badge"] = badge
        out.append(entry)
    return out


def scrape_menu(page, place_id: str):
    for biz in ("restaurant", "cafe", "place"):
        url = f"https://pcmap.place.naver.com/{biz}/{place_id}/menu/list"
        try:
            page.goto(url, wait_until="networkidle", timeout=40000)
            time.sleep(1.2)
            if place_id not in page.url:
                continue
            raw = page.evaluate(EXTRACT_JS)
            items = normalize_items(raw)
            if items:
                return items, url
        except Exception:
            continue
    return [], ""


def main():
    stores = read_stores()
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(locale="ko-KR")

        for i, store in enumerate(stores, start=1):
            name = store["name"]
            url = store["naver_url"]
            print(f"[{i}/{len(stores)}] {name}...", end=" ", flush=True)

            if not url:
                print("skip (no url)")
                results[name] = {"items": [], "error": "no_url"}
                continue

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                time.sleep(1)
                pid = place_id_from_url(page.url)
                if not pid:
                    print("skip (no place_id)")
                    results[name] = {"items": [], "error": "no_place_id", "naver_url": url}
                    continue

                items, menu_url = scrape_menu(page, pid)
                results[name] = {
                    "place_id": pid,
                    "naver_url": url,
                    "menu_url": menu_url,
                    "items": items,
                    "fetched_at": time.strftime("%Y-%m-%d"),
                }
                print(f"{len(items)} menus")
            except Exception as e:
                print(f"err: {e}")
                results[name] = {"items": [], "error": str(e), "naver_url": url}

        browser.close()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    ok = sum(1 for v in results.values() if v.get("items"))
    print(f"\n[OK] {ok}/{len(stores)}개 점포 메뉴 → {OUT}")


if __name__ == "__main__":
    main()
