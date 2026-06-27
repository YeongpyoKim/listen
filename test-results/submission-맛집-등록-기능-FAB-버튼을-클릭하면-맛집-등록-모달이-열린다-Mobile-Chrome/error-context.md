# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submission.spec.js >> 맛집 등록 기능 >> FAB 버튼을 클릭하면 맛집 등록 모달이 열린다
- Location: tests/e2e/submission.spec.js:31:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#submitModal').locator('.sm-eyebrow')
Expected substring: "내가 아는 교회 동네 맛집 추가하기"
Received string:    "내가 아는 맛집 추가하기"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#submitModal').locator('.sm-eyebrow')
    14 × locator resolved to <div class="sm-eyebrow">내가 아는 맛집 추가하기</div>
       - unexpected value "내가 아는 맛집 추가하기"

```

```yaml
- text: 내가 아는 맛집 추가하기
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
> 38  |     await expect(eyebrow).toContainText('내가 아는 교회 동네 맛집 추가하기');
      |                           ^ Error: expect(locator).toContainText(expected) failed
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
  56  |     await expect(msgEl).toContainText('가게 이름을 입력해 주세요');
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