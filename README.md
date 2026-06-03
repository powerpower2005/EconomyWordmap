# EconomyWordmap

경제 용어 간의 비례, 반비례, 상관관계를 Cytoscape를 활용하여 시각화하는 웹사이트입니다.

## 기능

- 🔗 경제 용어 간 관계 그래프 시각화 (Cytoscape)
- 📊 관계 유형별 색상 구분 (비례/반비례/상관관계)
- 💡 노드 및 엣지 클릭으로 상세 정보 확인
- 🖱️ 드래그 및 줌으로 그래프 탐색
- 🔍 실시간 용어 검색 (이름, 설명, 카테고리)
- 🎯 검색 필터 (주식시장 중요도별, 카테고리별)
- ⭐ 주식시장 중요도 시스템 (1-10 스케일, 별 표시)
- 📑 한글/영문 인덱스로 용어 탐색
- 📈 주식시장 중요도별 용어 분류
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

## GitHub Pages 배포

워크플로: [`.github/workflows/deploy_frontend.yml`](.github/workflows/deploy_frontend.yml) (`main` push 또는 **Actions → Run workflow**)

**서비스 URL (커스텀 도메인):** `https://economy-word.gaemi.dpdns.org/`  
**백업 (GitHub 기본):** `https://powerpower2005.github.io/EconomyWordmap/`

### GitHub에서 직접 설정할 항목

- [ ] **Settings → Pages** → Build and deployment: **GitHub Actions**
- [ ] **Settings → Pages** → **Custom domain:** `economy-word.gaemi.dpdns.org` → DNS 확인 후 **Enforce HTTPS**
- [ ] **Settings → Actions → General** → Workflow permissions: **Read and write permissions**
- [ ] **Settings → Secrets and variables → Actions → Variables**
  - `VITE_BASE` = `/` (커스텀 도메인 필수; 없으면 CI가 `/EconomyWordmap/` 로 빌드되어 깨짐)
  - `VITE_EMAILJS_*` — 피드백 폼용 ([docs/emailjs-setup.md](docs/emailjs-setup.md))

### DNS (`gaemi.dpdns.org` 관리 화면)

| Type | Host / Name | Value / Target |
|------|-------------|----------------|
| **CNAME** | `economy-word` | `powerpower2005.github.io` |

호스트 입력란이 FQDN이면 `economy-word.gaemi.dpdns.org` 로 넣는 UI도 있습니다. 전파 후 GitHub Pages에서 DNS check가 통과해야 합니다.

Private 저장소는 GitHub Pages 무료 플랜에서 제한될 수 있습니다. Public이 아니면 Pro 등 플랜을 확인하세요.

로컬 빌드 (커스텀 도메인과 동일 base):

```bash
# PowerShell
$env:VITE_BASE="/"; npm run build
npm run preview
```

## 데이터 구조

**편집 (소스):**

| 파일 | 내용 |
|------|------|
| `src/data/terms-all.yaml` | 용어 목록 |
| `src/data/relations.yaml` | 용어 간 관계 |

**생성물:** `src/data/terms.json` — `node build-data.js` 또는 `npm run dev` / `npm run build` 시 자동 생성. **직접 수정하지 마세요.**

```bash
node build-data.js      # YAML → JSON + Git 기반 변경 이력
npm run validate-data   # id 중복·고아 관계 검사
```

에이전트·기여자 가이드: [AGENTS.md](AGENTS.md) (EN 규칙) · [docs/agent-data-guide.md](docs/agent-data-guide.md) (KO 절차) · [docs/agent-recipes.md](docs/agent-recipes.md) (프롬프트 KO / 단계 EN)

### 용어 (Term)
- `id`: 고유 식별자 (kebab-case)
- `name`: 용어명 (예: "인플레이션 (Inflation)")
- `description`: 설명
- `category`: 카테고리 (선택)
- `stockMarketImportance`: 주식시장 중요도 1-10 (선택)
- `updatedAt`, `changelog`: 빌드 시 Git 이력에서 자동 부여 (UI 변경 이력)

### 관계 (Relation)
- `id`: `r1`, `r2`, … (신규는 파일 마지막 번호 + 1)
- `term1Id`, `term2Id`: 용어 ID (terms-all에 존재해야 함)
- `type`: proportional / inverse / correlation
- `description`, `strength`, `bidirectional`, `reverseDescription` 등 — [docs/data-schema.md](docs/data-schema.md)

## 주요 기능

### 그래프 시각화
- 노드 클릭 시 상세 정보 모달 표시 및 자동 확대
- 엣지 클릭 시 관계 정보 툴팁 표시
- 드래그 및 마우스 휠로 그래프 탐색
- 물리 시뮬레이션으로 부드러운 노드 움직임

### 용어 검색
- 실시간 검색 (용어 이름, 설명, 카테고리)
- 검색 필터 (주식시장 중요도, 카테고리)
- 다중 필터 선택 및 조합 가능
- 검색 결과 드롭다운 표시 (최대 20개, 중요도/카테고리 표시)
- 검색 결과 클릭 시 그래프에서 해당 노드로 이동

### 주식시장 중요도
- 1-10점 척도로 주식시장 영향력 평가
- 별(★☆) 형태로 시각화 (작은별 2개 = 큰별 1개)
- 중요도별 용어 그룹화 및 탐색
- 노드 상세 정보에 중요도 표시
- 중요도 필터로 핵심 용어 빠른 검색

### 용어 인덱스
- 한글 인덱스: 자음별 분류 (쌍자음은 기본 자음으로 매핑)
- 영문 인덱스: 알파벳별 분류 (괄호 안 영어도 포함)
- 각 섹션 클릭 시 해당 용어 목록 표시

### 관계 탐색
- 모달에서 관계 단어 클릭으로 연속 탐색 가능
- 양방향 관계 표시 및 역방향 정보 제공

## 카테고리

주요 카테고리 (전체·동기화: [docs/categories.md](docs/categories.md)):

- 거시경제, 국제경제, 금융, 통화, 통화정책, 정부, 원자재, 금리, 채권

## 최근 업데이트 (2024.01)

- ✨ 주식시장 중요도 시스템 추가 (1-10 스케일, 별 표시)
- 🔍 검색 필터 기능 (중요도별, 카테고리별)
- 📈 주식시장 중요도 탭 추가
- 🎨 카테고리 통합 (15개 → 7개)
- 📝 신규 용어 추가 (소비, 투자, 가계부채, 원자재 5종)
- 🔗 신규 관계 추가 (인플레이션-소비-투자-부채)

자세한 내용은 [기능 명세서](docs/features.md)를 참고하세요.

## 라이선스

MIT
