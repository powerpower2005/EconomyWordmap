# 구현 계획서 (Implementation Plan)

## 개요

이 문서는 `plan.md`의 개선 사항을 구체적으로 구현하기 위한 상세 계획입니다.

---

## 1. 단기 개선사항 (필수)

### 1.1 그래프 레이아웃 최적화

**목표**: 그래프가 더 보기 좋고 탐색하기 쉽도록 레이아웃 개선

**구현 방법**:
1. Cytoscape `cose` 레이아웃 파라미터 튜닝
   - `idealEdgeLength`: 엣지 길이 조정 (현재 100 → 120-150)
   - `nodeRepulsion`: 노드 간 반발력 조정 (현재 400000 → 600000)
   - `gravity`: 중력 설정 조정 (현재 0.25 → 0.1-0.2)
2. 레이아웃 실행 후 자동 fit 조정
3. 노드 간 최소 거리 보장

**파일 수정**:
- `src/components/RelationGraph.tsx`: `layout` 객체 파라미터 조정

**예상 작업 시간**: 1-2시간

---

### 1.2 노드 색상 조정 (연결 수에 따라)

**목표**: 노드의 연결 수(degree)에 따라 색상으로 표현

**구현 방법**:
1. 각 노드의 연결 수 계산
   ```typescript
   const getNodeDegree = (nodeId: string, relations: Relation[]): number => {
     return relations.filter(r => r.term1Id === nodeId || r.term2Id === nodeId).length;
   };
   ```
2. 연결 수에 따른 색상 그라데이션 정의
   - 최소 연결: 밝은 색상 (예: #e0e7ff)
   - 중간 연결: 중간 색상 (예: #818cf8)
   - 최대 연결: 진한 색상 (예: #4338ca)
3. Cytoscape 스타일에서 동적 색상 적용
   ```typescript
   'background-color': function(node) {
     const degree = node.data('degree');
     return getColorByDegree(degree, minDegree, maxDegree);
   }
   ```
4. 노드 데이터에 `degree` 속성 추가

**파일 수정**:
- `src/components/RelationGraph.tsx`: 노드 생성 시 degree 계산 및 색상 로직 추가
- `src/utils/dataLoader.ts`: 연결 수 계산 유틸리티 함수 추가 (선택)

**예상 작업 시간**: 2-3시간

---

### 1.3 반응형 디자인 개선

**목표**: 다양한 화면 크기에서 그래프가 잘 보이도록 개선

**구현 방법**:
1. 그래프 컨테이너 높이를 뷰포트 기반으로 조정
   - 데스크톱: `calc(100vh - 250px)`
   - 태블릿: `calc(100vh - 200px)`
   - 모바일: `calc(100vh - 180px)`
2. 헤더 및 범례 영역 반응형 조정
3. Cytoscape `resize()` 메서드로 창 크기 변경 감지
   ```typescript
   window.addEventListener('resize', () => {
     cy.resize();
   });
   ```

**파일 수정**:
- `src/components/RelationGraph.tsx`: 반응형 스타일 및 resize 이벤트 추가
- `src/pages/Home.tsx`: 반응형 레이아웃 조정

**예상 작업 시간**: 1-2시간

---

### 1.4 용어 검색 기능

**목표**: 드롭다운으로 용어 검색 및 선택, 선택된 노드 크기 증가

**구현 방법**:

#### 1.4.1 검색 컴포넌트 생성
- `src/components/TermSearch.tsx` 생성
- 입력 필드 + 드롭다운 리스트
- 실시간 검색 필터링

#### 1.4.2 검색 로직
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
const filteredTerms = searchTerms(searchQuery);
```

#### 1.4.3 노드 선택 및 크기 변경
1. 검색 결과에서 용어 선택 시 `selectedTermId` 상태 업데이트
2. Cytoscape에서 해당 노드 찾기
   ```typescript
   const selectedNode = cy.getElementById(selectedTermId);
   ```
3. 노드 크기 애니메이션으로 증가
   ```typescript
   selectedNode.animate({
     style: { width: 120, height: 120 },
     duration: 300
   });
   ```
4. 다른 노드는 원래 크기로 복원
5. 선택된 노드로 그래프 중심 이동 (선택)
   ```typescript
   cy.center(selectedNode);
   cy.fit(selectedNode, 100);
   ```

#### 1.4.4 UI/UX
- 검색 입력 필드에 포커스 시 드롭다운 표시
- 키보드 네비게이션 (↑↓ 방향키, Enter 선택)
- 선택 해제 기능 (X 버튼 또는 빈 영역 클릭)

**파일 생성/수정**:
- `src/components/TermSearch.tsx`: 새 파일 생성
- `src/components/RelationGraph.tsx`: 선택 상태 관리 및 노드 크기 변경 로직 추가
- `src/pages/Home.tsx`: 검색 컴포넌트 통합

**예상 작업 시간**: 4-5시간

---

### 1.5 그래프 애니메이션

**목표**: 그래프 움직임, 선택 애니메이션 추가

**구현 방법**:

#### 1.5.1 레이아웃 애니메이션
1. Cytoscape 레이아웃 실행 시 애니메이션 활성화
   ```typescript
   layout: {
     animate: true,
     animationDuration: 1000,
     animationEasing: 'ease-out'
   }
   ```

#### 1.5.2 노드 클릭 선택 애니메이션
1. 노드 클릭 시 선택 상태 표시
   ```typescript
   cy.on('tap', 'node', function(evt) {
     const node = evt.target;
     node.animate({
       style: { 
         'border-width': 4,
         'border-color': '#fbbf24'
       },
       duration: 200
     });
   });
   ```
2. 다른 노드 클릭 시 이전 선택 해제

#### 1.5.3 엣지 클릭 선택 애니메이션
1. 엣지 클릭 시 두께 증가 및 색상 강조
   ```typescript
   cy.on('tap', 'edge', function(evt) {
     const edge = evt.target;
     edge.animate({
       style: { width: 5, opacity: 1 },
       duration: 200
     });
   });
   ```

#### 1.5.4 검색 선택 시 크기 변화 애니메이션
- 1.4.3에서 구현한 노드 크기 변경에 애니메이션 적용 (이미 포함)

**파일 수정**:
- `src/components/RelationGraph.tsx`: 애니메이션 설정 및 이벤트 핸들러 수정

**예상 작업 시간**: 2-3시간

---

## 2. 중기 개선사항 (선택)

### 2.1 카테고리별 색상 구분

**목표**: 노드 색상에 카테고리 정보 반영

**구현 방법**:
1. 카테고리별 색상 맵 정의
   ```typescript
   const categoryColors = {
     '거시경제': '#3b82f6',
     '금융': '#10b981',
     '국제경제': '#f59e0b',
     // ...
   };
   ```
2. 노드 색상을 카테고리 기반으로 설정
3. 연결 수와 카테고리를 조합한 색상 적용 (예: 카테고리 색상 + 연결 수에 따른 명도 조정)

**파일 수정**:
- `src/components/RelationGraph.tsx`: 카테고리 색상 로직 추가

**예상 작업 시간**: 2-3시간

---

### 2.2 그래프 레이아웃 알고리즘 선택 옵션

**목표**: 사용자가 레이아웃 알고리즘 선택 가능

**구현 방법**:
1. 레이아웃 알고리즘 옵션 제공 (cose, grid, circle, breadthfirst 등)
2. UI에 드롭다운 또는 버튼 그룹 추가
3. 레이아웃 변경 시 애니메이션 적용

**파일 수정**:
- `src/components/RelationGraph.tsx`: 레이아웃 선택 로직 추가
- `src/pages/Home.tsx`: 레이아웃 선택 UI 추가

**예상 작업 시간**: 3-4시간

---

### 2.3 데이터 내보내기/가져오기 기능

**목표**: JSON 형식으로 데이터 내보내기/가져오기

**구현 방법**:
1. 내보내기: 현재 `terms.json` 데이터를 다운로드
2. 가져오기: JSON 파일 업로드 및 검증
3. 데이터 로드 후 그래프 재렌더링

**파일 생성/수정**:
- `src/utils/dataExporter.ts`: 새 파일 생성
- `src/utils/dataImporter.ts`: 새 파일 생성
- `src/pages/Home.tsx`: 내보내기/가져오기 UI 추가

**예상 작업 시간**: 3-4시간

---

### 2.4 엣지 다중 연결 시각화 개선

**목표**: 한 노드에 여러 엣지가 연결된 경우 시각화 개선

**구현 방법**:
1. 엣지 커브 스타일 조정 (bezier, taxi 등)
2. 엣지 간 간격 조정
3. 엣지 레이블 위치 최적화

**파일 수정**:
- `src/components/RelationGraph.tsx`: 엣지 스타일 조정

**예상 작업 시간**: 2-3시간

---

## 3. 장기 개선사항 (고려)

### 3.1 특정 용어 중심으로 그래프 필터링

**목표**: 선택한 용어와 직접 연결된 노드만 표시

**구현 방법**:
1. 필터링 로직 구현 (BFS/DFS로 연결된 노드만 추출)
2. 필터링된 노드/엣지만 그래프에 표시
3. 필터 해제 기능

**예상 작업 시간**: 4-5시간

---

### 3.2 관계 히스토리/타임라인

**목표**: 관계의 시간적 변화 추적 (향후 확장)

**예상 작업 시간**: 미정

---

### 3.3 고급 애니메이션 효과

**목표**: 트랜지션, 페이드 등 고급 애니메이션

**예상 작업 시간**: 3-4시간

---

## 구현 순서 (우선순위)

### Phase 1: 기본 기능 완성 (1주)
1. ✅ 그래프 레이아웃 최적화
2. ✅ 노드 색상 조정 (연결 수)
3. ✅ 반응형 디자인 개선

### Phase 2: 검색 및 애니메이션 (1주)
4. ✅ 용어 검색 기능
5. ✅ 그래프 애니메이션

### Phase 3: 중기 개선 (2주)
6. 카테고리별 색상 구분
7. 그래프 레이아웃 알고리즘 선택
8. 데이터 내보내기/가져오기
9. 엣지 다중 연결 시각화 개선

### Phase 4: 장기 개선 (향후)
10. 특정 용어 중심 필터링
11. 고급 애니메이션 효과

---

## 기술적 고려사항

### Cytoscape API 활용
- `cy.animate()`: 애니메이션
- `cy.center()`, `cy.fit()`: 뷰 조정
- `cy.getElementById()`: 노드/엣지 선택
- `cy.style()`: 동적 스타일 적용

### 성능 최적화
- 대량 데이터 처리 시 가상화 고려
- 애니메이션 프레임 드롭 방지
- 메모리 누수 방지 (이벤트 리스너 정리)

### 데이터 구조 변경
- `terms.json`에서 `strength` 필드 제거 필요 (현재 남아있음)
- 노드 데이터에 `degree` 속성 추가

---

## 파일 구조 변경 예정

```
src/
├── components/
│   ├── RelationGraph.tsx      # 수정
│   └── TermSearch.tsx         # 신규
├── utils/
│   ├── dataLoader.ts          # 수정 (선택)
│   ├── dataExporter.ts        # 신규 (중기)
│   └── dataImporter.ts        # 신규 (중기)
└── pages/
    └── Home.tsx               # 수정
```

---

## 체크리스트

### Phase 1
- [ ] 그래프 레이아웃 최적화
- [ ] 노드 색상 조정 (연결 수)
- [ ] 반응형 디자인 개선

### Phase 2
- [ ] 용어 검색 컴포넌트 생성
- [ ] 검색 기능 통합
- [ ] 노드 선택 및 크기 변경
- [ ] 그래프 레이아웃 애니메이션
- [ ] 노드/엣지 클릭 애니메이션

### Phase 3
- [ ] 카테고리별 색상 구분
- [ ] 레이아웃 알고리즘 선택
- [ ] 데이터 내보내기/가져오기
- [ ] 엣지 다중 연결 시각화

---

## 참고 자료

- [Cytoscape.js 공식 문서](https://js.cytoscape.org/)
- [Cytoscape.js 레이아웃](https://js.cytoscape.org/#layouts)
- [Cytoscape.js 스타일](https://js.cytoscape.org/#style)
