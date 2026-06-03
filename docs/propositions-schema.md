# Proposition schema (YAML)

> **Language:** English (field reference).
> **Writing style for Korean text:** [agent-data-guide.md](./agent-data-guide.md) (Korean).

TypeScript: [src/types.ts](../src/types.ts) (`Proposition`, `PropositionCase`)
Source file: `src/data/propositions.yaml` (`propositions:` list)
Rendered by: `src/pages/Propositions.tsx` ("명제" top-level tab)

A **proposition** is an "if A then B" economic claim (e.g. "금리가 오르면 물가가 내려간다"). The tab shows **when it holds**, **when it fails**, and a final verdict, so users learn that such claims are conditional, not absolute.

---

## Proposition

### Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | yes | string | `p1`, `p2`, … sequential; never reuse |
| `statement` | yes | string | The proposition, e.g. `"금리가 오르면 물가가 내려간다"` |
| `category` | recommended | string | Reuse term categories ([categories.md](./categories.md)), e.g. `통화정책` |
| `termIds` | yes | string[] | Related term ids (must exist in `terms-all.yaml`); rendered as clickable badges that open the 관계도 tab |
| `relationIds` | optional | string[] | Related relation ids (`r###`) |
| `premise` | recommended | string | Why people generally believe it (the logic / transmission channel) |
| `holds` | recommended | PropositionCase[] | Cases where the proposition holds |
| `fails` | recommended | PropositionCase[] | Cases where it breaks down / its limits |
| `verdict` | recommended | string | One-line conclusion (usually "conditional truth") |

### PropositionCase

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `label` | yes | string | Case / condition title, e.g. `"수요 견인 인플레이션 국면"` |
| `detail` | yes | string | Logical explanation (KO prose) |
| `example` | optional | string | Real historical example |

### YAML example

```yaml
propositions:
  - id: p1
    statement: "금리가 오르면 물가가 내려간다"
    category: 통화정책
    termIds: [interest-rate, inflation, policy-rate]
    premise: "금리가 오르면 차입 비용이 커져 총수요가 둔화되어 물가 압력이 완화된다는 통화정책 전달경로에 근거한다."
    holds:
      - label: "수요 견인 인플레이션 국면"
        detail: "수요 초과로 물가가 오르는 국면에서는 금리 인상이 총수요를 식혀 물가를 낮춘다."
        example: "2022~2023년 미국 연준 긴축 이후 인플레이션 둔화."
    fails:
      - label: "공급 충격발 인플레이션"
        detail: "공급망·에너지 충격발 물가는 수요 억제로 잡기 어렵다."
        example: "1970년대 오일쇼크 스태그플레이션."
    verdict: "수요 견인 국면에서는 대체로 성립하나 공급 충격·시차 앞에서는 약한 조건부 명제다."
```

---

## Build & validation

`propositions.yaml` is merged into `src/data/terms.json` under the `propositions` key.

```bash
node build-data.js        # YAML → terms.json (terms + relations + propositions)
npm run validate-data     # checks proposition id uniqueness + termIds exist
npm run build             # tsc + vite
```

`validate-data` auto-catches: missing/duplicate proposition `id`, missing `statement`, and `termIds` that do not exist in `terms-all.yaml` (error). It warns on missing `premise` / `holds` / `fails` / `verdict`.

## YAML quoting

Wrap string values in double quotes when they contain `=`, `:`, or `#`. Statements and details often contain punctuation; quoting is the safe default.

## Content language

`statement` / `premise` / `label` / `detail` / `example` / `verdict`: **Korean prose**. Field names and enums stay English. Do not put Korean inside executable code; only in data strings.
