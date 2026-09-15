# AI가 읽는 Wordmap 지도

## 읽기 순서와 원칙

`AGENTS.md` → 작업별 규칙 → 검색 결과 ID → 원문 레코드 → 직접 연결된 레코드 순서로 읽는다.
파일 전체를 프롬프트에 붙이지 않는다. 다만 선택한 규칙 문서와 수정할 레코드는 끝까지 읽는다.
검색 요약은 위치 안내이지 사실의 대체물이 아니다. 검색 결과가 없다고 동의어나 유사 명제가 없다고 단정하지 않는다.

## 데이터 연결 계약

| 종류 | 유일한 편집 원본 | 연결 키 |
|---|---|---|
| 용어 | `src/data/terms-all.yaml` | `id` |
| 관계 | `src/data/relations.yaml` | `term1Id` → `term2Id`; 역방향은 `bidirectional` 및 reverse 필드 확인 |
| 명제 | `src/data/propositions.yaml` | `termIds`, 선택적 `relationIds` |
| 학습 섹션 | `src/data/curriculum.yaml` | `sections[].id` → `parts[].id` |
| 학습 파트 | 같은 curriculum 파일 | `termIds`, `propositionIds` |

한 개념을 여러 파일에서 설명할 수 있지만 정체성은 같은 ID로 연결한다. 제목·문장·줄 번호를 식별자로 쓰지 않는다.
관계는 작동 경로, 명제는 조건부 판단, 학습은 독자의 질문에 답하는 이야기다. 단순 동시 등장으로 인과관계를 생성하지 않는다.
`terms.json`은 생성물, `src/data/terms/*.yaml`은 빌드에서 제외된 레거시다.

## 원본 기반 조회 (읽기 전용)

```bash
node scripts/ai-context.js overview
node scripts/ai-context.js search "금리" 20 0
node scripts/ai-context.js search "금리" 20 20
node scripts/ai-context.js get interest-rate
node scripts/ai-context.js context interest-rate 20 0
node scripts/ai-context.js get sec-money-value
```

- Node와 프로젝트 의존성(`js-yaml`) 필요. 작업 디렉터리와 무관하게 스크립트 위치의 원본 YAML을 읽는다.
- `overview`: 현재 개수, 섹션·파트 ID/제목. 별도 인덱스 파일을 저장하지 않아 갱신 누락이 없다.
- `search`: ID·이름·설명·명제·본문의 문자열 검색. 의미 검색이 아니므로 한국어/영어 이름과 동의어를 추가 확인한다.
- `get`: 정확한 ID의 **전체 원문 데이터**와 소스 경로. 섹션은 모든 파트를 포함하므로 좁은 작업에서는 파트 ID를 쓴다.
- `context`: 현재 레코드, 직접 참조하는 `outgoing`, 현재 ID를 참조하는 `incoming`. 기본 20개, 최대 100개씩 조회한다.
- `total`, `hasMore`, `offset`을 확인하고 누락 없이 조사할 때 다음 페이지를 읽는다. incoming/outgoing은 같은 offset으로 각각 페이지 처리된다.
- 용어의 incoming에는 관계·명제·학습 파트가 나온다. 관계를 `get`으로 읽으면 반대편 용어와 방향·조건을 확인할 수 있다. 자동 다중 홉 확장은 하지 않는다.
- 출력은 조회 시점의 데이터다. YAML 변경 후 다시 조회한다. 없는 ID는 오류로 종료하며 번호를 추측해 만들지 않는다.

## 코드 작업 지도

| 목적 | 먼저 볼 파일 |
|---|---|
| 상위 메뉴·화면 복귀 | `src/App.tsx` |
| 학습 검색·본문·목차 | `src/pages/Learning.tsx` |
| 마크다운·대화 렌더링 | `src/components/MarkdownProse.tsx` |
| 명제 조건·반례 | `src/components/PropositionBody.tsx`, `src/pages/Propositions.tsx` |
| 용어 탐색·관계도 | `src/pages/Home.tsx`, `src/components/RelationGraph.tsx` |
| 읽기 위치·북마크 | `src/utils/readingState.ts`, `src/utils/learningProgress.ts` |
| 데이터 타입·조회 | `src/types.ts`, `src/utils/dataLoader.ts` |
| 빌드·검증·이력 | `scripts/data-build.js`, `scripts/validate-data.js`, `scripts/content-history.js` |
| 구조적 학습 갭 | `scripts/audit-learning.js` |

## 작업 결과 형식

1. 범위: 대상 질문, 포함/제외 파일, 검토만인지 적용인지.
2. 근거: `종류 / ID / 원본 파일 / 확인한 내용`으로 기록한다. 파일 전체 요약보다 변경 근거를 남긴다.
3. 변경: 기존 보강 / 새 항목 / 연결 수정 / 제외 이유를 구분한다.
4. 검증: 실제 실행 결과와 미검증 항목. 구조적 통과와 경제적 타당성을 구분한다.

기사 검토는 [topic-review.md](topic-review.md)의 고정 4개 섹션을 우선 사용한다.

## 커질 때 유지하는 방법

- 규칙은 한 문서에서만 소유하고 다른 문서는 링크한다. 매 작업의 회고를 AGENTS.md에 누적하지 않는다.
- 현재 개수·완료 상태는 `overview`로 확인한다. 날짜가 붙은 감사 보고서는 과거 기록이지 현행 규칙이 아니다.
- YAML을 기계적으로 쪼개거나 임베딩 DB를 도입하지 않는다. 먼저 ID 조회로 범위를 줄인다.
- 물리적 분할이 필요해지면 빌드·검증·Git 이력 추적을 함께 바꾸는 별도 작업으로 다룬다. 현재 원본 계약을 임의로 변경하지 않는다.
