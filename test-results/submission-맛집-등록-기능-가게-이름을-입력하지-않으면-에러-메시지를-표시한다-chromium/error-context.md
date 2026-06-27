# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submission.spec.js >> 맛집 등록 기능 >> 가게 이름을 입력하지 않으면 에러 메시지를 표시한다
- Location: tests/e2e/submission.spec.js:46:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#smMsg')
Expected substring: "가게 이름을 입력해 주세요"
Received string:    ""
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#smMsg')
    14 × locator resolved to <div id="smMsg" class="sm-msg"></div>
       - unexpected value ""

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]: 경청 프로젝트 2기 · 작은 실천
    - heading "동네 한 바퀴, 은혜 한 바구니" [level=1] [ref=e4]:
      - text: 동네 한 바퀴,
      - text: 은혜 한 바구니
    - paragraph [ref=e5]: 주일, 이 동네를 찾는 당신께 — 발걸음이 머무는 곳마다 정성과 이야기가 담긴 가게들을 모았습니다. 마음에 드는 사진을 눌러 그 가게의 이야기 속으로 들어가 보세요.
  - main [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: 🔍
        - textbox "가게 이름 · 메뉴 검색" [ref=e11]
      - generic [ref=e12]:
        - button "전체" [ref=e13] [cursor=pointer]
        - button "치킨집" [ref=e14] [cursor=pointer]
        - button "한식" [ref=e15] [cursor=pointer]
        - button "양식" [ref=e16] [cursor=pointer]
        - button "카페" [ref=e17] [cursor=pointer]
        - button "퓨전" [ref=e18] [cursor=pointer]
        - button "중식" [ref=e19] [cursor=pointer]
        - button "베이커리" [ref=e20] [cursor=pointer]
    - region "상점 갤러리" [ref=e21]:
      - link "주일 영업 맛대로촌닭 🍗 맛대로촌닭 치킨집 · 어머나촌닭떡볶이" [ref=e22] [cursor=pointer]:
        - /url: store.html?id=s01
        - generic [ref=e23]:
          - generic [ref=e24]: 주일 영업
          - img "맛대로촌닭" [ref=e25]
          - generic [ref=e27]:
            - generic [ref=e28]: 🍗 맛대로촌닭
            - generic [ref=e29]: 치킨집 · 어머나촌닭떡볶이
      - link "이번 주일 영업 양천칼국수 🍽️ 양천칼국수 한식 · 칼국수" [ref=e30] [cursor=pointer]:
        - /url: store.html?id=s02
        - generic [ref=e31]:
          - generic [ref=e32]: 이번 주일 영업
          - img "양천칼국수" [ref=e33]
          - generic [ref=e35]:
            - generic [ref=e36]: 🍽️ 양천칼국수
            - generic [ref=e37]: 한식 · 칼국수
      - link "주일 영업 마곡오리 🦆 마곡오리 한식 · 오리 주물럭" [ref=e38] [cursor=pointer]:
        - /url: store.html?id=s03
        - generic [ref=e39]:
          - generic [ref=e40]: 주일 영업
          - img "마곡오리" [ref=e41]
          - generic [ref=e43]:
            - generic [ref=e44]: 🦆 마곡오리
            - generic [ref=e45]: 한식 · 오리 주물럭
      - link "주일 영업 마곡면옥 🍜 마곡면옥 한식 · 냉면" [ref=e46] [cursor=pointer]:
        - /url: store.html?id=s04
        - generic [ref=e47]:
          - generic [ref=e48]: 주일 영업
          - img "마곡면옥" [ref=e49]
          - generic [ref=e51]:
            - generic [ref=e52]: 🍜 마곡면옥
            - generic [ref=e53]: 한식 · 냉면
      - link "주일 영업 집애김밥 🍙 집애김밥 한식 · 야채김밥" [ref=e54] [cursor=pointer]:
        - /url: store.html?id=s05
        - generic [ref=e55]:
          - generic [ref=e56]: 주일 영업
          - img "집애김밥" [ref=e57]
          - generic [ref=e59]:
            - generic [ref=e60]: 🍙 집애김밥
            - generic [ref=e61]: 한식 · 야채김밥
      - link "주일 영업 옥담집 🍝 옥담집 양식 · 오일 파스타" [ref=e62] [cursor=pointer]:
        - /url: store.html?id=s06
        - generic [ref=e63]:
          - generic [ref=e64]: 주일 영업
          - img "옥담집" [ref=e65]
          - generic [ref=e67]:
            - generic [ref=e68]: 🍝 옥담집
            - generic [ref=e69]: 양식 · 오일 파스타
      - link "주일 영업 InLike 🍵 InLike 카페 · 쑥라떼" [ref=e70] [cursor=pointer]:
        - /url: store.html?id=s07
        - generic [ref=e71]:
          - generic [ref=e72]: 주일 영업
          - img "InLike" [ref=e73]
          - generic [ref=e75]:
            - generic [ref=e76]: 🍵 InLike
            - generic [ref=e77]: 카페 · 쑥라떼
      - link "주일 영업 왕소풍김밥 🍱 왕소풍김밥 한식 · 소풍김밥" [ref=e78] [cursor=pointer]:
        - /url: store.html?id=s08
        - generic [ref=e79]:
          - generic [ref=e80]: 주일 영업
          - img "왕소풍김밥" [ref=e81]
          - generic [ref=e83]:
            - generic [ref=e84]: 🍱 왕소풍김밥
            - generic [ref=e85]: 한식 · 소풍김밥
      - link "주일 영업 선식당 🥗 선식당 퓨전 · 스테이크 샐러드" [ref=e86] [cursor=pointer]:
        - /url: store.html?id=s09
        - generic [ref=e87]:
          - generic [ref=e88]: 주일 영업
          - img "선식당" [ref=e89]
          - generic [ref=e91]:
            - generic [ref=e92]: 🥗 선식당
            - generic [ref=e93]: 퓨전 · 스테이크 샐러드
      - link "주일 영업 태문네 🥩 태문네 한식 · 갈매기살" [ref=e94] [cursor=pointer]:
        - /url: store.html?id=s10
        - generic [ref=e95]:
          - generic [ref=e96]: 주일 영업
          - img "태문네" [ref=e97]
          - generic [ref=e99]:
            - generic [ref=e100]: 🥩 태문네
            - generic [ref=e101]: 한식 · 갈매기살
      - link "주일 영업 마라홍 마라탕 🌶️ 마라홍 마라탕 중식 · 마라탕" [ref=e102] [cursor=pointer]:
        - /url: store.html?id=s11
        - generic [ref=e103]:
          - generic [ref=e104]: 주일 영업
          - img "마라홍 마라탕" [ref=e105]
          - generic [ref=e107]:
            - generic [ref=e108]: 🌶️ 마라홍 마라탕
            - generic [ref=e109]: 중식 · 마라탕
      - link "주일 영업 카페 까사모멘토 ☕ 카페 까사모멘토 카페 · 모멘토 크림라떼" [ref=e110] [cursor=pointer]:
        - /url: store.html?id=s12
        - generic [ref=e111]:
          - generic [ref=e112]: 주일 영업
          - img "카페 까사모멘토" [ref=e113]
          - generic [ref=e115]:
            - generic [ref=e116]: ☕ 카페 까사모멘토
            - generic [ref=e117]: 카페 · 모멘토 크림라떼
      - link "주일 영업 빙그레식당 🍻 빙그레식당 한식 · 저녁메뉴-홍삼세트(홍어+삼겹살)" [ref=e118] [cursor=pointer]:
        - /url: store.html?id=s13
        - generic [ref=e119]:
          - generic [ref=e120]: 주일 영업
          - img "빙그레식당" [ref=e121]
          - generic [ref=e123]:
            - generic [ref=e124]: 🍻 빙그레식당
            - generic [ref=e125]: 한식 · 저녁메뉴-홍삼세트(홍어+삼겹살)
      - link "주일 휴무 장수밥상 🍚 장수밥상 한식 · 고등어구이 주일 휴무" [ref=e126] [cursor=pointer]:
        - /url: store.html?id=s14
        - generic [ref=e127]:
          - generic [ref=e128]: 주일 휴무
          - img "장수밥상" [ref=e129]
          - generic [ref=e131]:
            - generic [ref=e132]: 🍚 장수밥상
            - generic [ref=e133]: 한식 · 고등어구이
            - generic [ref=e134]: 주일 휴무
      - link "주일 영업 매일향 중화요리 🥢 매일향 중화요리 중식 · 식사류 - 차돌짬뽕" [ref=e135] [cursor=pointer]:
        - /url: store.html?id=s15
        - generic [ref=e136]:
          - generic [ref=e137]: 주일 영업
          - img "매일향 중화요리" [ref=e138]
          - generic [ref=e140]:
            - generic [ref=e141]: 🥢 매일향 중화요리
            - generic [ref=e142]: 중식 · 식사류 - 차돌짬뽕
      - link "주일 영업 김밥365 🍙 김밥365 한식 · 매우 다양한 분식과 식사류를 골라 먹을" [ref=e143] [cursor=pointer]:
        - /url: store.html?id=s16
        - generic [ref=e144]:
          - generic [ref=e145]: 주일 영업
          - img "김밥365" [ref=e146]
          - generic [ref=e148]:
            - generic [ref=e149]: 🍙 김밥365
            - generic [ref=e150]: 한식 · 매우 다양한 분식과 식사류를 골라 먹을
      - link "이번 주일 영업 빵굼터 🥐 빵굼터 베이커리 · 사라다빵" [ref=e151] [cursor=pointer]:
        - /url: store.html?id=s17
        - generic [ref=e152]:
          - generic [ref=e153]: 이번 주일 영업
          - img "빵굼터" [ref=e154]
          - generic [ref=e156]:
            - generic [ref=e157]: 🥐 빵굼터
            - generic [ref=e158]: 베이커리 · 사라다빵
      - link "주일 영업 금수저 아구찜 🍲 금수저 아구찜 한식" [ref=e159] [cursor=pointer]:
        - /url: store.html?id=s18
        - generic [ref=e160]:
          - generic [ref=e161]: 주일 영업
          - img "금수저 아구찜" [ref=e162]
          - generic [ref=e164]:
            - generic [ref=e165]: 🍲 금수저 아구찜
            - generic [ref=e166]: 한식
      - link "주일 휴무 마곡명인 도너츠 꽈배기 🍩 마곡명인 도너츠 꽈배기 베이커리 · 꽈배기 주일 휴무" [ref=e167] [cursor=pointer]:
        - /url: store.html?id=s19
        - generic [ref=e168]:
          - generic [ref=e169]: 주일 휴무
          - img "마곡명인 도너츠 꽈배기" [ref=e170]
          - generic [ref=e172]:
            - generic [ref=e173]: 🍩 마곡명인 도너츠 꽈배기
            - generic [ref=e174]: 베이커리 · 꽈배기
            - generic [ref=e175]: 주일 휴무
      - link "주일 휴무 커피상담원 ☕ 커피상담원 카페 · 크닐라떼 주일 휴무" [ref=e176] [cursor=pointer]:
        - /url: store.html?id=s20
        - generic [ref=e177]:
          - generic [ref=e178]: 주일 휴무
          - img "커피상담원" [ref=e179]
          - generic [ref=e181]:
            - generic [ref=e182]: ☕ 커피상담원
            - generic [ref=e183]: 카페 · 크닐라떼
            - generic [ref=e184]: 주일 휴무
  - generic [ref=e185]:
    - generic [ref=e186]:
      - generic [ref=e187]: 이웃이 추천한 맛집
      - heading "함께 채워 가는 우리 동네 지도" [level=2] [ref=e188]
      - paragraph [ref=e189]: 성도들이 알려 주신 맛집이에요. 관리자가 정보를 확인한 뒤 정식으로 소개될 예정입니다. 🌿
    - generic [ref=e190]:
      - article [ref=e191]:
        - generic [ref=e193]: 🍽️
        - generic [ref=e194]:
          - generic [ref=e195]: 성도 추천
          - heading "테스트 가게 1782529562019" [level=3] [ref=e196]
          - generic [ref=e197]: 한식 · 테스트 메뉴
          - generic [ref=e198]: 📍 서울 강서구 테스트동
          - generic [ref=e199]: ☎️ 02-1234-5678
          - generic [ref=e200]: 🕒 10:00-18:00
          - paragraph [ref=e201]: 테스트용 등록입니다
          - generic [ref=e202]:
            - generic [ref=e203]: 추천 · 테스터
            - button "지우기" [ref=e204] [cursor=pointer]
      - article [ref=e205]:
        - generic [ref=e207]: 🍽️
        - generic [ref=e208]:
          - generic [ref=e209]: 성도 추천
          - heading "테스트 가게 1782529540612" [level=3] [ref=e210]
          - generic [ref=e211]: 한식 · 테스트 메뉴
          - generic [ref=e212]: 📍 서울 강서구 테스트동
          - generic [ref=e213]: ☎️ 02-1234-5678
          - generic [ref=e214]: 🕒 10:00-18:00
          - paragraph [ref=e215]: 테스트용 등록입니다
          - generic [ref=e216]:
            - generic [ref=e217]: 추천 · 테스터
            - button "지우기" [ref=e218] [cursor=pointer]
      - article [ref=e219]:
        - generic [ref=e221]: 🍽️
        - generic [ref=e222]:
          - generic [ref=e223]: 성도 추천
          - heading "테스트 가게" [level=3] [ref=e224]
          - generic [ref=e225]: 한식 · 바지락 칼국수
          - generic [ref=e226]: 📍 서울 강서구 마곡동
          - generic [ref=e227]: ☎️ 02-000-0000
          - generic [ref=e228]: 🕒 10:00-18:00
          - paragraph [ref=e229]: 테스트용 등록입니다
          - generic [ref=e230]:
            - generic [ref=e231]: 추천 · 테스터
            - button "지우기" [ref=e232] [cursor=pointer]
  - contentinfo [ref=e233]:
    - generic [ref=e234]: 동네 한 바퀴, 은혜 한 바구니
    - generic [ref=e235]: 경청 프로젝트 2기 · 작은 실천 — 정보는 방문 시점에 따라 달라질 수 있으니, 표시된 안내를 참고해 주세요.
  - link "📝 +" [ref=e236] [cursor=pointer]:
    - /url: report.html
    - generic [ref=e237]: 📝
    - generic [ref=e238]: +
  - button "💬" [ref=e239] [cursor=pointer]
  - button "🍽️ ＋" [ref=e240] [cursor=pointer]:
    - generic [ref=e241]: 🍽️
    - generic [ref=e242]: ＋
  - dialog "알리고 싶은 가게가 있나요?" [ref=e245]:
    - button "닫기" [ref=e246] [cursor=pointer]: ✕
    - generic [ref=e247]:
      - generic [ref=e248]: 내가 아는 맛집 추가하기
      - heading "알리고 싶은 가게가 있나요?" [level=2] [ref=e249]
      - paragraph [ref=e250]: 아는 만큼만 적어 주셔도 괜찮아요. 빠진 정보는 관리자가 직접 채워 둘게요. 🌿
    - generic [ref=e251]:
      - generic [ref=e252]:
        - text: 가게 이름 *
        - textbox "가게 이름 *" [active] [ref=e253]:
          - /placeholder: 예) 마곡 손칼국수
      - generic [ref=e254]:
        - generic [ref=e255]:
          - text: 종류
          - textbox "종류" [ref=e256]:
            - /placeholder: 예) 한식 · 카페
        - generic [ref=e257]:
          - text: 대표 메뉴
          - textbox "대표 메뉴" [ref=e258]:
            - /placeholder: 예) 바지락 칼국수
      - generic [ref=e259]:
        - text: 주소
        - textbox "주소" [ref=e260]:
          - /placeholder: 예) 서울 강서구 …
      - generic [ref=e261]:
        - generic [ref=e262]:
          - text: 전화
          - textbox "전화" [ref=e263]:
            - /placeholder: 예) 02-000-0000
        - generic [ref=e264]:
          - text: 영업시간
          - textbox "영업시간" [ref=e265]:
            - /placeholder: 예) 11:00–21:00, 일요일 휴무
      - generic [ref=e266]:
        - text: 추천하는 이유 · 한마디
        - textbox "추천하는 이유 · 한마디" [ref=e267]:
          - /placeholder: 이 가게를 왜 소개하고 싶으신가요?
      - generic [ref=e268]:
        - text: 사진 (선택, 최대 6장)
        - button "사진 (선택, 최대 6장)" [ref=e269]
      - generic [ref=e270]:
        - text: 알려주신 분(선택)
        - textbox "알려주신 분(선택)" [ref=e271]:
          - /placeholder: 이름 또는 별명
      - generic [ref=e272]:
        - text: 비밀번호 *
        - textbox "비밀번호 *" [ref=e273]:
          - /placeholder: 나중에 직접 지울 때 쓸 비밀번호(4자 이상)
          - text: test1234
      - generic [ref=e274]:
        - button "취소" [ref=e275]
        - button "등록 제안하기" [ref=e276]
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | /**
  4   |  * 맛집 등록 기능 E2E 테스트
  5   |  *
  6   |  * 테스트 시나리오:
  7   |  * 1. 메인 페이지 로드 및 FAB 버튼 확인
  8   |  * 2. 맛집 등록 모달 열기
  9   |  * 3. 가게 정보 입력 및 등록
  10  |  * 4. 등록 성공 메시지 확인
  11  |  * 5. 등록된 가게 목록에 표시 확인
  12  |  */
  13  | 
  14  | test.describe('맛집 등록 기능', () => {
  15  | 
  16  |   test.beforeEach(async ({ page }) => {
  17  |     await page.goto('/');
  18  |     await page.waitForSelector('#submitFab');
  19  |   });
  20  | 
  21  |   // 테스트 1: 메인 페이지 로드 및 FAB 버튼 확인
  22  |   test('메인 페이지가 정상적으로 로드되고 FAB 버튼이 표시된다', async ({ page }) => {
  23  |     await expect(page).toHaveTitle(/동네 한 바퀴/);
  24  | 
  25  |     const fab = page.locator('#submitFab');
  26  |     await expect(fab).toBeVisible();
  27  |     await expect(fab).toHaveAttribute('title', '내가 아는 교회 동네 맛집 추가하기');
  28  |   });
  29  | 
  30  |   // 테스트 2: 맛집 등록 모달 열기
  31  |   test('FAB 버튼을 클릭하면 맛집 등록 모달이 열린다', async ({ page }) => {
  32  |     await page.click('#submitFab');
  33  | 
  34  |     const modal = page.locator('#submitModal');
  35  |     await expect(modal).toBeVisible();
  36  | 
  37  |     const eyebrow = modal.locator('.sm-eyebrow');
  38  |     await expect(eyebrow).toContainText('내가 아는 교회 동네 맛집 추가하기');
  39  | 
  40  |     // 폼 필드 확인
  41  |     await expect(modal.locator('input[name="store_name"]')).toBeVisible();
  42  |     await expect(modal.locator('input[name="password"]')).toBeVisible();
  43  |   });
  44  | 
  45  |   // 테스트 3: 빈 필드 검증
  46  |   test('가게 이름을 입력하지 않으면 에러 메시지를 표시한다', async ({ page }) => {
  47  |     await page.click('#submitFab');
  48  | 
  49  |     // 비밀번호만 입력하고 가게 이름은 비워둠
  50  |     await page.fill('input[name="password"]', 'test1234');
  51  | 
  52  |     await page.click('button[type="submit"]');
  53  | 
  54  |     const msgEl = page.locator('#smMsg');
  55  |     await expect(msgEl).toBeVisible();
> 56  |     await expect(msgEl).toContainText('가게 이름을 입력해 주세요');
      |                         ^ Error: expect(locator).toContainText(expected) failed
  57  |   });
  58  | 
  59  |   // 테스트 4: 비밀번호 검증
  60  |   test('비밀번호가 4 자 미만이면 에러 메시지를 표시한다', async ({ page }) => {
  61  |     await page.click('#submitFab');
  62  | 
  63  |     await page.fill('input[name="store_name"]', '테스트 가게');
  64  |     await page.fill('input[name="password"]', '123');
  65  | 
  66  |     await page.click('button[type="submit"]');
  67  | 
  68  |     const msgEl = page.locator('#smMsg');
  69  |     await expect(msgEl).toBeVisible();
  70  |     await expect(msgEl).toContainText('비밀번호');
  71  |   });
  72  | 
  73  |   // 테스트 5: 정상 등록 (API 테스트용 - 실제 Vercel 배포에서는 GitHub Issues 에 저장됨)
  74  |   test('정식 정보를 입력하면 등록 성공 메시지를 표시한다', async ({ page }) => {
  75  |     const uniqueId = Date.now();
  76  |     const storeName = `테스트 가게 ${uniqueId}`;
  77  | 
  78  |     await page.click('#submitFab');
  79  | 
  80  |     // 모든 필드 채우기
  81  |     await page.fill('input[name="store_name"]', storeName);
  82  |     await page.fill('input[name="category"]', '한식');
  83  |     await page.fill('input[name="signature"]', '테스트 메뉴');
  84  |     await page.fill('input[name="address"]', '서울 강서구 테스트동');
  85  |     await page.fill('input[name="phone"]', '02-1234-5678');
  86  |     await page.fill('input[name="hours"]', '10:00-18:00');
  87  |     await page.fill('textarea[name="reason"]', '테스트용 등록입니다');
  88  |     await page.fill('input[name="submitter"]', '테스터');
  89  |     await page.fill('input[name="password"]', 'test1234');
  90  | 
  91  |     // 등록 버튼 클릭
  92  |     await page.click('button[type="submit"]');
  93  | 
  94  |     // 성공 메시지 확인 (API 가 정상 응답하면 나타남)
  95  |     const msgEl = page.locator('#smMsg');
  96  | 
  97  |     // 두 가지 가능한 결과 중 하나:
  98  |     // 1. "소중한 추천 고맙습니다!" - 등록 성공
  99  |     // 2. "등록 중 문제가 발생했어요" - 에러 (콘솔 로그 확인 필요)
  100 |     const msgText = await msgEl.textContent();
  101 | 
  102 |     console.log('Registration result message:', msgText);
  103 | 
  104 |     // 메시지 표시 여부만 확인 (내용은 API 응답에 따라 다름)
  105 |     await expect(msgEl).toBeVisible();
  106 |   });
  107 | 
  108 |   // 테스트 6: 모달 닫기
  109 |   test('X 버튼과 취소 버튼으로 모달을 닫을 수 있다', async ({ page }) => {
  110 |     await page.click('#submitFab');
  111 |     await expect(page.locator('#submitModal')).toBeVisible();
  112 | 
  113 |     // X 버튼으로 닫기
  114 |     await page.click('.sm-x');
  115 |     await expect(page.locator('#submitModal')).not.toBeVisible();
  116 | 
  117 |     // 다시 열고 취소 버튼으로 닫기
  118 |     await page.click('#submitFab');
  119 |     await page.click('button[data-close]');
  120 |     await expect(page.locator('#submitModal')).not.toBeVisible();
  121 |   });
  122 | 
  123 | });
  124 | 
```