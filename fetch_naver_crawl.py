# -*- coding: utf-8 -*-
"""
playwright로 네이버 지도 place 페이지 크롤링
봇 감지 우회: 랜덤 viewport, random wait, mouse movement simulation, JS fingerprint randomize
Excel이 최우선. 수집한 정보는 보강용.
"""
import json
import time
import random
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

def randomize_context(browser):
    """랜덤 viewport + fingerprint로 봇 감지 우회"""
    vp_w = random.randint(1280, 1920)
    vp_h = random.randint(720, 1080)
    tz = random.choice([
        "Asia/Seoul", "America/New_York", "Europe/London", "Pacific/Auckland"
    ])
    locale = random.choice(["ko-KR", "en-US", "ja-JP"])
    lang = locale.split("-")[0]

    context = browser.new_context(
        viewport={"width": vp_w, "height": vp_h},
        timezone_id=tz,
        locale=locale,
        color_scheme="light",
        reduced_motion="reduce",
        extra_http_headers={
            "Accept-Language": f"{lang},{locale};q=0.9",
        },
    )

    # JS fingerprint randomize (일부 브라우저 속성 변조)
    context.add_init_script("""
        // WebGL renderer 랜덤화
        const getParameter = WebGLRenderingContext.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(arg) {
            if (arg === 37445) return 'Intel Open Source Technology Center'; // renderer random
            if (arg === 37446) return 'Mesa DRI Intel(R) HD Graphics 530';
            return getParameter.call(this, arg);
        };

        // Navigator plugins/randomize
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                { name: 'PDF Viewer', filename: 'application/pdf' },
                { name: 'Native Client', filename: 'application/x-nacl' },
            ],
        });

        // Hardware concurrency randomize (4~8)
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => Math.floor(Math.random()*5)+4 });

        // Screen dimension randomize (일부만)
        Object.defineProperty(navigator, 'deviceMemory', { get: () => Math.random() > 0.5 ? 8 : 4 });
    """)

    return context


def simulate_mouse(page):
    """마우스 움직임 시뮬레이션"""
    page.mouse.move(100 + random.randint(0, 200), 100 + random.randint(0, 100))
    page.wait_for_timeout(random.randint(50, 200))
    page.mouse.move(300 + random.randint(0, 400), 300 + random.randint(0, 200))


def extract_api_data(page):
    """네이버 지도 API 응답에서 JSON 데이터 추출 시도"""
    data = {}

    # intercepted network responses 수집 (이게 가장 정확함)
    # 페이지 로드 중 네트워크 요청 모니터링
    try:
        # place 정보 API는 보통 /v4/ed/local/ 혹은 /place/ 경로에서 호출됨
        # DOM에 이미 렌더링된 JSON 데이터 시도
        js_code = """
            () => {
                // document의 모든 텍스트 추출
                const allText = document.body ? document.body.innerText || '' : '';

                // meta 태그에서 description etc
                let metaDesc = '';
                try {
                    const desc = document.querySelector('meta[name="description"]');
                    if (desc) metaDesc = desc.getAttribute('content') || '';
                } catch(e) {}

                return JSON.stringify({
                    bodyText: allText,
                    metaDescription: metaDesc,
                    title: document.title || '',
                });
            }
        """
        result = page.evaluate(js_code)
        if result:
            info = json.loads(result)
            data['body_text'] = info.get('bodyText', '')[:3000]
            data['meta_description'] = info.get('metaDescription', '')
            data['page_title'] = info.get('title', '')
    except Exception:
        pass

    return data


results = {}
chromium_path = "/usr/bin/chromium-browser"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=chromium_path,
        headless=True,
    )

    for i, (store, url) in enumerate(links.items()):
        print(f"\n[{i+1}/{len(links)}] {store}")

        # 랜덤 대기 (봇 감지 우회)
        time.sleep(random.uniform(1.5, 3.0))

        context = randomize_context(browser)
        page = context.new_page()

        try:
            # 네트워크 인터셉트로 API 데이터 캐치 시도
            api_data = {}
            responses_received = []

            def handle_response(resp):
                url_lower = resp.url.lower()
                if any(k in url_lower for k in ['place', 'local', 'review', 'api']):
                    try:
                        body = resp.body().decode('utf-8', errors='ignore')[:2000]
                        responses_received.append({
                            'url': resp.url,
                            'body_preview': body,
                            'status': resp.status,
                        })
                    except:
                        pass

            page.on("response", handle_response)

            # 페이지 로드 (commit으로 빠르게 시작)
            resp = page.goto(url, timeout=25000, wait_until="domcontentloaded")
            final_url = page.url
            print(f"  → {final_url[:70]}...")

            # 랜덤 시간 대기 (SPA 렌더링용 + 봇 감지 우회)
            page.wait_for_timeout(random.randint(3000, 6000))

            # 마우스 시뮬레이션
            simulate_mouse(page)

            # 추가 랜덤 대기
            time.sleep(random.uniform(1.0, 2.5))

            # JS 렌더링된 데이터 추출
            js_data = extract_api_data(page)

            # place ID 추출
            place_id_match = __import__('re').search(r'/place/(\d+)', final_url)
            place_id = place_id_match.group(1) if place_id_match else 'N/A'

            print(f"  → placeID: {place_id}")

            # body_text가 비어있다면 스크롤 시뮬레이션
            body = js_data.get('body_text', '')
            if not body or len(body) < 10:
                print("  → 스크롤 시뮬레이션 중...")
                for _ in range(5):
                    page.evaluate("window.scrollBy(0, 500)")
                    page.wait_for_timeout(random.randint(200, 500))
                # 재추출
                text = page.evaluate("() => document.body.innerText || ''")
                js_data['body_text'] = (text or '')[:3000]

            body_lines = [l.strip() for l in js_data.get('body_text', '').split('\n') if l.strip()]
            print(f"  → 텍스트 줄수: {len(body_lines)}")
            for line in body_lines[:12]:
                clean = line.replace('\r', '').strip()
                if clean:
                    print(f"     \"{clean}\"")

            # 네트워크 응답도 확인
            api_texts = []
            for r in responses_received[:5]:
                # JSON 파싱 시도
                try:
                    jdata = json.loads(r['body_preview'])
                    if isinstance(jdata, dict):
                        api_texts.append(json.dumps(jdata, ensure_ascii=False)[:500])
                except:
                    pass

            results[store] = {
                "original_url": url,
                "final_url": final_url,
                "place_id": place_id,
                "page_title": js_data.get('page_title', ''),
                "meta_description": js_data.get('meta_description', ''),
                "body_lines": body_lines[:20],
                "api_responses_count": len(responses_received),
                "error": None,
            }

        except Exception as e:
            print(f"  ❌ {e}")
            results[store] = {"url": url, "error": str(e)}

        page.close()

    browser.close()

with open("naver_map_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n✅ 완료! {len(results)}개 상점 → naver_map_results.json")
