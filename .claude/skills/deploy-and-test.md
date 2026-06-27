# 배포 및 테스트 워크플로우 (Deploy & Test Workflow)

## 개요

로컬 코드 변경 → GitHub 자동 푸시 → Vercel 자동 배포 → 소프트웨어 검증까지의 전체 프로세스를 관리하는 스킬입니다.

---

## 1️⃣ 로컬에서 코드 변경 후 배포

### 단계별 워크플로우

```bash
# 1. 변경 사항 확인
git status

# 2. 변경사항 커밋 (예시)
git add -A
git commit -m "feat: 변경 내용 요약"

# 3. 원격 동기화 및 푸시 (이 스킬 실행)
/deploy-push
```

### `/deploy-push` 스킬 명령어

로컬 변경 사항을 GitHub 에 자동으로 푸시합니다:

1. `gh auth status` - 인증 상태 확인
2. `git pull origin main --rebase` - 원격 동기화
3. `git push origin main` - GitHub 푸시

---

## 2️⃣ Vercel 자동 배포 확인

GitHub 에 푸시되면 Vercel 이 자동으로 배포를 시작합니다.

### 배포 상태 확인 링크

| 항목 | URL |
|------|-----|
| **Vercel Deployments** | https://vercel.com/YeongpyoKim/listen/deployments |
| **GitHub Actions 로그** | https://github.com/YeongpyoKim/listen/actions |

### 배포 상태 체크 (수동)

```bash
# 최신 GitHub Action 실행 상태 확인
gh api repos/YeongpyoKim/listen/actions/runs -q '.workflow_runs[0] | {status: .status, conclusion: .conclusion}'
```

---

## 3️⃣ 소프트웨어 테스트 검증 체크리스트

배포 완료 후 다음 항목들을 순서대로 검증합니다.

### 📋 기본 기능 검증

| # | 항목 | 확인 방법 | 상태 |
|---|------|----------|------|
| 1 | 메인 페이지 로드 | https://listen-main.vercel.app 접속 | ☐ |
| 2 | 상점 카드 표시 | 모든 가게 카드가 정상적으로 보이는지 | ☐ |
| 3 | 검색 기능 | 가게 이름/메뉴 검색 테스트 | ☐ |
| 4 | 필터 기능 | 카테고리별 필터 동작 확인 | ☐ |

### 📋 성도 후기 이미지 업로드 검증

| # | 항목 | 확인 방법 | 상태 |
|---|------|----------|------|
| 1 | 상세 페이지 진입 | 카드 클릭 시 상점 상세 페이지로 이동 | ☐ |
| 2 | 후기 입력란 표시 | 댓글 폼에 "첨부 사진" 필드 존재 확인 | ☐ |
| 3 | 이미지 업로드 | 사진 선택 → 미리보기 표시 | ☐ |
| 4 | 용량 제한 | 2MB 초과 파일 경고 메시지 확인 | ☐ |
| 5 | 개수 제한 | 3 장 이상 선택 시 제한 동작 확인 | ☐ |
| 6 | 등록 테스트 | 이미지 포함 후기 등록 성공 | ☐ |
| 7 | 목록 표시 | 등록된 후기에 사진 함께 표시 | ☐ |
| 8 | lightbox 확대 | 사진 클릭 시 확대되는지 확인 | ☐ |

### 📋 한글 입력 검증 (모바일)

| # | 항목 | 확인 방법 | 상태 |
|---|------|----------|------|
| 1 | 휴대폰 접속 | 모바일 브라우저 또는 디바이스 모달 | ☐ |
| 2 | 가게 이름 입력 | 한글 키보드로 가게 이름 입력 | ☐ |
| 3 | 후기 내용 입력 | 한글 키보드로 후기 본문 입력 | ☐ |
| 4 | 등록 후 확인 | 저장된 데이터가 깨지지 않았는지 검증 | ☐ |

### 📋 메인 카드 대표 이미지 검증

| # | 항목 | 확인 방법 | 상태 |
|---|------|----------|------|
| 1 | gallery 있는 가게 | "우리 가게 한 장면" 섹션이 있는 상점 찾기 | ☐ |
| 2 | 대표 이미지 일치 | 메인 카드 이미지가 gallery 첫 번째 사진과 동일한지 | ☐ |

### 📋 기타 기능 검증

| # | 항목 | 확인 방법 | 상태 |
|---|------|----------|------|
| 1 | 맛집 추가하기 FAB | "내가 아는 교회 동네 맛집 추가하기" 텍스트 확인 | ☐ |
| 2 | 맛집 등록 팝업 | 가게 이름 한글 입력 테스트 | ☐ |
| 3 | 정보 제보하기 FAB | "변경된 정보 제보하기" 링크 동작 | ☐ |
| 4 | 챗봇 대화 | "동네 길잡이에게 물어보기" 챗봇 응답 확인 | ☐ |

---

## 4️⃣ 자동화 스크립트

### 전체 배포 및 검증 프로세스

```bash
#!/bin/bash
# deploy-and-verify.sh

echo "📝 변경 사항 커밋..."
git add -A
git commit -m "$1"

echo "🔄 GitHub 동기화 및 푸시..."
git pull origin main --rebase
git push origin main

echo "⏳ 30 초 대기 (배포 시작)..."
sleep 30

echo "🔍 배포 상태 확인..."
gh api repos/YeongpyoKim/listen/actions/runs -q '.workflow_runs[0] | {status: .status, conclusion: .conclusion}'

echo ""
echo "✅ 배포 완료! 다음 링크에서 확인하세요:"
echo "   Vercel: https://vercel.com/YeongpyoKim/listen/deployments"
```

### 사용법

```bash
chmod +x deploy-and-verify.sh
./deploy-and-verify.sh "feat: 새로운 기능 추가"
```

---

## 5️⃣ 문제 해결 (Troubleshooting)

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| `gh auth status` 실패 | GitHub 인증 만료 | `gh auth login -h github.com` |
| 푸시 거부 (fetch first) | 원격 변경사항 존재 | `git pull origin main --rebase` 후 재시도 |
| Vercel 배포 안 됨 | GitHub webhook 문제 | Vercel 대시보드 → Settings → Git 에서 수동 트리거 |
| 한글 깨짐 | UTF-8 인코딩 누락 | `vercel.json`, API 파일의 인코딩 설정 확인 |

---

## 6️⃣ 자주 쓰는 명령어 모음

```bash
# 인증 상태
gh auth status

# 변경사항 확인
git status
git diff

# 커밋 및 푸시
git add -A && git commit -m "메모" && git push origin main

# 원격 동기화 후 푸시
git pull origin main --rebase && git push origin main

# 최신 배포 상태
gh api repos/YeongpyoKim/listen/actions/runs -q '.workflow_runs[0].status'

# PR 생성 (필요 시)
gh pr create --title "제목" --body "내용"
```

---

## 7️⃣ 네이버 지도 메뉴 수집 (Playwright)

네이버 지도 점포 페이지에서 메뉴명·가격·「대표」뱃지를 Playwright 로 수집해 각 점포 상세 페이지 `menu_items` 를 보강합니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `fetch_naver_menus.py` | Playwright 로 전 점포 메뉴 스크래핑 |
| `site/data/naver_menus.json` | 수집 결과 (점포명 → items 배열) |
| `build_site.py` | 네이버 메뉴 우선 병합, 없으면 `signature` 파싱 fallback |
| `site/js/store.js` | 메뉴 카드·「대표」뱃지 렌더링 |
| `site/css/styles.css` | `.menu-card`, `.menu-card-badge` 스타일 |
| `상점 리스트.xlsx` B열 | 네이버 URL (naver.me 하이퍼링크) |

### 사전 준비

```bash
pip install playwright openpyxl
playwright install chromium
```

### 수집 → 빌드 워크플로우

```bash
# 1. 네이버 메뉴 전 점포 수집 (~1.5분, 20개 기준)
python3 fetch_naver_menus.py

# 2. stores.json 재생성 (naver_menus 우선 반영)
python3 build_site.py

# 3. 커밋·푸시·배포 (아래 1️⃣ 참고)
git add fetch_naver_menus.py site/data/naver_menus.json build_site.py site/data/stores.json
git commit -m "feat: 네이버 지도 메뉴 Playwright 수집 및 점포 페이지 반영"
git push origin main
```

### 스크래핑 동작 요약

1. 엑셀 B열 `naver.me` URL → Playwright 로 이동 → 리다이렉트 URL 에서 `place_id` 추출
2. 메뉴 URL 순서 시도: `restaurant` → `cafe` → `place`  
   `https://pcmap.place.naver.com/{biz}/{place_id}/menu/list`
3. DOM: `.place_section_content li` — 첫 줄 「대표/인기」뱃지, 메뉴명(첫 줄), 마지막 줄 가격
4. 필터: 가격 `\d{1,3}(,\d{3})*원` 필수, 이름 55자 이하, 「동영상」「다이닝코드」 등 노이즈 제외

### fallback

| 상황 | 동작 |
|------|------|
| 네이버 URL 없음 | `signature` 필드 쉼표 분리 → `menu_items` |
| 메뉴 탭 없음 / DOM 불일치 | 동일하게 `signature` fallback |
| 메뉴 이미지 폴더 | `{점포폴더}/메뉴*.jpg` → `menu_images` (빌드 시 별도 처리) |

### 수집 결과 참고 (2026-06-28 기준)

- **15/20** 점포 메뉴 수집 성공
- fallback 5개: 맛대로촌닭, 마라홍 마라탕, 빵굼터, 금수저 아구찜, 마곡명인 도너츠 꽈배기

### 📋 메뉴 카드 검증 체크리스트

| # | 항목 | 확인 방법 | 상태 |
|---|------|----------|------|
| 1 | 메뉴 카드 표시 | 상세 페이지 「메뉴」 섹션에 이름·가격 카드 | ☐ |
| 2 | 대표 뱃지 | 「대표」 메뉴에 금색 뱃지 표시 | ☐ |
| 3 | 네이버 연동 점포 | 양천칼국수·집애김밥 등 개별 가격(예: 9,000원) | ☐ |
| 4 | fallback 점포 | 수집 실패 점포는 시그니처 기반 메뉴명 유지 | ☐ |
| 5 | 메뉴판 이미지 | `메뉴.jpg` 등 `menu_images` 갤러리 표시 | ☐ |
| 6 | 재수집 | `fetch_naver_menus.py` 재실행 후 `build_site.py` → 배포 | ☐ |

### 문제 해결

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| `python` not found | python3 만 설치됨 | `python3 fetch_naver_menus.py` 사용 |
| 0 menus 전부 | Playwright 미설치 | `playwright install chromium` |
| place_id 추출 실패 | naver.me 만료·URL 변경 | 엑셀 B열 URL 갱신 |
| 메뉴명이 설명과 붙음 | 네이버 DOM 다중 줄 | 스크립트는 첫 줄만 이름으로 사용 |
| 동영상 등 노이즈 | 가격 없는 li | 가격 필수 필터로 제외됨 |

---

## 📌 메모

- Vercel 자동 배포: GitHub main 브랜치 푸시 후 보통 1-2 분 소요
- 검증 체크리스트는 배포 완료 후 반드시 수행
- 문제 발생 시 GitHub Actions 로그에서 상세 오류 확인
