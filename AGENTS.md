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

Grow new terms, relations, propositions, and **learn sections** along this arc — not by academic category or importance score alone.

### Learn UI model (sections + parts)

The Learn tab uses **thematic sections** in `src/data/curriculum.yaml` (`curriculum.version: 2`). Each section is **one readable article**, not a stack of cards.

| Layer | Role |
|-------|------|
| **Section** | One investor question (e.g. “How is the value of my cash determined?”) |
| **Section `body`** | Opening narrative — hook, roadmap, optional compressed story (Markdown) |
| **Part** | One chapter inside the section (numbered title + optional subtitle) |
| **Part `body`** | Continuous prose for that chapter (Markdown) |
| **Part `termIds` / `propositionIds`** | Graph depth — shown **collapsed** below the prose (“용어·명제 N개”) |

**Canonical example:** section `sec-money-value` in `curriculum.yaml` — copy its shape, not its topic.

### Authoring a new section (agents)

**File:** `src/data/curriculum.yaml` only. **Renderer:** `src/components/MarkdownProse.tsx` (`react-markdown`) in `src/pages/Learning.tsx`.

#### YAML skeleton

```yaml
curriculum:
  version: 2
  intro: "..."
  sections:
    - id: sec-your-slug          # unique, kebab-case
      order: 2                   # display order (unique per section)
      title: "한글 섹션 제목"
      subtitle: "부제 (선택)"
      learnerQuestion: "English one-liner for authors (optional)"
      body: |
        Opening paragraphs in **Markdown**. One story thread.
        Blank line between paragraphs.
      parts:
        - id: part-your-slug
          title: "1. 파트 제목"
          subtitle: "짧은 부제 (선택)"
          body: |
            Continuous prose. Weave examples into paragraphs — do not split into cards.
            End with **정리:** one short takeaway + investor habits in the same flow.
          termIds: [existing-term-id, ...]
          propositionIds: [p42, ...]   # optional
```

#### Do / Don't (format)

| Do | Don't |
|----|--------|
| Write **`body`** as **continuous Markdown prose** (paragraphs separated by blank lines) | Split content into `hook`, `overview`, `episode`, `examples`, `takeaway`, `investorActions` — **deprecated**; legacy fields may still render but avoid for new work |
| Use `**bold**` for emphasis; `###` / `####` sparingly for in-flow subheads | Rely on UI cards, colored boxes, or “example object” blocks — the UI no longer embeds them |
| Weave **historical episodes** and **investor actions** into sentences or a short bullet list **inside `body`** | Label blocks like “투자자 메모”, “한 편의 이야기”, “예시 카드” as separate data structures |
| Put **`termIds` / `propositionIds`** only at the part bottom — readers expand after reading | Front-load term lists or interrupt every paragraph with graph links |
| One **narrative thread** per section; parts should read like consecutive chapters | Reset tone every part with disconnected “임베딩” snippets |
| End each part with **`**정리:**`** (or equivalent closing paragraph) tying mechanism → portfolio | End with a detached slogan box |

#### Narrative checklist (before merge)

1. **Read aloud** — does it sound like one article, not a form with fields?
2. **Section `body`** — concrete hook (person/portfolio), roadmap of parts, optional “one week / one scene” preview.
3. **Each part `body`** — mechanism in plain Korean → 1–2 historical or recent episodes **in prose** → **정리** with what to watch/do.
4. **Transitions** — last sentence of part N should logically lead to part N+1 (same section).
5. **Terms** — every `termId` should appear in or clearly relate to that part’s story; add **relations** if the graph path is thin.
6. **Propositions** — prefer `propositionIds` that exercise terms from this part; add missing propositions when the cluster is dense.
7. **Dedupe** — search `curriculum.yaml` so the same term is not duplicated across sections without reason.
8. **Validate** — `node build-data.js && npm run validate-data && npm run build`.

#### Suggested section topics (backlog)

Use [thematic expansion order](#investor-learning-path-curriculum) above — map to **new sections**, not old stage numbers:

| Priority | Section theme | Learner question (draft) |
|----------|---------------|---------------------------|
| Done | Money & purchasing power | “Why does my cash buy less?” → `sec-money-value` |
| Next | Market & valuation | “What am I actually buying when I buy a stock?” |
| Then | Macro dashboard | “What did today’s CPI/GDP headline mean?” |
| Then | Rate transmission | “Why did stocks move on the Fed?” |
| Then | Fiscal, FX, risk | “What else can swamp my thesis?” |
| Later | Theory & history | “When does the usual story break?” |

Propositions stay in `propositions.yaml`; link them from relevant parts via `propositionIds`.

### Learning UX

Sections organize content; they do **not** lock navigation.

| Principle | Do | Don't |
|-----------|-----|--------|
| **Sections** | Thematic buckets with a *suggested* order on the index | Force strict completion before opening another section |
| **Within a section** | Read prose top-to-bottom; expand terms/propositions when curious | Show prose as fragmented cards or mandatory quizzes |
| **Progress** | Optional bookmarks on terms/propositions | Required completion % to unlock |
| **Depth** | Link out to graph, propositions, market tab from collapsed refs | Replace narrative with raw term lists |

### vs academic order

| Academic (textbook) | Investor (Wordmap) |
|---------------------|-------------------|
| Micro → macro → international → theory | Market purpose → macro dashboard → rates/Fed → fiscal/intl/risk → theory/history |
| Build abstractions first | Build motivation first (“why this moves my portfolio”) |
| Theory gets equal weight | Theory comes after live mechanisms |

### `stockMarketImportance` and learn placement

- **Importance** = how often the term hits live markets / portfolios (filter & priority for *relevance*).
- **Section/part membership** = which **story** the term supports in the Learn UI — independent of importance score.

Example: `inflation` and `cpi` score 10 and belong in the macro/money **story**, not “because they score high”. `keynesian-economics` may score 3 and still appear in a later theory section.

Do **not** order section prose by importance alone. Order by **mechanism and reader need**.

### Curriculum review and supplement (required)

Whenever you **add or materially edit** a term, relation, proposition, or **learn section**, **review and supplement in the same task** — do not treat Learn as a follow-up ticket.

Two parts — do **both** when applicable:

1. **Review** — Does existing section prose still fit? Update `body` text, `termIds`, or part order if meaning changed.
2. **Supplement** — Gap in story or graph? Add terms, relations, propositions, or a new part/section in the **same PR/session**.

| Change | Review | Supplement (add when missing) |
|--------|--------|-------------------------------|
| **Term** added/edited | Should it appear in a section part’s `termIds`? Relation path from section hub terms? | Add to appropriate part; **add relation(s)** to hub cluster if thin. Importance ≥ 5 with no learn mention → assign to a section. |
| **Relation** added/edited | Which section narrative does it support? | Cluster hard to reach from prose hubs → **bridge edge**. New cross-mechanism link → mention in part `body` + terms. |
| **Proposition** added/edited | Relevant part’s `propositionIds`? | Dense cluster with no proposition → **add proposition**. Claim needs new terms → add terms/relations first. |
| **Section / part** added/edited | Single thread? Markdown renders? No card-style fragments? | Missing terms/relations/propositions referenced in prose → add data + ids. |

**Cross-check (any learn/data PR):**

1. Gap analysis — orphan terms in `termIds`, missing bridges, prose mentions a mechanism with no graph edge?
2. If gap found → **supplement in the same change**, not a later ticket.
3. Re-read [Known gaps](#known-gaps-periodic-review) when `terms-all.yaml` grows by ~20 terms.

Commit examples: `learn: add sec-valuation section (markdown prose)`, `data: add r### bridge for sec-money-value part 3`, `data: add p### for inflation–rates cluster`.

### Hub terms by theme (draft — use when placing parts)

Expand via **relations** from these hubs before jumping to unrelated theory.

**Market & valuation (future sec):** `stock-market`, `stock-index`, `valuation`, `eps`, `per`, `pbr`, `etf`, `risk-on`, `risk-off`, `market-sentiment`

**Macro dashboard:** `gdp`, `real-gdp`, `unemployment`, `inflation`, `cpi`, `pce`, `core-pce`, `expected-inflation`, `economic-growth`, `recession`, `business-cycle`

**Rate transmission:** `interest-rate`, `policy-rate`, `federal-reserve`, `central-bank`, `government-bond`, `bond-market`, `yield-curve`, `long-term-interest-rate`, `quantitative-easing`, `quantitative-tightening`, `bond-price`, `term-spread`

**Fiscal, international, risk:** `fiscal-policy`, `exchange-rate`, `trade-war`, `tariff`, `supply-chain`, `strong-dollar`, `weak-dollar`, `asset-bubble`, `systemic-risk`, `liquidity`, `geopolitical-risk`, `safe-haven-asset`, `national-debt`, `sector-rotation`

**Theory, micro, history:** `supply-and-demand`, `aggregate-demand`, `aggregate-supply`, `efficient-market-hypothesis`, `phillips-curve`, `keynesian-economics`, `behavioral-finance`, `great-depression`, `global-financial-crisis`, `stagflation`

**Propositions:** prefer claims tying **two or more terms** from live-mechanism sections; link via part `propositionIds`.

### Adding or extending learn content (agents)

1. **Pick or create a section** from the learner question ([suggested topics](#suggested-section-topics-backlog)).
2. **Dedupe** per “Finding existing data”; link existing terms instead of near-duplicates.
3. **Draft `body` prose first** (section + parts), then attach `termIds` / `propositionIds`.
4. Set **`stockMarketImportance`** on any new terms (rubric above).
5. **Relations:** connect new terms to that section’s hub cluster.
6. **Propositions:** when a part’s term cluster is relation-dense, add/link conditional propositions.
7. **Validate & read in UI** — confirm Markdown (bold, lists) renders; no `**` literals visible.

### Known gaps (periodic review)

- Section structure and prose: `src/data/curriculum.yaml` (merged to `terms.json` on build). Reference implementation: `sec-money-value`.
- Learn UI: article layout + collapsed term/proposition refs — **no** embedded example/investor cards for new content.
- Only **one** section shipped; backlog includes valuation, macro dashboard, rates, risk, theory sections.
- Stage 1 lacks a dedicated `earnings` term (`eps` partially covers it) — address in a future market section.
- Bond/rate plumbing (`sofr`, `repo-market`, `m2`) belongs **after** headline anchors in narrative order, not before `interest-rate` / `federal-reserve`.

Re-run hub coverage when `terms-all.yaml` grows significantly (e.g. +20 terms).

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

Investor curriculum (section/part prose, anchors, expansion rules): **this file**, [Investor learning path](#investor-learning-path-curriculum) and [Authoring a new section](#authoring-a-new-section-agents).

## Relation IDs

Check the last `id: r###` in `src/data/relations.yaml` and use the next number (e.g. after `r204` use `r205`).

## Proposition IDs

Check the last `id: p###` in `src/data/propositions.yaml` and use the next number (e.g. after `p6` use `p7`). `termIds` must exist in `terms-all.yaml`. See [docs/agent-propositions-guide.md](docs/agent-propositions-guide.md).

## YAML

Wrap long `description` values in double quotes if they contain `=`, `:`, or `#`.

## Push / commit

Create git commits only when the user asks. Do not force-push `main`/`master`.
