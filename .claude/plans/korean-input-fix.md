# 한글 입력 문제 해결 계획

## Context (근본원인 분석)

### 문제 현상
"내가 아는 맛집 추가하기" 팝업에서 가게이름 input 에 휴대폰으로 한글을 입력하면 한글이 제대로 입력되지 않음.

### 근본원인

**1. API Content-Type 헤더에 charset=utf-8 이 누락됨**

`vercel.json` 에 Response headers 설정이 없어, serverless function 에서 반환하는 `application/json` 헤더에 charset 이 명시되지 않음:
```json
// 현재 vercel.json - headers 설정 없음
{
  "version": 2,
  "builds": [...]
}
```

**2. Serverless function 의 request body encoding 설정 누락**

모든 API 파일 (`submissions.js`, `comments.js` 등) 에서 request body 를 읽을 때:
```javascript
// 현재 코드 - 인코딩 명시 안 함
let buf = '';
req.on('data', c => (buf += c));  // 기본 인코딩 사용
```

Node.js stream 을 문자열로 읽을 때 `req.setEncoding('utf8')` 를 호출하지 않으면, 이진 데이터를 기본 인코딩으로 처리할 수 있어 한글 같은 multi-byte character 가 깨짐.

**3. Vercel Functions 의 Node.js default behavior**

Vercel Node.js function 에서 `@vercel/node` 는 자동으로 body parsing 을 하지만, 직접 stream 을 읽는 경우 UTF-8 encoding 이 명시적으로 설정되어야 함.

---

## 개선 조치

### 1. vercel.json 에 headers 추가 (Response charset 명시)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Content-Type", "value": "application/json; charset=utf-8" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### 2. submissions.js 의 request body reading 수정 (Request encoding 명시)
```javascript
// 기존 코드 (line 50-55):
const body = req.body || (await new Promise((resolve, reject) => {
  let buf = '';
  req.on('data', c => (buf += c));
  req.on('end', () => resolve(JSON.parse(buf || '{}')));
  req.on('error', reject);
}));

// 수정: UTF-8 인코딩 명시
const body = req.body || (await new Promise((resolve, reject) => {
  let buf = '';
  req.setEncoding('utf8');  // <-- 추가
  req.on('data', c => (buf += c));
  req.on('end', () => resolve(JSON.parse(buf || '{}')));
  req.on('error', reject);
}));
```

### 3. 이름 변경 (요청사항 반영)
- FAB 버튼 title: "내가 아는 맛집 추가하기" → "내가 아는 교회 동네 맛집 추가하기"
- Modal header eyebrow: "내가 아는 맛집 추가하기" → "내가 아는 교회 동네 맛집 추가하기"

---

## 수정 파일 목록

1. `/home/yp/project/listen/listen-main/vercel.json` - headers 추가
2. `/home/yp/project/listen/listen-main/serverless/api/submissions.js` - `req.setEncoding('utf8')` 추가
3. `/home/yp/project/listen/listen-main/site/index.html` - 텍스트 변경 (FAB 버튼 + 모달 헤더)

---

## 검증 방법

1. **로컬 테스트**: Vercel CLI 로 local deployment 실행 후 휴대폰으로 한글 입력 확인
2. **배포 후 테스트**: 
   - https://listen-main.vercel.app 접속
   - "내가 아는 교회 동네 맛집 추가하기" FAB 버튼 클릭
   - 가게 이름 필드에 휴대폰 키보드로 한글 입력 (예: "마곡 손칼국수")
   - 나머지 필드 채워 등록
   - 제출된 데이터가 정상적으로 저장되고 표시되는지 확인

---

## 참고: 유사 API 동시 수정 권장

`comments.js`, `reports.js`, `favorites.js` 도 동일한 request body parsing 패턴을 사용하므로, 향후 한글 입력 문제를 예방하기 위해 같은 수정을 적용하는 것이 좋음.
