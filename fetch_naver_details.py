# -*- coding: utf-8 -*-
"""
상점 리스트.xlsx B4~B24에 연결된 naver.me/naver 지도 링크를 playwright로 방문하여
상점별 추가정보 (메뉴, 리뷰 요약, 특징 등) 수집
"""
import json
from playwright.sync_api import sync_playwright

links = {
    "맛대로촌닭":       "https://naver.me/5B0Ti39n",
    "양천칼국수":       "https://naver.me/GeUtVT8R",
    "마곡오리":         "https://naver.me/xxY2OA5g",
    "마곡면옥":         "https://naver.me/GCgkW4gO",
    "집애김밥":         "https://naver.me/GBF7AutO",
    "옥담집":           "https://naver.me/5EnZYEfN",
    "InLike":           "https://naver.me/5fIpXXSG",
    "왕소풍김밥":       "https://naver.me/5k7U7ZVD",
    "선식당":           "https://naver.me/xrSQQ5o8",
    "태문네":           "https://naver.me/x3jFZaif",
    "마라홍 마라탕":     "https://naver.me/5eDryCUH",
    "카페 까사모멘토":   "https://naver.me/5ajqP6g9",
    "빙그레식당":       "https://naver.me/GMP2az6F",
    "장수밥상":         "https://naver.me/FxFKuLEW",
    "매일향 중화요리":   "https://naver.me/5UEnUkPq",
    "김밥365":          "https://naver.me/Fw7qsbaZ",
    "빵굼터":           "https://naver.me/5UEfUCvy",
    "금수저 아구찜":     "https://naver.me/5Hy8kD0f",
    "마곡명인 도너츠 꽈배기": "https://naver.me/x3cdujHo",
    "커피상담원":       "https://map.naver.com/p/entry/place/1235002435?lng=126.8225473&lat=37.572181&placePath=%2Fhome%3Ffrom%3Dmap%26fromPanelNum%3D1%26additionalHeight%3D76%26timestamp%3D202606252243%26locale%3Dko%26svcName%3Dmap_pcv5&entry=plt&searchType=place",
}

results = {}

chromium_path = "/usr/bin/chromium-browser"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=chromium_path,
        headless=True,
    )

    for i, (store, url) in enumerate(links.items()):
        print(f"\n[{i+1}/{len(links)}] {store}: {url[:50]}...")
        page = browser.new_page()

        try:
            # naver.me 링크는 리다이렉트됨 → 최종 URL 확인
            response = page.goto(url, timeout=15000, wait_until="domcontentloaded")
            final_url = page.url

            # 페이지 내용 추출
            content = {}

            # 제목
            try:
                content['title'] = page.title()
            except:
                content['title'] = ''

            # 본문 텍스트 (일부)
            try:
                body_text = page.inner_text("body")[:3000] if page.inner_text("body") else ""
                content['body_preview'] = body_text
            except:
                content['body_preview'] = ""

            # 링크들
            try:
                hrefs = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
                content['links'] = [h for h in hrefs if h and 'naver' in h][:10]
            except:
                content['links'] = []

            results[store] = {
                'original_url': url,
                'final_url': final_url,
                **content,
            }

        except Exception as e:
            results[store] = {'error': str(e), 'url': url}

        page.close()

        if i < len(links) - 1:
            # 다음 페이지를 위해 context 초기화
            browser.new_context()

browser.close()

with open("naver_store_details.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n✅ 완료! naver_store_details.json 저장됨")
