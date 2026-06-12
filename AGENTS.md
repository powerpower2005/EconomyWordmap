# Wordmap — Agent instructions

Economy term graph app. When adding or editing **terms** or **relations**, follow the data docs below.

## Documentation by role (language)

| Role | Language | File |
|------|----------|------|
| Cursor rule, entry, schema | **English** | This file, `.cursor/rules/wordmap-data.mdc`, `docs/data-schema.md` |
| Workflow, quality, Git | **Korean** | `docs/agent-data-guide.md` |
| User copy-paste prompts | **Korean** | `docs/agent-recipes.md`, `docs/add_terms.md` |
| Categories (maintainers) | **Korean** | `docs/categories.md` |

**Data content** (`description`, relation text): Korean prose; field names and enums stay English.

## Data editing (required)

| Do | Don't |
|----|--------|
| Edit `src/data/terms-all.yaml` | Edit `src/data/terms.json` |
| Edit `src/data/relations.yaml` | Edit only `src/data/terms/*.yaml` (legacy, not in build) |
| Edit `src/data/propositions.yaml` (명제 tab) | Edit `src/data/terms.json` |
| Edit `src/data/curriculum.yaml` (학습 tab) | Edit `src/data/terms.json` |

After **every** data change (add term, edit term, add/edit/delete relation), validate before commit:

```bash
node build-data.js        # YAML -> terms.json
npm run validate-data     # auto checks (fail = exit 1, fix and re-run)
npm run build             # TypeScript + Vite (before PR)
```

`validate-data` auto-catches: duplicate/missing ids, missing term refs, and enums (`type`, `reverseType`, `nature`, `strength`, `reverseStrength`).
It does **not** catch: duplicate relation pairs, category vocabulary, direction consistency. Check those manually per `docs/agent-data-guide.md` section 4 (자동/수동 검증 + work-type matrix).

Commit to Git so UI **changelog** / **updatedAt** update (`scripts/term-history.js` uses Git history).

For **writing style** (tone, conditional phrasing): read `docs/agent-data-guide.md` (Korean).

## Finding existing data (dedupe + gap analysis)

**Always search the data before adding** a term, relation, or proposition — both to avoid duplicates and to find existing items worth supplementing. (On Windows PowerShell `rg`/`grep` may be missing; use the editor's search or the agent's Grep/SemanticSearch tools instead.)

Before adding, check for duplicates:
- **Term** — search `terms-all.yaml` for the intended `id:` and for the Korean/English name. A concept may already exist under a different id (e.g. `aggregate-supply` vs `aggregate-demand`).
- **Relation** — search `relations.yaml` for **both** endpoint ids (`term1Id`/`term2Id`) of the pair, in **either** order. The validator does NOT catch duplicate pairs, so this is a manual check.
- **Proposition** — scan `propositions.yaml` `statement:` lines for an equivalent claim.

Find what to supplement (gap analysis):
1. **List a term's current edges** — search `relations.yaml` for the term id to see every relation it participates in. Few or no edges on an important term = a gap.
2. **Hub/cluster check** — newly added terms (and historically thin terms) often lack links to the core macro/finance cluster. Connect them to the obvious neighbors (e.g. a new macro variable should link to `gdp`, `inflation`, `interest-rate` where it applies).
3. **Symmetric-framework check** — if one half of a standard pair exists, add the other and the link (e.g. `aggregate-demand`↔`aggregate-supply`, demand-pull vs cost-push, `inflation`/`disinflation`/`deflation`).
4. **Proposition coverage** — well-developed term clusters with no proposition are candidates for a new conditional claim (`holds`/`fails`).

When in doubt about overlap, prefer **supplementing/linking existing items** over creating near-duplicates.

## Stock market importance (scoring rubric)

`stockMarketImportance` (integer **1-10**) = how directly/immediately the term moves stock prices, and how often it is actually used in real investment decisions — **not** its academic or historical significance. A theory or historical school can be intellectually important yet score low here.

Gauge along 4 axes, then map to the band below:
- **A. Market impact directness** — does it move asset prices directly?
- **B. Investor attention / news frequency** — how often is it actually tracked or quoted?
- **C. Timeliness / actionability** — a live, observable/tradeable variable vs a theory or past event.
- **D. Breadth** — market-wide vs niche.

Bands (with anchor examples):
- **9-10** — Primary, market-wide live drivers: `inflation`, `interest-rate`, `policy-rate`, `federal-reserve`, `cpi`, `gdp`, `stock-market`.
- **7-8** — Core macro/market variables watched closely: `unemployment`, `exchange-rate`, `quantitative-easing`, `government-bond`, `fiscal-policy`, `trade-war`, `supply-chain`.
- **5-6** — Meaningful but indirect or sector-level: `money-supply`, `consumption`, `asset-bubble`, `national-debt`, `supply-shock`, `systemic-risk`, `efficient-market-hypothesis`.
- **3-4** — Background / structural concepts, not direct signals: `keynesian-economics`, `comparative-advantage`, `marginal-cost`, `behavioral-economics`, `phillips-curve`.
- **1-2** — Pure theory, schools of thought, methodology, or historical episodes: `mercantilism`, `marginal-revolution`, `physiocracy`, `dsge-model`, `lucas-critique`.

Notes:
- Historical crises (`great-depression`, `global-financial-crisis`) are famous as lessons but are not live signals — keep them low-to-mid (2-5).
- Reference/technical plumbing (e.g. `sofr`, `m2`, `excess-reserves`) scores lower than headline drivers even when financially important.
- Assign a value to **every** new term for filter consistency; when unsure between two bands, pick the lower unless B (attention) is clearly high.

## Investor learning path (curriculum)

Wordmap teaches economics for **stock investors**, not for a university syllabus.

**Content expansion order** (for authors, not a forced learner path):

**market & news signals → rate transmission → risk & second-order drivers → theory & history → propositions (conditional judgment)**

Grow new terms, relations, and propositions **along these stages** rather than by academic category or importance score alone.

### Learning UX (when a Learn tab exists)

Stages organize content; they do **not** lock navigation.

| Principle | Do | Don't |
|-----------|-----|--------|
| **Stages** | Six buckets (1–6) with a *suggested* default order for newcomers | Force users through every item in strict sequence |
| **Within a stage** | Browse any term in that stage; optional “recommended next” hints | Block access until prior lessons are “complete” |
| **Across stages** | Show soft guidance (“stage 2 is easier after skimming stage 1”) | Hard prerequisites or progress gates |
| **Progress** | Optional bookmarks / “seen” markers only | Required completion % to unlock later stages |
| **Depth** | Link out to graph, propositions, market tab from any item | One long linear lesson queue |

**Suggested path** = default sort and onboarding copy, not curriculum law. Learners may jump to stage 4 or 6 first if that matches their question.

`src/data/curriculum.yaml` lists **stage membership and suggested order**, not mandatory locks.

### vs academic order

| Academic (textbook) | Investor (Wordmap) |
|---------------------|-------------------|
| Micro → macro → international → theory | Market purpose → macro dashboard → rates/Fed → fiscal/intl/risk → theory/history |
| Build abstractions first | Build motivation first (“why this moves my portfolio”) |
| Theory gets equal weight | Theory comes after live mechanisms |

### Six stages

| Stage | Goal | Learner question |
|-------|------|------------------|
| **1 — Market** | What is being priced; basic toolkit | “What am I actually buying?” |
| **2 — Macro dashboard** | Headline indicators in daily news | “What did today’s data mean?” |
| **3 — Rate transmission** | Central bank → yields → valuations | “Why did stocks move on the Fed?” |
| **4 — Fiscal, international, risk** | Second-order, regime, tail risks | “What else can swamp my thesis?” |
| **5 — Theory, micro, history** | Frameworks and past episodes | “When does the usual story break?” |
| **6 — Propositions** | Conditional claims (`holds` / `fails`) | “Under what conditions is this true?” |

### `stockMarketImportance` and stage are independent

- **Importance** = how often the term hits live markets / portfolios (filter & priority for *relevance*).
- **Stage** = which **bucket** the term belongs in for the Learn UI (organize & suggest), **not** a mandatory sequence number.

Examples: `inflation` and `cpi` score 10 but belong in **stage 2**, not stage 1. `valuation` and `dcf` score 5–6 but belong in **stage 1**. `keynesian-economics` may score 3 but stays in **stage 5**.

Do **not** sort stages or lessons by importance alone. Within a stage, a *suggested* order may differ from importance (e.g. `stock-market` before `dcf`).

### Curriculum review and supplement (required)

Whenever you **add or materially edit** a term, relation, or proposition, **review and supplement learning coverage in the same task** — do not treat Learn as a separate follow-up.

Two parts — do **both** when applicable:

1. **Review** — Does existing learning material still fit? Re-stage, re-link, or trim anchors if the edit changed meaning or placement.
2. **Supplement** — If the Learn path has a **gap**, **add** what is missing in this PR (or same session): terms, relations, propositions, anchor/`curriculum.yaml` entries, suggested-order notes. Review-only with no follow-up is not enough when something should be added.

| Change | Review | Supplement (add when missing) |
|--------|--------|-------------------------------|
| **Term** added/edited | Stage 1–5 correct? Still linked to stage hub? Anchor list still accurate? | New term belongs in a stage bucket → add to `src/data/curriculum.yaml` `termIds` (suggested order) and anchor list below if hub-worthy. No path from hub → **add relation(s)**. Investor-relevant (importance ≥ 5) but no stage → assign before merge. Thin stage 1–3 → prefer **new edges** over unrelated stage-5 theory. |
| **Relation** added/edited | Which stage cluster(s) does it affect? Cross-stage bridge still valid? | Cluster still hard to enter from a random term → **add** bridge edge to anchor. New mechanism between stages → **add** explicit cross-stage link. |
| **Proposition** added/edited | Stage 6 mapping and exercised stages (1–4) still correct? `termIds` + graph context sufficient? | Dense term+relation cluster with **no** matching proposition → **add** proposition. Claim needs terms not yet related → **add relation(s)** or term first. |

**Cross-check (any data PR):**

1. **Gap analysis** — For touched stages: missing anchor, orphan term in a stage, missing bridge, missing stage-6 proposition?
2. If review finds a gap → **supplement in the same change** (term / relation / proposition / anchor list / `curriculum.yaml`), not a later ticket.
3. Search anchor lists for affected ids — update suggested order or hub membership when you add.
4. Re-read [Known gaps](#known-gaps-periodic-review) when `terms-all.yaml` grows by ~20 terms; **close gaps by adding**, not only noting them.

Mention learning impact in commit messages when non-obvious, e.g. `data: add earnings term (stage 1 anchor)`, `data: add r### bridge for stage 3 learn path`, `data: add p### for inflation–rates cluster`.

### Anchor terms (draft map — review when data grows)

Use as hubs when placing new content; within a stage, expand via **relations** to neighbors before jumping stages.

**Stage 1 — Market:** `stock-market`, `stock-index`, `valuation`, `eps`, `per`, `pbr`, `etf`, `risk-on`, `risk-off`, `market-sentiment`

**Stage 2 — Macro dashboard:** `gdp`, `real-gdp`, `unemployment`, `inflation`, `cpi`, `pce`, `core-pce`, `expected-inflation`, `economic-growth`, `recession`, `business-cycle`

**Stage 3 — Rate transmission:** `interest-rate`, `policy-rate`, `federal-reserve`, `central-bank`, `government-bond`, `bond-market`, `yield-curve`, `long-term-interest-rate`, `quantitative-easing`, `quantitative-tightening`, `bond-price`, `term-spread`

**Stage 4 — Fiscal, international, risk:** `fiscal-policy`, `exchange-rate`, `yield-curve` (revisit with spreads), `trade-war`, `tariff`, `supply-chain`, `strong-dollar`, `weak-dollar`, `asset-bubble`, `systemic-risk`, `liquidity`, `geopolitical-risk`, `safe-haven-asset`, `national-debt`, `sector-rotation`

**Stage 5 — Theory, micro, history:** `supply-and-demand`, `aggregate-demand`, `aggregate-supply`, `efficient-market-hypothesis`, `phillips-curve`, `keynesian-economics`, `behavioral-finance`, `great-depression`, `global-financial-crisis`, `stagflation` — plus `경제이론` / `미시경제` terms at importance 1–4

**Stage 6 — Propositions:** add/edit in `propositions.yaml`; prefer claims that tie **two or more terms from stages 1–4**. Tag mentally by stage when authoring; full stage metadata in YAML is **not** required yet.

### Adding or extending content (agents)

1. **Pick a stage** from the learner question (table above). If unclear, default to the **earliest** stage that fits.
2. **Dedupe** per “Finding existing data”; prefer linking an existing term into the stage hub over near-duplicates.
3. Set **`stockMarketImportance`** by the rubric above (relevance), independent of stage.
4. **Relations:** connect new terms to that stage’s anchor hub (and cross-stage links only when the mechanism is explicit, e.g. stage-2 `inflation` → stage-3 `policy-rate`).
5. **Gap check:** thin anchors (few edges) in stages 1–3 are higher priority than new stage-5 theory.
6. **Propositions:** after a stage-1–4 cluster is relation-dense, add a conditional proposition for stage 6.
7. **Curriculum review & supplement:** complete [Curriculum review and supplement](#curriculum-review-and-supplement-required) — review **and** add missing learn-path content in the same task when gaps exist.

### Known gaps (periodic review)

- Stage buckets and suggested order: `src/data/curriculum.yaml` (merged to `terms.json` on build). Keep anchors in this doc in sync when editing stages. No per-term `curriculumStage` field on terms.
- Learn UI must follow [Learning UX](#learning-ux-when-a-learn-tab-exists): staged browse + suggested order, **no** forced linear progression.
- Stage 1 lacks a dedicated `earnings` term (`eps` partially covers it).
- Stage 3–4 bond/rate plumbing (`sofr`, `repo-market`, `m2`) is rich but should stay **after** headline anchors, not before `interest-rate` / `federal-reserve`.
- Stage 5 is large (~130 terms at importance 1–4); graph paths from stage 3 hubs are uneven — prefer **relation links backward** from theory terms to macro anchors when editing.

Re-run anchor coverage when `terms-all.yaml` grows significantly (e.g. +20 terms).

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/agent-data-guide.md](docs/agent-data-guide.md) | Main workflow (KO): add term, edit relation, validate, commit |
| [docs/data-schema.md](docs/data-schema.md) | Term / Relation YAML fields (EN) |
| [docs/propositions-schema.md](docs/propositions-schema.md) | Proposition (명제 tab) YAML fields (EN) |
| [docs/agent-propositions-guide.md](docs/agent-propositions-guide.md) | Proposition workflow (KO): add/edit 명제, validate |
| [docs/agent-recipes.md](docs/agent-recipes.md) | Prompts (KO) + agent steps (EN) |
| [docs/categories.md](docs/categories.md) | Category list and UI sync (KO) |
| [docs/add_terms.md](docs/add_terms.md) | Short user-facing pointer (KO) |

Investor curriculum (stage order, anchors, expansion rules): **this file**, [Investor learning path](#investor-learning-path-curriculum).

## Relation IDs

Check the last `id: r###` in `src/data/relations.yaml` and use the next number (e.g. after `r204` use `r205`).

## Proposition IDs

Check the last `id: p###` in `src/data/propositions.yaml` and use the next number (e.g. after `p6` use `p7`). `termIds` must exist in `terms-all.yaml`. See [docs/agent-propositions-guide.md](docs/agent-propositions-guide.md).

## YAML

Wrap long `description` values in double quotes if they contain `=`, `:`, or `#`.

## Push / commit

Create git commits only when the user asks. Do not force-push `main`/`master`.
