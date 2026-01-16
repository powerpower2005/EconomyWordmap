# 새로운 단어 및 관계 추가 가이드

이 문서는 `src/data/terms.json` 파일에 새로운 경제 용어와 관계를 추가하는 방법을 안내합니다.

## 프롬프트 템플릿

다음과 같은 형식으로 요청하시면 됩니다:

```
다음 단어들을 terms.json에 추가해줘:

[단어 목록]

각 단어는 다음 형식으로:
- id: 고유 식별자 (영어, 소문자, 하이픈 사용)
- name: 한글 이름 (영어 이름) 형식
- description: 상세 설명
- category: 카테고리

그리고 다음 관계들도 추가해줘:

[관계 목록]

각 관계는 다음 형식으로:
- term1Id → term2Id: 관계 타입 (비례/반비례/상관관계)
- 설명: 관계에 대한 설명
- 강도: strong/medium/weak (선택사항)
- 양방향 여부: bidirectional: true (선택사항, 양방향일 경우)
- 역방향 설명: reverseDescription (양방향일 경우 선택사항)
```

## 예시

### 예시 1: 단순 단어 추가

```
다음 단어를 terms.json에 추가해줘:

- id: "fiscal-policy"
- name: "재정정책 (Fiscal Policy)"
- description: "정부가 세입과 세출을 조절하여 경제에 영향을 미치는 정책"
- category: "거시경제"
```

### 예시 2: 단어와 관계 함께 추가

```
다음 단어들을 terms.json에 추가해줘:

1. 재정정책 (Fiscal Policy)
   - id: "fiscal-policy"
   - description: "정부가 세입과 세출을 조절하여 경제에 영향을 미치는 정책"
   - category: "거시경제"

2. 정부지출 (Government Spending)
   - id: "government-spending"
   - description: "정부가 공공재와 서비스를 제공하기 위해 지출하는 금액"
   - category: "거시경제"

그리고 다음 관계들도 추가해줘:

1. 재정정책 → 정부지출: 비례
   - 설명: "재정정책이 확장적이면 정부지출이 증가함"
   - 강도: strong

2. 정부지출 → GDP: 비례
   - 설명: "정부지출이 증가하면 GDP가 증가함 (승수효과)"
   - 강도: strong
```

### 예시 3: 양방향 관계 추가

```
다음 관계를 추가해줘:

금리 ↔ IORB: 상관관계 (양방향)
- 정방향 설명: "IORB는 금리의 하한선 역할을 하며, 금리 정책의 주요 도구임"
- 역방향 설명: "금리 정책은 IORB를 조정하여 시장 금리에 영향을 줌"
- 강도: strong
```

## 데이터 구조

### Term (단어) 구조

```json
{
  "id": "unique-id",
  "name": "한글 이름 (English Name)",
  "description": "상세 설명",
  "category": "카테고리"
}
```

**주의사항:**
- `id`는 고유해야 하며, 영어 소문자와 하이픈만 사용
- `name`은 "한글 이름 (English Name)" 형식으로 작성
- `category`는 기존 카테고리와 일관성 유지

### Relation (관계) 구조

```json
{
  "id": "r##",
  "term1Id": "source-term-id",
  "term2Id": "target-term-id",
  "type": "proportional" | "inverse" | "correlation",
  "description": "정방향 설명",
  "strength": "strong" | "medium" | "weak",
  "bidirectional": true,
  "reverseType": "proportional" | "inverse" | "correlation",
  "reverseDescription": "역방향 설명",
  "reverseStrength": "strong" | "medium" | "weak"
}
```

**관계 타입:**
- `proportional`: 비례 관계 (A가 증가하면 B도 증가)
- `inverse`: 반비례 관계 (A가 증가하면 B가 감소)
- `correlation`: 상관관계 (서로 연관되어 있음)

**양방향 관계:**
- `bidirectional: true`로 설정하면 양쪽 화살표로 표시됨
- `reverseType`, `reverseDescription`, `reverseStrength`는 선택사항
- 역방향 정보가 없으면 정방향과 동일하게 적용됨

## 카테고리 목록

현재 사용 중인 카테고리:
- 거시경제
- 금융
- 통화
- 통화정책
- 통화금융
- 금리정책
- 금융안정
- 국제경제

## 관계 ID 규칙

- 기존 관계는 `r1`, `r2`, ... 형식
- 새 관계는 다음 번호를 사용 (예: `r25`, `r26`)

## 체크리스트

새 단어/관계 추가 시 확인사항:

- [ ] 모든 단어에 고유한 ID가 있는가?
- [ ] 모든 단어에 한글과 영어 이름이 병기되어 있는가?
- [ ] 관계의 term1Id와 term2Id가 실제로 존재하는 단어 ID인가?
- [ ] 관계 타입이 올바른가? (proportional/inverse/correlation)
- [ ] 양방향 관계인 경우 bidirectional: true가 설정되어 있는가?
- [ ] 관계 ID가 중복되지 않는가?
- [ ] JSON 형식이 올바른가? (쉼표, 따옴표 등)

## 주의사항

1. **기존 단어와의 충돌**: 같은 ID를 가진 단어가 이미 있으면 덮어쓰기됩니다.
2. **관계의 방향**: term1Id → term2Id 방향으로 관계가 정의됩니다.
3. **양방향 관계**: 양방향 관계는 하나의 엣지로 표시되며, 양쪽 끝에 화살표가 표시됩니다.
4. **JSON 형식**: 마지막 항목 뒤에는 쉼표가 없어야 합니다.

## 완전한 예시

```
다음 단어들과 관계를 terms.json에 추가해줘:

단어:
1. 재정정책 (Fiscal Policy)
   - id: "fiscal-policy"
   - description: "정부가 세입과 세출을 조절하여 경제에 영향을 미치는 정책"
   - category: "거시경제"

2. 정부지출 (Government Spending)
   - id: "government-spending"
   - description: "정부가 공공재와 서비스를 제공하기 위해 지출하는 금액"
   - category: "거시경제"

3. 세금 (Tax)
   - id: "tax"
   - description: "정부가 국민으로부터 징수하는 강제적 지출"
   - category: "거시경제"

관계:
1. 재정정책 → 정부지출: 비례
   - 설명: "재정정책이 확장적이면 정부지출이 증가함"
   - 강도: strong

2. 정부지출 → GDP: 비례
   - 설명: "정부지출이 증가하면 GDP가 증가함 (승수효과)"
   - 강도: strong

3. 세금 → GDP: 반비례
   - 설명: "세금이 증가하면 가처분소득이 감소하여 GDP에 부정적 영향"
   - 강도: medium

4. 재정정책 ↔ 세금: 상관관계 (양방향)
   - 정방향 설명: "재정정책은 세금 정책을 포함함"
   - 역방향 설명: "세금 정책은 재정정책의 일부임"
   - 강도: strong
```

이 프롬프트를 사용하면 새로운 단어와 관계를 체계적으로 추가할 수 있습니다.

---

## 자동 생성 프롬프트 (단어만 제공)

단어 목록만 제공하면 AI가 자동으로 description, category, 관계를 생성해주는 프롬프트:

```
다음 단어들을 terms.json에 추가해줘. 각 단어의 description, category를 적절히 생성하고, 
단어들 간의 논리적인 관계(비례/반비례/상관관계)도 자동으로 찾아서 추가해줘.


기존 terms.json에 있는 단어들과의 관계도 고려해서 추가해줘.
```

### 자동 생성 프롬프트 예시

```
다음 단어들을 terms.json에 추가해줘. 각 단어의 description, category를 적절히 생성하고, 
단어들 간의 논리적인 관계(비례/반비례/상관관계)도 자동으로 찾아서 추가해줘.

단어 목록:
1. 재정정책 (Fiscal Policy)
2. 정부지출 (Government Spending)
3. 세금 (Tax)
4. 재정적자 (Fiscal Deficit)
5. 국채 (Government Bond)

기존 terms.json에 있는 단어들(GDP, 인플레이션, 금리 등)과의 관계도 고려해서 추가해줘.
```

### 자동 생성 시 AI가 수행하는 작업

1. **단어 정보 생성**
   - 각 단어에 대한 적절한 description 작성
   - 적절한 category 할당 (기존 카테고리 중 선택)
   - 고유한 ID 생성 (영어 소문자, 하이픈 사용)

2. **관계 자동 탐지**
   - 제공된 단어들 간의 논리적 관계 분석
   - 비례/반비례/상관관계 판단
   - 관계 설명 자동 생성
   - 관계 강도 추정 (strong/medium/weak)

3. **기존 단어와의 관계 연결**
   - 기존 terms.json의 단어들과의 관계도 분석
   - 논리적으로 연결 가능한 관계 추가

### 자동 생성 프롬프트 사용 시 주의사항

- 단어 이름은 한글과 영어를 모두 제공하는 것이 좋습니다
- 경제 용어의 경우 정확한 관계를 위해 맥락을 함께 제공하면 더 정확합니다
- 생성된 관계는 검토 후 필요시 수정할 수 있습니다

### 맥락을 포함한 자동 생성 예시

```
다음 단어들을 terms.json에 추가해줘. 각 단어의 description, category를 적절히 생성하고, 
단어들 간의 논리적인 관계(비례/반비례/상관관계)도 자동으로 찾아서 추가해줘.

단어 목록:
1. 재정정책 (Fiscal Policy) - 정부의 세입과 세출을 통한 경제 조절 정책
2. 정부지출 (Government Spending) - 정부가 공공재와 서비스를 위해 지출하는 금액
3. 세금 (Tax) - 정부가 국민으로부터 징수하는 강제적 수입
4. 재정적자 (Fiscal Deficit) - 정부지출이 세입을 초과하는 상태
5. 국채 (Government Bond) - 정부가 발행하는 채권

기존 terms.json에 있는 단어들(GDP, 인플레이션, 금리 등)과의 관계도 고려해서 추가해줘.
```

이렇게 맥락을 함께 제공하면 더 정확한 description과 관계를 생성할 수 있습니다.
