# EconomyWordmap

경제 용어 간의 비례, 반비례, 상관관계를 Cytoscape를 활용하여 시각화하는 웹사이트입니다.

## 기능

- 🔗 경제 용어 간 관계 그래프 시각화 (Cytoscape)
- 📊 관계 유형별 색상 구분 (비례/반비례/상관관계)
- 💡 노드 및 엣지 클릭으로 상세 정보 확인
- 🖱️ 드래그 및 줌으로 그래프 탐색

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
- `name`: 용어명
- `description`: 설명
- `category`: 카테고리 (선택)

### 관계 (Relation)
- `id`: 고유 식별자
- `term1Id`: 첫 번째 용어 ID
- `term2Id`: 두 번째 용어 ID
- `type`: 관계 유형 (proportional/inverse/correlation)
- `description`: 관계 설명 (선택)
- `strength`: 관계 강도 (weak/medium/strong, 선택)

## 라이선스

MIT
