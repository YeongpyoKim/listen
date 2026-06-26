# -*- coding: utf-8 -*-
"""네이버 지도 place 페이지에서 정보 추출 - 네트워크 대기 후"""
import json
from playwright.sync_api import sync_playwright

links = {
    "맛대로촌닭":   "https://naver.me/5B0Ti39n",
    "양천칼국수":   "https://naver.me/GeUtVT8R",
    "마곡오리":      "https://naver.me/xxY2OA5g",
    "마곡면옥":      "https://naver.me/GCgkW4gO",
    "집애김밥":      "https://naver.me/GBF7AutO",
}

chromium_path = "/usr/bin/chromium-browser"
results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=chromium_path,
        headless=True,
    )

    for store, url in links.items():
        print(f"\n🔍 {store}: {url}")
        context = browser.new_context()
        page = context.new_page()

        try:
            resp = page.goto(url, timeout=20000, wait_until="commit")

            # naver maps SPA가 완전히 로드될 때까지 대기
            print(f"  → 최종 URL: {page.url}")

            # JS 렌더링된 콘텐츠 기다리기
            page.wait_for_load_state("networkidle", timeout=10000)

            # 추가 대기 (SPA 특성상 조금 더)
            page.wait_for_timeout(2000)

            # 장소명 추출 시도
            name_selectors = [
                "[data-testid='place-name']",
                ".place_name",
                ".info_place_name",
                "h3.title_place",
                "span.name",
            ]
            place_name = ""
            for sel in name_selectors:
                try:
                    el = page.query_selector(sel)
                    if el and el.inner_text().strip():
                        place_name = el.inner_text().strip()
                        break
                except:
                    continue

            # 전체 텍스트 추출
            text = ""
            try:
                text = page.inner_text("body", timeout=5000) or ""
            except:
                pass

            # 스크린샷 (확인용)
            page.screenshot(path=f"_{store[:4]}.png")

            print(f"  → 장소명: {place_name}")
            lines = [l for l in text.split('\n') if l.strip()][:20]
            for line in lines:
                print(f"     {line[:100]}")

            results[store] = {
                "final_url": page.url,
                "place_name": place_name,
                "body_preview_lines": lines,
                "error": None,
            }

        except Exception as e:
            print(f"  ❌ 에러: {e}")
            results[store] = {
                "url": url,
                "error": str(e),
            }

        page.close()

browser.close()

with open("naver_map_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n✅ 저장됨 → naver_map_results.json")
