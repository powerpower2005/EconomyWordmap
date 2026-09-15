# Article and topic review policy

## Content / topic review — answer format (required)

When the user pastes an **article, column, lecture notes, or policy narrative** and asks to **review or map** terms, relations, and propositions (e.g. “용어·관계·명제 검토해 봐”, “그래프에 뭐 넣을까”), **always search the data first**, then reply in **exactly these four sections** (Korean headings, fixed order). Do not merge tiers or skip a tier — use “해당 없음” if empty.

### 1. 필수 — 넣어야 할 것

Items the graph **needs** for this topic to be navigable and faithful to the source.

| Kind | Include here when |
|------|-------------------|
| **Term** | Core concept appears throughout the source, **no adequate existing term** (check names + descriptions), and investors would look it up in markets/news (importance usually **≥ 5**, or it unlocks a policy cluster). |
| **Relation** | Source states a **mechanism or policy link** between two existing terms, but **no edge** (or only a distant hop). Hub terms with **≤ 2 edges** on this topic belong here. |
| **Proposition** | Source argues a **conditional claim** (holds/fails) that is central to the narrative but **no equivalent `statement:`** exists. |
| **Description fix** | An existing term is **misleading or missing the article’s key mechanism** — fixing it is mandatory, not optional. |

List each item with **id (existing or proposed slug)**, **why** (one line tied to the source), and **YAML target file**.

### 2. 보강 — 보강하면 좋은 것

Strengthens coverage **without** new top-level concepts. Prefer this tier over new terms when a near-match exists.

| Kind | Include here when |
|------|-------------------|
| **Relation** | Same mechanism as §1 but **secondary** or **one hop removed** from the article’s main thread; or symmetric pair / cluster bridge still missing. |
| **Proposition** | Useful conditional claim, but **partially covered** by an existing proposition — extend `holds`/`fails` or add a sibling claim rather than duplicate. |
| **Term `description`** | Concept already exists; add **one mechanism sentence** (productivity constraint, policy channel, investor hook) from the source. |
| **Curriculum** | Relevant `termIds` / `propositionIds` / short `body` tweak in an existing or planned section — not a full new section unless the user asked for learn content. |

### 3. 선택 — 넣어도 되고 안 넣어도 되는 것

Reasonable additions that **do not change** whether a reader can follow the article through the graph.

| Kind | Include here when |
|------|-------------------|
| **Term** | Illustrative, regional, or academic detail; **importance 3–4**; or covered by a broader term but a dedicated node would help niche navigation. |
| **Relation / proposition** | Example-specific, historical one-off, or **third-order** link the article mentions in passing. |
| **Learn section** | Thematic fit exists but **backlog priority** is lower than current investor path (see [Suggested section topics](learning-authoring.md#suggested-section-topics-backlog)). |

State **trade-off** briefly (add = richer cluster vs graph noise).

### 4. 제외 — 넣지 않는 것이 좋은 것

Explicit **do-not-add** list to prevent graph bloat and dupes.

| Kind | Exclude when |
|------|----------------|
| **Person** | Individual politicians, advisors, or officials (**Navarro, Feldstein, Treasury pick**) — use policy/concept terms (`protectionism`, `neo-mercantilism`, `twin-deficit`, `federal-reserve`) unless the person names a **reusable theory** already absent (rare). |
| **Near-duplicate term** | Existing term + description edit suffices (`technological-progress` vs new `productivity`; `capital-accumulation` vs `capital-intensity` — only add the latter if the article **depends** on the ratio definition). |
| **Duplicate pair** | Same `term1Id`/`term2Id` in either order already in `relations.yaml`. |
| **Chart / series metadata** | One-off chart labels, survey cohorts, paper titles, column part numbers — cite in proposition `example:` instead. |
| **Low-investor concepts** | Pure historiography, geography-only labels, or **importance 1–2** nodes that do not serve live portfolio/mechanism navigation. |
| **Implementation** | Do **not** edit YAML or commit unless the user asks to **apply** changes; this tier is for the review answer only. |

### Review workflow (agents)

1. Extract **5–10 anchor concepts** from the source (policy goal, mechanism, constraint, controversy).
2. Grep `terms-all.yaml`, `relations.yaml`, `propositions.yaml` for each — note **existing ids** and **edge count** on hubs.
3. Map anchors to the four tiers above; **default downward** (필수 → 보강 → 선택 → 제외) when unsure.
4. End with a **one-line summary**: what is already well covered vs the smallest set of §1 items to close the gap.

**Example (column on manufacturing jobs + reshoring):** §1 — `manufacturing`↔`unemployment` bridge, proposition on productivity vs manufacturing employment; §2 — extend `reshoring` description; §3 — `offshoring` as symmetric term; §4 — Peter Navarro as a term, duplicate productivity term if `technological-progress` suffices.

