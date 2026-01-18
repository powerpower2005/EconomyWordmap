# 광고 모듈 사용법 (Advertising Module Usage Guide)

## 개요

이 문서는 범용 광고 모듈을 사용하기 위한 단계별 가이드입니다.

---

## 1. 사전 준비사항

### 1.1 Google AdSense 계정 설정 (Google AdSense 사용 시)

1. **Google AdSense 계정 생성**
   - https://www.google.com/adsense 접속
   - 계정 생성 및 사이트 등록
   - 승인 대기 (보통 1-2주 소요)

2. **광고 단위 생성**
   - AdSense 대시보드에서 "광고" → "광고 단위" 클릭
   - 새 광고 단위 생성
   - 광고 형식 선택 (반응형, 표시형 등)
   - 광고 단위 이름 및 크기 설정
   - **광고 단위 ID (ad-slot) 확인** - 예: `1234567890`
   - **게시자 ID (ad-client) 확인** - 예: `ca-pub-XXXXXXXXXX`

3. **사이트 승인 확인**
   - AdSense에서 사이트가 승인되었는지 확인
   - 승인되지 않은 경우 광고가 표시되지 않음

### 1.2 직접 광고 사용 시

- 광고 이미지 파일 준비
- 광고 링크 URL 준비
- 광고 배너 크기 결정 (예: 728x90, 300x250)

---

## 2. 모듈 설치 및 로드

### 2.1 CDN 방식 (가장 간단)

**HTML에 스크립트 추가:**
```html
<!-- Web Component 방식 -->
<script type="module" src="https://cdn.economywordmap.com/ad-module/web-component.js"></script>

<!-- 또는 Vanilla JS 방식 -->
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
```

**장점:**
- 설치 불필요
- 즉시 사용 가능
- 자동 업데이트

### 2.2 npm 패키지 방식

**설치:**
```bash
npm install @economywordmap/ad-module
```

**ES Module로 import:**
```javascript
import AdModule from '@economywordmap/ad-module';
```

**CommonJS로 require:**
```javascript
const AdModule = require('@economywordmap/ad-module');
```

### 2.3 로컬 파일 다운로드

1. GitHub에서 파일 다운로드
2. 프로젝트에 파일 복사
3. HTML에서 로컬 파일 참조

```html
<script src="./js/ad-module.js"></script>
```

---

## 3. 사용 방법 (프레임워크별)

### 3.1 Vanilla JavaScript / HTML

#### 방법 1: Web Component 사용

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <!-- AdSense 스크립트 (필수) -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
  <!-- 광고 모듈 -->
  <script type="module" src="https://cdn.economywordmap.com/ad-module/web-component.js"></script>
</head>
<body>
  <h1>My Website</h1>
  
  <!-- 광고 배너 삽입 -->
  <ad-banner 
    ad-client="ca-pub-XXXXXXXXXX" 
    ad-slot="1234567890" 
    ad-format="horizontal"
  ></ad-banner>
  
  <!-- 또는 사이드바에 -->
  <aside>
    <ad-banner 
      ad-client="ca-pub-XXXXXXXXXX" 
      ad-slot="0987654321" 
      ad-format="rectangle"
    ></ad-banner>
  </aside>
</body>
</html>
```

#### 방법 2: Vanilla JS API 사용

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  <script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
</head>
<body>
  <h1>My Website</h1>
  
  <!-- 광고를 삽입할 컨테이너 -->
  <div id="footer-ad"></div>
  <div id="sidebar-ad"></div>
  
  <script>
    // 1. 모듈 초기화
    AdModule.init({
      adClient: 'ca-pub-XXXXXXXXXX',
      autoLoad: true  // AdSense 스크립트 자동 로드
    });
    
    // 2. 광고 배너 삽입
    AdModule.insertBanner('#footer-ad', {
      adSlot: '1234567890',
      adFormat: 'horizontal',
      width: 728,
      height: 90,
      label: '광고'
    });
    
    // 3. 사이드바 광고
    AdModule.insertBanner('#sidebar-ad', {
      adSlot: '0987654321',
      adFormat: 'rectangle',
      width: 300,
      height: 250
    });
  </script>
</body>
</html>
```

### 3.2 React

#### 방법 1: Web Component 사용

```jsx
// App.jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Web Component 스크립트 로드
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.economywordmap.com/ad-module/web-component.js';
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div>
      <h1>My React App</h1>
      
      {/* Web Component 사용 */}
      <ad-banner 
        ad-client="ca-pub-XXXXXXXXXX" 
        ad-slot="1234567890" 
        ad-format="horizontal"
      />
    </div>
  );
}
```

#### 방법 2: npm 패키지 사용

```jsx
// App.jsx
import { AdBanner } from '@economywordmap/ad-module/react';

function App() {
  return (
    <div>
      <h1>My React App</h1>
      
      <AdBanner 
        adClient="ca-pub-XXXXXXXXXX"
        adSlot="1234567890"
        adFormat="horizontal"
        className="my-ad-class"
      />
    </div>
  );
}
```

#### 방법 3: Vanilla JS API 사용

```jsx
// App.jsx
import { useEffect, useRef } from 'react';
import AdModule from '@economywordmap/ad-module';

function App() {
  const adContainerRef = useRef(null);

  useEffect(() => {
    // 모듈 초기화
    AdModule.init({
      adClient: 'ca-pub-XXXXXXXXXX',
      autoLoad: true
    });

    // 광고 삽입
    if (adContainerRef.current) {
      AdModule.insertBanner(adContainerRef.current, {
        adSlot: '1234567890',
        adFormat: 'horizontal'
      });
    }
  }, []);

  return (
    <div>
      <h1>My React App</h1>
      <div ref={adContainerRef}></div>
    </div>
  );
}
```

### 3.3 Vue

#### 방법 1: Web Component 사용

```vue
<template>
  <div>
    <h1>My Vue App</h1>
    <ad-banner 
      :ad-client="adClient" 
      :ad-slot="adSlot" 
      ad-format="horizontal"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      adClient: 'ca-pub-XXXXXXXXXX',
      adSlot: '1234567890'
    };
  },
  mounted() {
    // Web Component 스크립트 로드
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.economywordmap.com/ad-module/web-component.js';
    document.head.appendChild(script);
  }
};
</script>
```

#### 방법 2: npm 패키지 사용

```vue
<template>
  <div>
    <h1>My Vue App</h1>
    <AdBanner 
      :ad-client="adClient"
      :ad-slot="adSlot"
      ad-format="horizontal"
    />
  </div>
</template>

<script>
import { AdBanner } from '@economywordmap/ad-module/vue';

export default {
  components: {
    AdBanner
  },
  data() {
    return {
      adClient: 'ca-pub-XXXXXXXXXX',
      adSlot: '1234567890'
    };
  }
};
</script>
```

### 3.4 Angular

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import AdModule from '@economywordmap/ad-module';

@Component({
  selector: 'app-root',
  template: `
    <h1>My Angular App</h1>
    <div #adContainer></div>
  `
})
export class AppComponent implements OnInit {
  @ViewChild('adContainer', { static: true }) adContainer!: ElementRef;

  ngOnInit() {
    AdModule.init({
      adClient: 'ca-pub-XXXXXXXXXX',
      autoLoad: true
    });

    AdModule.insertBanner(this.adContainer.nativeElement, {
      adSlot: '1234567890',
      adFormat: 'horizontal'
    });
  }
}
```

### 3.5 Python (Flask)

```python
# app.py
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', 
                         ad_client='ca-pub-XXXXXXXXXX',
                         ad_slot='1234567890')

if __name__ == '__main__':
    app.run()
```

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>My Flask App</title>
    <script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
</head>
<body>
    <h1>My Flask App</h1>
    <div id="footer-ad"></div>
    
    <script>
        AdModule.init({
            adClient: '{{ ad_client }}',
            autoLoad: true
        });
        
        AdModule.insertBanner('#footer-ad', {
            adSlot: '{{ ad_slot }}',
            adFormat: 'horizontal'
        });
    </script>
</body>
</html>
```

### 3.6 PHP

```php
<?php
// config.php
$ad_client = 'ca-pub-XXXXXXXXXX';
$ad_slot = '1234567890';
?>

<!DOCTYPE html>
<html>
<head>
    <title>My PHP Site</title>
    <script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
</head>
<body>
    <h1>My PHP Site</h1>
    <div id="footer-ad"></div>
    
    <script>
        AdModule.init({
            adClient: '<?php echo $ad_client; ?>',
            autoLoad: true
        });
        
        AdModule.insertBanner('#footer-ad', {
            adSlot: '<?php echo $ad_slot; ?>',
            adFormat: 'horizontal'
        });
    </script>
</body>
</html>
```

---

## 4. 환경 변수 설정 (권장)

### 4.1 환경 변수 사용 이유

- 보안: AdSense ID를 코드에 직접 노출하지 않음
- 유연성: 환경별로 다른 광고 설정 가능
- 관리 용이: 중앙 집중식 설정 관리

### 4.2 설정 방법

#### React (Vite)

```javascript
// .env
VITE_AD_CLIENT=ca-pub-XXXXXXXXXX
VITE_AD_SLOT_FOOTER=1234567890
VITE_AD_SLOT_SIDEBAR=0987654321
```

```jsx
// App.jsx
const adClient = import.meta.env.VITE_AD_CLIENT;
const footerAdSlot = import.meta.env.VITE_AD_SLOT_FOOTER;

<AdBanner adClient={adClient} adSlot={footerAdSlot} />
```

#### Node.js (Express)

```javascript
// .env
AD_CLIENT=ca-pub-XXXXXXXXXX
AD_SLOT_FOOTER=1234567890
```

```javascript
// server.js
require('dotenv').config();

app.get('/', (req, res) => {
  res.render('index', {
    adClient: process.env.AD_CLIENT,
    adSlot: process.env.AD_SLOT_FOOTER
  });
});
```

#### Python (Django)

```python
# settings.py
import os

AD_CLIENT = os.environ.get('AD_CLIENT', '')
AD_SLOT_FOOTER = os.environ.get('AD_SLOT_FOOTER', '')
```

```html
<!-- template.html -->
<script>
  AdModule.init({
    adClient: '{{ AD_CLIENT }}',
    autoLoad: true
  });
</script>
```

---

## 5. 일반적인 사용 패턴

### 5.1 푸터 광고

```html
<footer>
  <div id="footer-ad"></div>
</footer>

<script>
  AdModule.insertBanner('#footer-ad', {
    adSlot: '1234567890',
    adFormat: 'horizontal',
    width: 728,
    height: 90
  });
</script>
```

### 5.2 사이드바 광고 (데스크톱 전용)

```html
<aside class="sidebar">
  <div id="sidebar-ad"></div>
</aside>

<script>
  // 데스크톱에서만 표시
  if (window.innerWidth >= 1024) {
    AdModule.insertBanner('#sidebar-ad', {
      adSlot: '0987654321',
      adFormat: 'rectangle',
      width: 300,
      height: 250
    });
  }
</script>
```

### 5.3 반응형 광고

```html
<div id="responsive-ad"></div>

<script>
  AdModule.insertBanner('#responsive-ad', {
    adSlot: '1234567890',
    adFormat: 'auto',  // 자동 반응형
    // width, height 지정 시 고정 크기
  });
</script>
```

### 5.4 여러 광고 배치

```html
<div id="ad-1"></div>
<div id="ad-2"></div>
<div id="ad-3"></div>

<script>
  AdModule.init({
    adClient: 'ca-pub-XXXXXXXXXX',
    autoLoad: true
  });

  // 여러 광고 배치
  AdModule.insertBanner('#ad-1', {
    adSlot: '1234567890',
    adFormat: 'horizontal'
  });

  AdModule.insertBanner('#ad-2', {
    adSlot: '0987654321',
    adFormat: 'rectangle'
  });

  AdModule.insertBanner('#ad-3', {
    adSlot: '1122334455',
    adFormat: 'vertical'
  });
</script>
```

---

## 6. 고급 사용법

### 6.1 조건부 광고 표시

```javascript
// 특정 조건에서만 광고 표시
function showAdIfNeeded() {
  const userType = getUserType(); // 예: 'premium', 'free'
  const isMobile = window.innerWidth < 768;
  
  if (userType === 'free' && !isMobile) {
    AdModule.insertBanner('#ad-container', {
      adSlot: '1234567890',
      adFormat: 'horizontal'
    });
  }
}
```

### 6.2 지연 로딩 (Lazy Loading)

```javascript
// Intersection Observer를 사용한 지연 로딩
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      AdModule.insertBanner(entry.target, {
        adSlot: '1234567890',
        adFormat: 'horizontal'
      });
      observer.unobserve(entry.target);
    }
  });
});

const adContainer = document.querySelector('#lazy-ad');
observer.observe(adContainer);
```

### 6.3 광고 새로고침

```javascript
// 특정 시간마다 광고 새로고침
setInterval(() => {
  const adContainer = document.querySelector('#ad-container');
  adContainer.innerHTML = ''; // 기존 광고 제거
  
  AdModule.insertBanner(adContainer, {
    adSlot: '1234567890',
    adFormat: 'horizontal'
  });
}, 60000); // 60초마다
```

### 6.4 에러 처리

```javascript
try {
  AdModule.init({
    adClient: 'ca-pub-XXXXXXXXXX',
    autoLoad: true
  });
  
  AdModule.insertBanner('#ad-container', {
    adSlot: '1234567890',
    adFormat: 'horizontal'
  });
} catch (error) {
  console.error('광고 로드 실패:', error);
  // 대체 콘텐츠 표시 또는 무시
}
```

---

## 7. 체크리스트

### 사용 전 확인사항

- [ ] Google AdSense 계정 생성 및 승인 완료
- [ ] 광고 단위 ID (ad-slot) 확인
- [ ] 게시자 ID (ad-client) 확인
- [ ] 모듈 스크립트 로드 확인
- [ ] 광고 컨테이너 요소 존재 확인
- [ ] 환경 변수 설정 (선택사항)
- [ ] 테스트 환경에서 광고 표시 확인

### 문제 해결

**광고가 표시되지 않는 경우:**
1. AdSense 계정 승인 상태 확인
2. 브라우저 콘솔에서 에러 확인
3. 광고 단위 ID 확인
4. 게시자 ID 확인
5. 스크립트 로드 확인
6. 컨테이너 요소 존재 확인

**성능 문제:**
1. 광고 지연 로딩 적용
2. 광고 개수 제한
3. 광고 스크립트 비동기 로드 확인

---

## 8. 빠른 시작 가이드

### 최소 설정 (5분)

1. **HTML 파일에 스크립트 추가:**
```html
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
```

2. **광고 컨테이너 추가:**
```html
<div id="my-ad"></div>
```

3. **초기화 및 광고 삽입:**
```html
<script>
  AdModule.init({
    adClient: 'ca-pub-XXXXXXXXXX',  // 여기에 본인의 AdSense ID 입력
    autoLoad: true
  });
  
  AdModule.insertBanner('#my-ad', {
    adSlot: '1234567890'  // 여기에 본인의 광고 단위 ID 입력
  });
</script>
```

**완료!** 이제 광고가 표시됩니다.

---

## 9. 참고 자료

- [Google AdSense 가이드](https://support.google.com/adsense)
- [모듈 GitHub 저장소](https://github.com/economywordmap/ad-module)
- [예제 코드 모음](https://github.com/economywordmap/ad-module/tree/main/examples)
