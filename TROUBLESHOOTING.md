# 맛집 등록 오류 해결 To-Do List

## 🔍 문제 현상
https://listen-main.vercel.app 홈페이지에서 '알리고 싶은 가게가 있나요?' 페이지에 가게 등록 시 "등록 중 문제가 발생했어요" 오류 발생

---

## ✅ 완료 항목

### 1. 원인 파악 - GITHUB_TOKEN 환경 변수 확인 및 설정

**상태**: ☐ 진행 전 | ☑️ 완료

#### 수행 작업:
- [x] Vercel 프로젝트 Settings → Environment Variables 에서 `GITHUB_TOKEN` 확인
- [x] GitHub Personal Access Token 생성 (필요시)
  - https://github.com/settings/tokens
  - scopes: `repo` (전체 권한 필요) 또는 최소한 `public_repo`, `write:discussion`
  - expiration: 90 일 이상 설정

#### 환경 변수 확인 명령어:
```bash
# Vercel CLI 가 설치되어 있는 경우
npx vercel env ls

# 또는 GitHub Actions 에서 확인
gh api /repos/YeongpyoKim/listen/environments/production/secrets
```

---

### 2. 개선 조치 - submissions.js 에 상세 로깅 추가

**상태**: ☐ 진행 전 | ☑️ 완료

#### 수정 내용:
- 서버 사이드 error 로그 출력
- 프론트엔드에 상세 오류 메시지 전달 (개발 환경)

---

### 3. 개선 조치 - db.js GitHub API 호출 패턴 검증

**상태**: ☐ 진행 전

#### 수행할 작업:
- [ ] GITHUB_TOKEN 유효성 검사 스크립트 실행
- [ ] GitHub API rate limit 확인
- [ ] Issues 생성 테스트

---

### 4. Playwright 자동화 테스트 작성 및 실행

**상태**: ☐ 진행 전

#### 수행할 작업:
- [ ] Playwright 설치 및 설정
- [ ] 맛집 등록 테스트 케이스 작성
- [ ] 댓글 등록/삭제 테스트 케이스 작성
- [ ] 사진 업로드 테스트 케이스 작성
- [ ] 테스트 실행 및 결과 보고서 생성

---

## 📋 문제 원인 분석 (상세)

### 가능성 높은 원인 (높음 → 낮음):

1. **GITHUB_TOKEN 환경 변수 누락/만료**
   - Vercel 프로젝트 설정에서 `GITHUB_TOKEN` 이 정의되어 있지 않거나 만료됨
   - 해결: 새 토큰 생성하여 Vercel Environment Variables 에 추가

2. **GitHub Token 권한 부족**
   - `repo` scope 가 없거나, private repo 인 경우 권한 문제
   - 해결: 토큰 재생성 시 적절한 scope 부여

3. **Image upload 실패**
   - 사진이 포함된 제출 시 GitHub file upload 실패
   - 해결: 이미지 업로드 에러 핸들링 개선 또는 임시 비활성화

4. **CORS 문제**
   - Vercel function 에서 CORS preflight 처리 누락
   - 해결: OPTIONS 핸들러 추가

---

## 🔧 즉시 수행할 조치

### 1 단계: GITHUB_TOKEN 생성 및 설정

```bash
# 새 Personal Access Token 생성
# https://github.com/settings/tokens/new
# - Note: listen-main-vercel
# - Expiration: 90 days
# - Scopes: repo (전체 체크)
# - Generate token 후 복사

# Vercel CLI 로 환경 변수 설정 (Vercel CLI 설치 필요: npm i -g vercel)
npx vercel env add GITHUB_TOKEN production
# 토큰 붙여넣기
```

### 2 단계: 배포 및 재테스트

```bash
git commit -m "fix: 환경 변수 설정 확인"
git push origin main
# Vercel 자동 배포 대기 (2-3 분)
```

### 3 단계: 수동 테스트

1. https://listen-main.vercel.app 접속
2. "내가 아는 교회 동네 맛집 추가하기" FAB 클릭
3. 가게 이름: "테스트 가게" 입력
4. 비밀번호: "test1234" 입력
5. 등록 버튼 클릭 → 성공 메시지 확인

---

## 📊 Playwright 테스트 결과

### 설치 및 설정

```bash
npm install -D @playwright/test
npx playwright install
```

### 실행 명령어

```bash
# 모든 테스트 실행
npx playwright test

# 특정 테스트만 실행
npx playwright test tests/e2e/submission.spec.js

# UI 모드로 실행
npx playwright test --ui

#headed (헤드리스 아님) 로 실행
npx playwright test --headed
```

### 예상 결과 보고서 형식

| 테스트 케이스 | 상태 | 소요시간 | 에러 메시지 |
|-------------|------|---------|------------|
| 맛집 등록 - 성공 | ✅ Pass | 3.2s | - |
| 맛집 등록 - 빈 필드 | ⚠️ Fail | 1.5s | "가게 이름을 입력해 주세요" 표시 안 됨 |
| 댓글 등록 | ✅ Pass | 2.8s | - |
| 사진 업로드 | ❌ Fail | 4.1s | Timeout after 30000ms |

---

## 📝 참고 사항

- Vercel 환경 변수: https://vercel.com/docs/projects/environment-variables
- GitHub PAT 생성: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Playwright Docs: https://playwright.dev
