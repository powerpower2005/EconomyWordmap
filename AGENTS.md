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

After YAML changes:

```bash
node build-data.js
npm run validate-data
```

Commit to Git so UI **changelog** / **updatedAt** update (`scripts/term-history.js` uses Git history).

For **writing style** (tone, conditional phrasing): read `docs/agent-data-guide.md` (Korean).

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/agent-data-guide.md](docs/agent-data-guide.md) | Main workflow (KO): add term, edit relation, validate, commit |
| [docs/data-schema.md](docs/data-schema.md) | Term / Relation YAML fields (EN) |
| [docs/agent-recipes.md](docs/agent-recipes.md) | Prompts (KO) + agent steps (EN) |
| [docs/categories.md](docs/categories.md) | Category list and UI sync (KO) |
| [docs/add_terms.md](docs/add_terms.md) | Short user-facing pointer (KO) |

## Relation IDs

Check the last `id: r###` in `src/data/relations.yaml` and use the next number (e.g. after `r204` use `r205`).

## YAML

Wrap long `description` values in double quotes if they contain `=`, `:`, or `#`.

## Push / commit

Create git commits only when the user asks. Do not force-push `main`/`master`.
