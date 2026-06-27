# 성도 후기 이미지 추가 기능 구현 계획

## Context

### 요청사항
1. 각 상점 홈페이지의 성도 후기 입력 칸에 이미지 업로드 기능 추가
2. 이미지 용량 제한 검토 및 적용
3. 메인 홈페이지의 각 상점 대표 이미지를 "우리 가게 한 장면" 첫 번째 이미지로도 포함

### 현재 상태
- **성도 후기 (댓글)**: 텍스트만 입력 가능 (이미지 업로드 없음)
- **메인 카드**: `main_image` 만 표시, gallery 이미지는 별도 섹션으로만 표시

---

## 구현 내용

### 1. 성도 후기 이미지 추가 기능

#### 용량 제한 설정
- **최대 파일 크기**: 2MB (이전 맛집 추천의 4MB 보다 낮게 - 댓글은 보조 정보이므로)
- **최대 이미지 수**: 3 장까지
- **허용 포맷**: image/* (브라우저 기본 필터)

#### 수정 파일

**A. `site/store.html` - UI 추가**
```html
<!-- 기존 textarea 아래에 추가 -->
<label class="cf-upload">
  첨부 사진 (선택, 최대 3 장, 각 2MB 까지)
  <input type="file" id="c_photos" accept="image/*" multiple />
  <div class="cf-preview" id="cPreview"></div>
</label>
```

**B. `site/js/store.js` - 클라이언트 로직 추가**
- 사진 선택 핸들러 (preview 표시)
- FormData 에 이미지 포함하여 전송
- 댓글 목록에 이미지 표시
- 수정/삭제 시에도 이미지 처리

**C. `serverless/api/comments.js` - 서버 API 수정**
- 이미지 업로드 처리
- GitHub Issues 에는 텍스트만 저장, 이미지는 별도 경유 저장 (이미지 폴더 구조 사용)
- GET 응답에 이미지 URL 포함

**D. `serverless/api/db.js` - DB 레이어 확장**
- 댓글 이미지 저장/조회 함수 추가
- Image storage operations 활용

### 2. 메인 카드 대표 이미지 변경

#### 수정 파일: `site/js/app.js`

**현재 코드 (line 107-108)**:
```javascript
media = `<img loading="lazy" src="${s.main_image}" alt="${s.name}" />`;
```

**수정 후**:
```javascript
// gallery 의 첫 번째 이미지를 "우리 가게 한 장면" 으로 사용
const firstGalleryImg = (s.gallery && s.gallery.length > 0) ? s.gallery[0] : s.main_image;
media = `<img loading="lazy" src="${firstGalleryImg}" alt="${s.name}" />`;
```

---

## 검증 방법

1. **성도 후기 이미지 업로드**
   - 상점 상세 페이지로 이동
   - 후기 입력란 아래 사진 첨부 버튼으로 이미지 선택 (최대 3 장)
   - 각 이미지 2MB 초과 시 경고 메시지 표시
   - 등록 후 댓글 목록에 이미지가 함께 표시되는지 확인

2. **메인 카드 대표 이미지**
   - 메인 페이지로 이동
   - gallery 가 있는 가게 카드의 대표 이미지가 "우리 가게 한 장면" 첫 번째 이미지인지 확인

---

## 참고: 기존 맛집 추천 기능과의 차이점

| 항목 | 맛집 추천 (submit.js) | 성도 후기 (store.js) |
|------|----------------------|---------------------|
| 최대 이미지 수 | 6 장 | 3 장 |
| 최대 파일 크기 | 4MB | 2MB |
| 목적 | 가게 등록 제안 | 방문 후기 공유 |
