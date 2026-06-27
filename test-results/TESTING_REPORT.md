# Software Testing Report - 맛집 등록 기능 검증

## Test Date
2026-06-27

## Environment
- **URL**: https://listen-main.vercel.app
- **Browser**: Playwright Chromium (Desktop + Mobile)
- **Test Framework**: Playwright 1.61.1

---

## Test Summary

| Total Tests | Passed | Failed | Pass Rate |
|-------------|--------|--------|-----------|
| 12 | 7 | 5 | 58% |

---

## Test Results Detail

### ✅ Passed Tests (7)

| # | Test Case | Duration |
|---|-----------|----------|
| 1 | 비밀번호가 4 자 미만이면 에러 메시지를 표시한다 (맛집 등록) | 2.1s |
| 2 | 댓글 입력 폼이 표시된다 | 3.0s |
| 3 | 정식 정보를 입력하면 등록 성공 메시지를 표시한다 | 1.7s |
| 4 | 상점 상세 페이지가 정상적으로 로드된다 | 3.9s |
| 5 | 내용을 입력하지 않으면 에러 메시지를 표시한다 (댓글) | 6.1s |
| 6 | X 버튼과 취소 버튼으로 모달을 닫을 수 있다 | 1.9s |
| 7 | 비밀번호가 4 자 미만이면 에러 메시지를 표시한다 (댓글) | 4.9s |

### ❌ Failed Tests (5)

| # | Test Case | Error | Root Cause |
|---|-----------|-------|------------|
| 1 | 댓글에 첨부 사진 필드가 있다 | `.cf-upload` element not found | **배포된 코드가 로컬과 다름** - store.js 이미지 업로드 UI 미적용 |
| 2 | 댓글 등록 폼에 입력 필드가 모두 있다 | `#c_photos` element not found | **배포된 코드가 로컬과 다름** |
| 3 | 메인 페이지가 정상적으로 로드되고 FAB 버튼이 표시된다 | `#submitFab` not found | 텍스트 변경 전 버전 배포됨 |
| 4 | FAB 버튼을 클릭하면 맛집 등록 모달이 열린다 | `.sm-eyebrow` text mismatch | "내가 아는 교회 동네 맛집 추가하기" 대신 기존 텍스트 |
| 5 | 가게 이름을 입력하지 않으면 에러 메시지를 표시한다 | `#smMsg` empty string | Validation 메시지 로직 문제 |

---

## Root Cause Analysis

### 1. 배포된 코드가 로컬 코드와 불일치
**원인**: Vercel 자동 배포가 지연되거나 실패했을 수 있음  
**해결**: GitHub push 후 Vercel 대시보드에서 배포 상태 확인 필요

### 2. 맛집 등록 모달 validation 메시지 표시 문제
**원인**: submit.js 의 msg() 함수가 제대로 호출되지 않음  
**해결**: 에러 로깅 추가 완료 - 다음 배포에서 검증 예정

---

## API Verification Results

### Direct API Test (curl)
```bash
# GET /api/submissions
Response: {"submissions":[]} ✅

# POST /api/submissions (new restaurant)
Response: {"ok":true,"submission":{...}} ✅
```

**결론**: 서버 사이드 API 는 정상 동작함. 문제는 프론트엔드 코드 또는 배포 상태임.

---

## Recommendations

### Immediate Actions
1. **Vercel 배포 확인**: https://vercel.com/YeongpyoKim/listen/deployments
2. **최신 코드 동기화**: GitHub Actions 로그에서 최신 배포 상태 확인
3. **브라우저 캐시 정리**: 테스트 시 hard reload (Ctrl+Shift+R)

### Follow-up Tests
1. Vercel 배포 완료 후 재테스트
2. 휴대폰 한글 입력 검증 (수동 테스트)
3. 이미지 업로드 기능 검증

---

## Files Modified

| File | Change |
|------|--------|
| `site/js/submit.js` | 상세 에러 로깅 추가 |
| `serverless/api/comments.js` | 이미지 업로드 지원, UTF-8 인코딩 |
| `serverless/api/db.js` | 댓글 사진 저장 support |
| `site/js/store.js` | 댓글 이미지 업로드 UI 추가 |
| `site/css/styles.css` | 댓글 사진 스타일 추가 |
| `site/index.html` | 텍스트 변경 ("교회 동네 맛집") |
| `site/js/app.js` | 메인 카드 대표 이미지 변경 |

---

## Next Steps

1. Vercel 배포 완료 대기 (2-3 분)
2. 재테스트 실행: `npm run test`
3. 수동 검증: https://listen-main.vercel.app 직접 접속 테스트
4. 모든 테스트 통과 시 GitHub merge
