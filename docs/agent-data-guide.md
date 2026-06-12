# Wordmap 에이전트·개발자 데이터 운영 가이드

경제 용어·관계 데이터를 추가·수정할 때 따라야 하는 **단일 운영 문서**입니다.  
사용자용 프롬프트 예시는 [agent-recipes.md](./agent-recipes.md), 필드 정의는 [data-schema.md](./data-schema.md)를 참고하세요.

## 문서 언어 (역할별)

| 역할 | 언어 | 문서 |
|------|------|------|
| 규칙·진입·스키마 | English | [AGENTS.md](../AGENTS.md), [.cursor/rules/wordmap-data.mdc](../.cursor/rules/wordmap-data.mdc), [data-schema.md](./data-schema.md) |
| 절차·품질·Git | **한국어 (본 문서)** | agent-data-guide.md |
| 사용자 프롬프트 | 한국어 | agent-recipes.md, add_terms.md |
| 데이터 본문 | 한국어 | `description`, 관계 설명 (필드명·enum은 영어) |

에이전트: **명령·경로·검증은 영어 그대로**, **설명 문장 톤은 이 문서(한국어)를 따릅니다.**

## 문서 맵

| 문서 | 용도 | 언어 |
|------|------|------|
| [agent-data-guide.md](./agent-data-guide.md) | 파이프라인, 작업 절차, 검증, Git | KO |
| [data-schema.md](./data-schema.md) | Term / Relation YAML 스키마 | EN |
| [agent-recipes.md](./agent-recipes.md) | 프롬프트 (KO) + 실행 단계 (EN) | KO + EN |
| [categories.md](./categories.md) | 카테고리 목록·동기화 | KO |
| [add_terms.md](./add_terms.md) | 사용자 프롬프트 요약 | KO |
| [AGENTS.md](../AGENTS.md) § Investor learning path | 투자자 학습 단계·앵커·검토·보강 | EN |

용어·관계·명제를 **늘릴 때** (1) 콘텐츠는 **시장→매크로→금리→리스크→이론→명제** 단계에 배치하고, (2) **같은 작업에서** [AGENTS.md § Curriculum review and supplement](../AGENTS.md#curriculum-review-and-supplement-required)를 수행하세요 — **검토만**이 아니라, 학습 경로에 **빈 곳이 있으면 용어·관계·명제·앵커를 추가**합니다. 단계는 **분류·권장 순서**이지 사용자 강제 순서가 아닙니다. `stockMarketImportance`는 뉴스 중요도이지 단계 번호가 아닙니다.

---

## 1. 데이터 파이프라인

**소스 오브 트루스 (직접 편집):**

- `src/data/terms-all.yaml` — 용어 (`terms:` 배열)
- `src/data/relations.yaml` — 관계 (`relations:` 배열)
- `src/data/curriculum.yaml` — 학습 탭 단계·권장 순서 (`curriculum:`)

**생성물 (편집 금지):**

- `src/data/terms.json` — 빌드 시 자동 생성·병합

**흐름:**

1. YAML 수정
2. `node build-data.js` 또는 `npm run dev` / `npm run build`
   - [scripts/data-build.js](../scripts/data-build.js): YAML → JSON 병합
   - [scripts/term-history.js](../scripts/term-history.js): Git 이력 → 용어별 `updatedAt`, `changelog`
3. 앱 [src/utils/dataLoader.ts](../src/utils/dataLoader.ts)가 `terms.json` 로드

개발 중 YAML 저장 시 [vite-plugin-yaml-to-json.js](../vite-plugin-yaml-to-json.js)가 동일 빌드를 실행합니다.

### 변경 이력 (changelog)

- `terms-all.yaml` 커밋: 이름·설명·카테고리·주식시장 중요도 변경 기록
- `relations.yaml` 커밋: 관계 추가·수정·삭제 → **연결된 양쪽 용어**에 관계 이력 기록
- UI: 검색 정렬(최근 수정순), 용어 모달의「변경 이력」
- **커밋 후** 빌드해야 이력에 반영됩니다. 미커밋 로컬 변경만으로는 Git diff 기반 이력이 완전하지 않을 수 있습니다.

---

## 2. 작업 유형별 절차

각 작업은 **Before → Edit → Validate → Commit** 순서를 따릅니다.  
검증 항목은 작업 유형별로 [4.3 검증 매트릭스](#43-작업-유형별-검증-매트릭스)를 따르고, 작업 후 반드시 [4. 검증](#4-검증-작업-후-필수)을 수행합니다.

### A. 용어 추가

**Edit:** `terms-all.yaml`의 `terms:` 목록 **끝**에 블록 추가.

```yaml
  - id: sofr
    name: SOFR (Secured Overnight Financing Rate)
    description: "..."
    category: 금리
    stockMarketImportance: 8
```

**Before:**

- `grep "id: sofr" src/data/terms-all.yaml` — id 중복 없음 확인

**Validate:** [4. 검증](#4-검증-작업-후-필수) 수행. 추가 수동 확인은 [4.3 매트릭스](#43-작업-유형별-검증-매트릭스)의 "용어 추가" 행.

**Commit:** 관계도 추가할 경우 **같은 커밋**에 `relations.yaml` 포함 권장.

---

### B. 용어 설명·메타 수정

- 해당 `- id:` 블록만 수정 (`name`, `description`, `category`, `stockMarketImportance`)
- 설명 톤: 단정적 인과보다 **경향**, **조건부**, **함께 분석** (예: `tax-cut`, `tax-increase` 항목 참고)
- `changelog` / `updatedAt`은 YAML에 **수동으로 넣지 않음** (Git 자동)
- **Validate:** [4. 검증](#4-검증-작업-후-필수) 수행. `category` 변경 시 [categories.md](./categories.md) 어휘 확인.

---

### C. 관계 추가

**Edit:** `relations.yaml` 끝에 새 블록.

1. 파일 **마지막** `- id: r###` 확인 → 다음 번호 사용 (예: r204 다음은 **r205**)
2. `term1Id`, `term2Id`는 `terms-all.yaml`에 **존재하는 id**
3. `type`: `proportional` | `inverse` | `correlation` (방향성 경향 → 엣지 **색**)
4. `strength`: `weak` | `medium` | `strong` (권장)
5. 긴 `description`은 **쌍따옴표**로 감싸기
6. (선택) 의미·맥락 필드로 학습 품질 강화:
   - `nature`: `causal` | `correlational` | `definitional` | `hierarchical` | `policy` (의미 축 → 엣지 **실선/점선**, `correlational`만 점선)
   - `mechanism`: 작동 메커니즘 (한국어 산문)
   - `conditions`: 성립 조건·국면 (예: `고인플레 국면`)
   - `lag`: 시차 (예: `1~2분기 후`)
   - 모두 optional이라 기존 관계는 그대로 유효. 핵심 인과 사슬(인플레이션→금리→채권 등)부터 점진 backfill 권장.
   - 필드 정의: [data-schema.md](./data-schema.md) 참고.

**Before:**

```bash
grep "id: r205" src/data/relations.yaml
grep "id: sofr" src/data/terms-all.yaml
```

**Validate:** [4. 검증](#4-검증-작업-후-필수) 수행. 특히 [4.2](#42-수동-검증-자동으로-안-잡힘--에이전트가-직접-확인)의 **중복 관계쌍**·**방향성**을 직접 확인 (자동 검사기가 못 잡음).

---

### D. 관계 수정

- 관계 `id`는 **유지**, 필드만 수정 (설명 보강이 가장 흔함)
- UI 이력 요약 예: `관계 설명 수정`, `관계 유형·관계 설명 수정`
- **Validate:** [4. 검증](#4-검증-작업-후-필수) + enum(`type`/`nature`/`strength`)·방향성·양방향 필드 정합 확인.

---

### E. 관계 삭제

- `- id: r###` 블록 전체 제거
- 그래프에서 엣지 제거, 양쪽 용어에 `관계 삭제` 이력 생성
- 의도적 삭제인지 작업 메모·커밋 메시지에 명시
- **Validate:** [4. 검증](#4-검증-작업-후-필수) 수행. 삭제로 **고아 노드**(연결 0개)가 생기는지 확인.

---

### F. 용어 + 관계 일괄 작업 (권장 패턴)

1. `terms-all.yaml`에 신규 용어
2. `relations.yaml`에 기존 용어 ↔ 신규 용어 관계
3. 필요 시 기존 용어 간 추가 관계
4. `node build-data.js` → Git 커밋 (한 커밋 가능, 이력은 항목별 분리 기록)

---

## 3. YAML 작성 규칙

| 규칙 | 이유 |
|------|------|
| 긴 `description`은 `"..."` 로 감싸기 | `=`, `:`, `#` 등으로 YAML 파서·Git 이력 파싱 실패 |
| 들여쓰기 2칸, `- id:` 리스트 형식 유지 | js-yaml 호환 |
| 관계 `id` 재사용·변경 금지 | 그래프 edge id·이력 충돌 |
| `term1Id` → `term2Id` 방향 유지 | [RelationGraph](../src/components/RelationGraph.tsx) outbound/inbound 표시 |
| `id`는 영어 소문자·하이픈 (kebab-case) | 프로젝트 규칙 |
| `name`은 `한글 (English)` 형식 | 검색·인덱스 일관성 |

---

## 4. 검증 (작업 후 필수)

**모든** 데이터 변경 — 용어 추가, 용어 수정, 관계 추가·수정·삭제 — 후에는 아래 순서로 검증합니다. 건너뛰지 않습니다.

```bash
node build-data.js        # YAML → terms.json 변환·병합·이력 적용
npm run validate-data     # 자동 검사 (4.1)
npm run build             # PR 전 TypeScript·Vite 빌드
```

### 4.1 자동 검증 (`validate-data`가 잡는 것)

- term `id` 누락·중복, `name` 누락 (error) / `description` 누락 (warning)
- relation `id` 누락·중복, `term1Id` / `term2Id` 누락
- relation이 가리키는 term id가 terms-all에 없음 (**기존**은 warning, **신규**는 반드시 회피)
- `type` / `reverseType` enum (`proportional` | `inverse` | `correlation`)
- `nature` enum (`causal` | `correlational` | `definitional` | `hierarchical` | `policy`)
- `strength` / `reverseStrength` enum (`weak` | `medium` | `strong`)

통과 메시지: `✅ Data validation passed (N terms, M relations)`. error가 있으면 종료 코드 1 → **반드시 수정 후 재검증.**

### 4.2 수동 검증 (자동으로 안 잡힘 — 에이전트가 직접 확인)

| 항목 | 확인 방법 |
|------|-----------|
| 중복 관계쌍 | 같은 (`term1Id`, `term2Id`) 조합이 이미 있는지 `grep`. 방향만 바뀐 중복도 점검 |
| 카테고리 어휘 | 신규 `category`가 [categories.md](./categories.md) 목록에 있는지. 새 값은 임의 생성 금지 — 합의 후 UI 동기화 |
| 방향성 일관성 | `term1Id → term2Id` 방향이 `description`·`type` 의미와 일치 (RelationGraph outbound/inbound 표시 기준) |
| 양방향 필드 | `bidirectional: true`면 `reverseDescription` 작성, 필요 시 `reverseType` / `reverseStrength` |
| nature ↔ 의미 정합 | 정책 대응=`policy`, 정의·측정=`definitional` 등 `nature`가 `description` 의미와 어긋나지 않게 |
| YAML 인용 | `=`, `:`, `#` 포함 `description`은 `"..."`로 감쌌는지 |

### 4.3 작업 유형별 검증 매트릭스

| 작업 | 자동 (4.1) | 추가 수동 확인 (4.2) |
|------|-----------|----------------------|
| 용어 추가 | id 중복·name 누락 | category 어휘, `name`이 `한글 (English)` 형식, **학습 단계(1–5) 배정·앵커/관계 검토·갭 시 보강 추가** ([AGENTS.md](../AGENTS.md#curriculum-review-and-supplement-required)) |
| 용어 수정 | — | description 톤(경향·조건부) 유지, 단계·앵커 목록 갱신·누락 관계/명제 **추가** 필요 여부 |
| 관계 추가 | id·term 참조·enum | **중복 관계쌍**, 방향성, (선택) nature/mechanism, **단계 클러스터 보강·브릿지·명제 갭 시 추가** |
| 관계 수정 | enum | `id` 유지, 방향성·nature 정합, 양방향 필드 |
| 관계 삭제 | — | 의도적 삭제 명시(커밋 메시지), 고아 노드 발생 여부, 학습 경로 상 대체 관계 **추가** 필요 여부 |
| 명제 추가·수정 | termIds 참조 | holds/fails·톤, **stage 6 매핑·클러스터 명제 갭 시 명제/관계 추가** |

**최종 체크리스트:**

- [ ] `✅ terms-all.yaml → terms.json 변환 완료`
- [ ] `✅ relations.yaml → terms.json 병합 완료`
- [ ] `✅ 용어·관계 변경 이력 적용` (Git 저장소일 때)
- [ ] `✅ Data validation passed` (error 0)
- [ ] 4.2 / 4.3 수동 항목 확인 완료
- [ ] `npm run build` 통과 (PR 전)

---

## 5. Git·커밋

| 동작 | UI 이력 |
|------|---------|
| YAML만 수정, 커밋 없음 | 이력 미반영 또는 불완전 |
| YAML 수정 + 커밋 + build | `changelog`, `updatedAt` 갱신 |
| `terms.json`만 커밋 | **비권장** — 소스와 불일치 |

**커밋 메시지 예:**

- `data: add SOFR term and policy relations`
- `data: enrich inflation description and r18 relation`
- `data: add short/medium/long-term bond terms`

**push:** 사용자가 명시적으로 요청할 때만 수행.

---

## 6. 하지 말 것

- `src/data/terms.json` 직접 편집·커밋
- `src/data/terms/*.yaml` 만 수정 (빌드 파이프라인 **미사용**, 레거시)
- 존재하지 않는 `term1Id` / `term2Id`로 관계 추가
- `changelog`, `updatedAt`을 terms-all에 수동 추가 (자동 생성 필드)

---

## 7. 카테고리

신규 용어는 **이미 terms-all에 쓰인 category 문자열**을 우선 재사용하세요.  
목록·UI 동기화: [categories.md](./categories.md).

---

## 8. 관련 코드 위치

| 역할 | 경로 |
|------|------|
| YAML → JSON | [scripts/data-build.js](../scripts/data-build.js) |
| Git 이력 | [scripts/term-history.js](../scripts/term-history.js) |
| 데이터 검증 | [scripts/validate-data.js](../scripts/validate-data.js) |
| 타입 | [src/types.ts](../src/types.ts) |
| 로드 | [src/utils/dataLoader.ts](../src/utils/dataLoader.ts) |
| 변경 이력 UI | [src/components/TermChangelog.tsx](../src/components/TermChangelog.tsx) |
