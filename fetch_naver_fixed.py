# -*- coding: utf-8 -*-
"""네이버 지도 페이지에서 JS 렌더링 후 HTML 파싱"""
import json, re
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
            # commit까지 기다린 후 body 로드 대기
            resp = page.goto(url, timeout=20000, wait_until="domcontentloaded")
            final_url = page.url
            print(f"  → {final_url}")

            # JS 렌더링을 위해 충분한 시간 대기
            page.wait_for_timeout(5000)

            # HTML 직접 추출
            html = page.content() if page.content() else ""

            # 제목 관련 정보 추출 (meta tag, title element 등)
            title_match = re.search(r'<title>(.*?)</title>', html)
            print(f"  → 페이지 타이틀: {title_match.group(1).strip()[:80] if title_match else 'N/A'}")

            # place ID 추출
            id_match = re.search(r'/place/(\d+)', final_url)
            place_id = id_match.group(1) if id_match else 'N/A'
            print(f"  → place ID: {place_id}")

            # 네이버 지도의 JSON 데이터 시도 (초기 상태)
            json_matches = re.findall(r'(?:window\.__INITIAL_STATE__|__NEXT_DATA__|initialState)\s*=\s*(\{.*?\});', html, re.DOTALL)
            if json_matches:
                print(f"  → JSON 데이터 발견 ({len(json_matches)}개)")

            # 관련 텍스트 추출 (div 안에 한글 텍스트들)
            divs = re.findall(r'<div[^>]*>([^<]+)', html)
            korean_texts = [d.strip() for d in divs if any(ord(c) > 127 for c in d.strip()) and len(d.strip()) > 3][:20]
            print(f"  → 한글 텍스트 {len(korean_texts)}개 추출")
            for t in korean_texts[:8]:
                print(f"     \"{t}\"")

            # 카테고리 정보
            cats = re.findall(r'category.*?([^",<>]+)', html, re.IGNORECASE)
            if cats:
                print(f"  → 카테고리 관련: {cats[:5]}")

            results[store] = {
                "final_url": final_url,
                "place_id": place_id,
                "title": title_match.group(1).strip() if title_match else "",
                "korean_texts": korean_texts,
                "html_length": len(html),
                "error": None,
            }

        except Exception as e:
            print(f"  ❌ 에러: {e}")
            results[store] = {"url": url, "error": str(e)}

        page.close()

browser.close()

with open("naver_map_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n✅ 완료 → naver_map_results.json")
