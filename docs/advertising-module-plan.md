# 광고 모듈 범용화 계획서 (Universal Advertising Module Plan)

## 개요

광고 모듈을 React/Node.js에 종속되지 않고, 모든 웹 프레임워크와 언어에서 사용할 수 있도록 범용화하는 방안을 제시합니다.

---

## 1. 모듈화 전략

### 1.1 Web Components 방식 (권장)

**장점:**
- 모든 프레임워크에서 사용 가능 (React, Vue, Angular, Svelte, Vanilla JS 등)
- 표준 웹 기술 (Custom Elements API)
- 프레임워크 독립적
- 재사용성 높음

**구현 방법:**
```javascript
// ad-banner.js (Web Component)
class AdBanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const adSlot = this.getAttribute('ad-slot');
    const adFormat = this.getAttribute('ad-format') || 'auto';
    const adClient = this.getAttribute('ad-client');
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 1rem 0;
        }
        .ad-container {
          text-align: center;
          min-height: 90px;
        }
        .ad-label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
      </style>
      <div class="ad-container">
        <div class="ad-label">광고</div>
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${adClient}"
             data-ad-slot="${adSlot}"
             data-ad-format="${adFormat}"
             data-full-width-responsive="true"></ins>
      </div>
    `;
    
    // AdSense 스크립트 로드 및 초기화
    this.loadAdSense();
  }

  loadAdSense() {
    if (window.adsbygoogle && window.adsbygoogle.loaded) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      return;
    }

    // AdSense 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    script.onload = () => {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    };
    document.head.appendChild(script);
  }
}

customElements.define('ad-banner', AdBanner);
```

**사용 예시:**
```html
<!-- React -->
<ad-banner 
  ad-client="ca-pub-XXXXXXXXXX" 
  ad-slot="1234567890" 
  ad-format="horizontal"
/>

<!-- Vue -->
<ad-banner 
  :ad-client="adClient" 
  :ad-slot="adSlot" 
/>

<!-- Angular -->
<ad-banner 
  [ad-client]="adClient" 
  [ad-slot]="adSlot"
></ad-banner>

<!-- Vanilla JS / HTML -->
<ad-banner 
  ad-client="ca-pub-XXXXXXXXXX" 
  ad-slot="1234567890"
></ad-banner>
```

### 1.2 순수 JavaScript 라이브러리 방식

**장점:**
- 프레임워크 완전 독립적
- 가벼움
- CDN으로 배포 가능

**구현 방법:**
```javascript
// ad-module.js
(function(window) {
  'use strict';

  const AdModule = {
    init: function(config) {
      this.config = {
        adClient: config.adClient,
        container: config.container || document.body,
        adSlots: config.adSlots || [],
        autoLoad: config.autoLoad !== false
      };

      if (this.config.autoLoad) {
        this.loadAdSense();
      }
    },

    loadAdSense: function() {
      if (document.getElementById('adsbygoogle-script')) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'adsbygoogle-script';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      document.head.appendChild(script);
    },

    createBanner: function(options) {
      const {
        adSlot,
        adFormat = 'auto',
        width,
        height,
        className = 'ad-banner',
        label = '광고'
      } = options;

      const container = document.createElement('div');
      container.className = className;
      container.innerHTML = `
        <div class="ad-label" style="font-size: 0.75rem; color: #666; margin-bottom: 0.5rem;">
          ${label}
        </div>
        <ins class="adsbygoogle"
             style="display:block${width ? `;width:${width}px` : ''}${height ? `;height:${height}px` : ''}"
             data-ad-client="${this.config.adClient}"
             data-ad-slot="${adSlot}"
             data-ad-format="${adFormat}"
             data-full-width-responsive="true"></ins>
      `;

      // AdSense 초기화
      setTimeout(() => {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }, 100);

      return container;
    },

    insertBanner: function(selector, options) {
      const target = document.querySelector(selector);
      if (!target) {
        console.error('Ad target not found:', selector);
        return;
      }

      const banner = this.createBanner(options);
      target.appendChild(banner);
    }
  };

  window.AdModule = AdModule;
})(window);
```

**사용 예시:**
```javascript
// 초기화
AdModule.init({
  adClient: 'ca-pub-XXXXXXXXXX',
  autoLoad: true
});

// 배너 삽입
AdModule.insertBanner('#footer', {
  adSlot: '1234567890',
  adFormat: 'horizontal',
  width: 728,
  height: 90
});

// React에서 사용
useEffect(() => {
  AdModule.insertBanner('#ad-container', {
    adSlot: '1234567890'
  });
}, []);

// Vue에서 사용
mounted() {
  AdModule.insertBanner('#ad-container', {
    adSlot: '1234567890'
  });
}
```

### 1.3 iframe 임베드 방식

**장점:**
- 완전한 격리 (스타일 충돌 없음)
- 보안성 높음
- 모든 환경에서 동작

**구현 방법:**
```javascript
// ad-iframe.js
class AdIframe {
  constructor(config) {
    this.config = config;
    this.iframe = null;
  }

  create(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    this.iframe = document.createElement('iframe');
    this.iframe.src = `https://ad-service.example.com/embed?slot=${this.config.adSlot}&client=${this.config.adClient}`;
    this.iframe.width = this.config.width || '728';
    this.iframe.height = this.config.height || '90';
    this.iframe.frameBorder = '0';
    this.iframe.scrolling = 'no';
    this.iframe.style.border = 'none';
    this.iframe.style.display = 'block';
    this.iframe.style.margin = '0 auto';

    container.appendChild(this.iframe);
  }
}
```

---

## 2. 배포 전략

### 2.1 npm 패키지

**패키지 구조:**
```
universal-ad-module/
  ├── package.json
  ├── README.md
  ├── dist/
  │   ├── ad-module.js          # UMD 빌드
  │   ├── ad-module.esm.js      # ES Module
  │   ├── ad-module.cjs.js      # CommonJS
  │   └── ad-module.min.js      # Minified
  ├── src/
  │   ├── web-component.js      # Web Component
  │   ├── vanilla-js.js         # Vanilla JS
  │   └── iframe.js             # iframe 방식
  └── examples/
      ├── react/
      ├── vue/
      ├── angular/
      └── vanilla/
```

**package.json:**
```json
{
  "name": "@economywordmap/ad-module",
  "version": "1.0.0",
  "description": "Universal advertising module for any web framework",
  "main": "dist/ad-module.cjs.js",
  "module": "dist/ad-module.esm.js",
  "browser": "dist/ad-module.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "rollup -c",
    "build:web-component": "rollup -c --input src/web-component.js",
    "build:vanilla": "rollup -c --input src/vanilla-js.js"
  },
  "keywords": [
    "advertising",
    "adsense",
    "ad-banner",
    "universal",
    "framework-agnostic"
  ],
  "author": "EconomyWordmap",
  "license": "MIT"
}
```

### 2.2 CDN 배포

**사용 예시:**
```html
<!-- Web Component 방식 -->
<script type="module" src="https://cdn.economywordmap.com/ad-module/web-component.js"></script>
<ad-banner ad-client="..." ad-slot="..."></ad-banner>

<!-- Vanilla JS 방식 -->
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
<script>
  AdModule.init({ adClient: '...' });
  AdModule.insertBanner('#footer', { adSlot: '...' });
</script>
```

### 2.3 GitHub Packages / npm Registry

```bash
# 설치
npm install @economywordmap/ad-module

# React에서
import { AdBanner } from '@economywordmap/ad-module/react';

# Vue에서
import { AdBanner } from '@economywordmap/ad-module/vue';

# Vanilla JS
import AdModule from '@economywordmap/ad-module';
```

---

## 3. 프레임워크별 래퍼

### 3.1 React 래퍼

```typescript
// react-ad-banner.tsx
import { useEffect, useRef } from 'react';
import AdModule from '@economywordmap/ad-module';

interface AdBannerProps {
  adSlot: string;
  adClient: string;
  adFormat?: string;
  className?: string;
}

export function AdBanner({ 
  adSlot, 
  adClient, 
  adFormat = 'auto',
  className 
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      AdModule.insertBanner(containerRef.current, {
        adSlot,
        adFormat,
        className
      });
    }
  }, [adSlot, adFormat]);

  return <div ref={containerRef} className={className} />;
}
```

### 3.2 Vue 래퍼

```vue
<!-- AdBanner.vue -->
<template>
  <div ref="container" :class="className"></div>
</template>

<script>
import AdModule from '@economywordmap/ad-module';

export default {
  name: 'AdBanner',
  props: {
    adSlot: {
      type: String,
      required: true
    },
    adClient: {
      type: String,
      required: true
    },
    adFormat: {
      type: String,
      default: 'auto'
    },
    className: {
      type: String,
      default: ''
    }
  },
  mounted() {
    AdModule.insertBanner(this.$refs.container, {
      adSlot: this.adSlot,
      adFormat: this.adFormat,
      className: this.className
    });
  }
};
</script>
```

### 3.3 Angular 래퍼

```typescript
// ad-banner.component.ts
import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import AdModule from '@economywordmap/ad-module';

@Component({
  selector: 'app-ad-banner',
  template: '<div #container [class]="className"></div>'
})
export class AdBannerComponent implements OnInit {
  @Input() adSlot!: string;
  @Input() adClient!: string;
  @Input() adFormat: string = 'auto';
  @Input() className: string = '';
  
  @ViewChild('container', { static: true }) container!: ElementRef;

  ngOnInit() {
    AdModule.insertBanner(this.container.nativeElement, {
      adSlot: this.adSlot,
      adFormat: this.adFormat,
      className: this.className
    });
  }
}
```

---

## 4. 빌드 설정 (Rollup)

```javascript
// rollup.config.js
import { defineConfig } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig([
  // UMD 빌드
  {
    input: 'src/vanilla-js.js',
    output: {
      file: 'dist/ad-module.js',
      format: 'umd',
      name: 'AdModule',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // ES Module 빌드
  {
    input: 'src/vanilla-js.js',
    output: {
      file: 'dist/ad-module.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // CommonJS 빌드
  {
    input: 'src/vanilla-js.js',
    output: {
      file: 'dist/ad-module.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // Minified 빌드
  {
    input: 'src/vanilla-js.js',
    output: {
      file: 'dist/ad-module.min.js',
      format: 'umd',
      name: 'AdModule'
    },
    plugins: [resolve(), commonjs(), terser()]
  },
  // Web Component 빌드
  {
    input: 'src/web-component.js',
    output: {
      file: 'dist/ad-module-web-component.js',
      format: 'iife',
      name: 'AdModule',
      sourcemap: true
    }
  }
]);
```

---

## 5. 사용 예시 (다양한 환경)

### 5.1 Python Flask/Django

```html
<!-- templates/base.html -->
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
<script>
  AdModule.init({
    adClient: '{{ ad_client }}',
    autoLoad: true
  });
</script>

<!-- 푸터에 광고 삽입 -->
<div id="footer-ad"></div>
<script>
  AdModule.insertBanner('#footer-ad', {
    adSlot: '{{ ad_slot }}',
    adFormat: 'horizontal'
  });
</script>
```

### 5.2 PHP

```php
<!-- footer.php -->
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
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
```

### 5.3 Ruby on Rails

```erb
<!-- app/views/layouts/application.html.erb -->
<%= javascript_include_tag 'https://cdn.economywordmap.com/ad-module/vanilla.js' %>

<script>
  AdModule.init({
    adClient: '<%= ENV['AD_CLIENT'] %>',
    autoLoad: true
  });
  
  AdModule.insertBanner('#footer-ad', {
    adSlot: '<%= ENV['AD_SLOT'] %>',
    adFormat: 'horizontal'
  });
</script>
```

### 5.4 Java (Spring Boot)

```html
<!-- templates/footer.html -->
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
<script>
  AdModule.init({
    adClient: '${adClient}',
    autoLoad: true
  });
  
  AdModule.insertBanner('#footer-ad', {
    adSlot: '${adSlot}',
    adFormat: 'horizontal'
  });
</script>
```

### 5.5 .NET (ASP.NET Core)

```html
<!-- Views/Shared/_Layout.cshtml -->
<script src="https://cdn.economywordmap.com/ad-module/vanilla.js"></script>
<script>
  AdModule.init({
    adClient: '@ViewBag.AdClient',
    autoLoad: true
  });
  
  AdModule.insertBanner('#footer-ad', {
    adSlot: '@ViewBag.AdSlot',
    adFormat: 'horizontal'
  });
</script>
```

---

## 6. API 기반 방식 (서버 사이드)

### 6.1 REST API 제공

```javascript
// ad-service.js (Node.js 서버)
const express = require('express');
const app = express();

app.get('/api/ad/:slot', async (req, res) => {
  const { slot } = req.params;
  const { format = 'auto', width, height } = req.query;
  
  // 광고 HTML 생성
  const adHtml = generateAdHtml({
    slot,
    format,
    width,
    height
  });
  
  res.json({ html: adHtml });
});

function generateAdHtml({ slot, format, width, height }) {
  return `
    <ins class="adsbygoogle"
         style="display:block${width ? `;width:${width}px` : ''}${height ? `;height:${height}px` : ''}"
         data-ad-client="ca-pub-XXXXXXXXXX"
         data-ad-slot="${slot}"
         data-ad-format="${format}"
         data-full-width-responsive="true"></ins>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  `;
}
```

**클라이언트 사용:**
```javascript
// 클라이언트에서 API 호출
async function loadAd(containerSelector, slot) {
  const response = await fetch(`https://ad-service.example.com/api/ad/${slot}`);
  const { html } = await response.json();
  
  document.querySelector(containerSelector).innerHTML = html;
}
```

---

## 7. 구현 우선순위

### Phase 1: 기본 모듈 (1주)
1. Web Component 버전 구현
2. Vanilla JS 버전 구현
3. 기본 빌드 설정

### Phase 2: 배포 (3일)
1. npm 패키지 배포
2. CDN 설정
3. 문서화

### Phase 3: 프레임워크 래퍼 (1주)
1. React 래퍼
2. Vue 래퍼
3. Angular 래퍼

### Phase 4: 고급 기능 (1주)
1. iframe 방식
2. API 기반 방식
3. 성능 최적화

---

## 8. 장점 요약

### 8.1 범용성
- ✅ 모든 웹 프레임워크에서 사용 가능
- ✅ 서버 사이드 렌더링 (SSR) 지원
- ✅ 정적 사이트에서도 사용 가능

### 8.2 유지보수
- ✅ 단일 소스 코드
- ✅ 중앙 집중식 업데이트
- ✅ 버전 관리 용이

### 8.3 성능
- ✅ 가벼운 번들 크기
- ✅ 지연 로딩 지원
- ✅ 최적화된 로딩 전략

### 8.4 개발자 경험
- ✅ 간단한 API
- ✅ 풍부한 문서
- ✅ 다양한 예시 제공

---

## 9. 결론

**권장 접근 방식:**
1. **Web Component + Vanilla JS** 조합으로 시작
2. **npm 패키지 + CDN** 이중 배포
3. **프레임워크별 래퍼** 제공 (선택적)

이 방식으로 구현하면 React, Vue, Angular, Svelte, 그리고 Python, PHP, Java, .NET 등 모든 환경에서 사용할 수 있는 범용 광고 모듈을 만들 수 있습니다.
