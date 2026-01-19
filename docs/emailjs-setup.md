# EmailJS 피드백 서비스 설정 가이드

이 문서는 EmailJS를 사용하여 피드백 폼에서 이메일을 받을 수 있도록 설정하는 방법을 안내합니다.

## 1. EmailJS 계정 생성

1. [EmailJS 웹사이트](https://www.emailjs.com/)에 접속
2. "Sign Up" 버튼을 클릭하여 무료 계정 생성
3. 이메일 인증 완료

## 2. 이메일 서비스 연결 (Gmail 설정)

### 2.1 EmailJS에서 Gmail 서비스 추가

1. EmailJS 대시보드에 로그인: https://dashboard.emailjs.com/
2. 왼쪽 메뉴에서 **"Email Services"** 클릭
3. **"Add New Service"** 버튼 클릭
4. 서비스 목록에서 **"Gmail"** 선택

### 2.2 Gmail 계정 연결

1. **"Connect Account"** 버튼 클릭
2. Google 로그인 창이 열립니다
3. 피드백을 받을 Gmail 계정으로 로그인
4. **"Allow"** 버튼을 클릭하여 EmailJS에 권한 부여
   - EmailJS가 이메일을 대신 보낼 수 있는 권한입니다
   - 안전한 서비스이므로 허용해도 됩니다

### 2.3 Service ID 확인

1. 연결이 완료되면 **Service ID**가 표시됩니다
2. **Service ID**를 복사하세요 (예: `service_xxxxxxx`)
3. 이 ID는 나중에 환경 변수에 사용됩니다

### 2.4 Gmail 보안 설정 (필요한 경우)

일부 Gmail 계정은 보안 설정 때문에 연결이 안 될 수 있습니다:

1. **2단계 인증 활성화** (권장)
   - Google 계정 설정 → 보안 → 2단계 인증
   - 앱 비밀번호 생성 가능

2. **앱 비밀번호 사용** (2단계 인증이 활성화된 경우)
   - Google 계정 → 보안 → 앱 비밀번호
   - "메일" 및 "기타(맞춤 이름)" 선택
   - 생성된 16자리 비밀번호 사용

**참고:** EmailJS는 OAuth를 사용하므로 대부분의 경우 추가 설정 없이 작동합니다.

## 3. 이메일 템플릿 생성

### 3.1 템플릿 생성

1. EmailJS 대시보드에서 **"Email Templates"** 메뉴 클릭
2. **"Create New Template"** 버튼 클릭

### 3.2 템플릿 설정

**Template Name**: `feedback_template` (원하는 이름)

**Service**: 위에서 생성한 Gmail 서비스 선택

**Subject**: 
```
피드백: {{subject}}
```

**Content** (이메일 본문):
```
새로운 피드백이 도착했습니다.

보낸 사람: {{from_name}}
이메일: {{from_email}}
제목: {{subject}}

내용:
{{message}}

---
이 메일은 경제 용어 관계 사전 웹사이트에서 자동으로 전송되었습니다.
```

**To Email**: 
```
{{to_email}}
```
또는 직접 이메일 주소 입력 (예: `your-email@gmail.com`)

**From Name**: 
```
경제 용어 관계 사전
```

**Reply To**: 
```
{{from_email}}
```
(사용자가 보낸 이메일로 답장할 수 있도록)

### 3.3 템플릿 저장

1. **"Save"** 버튼 클릭
2. **Template ID** 확인 (예: `template_xxxxxxx`)
3. 이 ID를 복사하세요

## 4. Public Key 확인

1. EmailJS 대시보드에서 **"Account"** → **"General"** 메뉴
2. **"Public Key"** 복사 (예: `xxxxxxxxxxxxxxx`)

## 5. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
VITE_FEEDBACK_EMAIL=your-email@example.com
```

**주의사항:**
- `.env` 파일은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있을 수 있습니다)
- 실제 값으로 `xxxxxxx` 부분을 교체하세요
- `VITE_FEEDBACK_EMAIL`은 피드백을 받을 Gmail 주소입니다 (예: `your-email@gmail.com`)

## 6. .gitignore 확인

`.gitignore` 파일에 `.env`가 포함되어 있는지 확인:

```
.env
.env.local
.env.production
```

## 7. Vercel 배포 시 환경 변수 설정

Vercel에 배포하는 경우:

1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** → **Environment Variables** 메뉴
3. 다음 환경 변수 추가:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_FEEDBACK_EMAIL`

4. 각 환경(Production, Preview, Development)에 대해 변수 추가
5. **"Save"** 후 재배포

## 8. 테스트

1. 개발 서버 실행: `npm run dev`
2. 웹사이트에서 "피드백 보내기" 버튼 클릭
3. 테스트 피드백 전송
4. 설정한 이메일 주소로 피드백이 도착하는지 확인

## 무료 플랜 제한사항

### EmailJS 무료 플랜
- **월 200통** 이메일 전송 제한
- 기본 기능 사용 가능
- 커스텀 도메인 사용 불가

### Gmail 제한사항 (EmailJS를 통해 Gmail 사용 시)
- **무료 Gmail 계정**: 하루 500통 전송 가능
- **Google Workspace**: 하루 2,000통 전송 가능
- 하지만 EmailJS 무료 플랜 제한(월 200통)이 더 먼저 적용됩니다

### 현재 프로젝트(피드백 폼)에서는
- 월 200통이면 충분합니다
- 피드백 폼은 사용자가 직접 보내는 것이므로 대량 발송이 아닙니다
- 일반적인 웹사이트 피드백 수요에는 무료 플랜으로 충분합니다

## 더 많은 이메일이 필요한 경우

### EmailJS 유료 플랜
- **Starter 플랜**: 월 $15, 월 1,000통
- **Professional 플랜**: 월 $35, 월 5,000통
- **Business 플랜**: 월 $80, 월 20,000통
- [EmailJS 가격 페이지](https://www.emailjs.com/pricing/)에서 자세한 정보 확인

### 대량 발송이 목적인 경우
피드백 폼이 아닌 **마케팅 이메일**이나 **뉴스레터**를 보내야 한다면:
- **SendGrid**: 트랜잭셔널 이메일 전문 서비스
- **Mailgun**: 개발자 친화적 이메일 API
- **Amazon SES**: AWS 기반 저렴한 이메일 서비스

**참고**: 현재 프로젝트는 피드백 폼이므로 EmailJS 무료 플랜으로 충분합니다.

## 문제 해결

### 이메일이 도착하지 않는 경우

1. **환경 변수 확인**: `.env` 파일의 값이 정확한지 확인
2. **템플릿 변수 확인**: 템플릿에서 사용한 변수명이 코드와 일치하는지 확인
3. **스팸 폴더 확인**: 이메일이 스팸 폴더로 이동했는지 확인
4. **브라우저 콘솔 확인**: 개발자 도구에서 에러 메시지 확인
5. **EmailJS 대시보드 확인**: EmailJS 대시보드의 "Logs" 메뉴에서 전송 기록 확인

### CORS 에러가 발생하는 경우

- EmailJS는 CORS를 지원하므로 일반적으로 문제가 없습니다
- 문제가 발생하면 EmailJS 공식 문서를 참고하세요

## 9. Gmail 설정 완료 확인

설정이 완료되면:
1. EmailJS 대시보드 → **"Email Services"**에서 Gmail 서비스가 "Connected" 상태인지 확인
2. **"Email Templates"**에서 템플릿이 생성되었는지 확인
3. 테스트 이메일을 보내서 Gmail로 정상 수신되는지 확인

## 10. Gmail 관련 문제 해결

### Gmail 연결이 안 되는 경우

1. **Google 계정 보안 확인**
   - Google 계정에 로그인되어 있는지 확인
   - 보안 설정에서 "낮은 보안 수준 앱의 액세스" 허용 (필요한 경우)

2. **브라우저 쿠키/팝업 차단 확인**
   - 팝업 차단 해제
   - 쿠키 허용

3. **다른 브라우저로 시도**
   - Chrome, Firefox 등 다른 브라우저에서 시도

4. **EmailJS 지원팀 문의**
   - 문제가 계속되면 EmailJS 지원팀에 문의

### 이메일이 스팸으로 분류되는 경우

1. **Gmail 설정 확인**
   - 받은편지함에서 이메일 찾기
   - 스팸 폴더 확인
   - "스팸 아님"으로 표시

2. **템플릿 내용 개선**
   - 스팸처럼 보이는 단어 제거
   - 전문적인 문구 사용

## 참고 자료

- [EmailJS 공식 문서](https://www.emailjs.com/docs/)
- [EmailJS Gmail 연동 가이드](https://www.emailjs.com/docs/user-guide/connecting-email-service/)
- [EmailJS React 가이드](https://www.emailjs.com/docs/examples/reactjs/)
- [Gmail 보안 설정](https://myaccount.google.com/security)