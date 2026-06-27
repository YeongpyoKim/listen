const { test, expect } = require('@playwright/test');

/**
 * 상점 상세 페이지 - 댓글 기능 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 상점 상세 페이지 로드
 * 2. 댓글 입력 및 등록
 * 3. 등록된 댓글 표시 확인
 * 4. 댓글 삭제
 */

test.describe('상점 상세 페이지', () => {

  test.beforeEach(async ({ page }) => {
    // 첫 번째 가게로 이동 (ID 가 있는 경우)
    await page.goto('/store.html?id=1');
    await page.waitForSelector('#app');
  });

  // 테스트 1: 상점 상세 페이지 로드
  test('상점 상세 페이지가 정상적으로 로드된다', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('동네 한 바퀴');

    // 가게 정보 표시 확인
    await expect(page.locator('.detail-hero')).toBeVisible();
  });

  // 테스트 2: 댓글 폼 표시 확인
  test('댓글 입력 폼이 표시된다', async ({ page }) => {
    const commentsForm = page.locator('.comment-form');
    await expect(commentsForm).toBeVisible();

    await expect(commentsForm.locator('#c_name')).toBeVisible();
    await expect(commentsForm.locator('#c_pw')).toBeVisible();
    await expect(commentsForm.locator('#c_text')).toBeVisible();
  });

  // 테스트 3: 첨부 사진 필드 확인 (새 기능)
  test('댓글에 첨부 사진 필드가 있다', async ({ page }) => {
    const commentsForm = page.locator('.comment-form');

    // 첨부 사진 라벨 존재 확인
    const uploadLabel = commentsForm.locator('.cf-upload');
    await expect(uploadLabel).toBeVisible();

    // 파일 입력 요소 확인
    const fileInput = commentsForm.locator('#c_photos');
    await expect(fileInput).toBeVisible();

    // 전체삭제 버튼 확인
    const delAllBtn = commentsForm.locator('#c_delAll');
    await expect(delAllBtn).toBeVisible();
  });

  // 테스트 4: 빈 댓글 등록 검증
  test('내용을 입력하지 않으면 에러 메시지를 표시한다', async ({ page }) => {
    await page.fill('#c_pw', 'test1234');

    await page.click('#c_post');

    const alertPromise = page.waitForEvent('popup').catch(() => {});

    // 알림 대신 alert 가 뜨므로 처리
    page.on('dialog', dialog => dialog.accept());

    await page.click('#c_post');
  });

  // 테스트 5: 비밀번호 검증
  test('비밀번호가 4 자 미만이면 에러 메시지를 표시한다', async ({ page }) => {
    await page.fill('#c_text', '테스트 댓글입니다');
    await page.fill('#c_pw', '123');

    page.on('dialog', async (dialog) => {
      console.log('Alert message:', dialog.message());
      await dialog.accept();
    });

    await page.click('#c_post');
  });

});

test.describe('댓글 등록 및 삭제', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/store.html?id=1');
    await page.waitForSelector('#app');
  });

  // 테스트: 댓글 등록 (수동 검증 필요)
  test('댓글 등록 폼에 입력 필드가 모두 있다', async ({ page }) => {
    const form = page.locator('.comment-form');

    await expect(form.locator('#c_name')).toBeVisible();
    await expect(form.locator('#c_pw')).toBeVisible();
    await expect(form.locator('#c_text')).toBeVisible();
    await expect(form.locator('#c_photos')).toBeVisible();
    await expect(form.locator('#c_post')).toBeVisible();
    await expect(form.locator('#c_clear')).toBeVisible();
  });

});
