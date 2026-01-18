# 광고 지면 추가 계획서 (Advertising Plan)

## 개요

EconomyWordmap에 광고 지면을 추가하여 수익화 가능성을 검토하고 구현 방안을 제시합니다.

---

## 1. 광고 배치 위치 후보

### 1.1 헤더 영역
- **위치**: 페이지 최상단
- **크기**: 728x90 (Leaderboard) 또는 320x50 (Mobile Banner)
- **장점**: 
  - 높은 노출률
  - 사용자가 페이지에 진입하자마자 노출
- **단점**: 
  - 콘텐츠 영역을 차지하여 사용자 경험에 영향 가능
  - 그래프 시각화에 집중해야 하는 사이트 특성상 방해될 수 있음

### 1.2 사이드바 (데스크톱)
- **위치**: 그래프 옆 좌우 측면
- **크기**: 300x250 (Medium Rectangle) 또는 160x600 (Wide Skyscraper)
- **장점**: 
  - 콘텐츠와 분리되어 사용자 경험에 영향 적음
  - 데스크톱 사용자에게 효과적
- **단점**: 
  - 모바일에서는 사용 불가
  - 반응형 디자인 고려 필요

### 1.3 통합 섹션 내부
- **위치**: 검색/인덱스/가이드 섹션 사이 또는 하단
- **크기**: 728x90 또는 300x250
- **장점**: 
  - 콘텐츠 흐름에 자연스럽게 통합 가능
  - 사용자가 기능을 사용한 후 노출
- **단점**: 
  - 콘텐츠 탐색 흐름을 방해할 수 있음

### 1.4 그래프 하단
- **위치**: 그래프와 범례 사이 또는 범례 아래
- **크기**: 728x90 (Leaderboard)
- **장점**: 
  - 그래프를 본 후 자연스럽게 노출
  - 범례와 함께 배치하여 시각적 균형 유지
- **단점**: 
  - 그래프 영역이 줄어들 수 있음

### 1.5 푸터 영역
- **위치**: 페이지 최하단
- **크기**: 728x90 또는 300x250
- **장점**: 
  - 콘텐츠 탐색을 방해하지 않음
  - 사용자가 모든 콘텐츠를 본 후 노출
- **단점**: 
  - 노출률이 낮을 수 있음
  - 스크롤을 많이 내려야 볼 수 있음

### 1.6 모달 내부 (비추천)
- **위치**: 노드 상세 정보 모달
- **크기**: 300x250
- **장점**: 
  - 높은 집중도 (사용자가 모달을 보고 있을 때)
- **단점**: 
  - 사용자 경험에 매우 부정적 영향
  - 콘텐츠 집중을 방해
  - **권장하지 않음**

---

## 2. 추천 배치 전략

### 2.1 1단계: 보수적 접근 (권장)
**배치 위치:**
1. **푸터 영역** (728x90)
   - 페이지 최하단에 배치
   - 콘텐츠 탐색에 영향 최소화
   - 사용자 경험 우선

2. **사이드바 (데스크톱 전용)** (300x250)
   - 그래프 오른쪽에 배치
   - 데스크톱에서만 표시 (모바일 숨김)
   - 콘텐츠와 분리

**장점:**
- 사용자 경험에 최소한의 영향
- 점진적 수익화 시작
- 사용자 피드백 수집 후 조정 가능

### 2.2 2단계: 확장 (사용자 반응 확인 후)
**추가 배치:**
1. **그래프 하단** (728x90)
   - 범례 아래에 배치
   - 그래프를 본 후 자연스러운 노출

2. **통합 섹션 하단** (300x250)
   - 검색/인덱스/가이드 섹션 아래
   - 탭 전환 시에도 표시

---

## 3. 기술적 구현 방안

### 3.1 Google AdSense 통합

**구현 방법:**
```typescript
// src/components/AdBanner.tsx
import { useEffect } from 'react';

interface AdBannerProps {
  adSlot: string;
  adFormat?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({ adSlot, adFormat = 'auto', style }: AdBannerProps) {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

**사용 예시:**
```tsx
// src/pages/Home.tsx
import AdBanner from '../components/AdBanner';

// 푸터 영역
<AdBanner 
  adSlot="1234567890" 
  adFormat="horizontal"
  style={{ marginTop: '2rem', textAlign: 'center' }}
/>

// 사이드바
<div className="hidden lg:block">
  <AdBanner 
    adSlot="0987654321" 
    adFormat="rectangle"
    style={{ position: 'sticky', top: '20px' }}
  />
</div>
```

### 3.2 직접 광고 배너

**구현 방법:**
```typescript
// src/components/CustomAd.tsx
interface CustomAdProps {
  imageUrl: string;
  linkUrl: string;
  altText: string;
  width?: number;
  height?: number;
}

export default function CustomAd({ 
  imageUrl, 
  linkUrl, 
  altText, 
  width = 728, 
  height = 90 
}: CustomAdProps) {
  return (
    <a 
      href={linkUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
    >
      <img 
        src={imageUrl} 
        alt={altText}
        width={width}
        height={height}
        className="mx-auto"
      />
    </a>
  );
}
```

### 3.3 조건부 렌더링

**구현 방법:**
```typescript
// 환경 변수로 광고 활성화 제어
const ENABLE_ADS = import.meta.env.VITE_ENABLE_ADS === 'true';

// 사용
{ENABLE_ADS && <AdBanner adSlot="..." />}
```

---

## 4. 파일 구조

```
src/
  components/
    AdBanner.tsx          # Google AdSense 컴포넌트
    CustomAd.tsx          # 직접 광고 배너 컴포넌트
    AdContainer.tsx       # 광고 컨테이너 (스타일링, 위치 관리)
  pages/
    Home.tsx              # 광고 배치 위치 추가
```

---

## 5. 스타일링 고려사항

### 5.1 반응형 디자인
- **데스크톱**: 사이드바 + 푸터
- **태블릿**: 푸터만 (사이드바 숨김)
- **모바일**: 푸터만 (작은 배너)

### 5.2 시각적 통합
- 광고 영역을 명확히 구분 (border, background)
- "광고" 라벨 표시 (법적 요구사항)
- 콘텐츠와 충분한 여백 유지

### 5.3 성능 최적화
- 광고 스크립트 비동기 로딩
- 지연 로딩 (Lazy Loading)
- 광고 로드 실패 시 콘텐츠 영향 없도록 처리

---

## 6. 구현 단계

### Phase 1: 기본 구조 (1-2일)
1. `AdBanner` 컴포넌트 생성
2. 푸터 영역에 광고 배치
3. 환경 변수 설정
4. 스타일링 및 반응형 처리

### Phase 2: 추가 배치 (1일)
1. 사이드바 광고 추가 (데스크톱 전용)
2. 그래프 하단 광고 추가
3. A/B 테스트 준비

### Phase 3: 최적화 (1-2일)
1. 성능 모니터링
2. 클릭률 분석
3. 사용자 피드백 수집
4. 배치 조정

---

## 7. 주의사항 및 고려사항

### 7.1 사용자 경험
- **최우선**: 콘텐츠 탐색을 방해하지 않도록 주의
- 광고가 그래프 시각화의 주요 기능을 가리지 않도록 배치
- 과도한 광고 배치는 사용자 이탈률 증가 가능

### 7.2 법적 요구사항
- 광고임을 명시 ("광고" 라벨)
- 개인정보 보호 정책 준수 (GDPR, CCPA 등)
- Google AdSense 정책 준수

### 7.3 성능
- 광고 스크립트가 페이지 로딩 속도에 영향 주지 않도록
- 광고 로드 실패 시에도 사이트 정상 작동 보장

### 7.4 수익화 전략
- 초기에는 보수적으로 시작
- 사용자 피드백 수집 후 점진적 확장
- 광고 수익 vs 사용자 경험 균형 유지

---

## 8. 대안: 후원/기부 시스템

광고 대신 또는 함께 사용할 수 있는 옵션:

### 8.1 후원 버튼
- Ko-fi, Buy Me a Coffee 등
- 푸터에 작은 버튼 배치

### 8.2 프리미엄 기능
- 광고 없는 버전 제공
- 추가 기능 제공 (예: 그래프 내보내기, 고급 필터링)

---

## 9. 결론 및 권장사항

### 권장 접근 방식:
1. **1단계**: 푸터 영역에만 광고 배치 (728x90)
2. **2단계**: 사용자 반응 확인 후 사이드바 추가 (데스크톱 전용)
3. **3단계**: 필요시 그래프 하단 추가

### 우선순위:
1. 사용자 경험 유지
2. 점진적 수익화
3. 사용자 피드백 기반 조정

### 구현 시기:
- 현재는 콘텐츠와 기능 완성도 향상에 집중
- 사용자 기반이 어느 정도 형성된 후 광고 도입 검토
- 또는 후원 시스템을 먼저 도입하여 사용자 반응 확인

---

## 10. 참고 자료

- [Google AdSense 가이드](https://support.google.com/adsense)
- [웹사이트 광고 배치 모범 사례](https://www.google.com/adsense/start/optimization-tips)
- [GDPR 및 개인정보 보호](https://gdpr.eu/)
