# -*- coding: utf-8 -*-
"""네이버 링크 몇 개만 테스트 - 추출한 데이터 확인용"""
import json
from playwright.sync_api import sync_playwright

# 첫 5개만 테스트
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
            resp = page.goto(url, timeout=15000, wait_until="commit")
            final_url = page.url
            print(f"  → 최종 URL: {final_url[:80]}")

            # 제목 추출
            title = page.title()
            print(f"  → 제목: {title}")

            # 본문 텍스트
            text = page.inner_text("body", timeout=5000) or ""
            lines = [l for l in text.split('\n') if l.strip()]
            print(f"  → 본문 줄수: {len(lines)}")
            for line in lines[:15]:
                print(f"     {line}")

            # 이미지 alt/text
            imgs = page.eval_on_selector_all("img", "els => els.map(e => ({alt: e.alt, src: e.src}))")
            if imgs:
                print(f"  → 이미지가 {len(imgs)}개 있음")

        except Exception as e:
            print(f"  ❌ 에러: {e}")

        results[store] = {
            "url": final_url,
            "title": title if 'title' in dir() else "",
            "body_lines": lines[:10] if 'lines' in dir() else [],
            "error": str(e) if 'e' in dir() else None,
        }
        page.close()

browser.close()

with open("naver_test_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n✅ 저장됨 → naver_test_results.json")
