# EconomyWordmap

경제 용어 간의 비례, 반비례, 상관관계를 Cytoscape를 활용하여 시각화하는 웹사이트입니다.

## 기능

- 🔗 경제 용어 간 관계 그래프 시각화 (Cytoscape)
- 📊 관계 유형별 색상 구분 (비례/반비례/상관관계)
- 💡 노드 및 엣지 클릭으로 상세 정보 확인
- 🖱️ 드래그 및 줌으로 그래프 탐색
- 🔍 실시간 용어 검색 (이름, 설명, 카테고리)
- 📑 한글/영문 인덱스로 용어 탐색
- 📖 사용 방법 가이드
- 🔗 관계 단어 클릭으로 연속 탐색

## 기술 스택

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Cytoscape (그래프 시각화)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 데이터 구조

용어와 관계 데이터는 `src/data/terms.json` 파일에서 관리됩니다.

### 용어 (Term)
- `id`: 고유 식별자
- `name`: 용어명 (영문 병기 가능, 예: "인플레이션 (Inflation)")
- `description`: 설명
- `category`: 카테고리 (선택)

### 관계 (Relation)
- `id`: 고유 식별자
- `term1Id`: 첫 번째 용어 ID
- `term2Id`: 두 번째 용어 ID
- `type`: 관계 유형 (proportional/inverse/correlation)
- `description`: 관계 설명 (선택)
- `strength`: 관계 강도 (weak/medium/strong, 선택)
- `bidirectional`: 양방향 관계 여부 (선택)
- `reverseType`: 역방향 관계 타입 (양방향일 때, 선택)
- `reverseDescription`: 역방향 관계 설명 (양방향일 때, 선택)
- `reverseStrength`: 역방향 관계 강도 (양방향일 때, 선택)

## 주요 기능

### 그래프 시각화
- 노드 클릭 시 상세 정보 모달 표시 및 자동 확대
- 엣지 클릭 시 관계 정보 툴팁 표시
- 드래그 및 마우스 휠로 그래프 탐색
- 물리 시뮬레이션으로 부드러운 노드 움직임

### 용어 검색
- 실시간 검색 (용어 이름, 설명, 카테고리)
- 검색 결과 드롭다운 표시 (최대 10개)
- 검색 결과 클릭 시 그래프에서 해당 노드로 이동

### 용어 인덱스
- 한글 인덱스: 자음별 분류 (쌍자음은 기본 자음으로 매핑)
- 영문 인덱스: 알파벳별 분류 (괄호 안 영어도 포함)
- 각 섹션 클릭 시 해당 용어 목록 표시

### 관계 탐색
- 모달에서 관계 단어 클릭으로 연속 탐색 가능
- 양방향 관계 표시 및 역방향 정보 제공

자세한 내용은 [기능 명세서](docs/features.md)를 참고하세요.

## 라이선스

MIT
