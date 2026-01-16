# 현재 아키텍처 및 구현 상태

**마지막 업데이트**: 2024-12-19

---

## 프로젝트 개요

경제 용어 간의 비례, 반비례, 상관관계를 Cytoscape를 활용하여 시각화하는 단일 페이지 웹 애플리케이션입니다.

---

## 기술 스택

### 핵심 기술
- **React 18.2.0**: UI 프레임워크
- **TypeScript 5.3.3**: 타입 안정성
- **Vite 5.0.8**: 빌드 도구 및 개발 서버
- **Tailwind CSS 3.3.6**: 스타일링
- **Cytoscape 3.27.0**: 그래프 시각화 라이브러리

### 개발 도구
- React 플러그인, PostCSS, Autoprefixer

---

## 아키텍처 구조

### 파일 구조

```
wordmap/
├── src/
│   ├── components/
│   │   └── RelationGraph.tsx      # Cytoscape 그래프 컴포넌트
│   ├── pages/
│   │   └── Home.tsx               # 메인 페이지
│   ├── data/
│   │   └── terms.json             # 용어 및 관계 데이터
│   ├── utils/
│   │   └── dataLoader.ts          # 데이터 로딩 유틸리티
│   ├── types.ts                   # TypeScript 타입 정의
│   ├── App.tsx                    # 루트 컴포넌트
│   ├── main.tsx                   # 엔트리 포인트
│   └── index.css                  # 전역 스타일
├── docs/                          # 문서 (빌드 제외)
│   ├── plan.md                    # 프로젝트 계획
│   ├── implementation-plan.md     # 상세 구현 계획
│   └── now.md                     # 현재 상태 (이 파일)
├── public/                        # 정적 파일
├── index.html                     # HTML 템플릿
├── package.json                   # 의존성 관리
├── tsconfig.json                  # TypeScript 설정
├── vite.config.ts                 # Vite 설정
└── tailwind.config.js             # Tailwind 설정
```

### 컴포넌트 구조

```
App
└── Home
    ├── 통계 카드 (용어 수, 관계 수)
    ├── 사용 방법 안내
    └── RelationGraph
        ├── Cytoscape 인스턴스
        ├── 노드 (용어)
        └── 엣지 (관계)
```

---

## 데이터 구조

### TypeScript 타입 정의

```typescript
// types.ts
- RelationType: 'proportional' | 'inverse' | 'correlation'
- Term: { id, name, description, category? }
- Relation: { id, term1Id, term2Id, type, description?, strength? }
- TermWithRelations: Term + relations[]
```

### 데이터 파일 구조

**`src/data/terms.json`**
- `terms`: 용어 배열 (현재 8개)
- `relations`: 관계 배열 (현재 7개)
- **참고**: `strength` 필드는 아직 데이터에 남아있으나, 계획상 제거 예정

---

## 현재 구현된 기능

### ✅ 완료된 기능

1. **기본 프로젝트 구조**
   - React + TypeScript + Vite 설정 완료
   - Tailwind CSS 통합 완료

2. **Cytoscape 그래프 시각화**
   - 노드(용어) 및 엣지(관계) 렌더링
   - COSE 레이아웃 알고리즘 사용
   - 기본 스타일링 (노드: 원형, 엣지: 베지어 곡선)

3. **관계 유형별 색상 구분**
   - 비례 관계: 파란색 (#3b82f6)
   - 반비례 관계: 빨간색 (#ef4444)
   - 상관관계: 보라색 (#a855f7)

4. **인터랙티브 기능**
   - 그래프 드래그로 이동
   - 마우스 휠로 확대/축소
   - 노드 클릭 시 툴팁 (용어 정보)
   - 엣지 클릭 시 툴팁 (관계 정보)

5. **데이터 로딩**
   - JSON 파일에서 용어/관계 로드
   - 유틸리티 함수로 데이터 조회

6. **UI 구성**
   - 헤더 (제목, 설명)
   - 통계 카드 (용어 수, 관계 수)
   - 사용 방법 안내
   - 범례 표시

---

## 미구현 기능

### ❌ 단기 개선사항 (계획됨)

1. **그래프 레이아웃 최적화**
   - 현재 기본 COSE 파라미터 사용
   - 최적화 필요

2. **노드 색상 조정 (연결 수 기반)**
   - 현재 모든 노드 동일 색상 (#6366f1)
   - 연결 수에 따른 색상 그라데이션 미구현

3. **반응형 디자인 개선**
   - 기본 반응형은 있으나 최적화 필요
   - 창 크기 변경 시 그래프 리사이즈 미구현

4. **용어 검색 기능**
   - 검색 UI 없음
   - 노드 선택 기능 없음

5. **그래프 애니메이션**
   - 레이아웃 애니메이션 없음
   - 노드/엣지 클릭 애니메이션 없음
   - 선택 시 크기 변화 애니메이션 없음

### ❌ 중기/장기 개선사항
- 카테고리별 색상 구분
- 레이아웃 알고리즘 선택
- 데이터 내보내기/가져오기
- 엣지 다중 연결 시각화 개선
- 특정 용어 중심 필터링

---

## 현재 코드 상태

### 주요 컴포넌트

#### `RelationGraph.tsx`
- **역할**: Cytoscape 그래프 렌더링 및 인터랙션
- **상태 관리**: `useRef`로 Cytoscape 인스턴스 관리
- **이벤트**: 노드/엣지 클릭 시 툴팁 표시
- **스타일**: 고정 색상, 고정 크기 노드

#### `Home.tsx`
- **역할**: 메인 페이지 레이아웃
- **기능**: 통계 표시, 사용 방법 안내, 그래프 컴포넌트 렌더링

#### `dataLoader.ts`
- **역할**: JSON 데이터 로드 및 조회
- **함수**: `loadTerms()`, `loadRelations()`, `getTermById()`, `searchTerms()` 등

---

## 데이터 현황

### 현재 등록된 용어
- 총 8개 용어
- 카테고리: 거시경제, 금융, 국제경제

### 현재 등록된 관계
- 총 7개 관계
- 관계 유형 분포: 비례(3), 반비례(2), 상관관계(2)

---

## 알려진 이슈

1. **데이터 구조 불일치**
   - `types.ts`의 `Relation`에 `strength?` 필드가 있으나, 계획상 제거 예정
   - `terms.json`에 아직 `strength` 필드가 남아있음

2. **성능 최적화 미완료**
   - 대량 데이터 처리 시 성능 테스트 필요
   - 애니메이션 프레임 드롭 가능성

3. **접근성 미고려**
   - 키보드 네비게이션 없음
   - 스크린 리더 지원 없음

---

## 다음 단계

### 즉시 구현 가능 (Phase 1)
1. 그래프 레이아웃 최적화
2. 노드 색상 조정 (연결 수 기반)
3. 반응형 디자인 개선

### 단기 구현 (Phase 2)
4. 용어 검색 기능
5. 그래프 애니메이션

자세한 구현 계획은 `docs/implementation-plan.md` 참조

---

## 빌드 및 실행

### 개발 서버 실행
```bash
npm install
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 결과물
- `dist/` 디렉토리에 생성
- `docs/` 디렉토리는 빌드에 포함되지 않음

---

## 의존성 현황

### 프로덕션 의존성
- react: ^18.2.0
- react-dom: ^18.2.0
- cytoscape: ^3.27.0

### 개발 의존성
- TypeScript, Vite, Tailwind CSS 등

---

## 참고 문서

- `docs/plan.md`: 프로젝트 전체 계획
- `docs/implementation-plan.md`: 상세 구현 계획

---

**문서 버전**: 1.0  
**마지막 업데이트**: 2024-12-19
