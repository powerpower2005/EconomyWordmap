# Wordmap 명제(Proposition) 운영 가이드

경제 **명제** 데이터를 추가·수정할 때 따르는 한국어 절차 문서입니다.
필드 정의(영어)는 [propositions-schema.md](./propositions-schema.md)를 참고하세요.

## 명제 탭이란

"A이면 B이다" 형태의 경제 명제(예: **금리가 오르면 물가가 내려간다**)가
**어떤 경우에 성립하고**, **어떤 경우에 깨지는지**, 그래서 어떤 **한계**가 있는지를
논리(`premise`)와 사례(`holds`/`fails`)로 보여주는 탭입니다.

- 소스: `src/data/propositions.yaml` (`propositions:` 배열)
- 화면: `src/pages/Propositions.tsx` (상위 탭 "명제")
- 생성물: `src/data/terms.json`의 `propositions` 키로 병합 (직접 편집 금지)

## 1. 명제 추가 절차 (Before → Edit → Validate)

**Before**

- `propositions.yaml`의 마지막 `- id: p###` 확인 → 다음 번호 사용 (예: p6 다음은 **p7**)
- `termIds`에 넣을 용어가 `terms-all.yaml`에 실제로 존재하는지 확인

**Edit:** `propositions.yaml`의 `propositions:` 목록 **끝**에 블록 추가.

```yaml
  - id: p7
    statement: "..."
    category: 통화정책        # 기존 용어 카테고리 재사용 권장
    termIds: [term-a, term-b]  # terms-all.yaml에 존재하는 id
    premise: "왜 일반적으로 그렇게 보는가(논리·전달경로)"
    holds:
      - label: "성립 사례 제목"
        detail: "왜 이 경우 성립하는지"
        example: "실제 역사적 예시 (선택)"
    fails:
      - label: "한계·반례 제목"
        detail: "왜 이 경우 깨지는지"
        example: "실제 역사적 예시 (선택)"
    verdict: "한 줄 결론 (대개 조건부 참)"
```

**Validate:** 아래 [3. 검증](#3-검증-작업-후-필수) 수행.

## 2. 작성 스타일 (중요)

- **단정 금지, 조건부 서술**: 명제 탭의 목적 자체가 "항상 참은 아니다"를 보여주는 것. `holds`와 `fails`를 **균형 있게** 채우고 `verdict`는 조건부로 마무리한다.
- `premise`는 명제를 **옹호하는 논리**(전달경로)를 적는다. 반박은 `fails`에 적는다.
- `holds`/`fails`의 `label`은 **국면·조건**으로 쓴다 (예: "수요 견인 국면", "공급 충격발", "정책 시차").
- `example`에는 가능하면 **실제 사례**(연도·사건)를 넣어 신뢰도를 높인다.
- 본문은 한국어 산문, `id`/필드명/enum은 영어. 실행 코드에는 한국어를 넣지 않는다.

## 3. 검증 (작업 후 필수)

```bash
node build-data.js        # YAML → terms.json (용어·관계·명제 병합)
npm run validate-data     # 자동 검사
npm run build             # PR 전 TypeScript·Vite 빌드
```

**자동 검사(`validate-data`)가 잡는 것**

- 명제 `id` 누락·중복
- `statement` 누락 (error)
- `termIds`가 `terms-all.yaml`에 없는 경우 (**error** — 신규는 반드시 회피)
- `premise`/`holds`/`fails`/`verdict` 누락 (warning)

통과 메시지: `✅ Data validation passed (N terms, M relations, K propositions)`.

**수동 확인**

- `category`는 [categories.md](./categories.md) 어휘 재사용
- `holds`와 `fails`가 한쪽으로 치우치지 않았는지
- `termIds`가 명제와 실제로 관련 있는지 (관계도 탭으로 연결됨)

## 4. Git·커밋

- `propositions.yaml` 수정 + 커밋 + build.
- 명제는 용어·관계와 달리 Git 기반 `changelog`/`updatedAt`을 쓰지 않는다(용어 전용 기능).
- 커밋 메시지 예: `data: add proposition p7 (관세와 무역수지)`.
- push는 사용자가 명시적으로 요청할 때만.

## 5. 하지 말 것

- `src/data/terms.json` 직접 편집 (생성물)
- 존재하지 않는 `termIds`로 명제 추가
- `holds`만 채우고 `fails`를 비우는 것 (명제 탭의 목적에 어긋남)
