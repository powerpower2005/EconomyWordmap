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

## Relation IDs

Check the last `id: r###` in `src/data/relations.yaml` and use the next number (e.g. after `r204` use `r205`).

## Proposition IDs

Check the last `id: p###` in `src/data/propositions.yaml` and use the next number (e.g. after `p6` use `p7`). `termIds` must exist in `terms-all.yaml`. See [docs/agent-propositions-guide.md](docs/agent-propositions-guide.md).

## YAML

Wrap long `description` values in double quotes if they contain `=`, `:`, or `#`.

## Push / commit

Create git commits only when the user asks. Do not force-push `main`/`master`.
