# Wordmap agent recipes

> **User prompts:** Korean (copy-paste below).  
> **Agent steps:** English.  
> **Rules:** [agent-data-guide.md](./agent-data-guide.md) (KO) · **Schema:** [data-schema.md](./data-schema.md) (EN)

Each recipe = **user prompt (KO)** + **agent steps (EN)**.

---

## R1 — Add N terms

### User prompt (한국어)

```
다음 용어를 Wordmap에 추가해줘. src/data/terms-all.yaml 과 필요 시 relations.yaml 만 수정해.

[용어 목록: 한글 (English), 간단 맥락]

각 용어: id, name, description, category 생성. stockMarketImportance는 주식시장 영향이 크면 1-10 부여.
작업 후 node build-data.js 실행하고 data: 커밋 메시지로 커밋해줘.
```

### Agent steps (English)

1. Read `docs/agent-data-guide.md` (writing style).
2. `grep "id: ..."` — no duplicate term ids.
3. Append blocks to `terms-all.yaml`.
4. Run `node build-data.js` then `npm run validate-data`.
5. Git commit: `data: add ...`

---

## R2 — Add terms + relations

### User prompt (한국어)

```
다음 용어들을 추가하고, 서로 및 기존 용어(인플레이션, 금리, GDP 등)와의 논리적 관계를 relations.yaml에 추가해줘.
terms.json 은 수정하지 말고 YAML만 편집해.

단어 목록:
1. ...
2. ...

관계는 proportional / inverse / correlation 과 strength를 적절히 설정해.
인과·정책 관계는 nature(causal/policy 등)와 mechanism 도 가능하면 채워줘.
```

### Agent steps (English)

1. Add all new terms to `terms-all.yaml`.
2. Find last `r###` in `relations.yaml`; assign next ids.
3. Ensure `term1Id` / `term2Id` exist in `terms-all.yaml`.
4. Run `node build-data.js` and `npm run validate-data`.
5. Commit: `data: add terms and relations for ...`

---

## R3 — Enrich term description only

### User prompt (한국어)

```
[용어 id 또는 한글명] 설명을 보강해줘. 단정적 표현보다 경향·조건부 표현을 쓰고,
terms-all.yaml 만 수정한 뒤 build-data 실행해.
```

### Agent steps (English)

1. Edit only `description` on the matching `- id:` block.
2. Follow Korean tone rules in `agent-data-guide.md`.
3. Run `node build-data.js`.
4. Commit: `data: enrich [term-id] description`

---

## R4 — Enrich relation description

### User prompt (한국어)

```
relations.yaml 의 r### ([용어A] ↔ [용어B]) 관계 설명을 보강해줘.
양방향이면 reverseDescription 도 검토하고, 가능하면 nature / mechanism / conditions / lag 도 채워줘.
```

### Agent steps (English)

1. `grep "id: r###"` to locate the block.
2. Update `description` / `reverseDescription`; quote strings if needed.
3. (Optional) Add semantic fields: `nature` (`causal`|`correlational`|`definitional`|`hierarchical`|`policy`), `mechanism`, `conditions`, `lag`. See [data-schema.md](./data-schema.md).
4. Run `node build-data.js` then `npm run validate-data`.
5. Commit: `data: enrich r### relation (nature/mechanism)`

---

## R5 — Add bidirectional relation

### User prompt (한국어)

```
[term1] ↔ [term2] 양방향 상관관계를 relations.yaml에 추가해줘.
정방향·역방향 설명을 각각 작성해.
```

### Agent steps (English)

1. Confirm both ids exist in `terms-all.yaml`.
2. Add new `r###` block:

```yaml
  - id: r###
    term1Id: ...
    term2Id: ...
    type: correlation
    bidirectional: true
    description: "..."
    reverseDescription: "..."
    strength: strong
```

3. Build, validate, commit.

Reference: `r22` (iorb ↔ interest-rate) in [relations.yaml](../src/data/relations.yaml).

---

## R6 — Set stock market importance

### User prompt (한국어)

```
다음 용어에 stockMarketImportance (1-10)를 부여해줘. 주식시장·금리·물가에 미치는 영향 기준.
```

### Agent steps (English)

1. Set `stockMarketImportance: N` (1–10) on terms in `terms-all.yaml`.
2. UI stars: two small = one large (`getStarRating` in dataLoader).
3. Build and commit.

---

## R2 extended — Context-rich auto generation

### User prompt (한국어)

```
다음 용어를 추가하고 관계까지 생성해줘. 괄호 안 맥락을 description에 반영해.

1. 재정정책 (Fiscal Policy) - 정부의 세입·세출 조절
2. 정부지출 (Government Spending) - ...

기존 terms-all 용어(GDP, 인플레이션, 금리 등)와의 관계도 relations.yaml에 추가해.
YAML만 수정, build-data 후 커밋.
```

### Agent steps (English)

Same as R2; merge user context into Korean `description` fields.

---

## Checklist (all recipes)

- [ ] Did not edit `terms.json`
- [ ] Did not use `src/data/terms/*.yaml`
- [ ] No duplicate relation ids / no duplicate relation pairs (manual)
- [ ] New `category` exists in vocabulary (`docs/categories.md`)
- [ ] `npm run validate-data` passed (auto: ids, refs, enums)
- [ ] Direction (`term1Id -> term2Id`) consistent with description
- [ ] Git commit done (for changelog)

> Full validation procedure (auto + manual + work-type matrix): `docs/agent-data-guide.md` section 4.
