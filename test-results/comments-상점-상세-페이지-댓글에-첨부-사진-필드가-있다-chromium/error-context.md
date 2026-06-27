# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comments.spec.js >> 상점 상세 페이지 >> 댓글에 첨부 사진 필드가 있다
- Location: tests/e2e/comments.spec.js:41:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.comment-form').locator('.cf-upload')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.comment-form').locator('.cf-upload')

```

```yaml
- link "← 동네 한 바퀴로 돌아가기":
  - /url: index.html
- text: 은혜 한 바구니
- banner:
  - text: 치킨집
  - heading "🍗 맛대로촌닭" [level=1]
  - text: 찜닭 한 솥에 담긴, 고향을 향한 마음
- text: "🕊️ 주일에 문을 엽니다 다가오는 주일(6월 28일(일)): 영업 ✅ 연중무휴 · 주일에도 따뜻하게 문을 엽니다. Story"
- paragraph: 32년을 한자리에서 지켜온 맛대로촌닭은 그저 닭요리집이 아닙니다. 사장님은 닭을 통해 남과 북이 함께하는 날을 소망해 왔고, 그 삶의 철학이 담긴 이야기와 손맛을 찜닭 한 그릇에 담아 전합니다. 찜닭을 다 먹은 자리에서 밥을 볶아 한 끼를 완성하는 정성은, 이 집이 전하고 싶은 환대의 방식입니다. 항상 성실하게 와이셔츠에 넥타이를 매고 손님을 맞이하시며 직접 배달까지 가시는 사장님의 따뜻한 마음이 돋보이는 곳입니다. 지나가는 행인들을 위한 무료 식수 제공과 같은 작은 배려들, 이웃과 더불어 사는 삶에 대한 따뜻한 마음이 담긴 곳입니다. 넉넉한 한 상과 따뜻한 이웃의 마음을 느껴보세요.
- button "🤍 0"
- link "📍 네이버 지도에서 보기":
  - /url: https://naver.me/5B0Ti39n
- button "💬 이 가게, 챗봇에게 물어보기"
- text: 우리 가게 한 장면
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- img "맛대로촌닭"
- text: 이웃들이 남긴 따뜻한 한마디
- paragraph: 이 가게에 대한 작은 후기를 나눠 주세요. 로그인은 없지만, 나중에 직접 수정하거나 지울 수 있도록 비밀번호를 함께 적어 주세요.
- text: 김 2026. 6. 27. 오전 11:58:01 · 수정됨 11
- button "수정"
- button "삭제"
- textbox "이름(선택)"
- textbox "비밀번호(수정·삭제용, 4자 이상)"
- textbox "따뜻한 한마디를 남겨 보세요"
- button "남기기"
- button "지우기"
- text: 정확히 알고 가요 ⭐ 대표 · 시그니처 메뉴 어머나촌닭떡볶이, 평양칠향계 💳 평균 가격대 12,000~25,000 🕒 영업시간 · 정기휴무 12시~24시, 연중무휴 🪑 좌석 형태 4인 8개, 단체석 가능 🍼 아기의자 있음 🚗 주차 가게 앞 2대, 아름드리 주차장 📍 주소 서울 강서구 방화동 일대 📜 가게의 역사 32년 💡 100% 즐기는 팁 평양칠향계 찜닭을 먹고 볶음밥을 꼭 볶아먹어야 진정한 맛을 알 수 있습니다. 음식을 통해 남북이 하나되는 소망이 진심인 사장님, 항상 양복으로 배달 가시는, 동네 사람들에게 배푸는 생수와 환대. ✨ 이 집만의 매력 찜닭과 치킨을 같이 먹을 수 있다는 장점, 북한에 대한 사장님의 마음을 느낄 수 있는 지역사회를 섬기는 멋진 곳
- contentinfo: 동네 한 바퀴, 은혜 한 바구니 표시된 정보는 변동될 수 있어요. 특히 주일 방문 전, 안내된 휴무 정보를 꼭 확인해 주세요.
- button "💬"
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | /**
  4   |  * 상점 상세 페이지 - 댓글 기능 E2E 테스트
  5   |  *
  6   |  * 테스트 시나리오:
  7   |  * 1. 상점 상세 페이지 로드
  8   |  * 2. 댓글 입력 및 등록
  9   |  * 3. 등록된 댓글 표시 확인
  10  |  * 4. 댓글 삭제
  11  |  */
  12  | 
  13  | test.describe('상점 상세 페이지', () => {
  14  | 
  15  |   test.beforeEach(async ({ page }) => {
  16  |     // 첫 번째 가게로 이동 (ID 가 있는 경우)
  17  |     await page.goto('/store.html?id=1');
  18  |     await page.waitForSelector('#app');
  19  |   });
  20  | 
  21  |   // 테스트 1: 상점 상세 페이지 로드
  22  |   test('상점 상세 페이지가 정상적으로 로드된다', async ({ page }) => {
  23  |     const title = await page.title();
  24  |     expect(title).toContain('동네 한 바퀴');
  25  | 
  26  |     // 가게 정보 표시 확인
  27  |     await expect(page.locator('.detail-hero')).toBeVisible();
  28  |   });
  29  | 
  30  |   // 테스트 2: 댓글 폼 표시 확인
  31  |   test('댓글 입력 폼이 표시된다', async ({ page }) => {
  32  |     const commentsForm = page.locator('.comment-form');
  33  |     await expect(commentsForm).toBeVisible();
  34  | 
  35  |     await expect(commentsForm.locator('#c_name')).toBeVisible();
  36  |     await expect(commentsForm.locator('#c_pw')).toBeVisible();
  37  |     await expect(commentsForm.locator('#c_text')).toBeVisible();
  38  |   });
  39  | 
  40  |   // 테스트 3: 첨부 사진 필드 확인 (새 기능)
  41  |   test('댓글에 첨부 사진 필드가 있다', async ({ page }) => {
  42  |     const commentsForm = page.locator('.comment-form');
  43  | 
  44  |     // 첨부 사진 라벨 존재 확인
  45  |     const uploadLabel = commentsForm.locator('.cf-upload');
> 46  |     await expect(uploadLabel).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  47  | 
  48  |     // 파일 입력 요소 확인
  49  |     const fileInput = commentsForm.locator('#c_photos');
  50  |     await expect(fileInput).toBeVisible();
  51  |   });
  52  | 
  53  |   // 테스트 4: 빈 댓글 등록 검증
  54  |   test('내용을 입력하지 않으면 에러 메시지를 표시한다', async ({ page }) => {
  55  |     await page.fill('#c_pw', 'test1234');
  56  | 
  57  |     await page.click('#c_post');
  58  | 
  59  |     const alertPromise = page.waitForEvent('popup').catch(() => {});
  60  | 
  61  |     // 알림 대신 alert 가 뜨므로 처리
  62  |     page.on('dialog', dialog => dialog.accept());
  63  | 
  64  |     await page.click('#c_post');
  65  |   });
  66  | 
  67  |   // 테스트 5: 비밀번호 검증
  68  |   test('비밀번호가 4 자 미만이면 에러 메시지를 표시한다', async ({ page }) => {
  69  |     await page.fill('#c_text', '테스트 댓글입니다');
  70  |     await page.fill('#c_pw', '123');
  71  | 
  72  |     page.on('dialog', async (dialog) => {
  73  |       console.log('Alert message:', dialog.message());
  74  |       await dialog.accept();
  75  |     });
  76  | 
  77  |     await page.click('#c_post');
  78  |   });
  79  | 
  80  | });
  81  | 
  82  | test.describe('댓글 등록 및 삭제', () => {
  83  | 
  84  |   test.beforeEach(async ({ page }) => {
  85  |     await page.goto('/store.html?id=1');
  86  |     await page.waitForSelector('#app');
  87  |   });
  88  | 
  89  |   // 테스트: 댓글 등록 (수동 검증 필요)
  90  |   test('댓글 등록 폼에 입력 필드가 모두 있다', async ({ page }) => {
  91  |     const form = page.locator('.comment-form');
  92  | 
  93  |     await expect(form.locator('#c_name')).toBeVisible();
  94  |     await expect(form.locator('#c_pw')).toBeVisible();
  95  |     await expect(form.locator('#c_text')).toBeVisible();
  96  |     await expect(form.locator('#c_photos')).toBeVisible();
  97  |     await expect(form.locator('#c_post')).toBeVisible();
  98  |     await expect(form.locator('#c_clear')).toBeVisible();
  99  |   });
  100 | 
  101 | });
  102 | 
```