# Wordmap data schema (YAML)

> **Language:** English (field reference).  
> **Writing style for Korean `description` text:** [agent-data-guide.md](./agent-data-guide.md) (Korean).

TypeScript: [src/types.ts](../src/types.ts)  
Source files: `src/data/terms-all.yaml`, `src/data/relations.yaml`

---

## Term

### Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | yes | string | Unique kebab-case id (e.g. `inflation`) |
| `name` | yes | string | `한글 (English)` |
| `description` | yes | string | Long text; use `"..."` in YAML when needed |
| `category` | recommended | string | See [categories.md](./categories.md) |
| `stockMarketImportance` | optional | 1–10 | Stock market importance (star UI) |

### Build-time only (do not author in YAML)

| Field | Description |
|-------|-------------|
| `updatedAt` | Last change date from Git (`YYYY-MM-DD`) |
| `changelog` | History entries ([TermChangeEntry](#termchangeentry-ui-history)) |

### YAML example

```yaml
terms:
  - id: inflation
    name: 인플레이션 (Inflation)
    description: "일반적인 물가 수준이 지속적으로 상승하여..."
    category: 거시경제
    stockMarketImportance: 10
```

---

## Relation

### Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | yes | string | `r1`, `r2`, … sequential; never reuse |
| `term1Id` | yes | string | Source term id |
| `term2Id` | yes | string | Target term id |
| `type` | yes | enum | `proportional` \| `inverse` \| `correlation` (direction tendency) |
| `description` | recommended | string | term1 → term2 |
| `strength` | recommended | enum | `weak` \| `medium` \| `strong` |
| `nature` | optional | enum | Semantic nature (see below); orthogonal to `type` |
| `mechanism` | optional | string | How the relation works (KO prose) |
| `conditions` | optional | string | When it holds (e.g. `고인플레 국면`) |
| `lag` | optional | string | Time lag (e.g. `1~2분기 후`) |
| `bidirectional` | optional | boolean | `true` for two-way arrow |
| `reverseType` | optional | enum | Reverse direction type |
| `reverseDescription` | optional | string | term2 → term1 |
| `reverseStrength` | optional | enum | Reverse strength |

### Relation nature (semantic axis)

`nature` is independent from `type`. `type` encodes direction tendency (used for edge color); `nature` encodes meaning (used for edge line style: `correlational` renders dashed, all others solid).

| `nature` | Meaning | UI label (KO) |
|----------|---------|----------------|
| `causal` | A causes B | 인과 |
| `correlational` | Co-moves, causation not asserted | 상관 |
| `definitional` | Defines / measures (e.g. CPI measures inflation) | 정의·측정 |
| `hierarchical` | Parent/child, component-of | 계층 |
| `policy` | Policy response link | 정책 반응 |

All four of `nature` / `mechanism` / `conditions` / `lag` are optional; existing relations without them keep working. Backfill gradually, starting with key causal chains.

### Relation types (UI labels)

| `type` | Meaning | UI label (KO) |
|--------|---------|----------------|
| `proportional` | Same direction tendency | 비례 |
| `inverse` | Opposite direction tendency | 반비례 |
| `correlation` | Linked / policy / structural | 상관관계 |

### One-way example

```yaml
  - id: r1
    term1Id: inflation
    term2Id: interest-rate
    type: correlation
    description: "인플레이션이 상승하면 기준금리 인상 경향(정책 반응)"
    strength: strong
    nature: policy
    mechanism: "중앙은행이 물가안정 목표를 위해 정책금리를 조정"
    conditions: "기대인플레이션이 흔들릴 때 대응 강도 확대"
    lag: "수개월~수분기"
```

### Bidirectional example (r22)

```yaml
  - id: r22
    term1Id: iorb
    term2Id: interest-rate
    type: correlation
    bidirectional: true
    description: "IORB는 준비금에 대한 지급이자로 단기금리 하단(바닥)을 형성하는 핵심 정책도구"
    reverseDescription: "중앙은행은 IORB 조정을 통해 단기 시장금리(정책금리 범위)를 유도"
    strength: strong
```

---

## terms.json (generated)

```json
{
  "terms": [ /* Term + updatedAt, changelog */ ],
  "relations": [ /* Relation */ ]
}
```

The app imports this file only. **Do not edit by hand.**

---

## TermChangeEntry (UI history)

Generated at build from Git. Agents must **not** add these fields to YAML.

```typescript
{
  date: "2026-01-24",
  commit: "0747141",
  message: "commit subject",
  summary: "설명 수정" | "관계 추가" | "관계 설명 수정" | ...,
  changes: [
    {
      field: "description" | "name" | "category" | "stockMarketImportance" | "relation",
      label: "설명",
      before: "...",
      after: "..."
    }
  ]
}
```

Relation changes use `field: "relation"`; `label` includes the counterparty term name.
