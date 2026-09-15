# Data quality policy

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

