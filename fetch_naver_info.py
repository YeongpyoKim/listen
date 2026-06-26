# -*- coding: utf-8 -*-
"""
각 상점의 네이버 지도 리뷰 및 블로그 정보를 수집합니다.
네이버 검색 결과를 파싱하여 메뉴, 리뷰 요약, 특징 등을 추출합니다.
"""
import requests
from bs4 import BeautifulSoup
import time
import json

stores = [
    "맛대로촌닭 강서구 방화동",
    "양천칼국수 강서구 마곡동",
    "마곡오리 찜닭 오리지널",
    "마곡면옥 강서구",
    "집애김밥 강서구 방화",
    "옥담집 파스타 강서구",
    "InLike 강서구 양천로",
    "왕소풍김밥 강서구 마곡동",
    "선식당 강서구 신방화역",
    "태문네 갈매기살 강서구 방화",
    "마라홍 마라탕 강서구",
    "카페 까사모멘토 강서구 양천로",
    "은행나무집 강서구 신방화역",
    "빙그레식당 강서구 홍어 삼겹살",
    "장수밥상 강서구 마곡 발산",
    "매일향 중화요리 강서구",
    "김밥365 강서구 방화본점",
    "빵굼터 강서구 양천로28길",
    "금수저 아구찜 강서구 방화대로44길",
    "마곡명인 도너츠 꽈배기 강서구",
    "커피상담원 강서구 마곡동",
]

results = {}

for store in stores:
    print(f"검색 중: {store}")
    query = '+'.join(store.split())
    url = f"https://search.naver.com/search.naver?ie=utf8&query={query}&where=blog"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")

        blogs = []
        for blog in soup.select("div[xid='post']"):
            title = blog.find("span", class_("tit_blog"))
            if title:
                blogs.append(title.get_text(strip=True))

        results[store] = {
            "blog_titles": blogs[:5],  # 최대 5개 블로그 제목
            "status": "ok" if blogs else "no-results",
        }
    except Exception as e:
        results[store] = {"error": str(e), "status": "fail"}

    time.sleep(1.2)  # rate limiting

with open("naver_blog_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n완료! {len(results)}개 상점 수집 → naver_blog_results.json")
