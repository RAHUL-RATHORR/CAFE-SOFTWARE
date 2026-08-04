# Contributing

## Branching

- `main` / `master` — release candidate / production
- `develop` — integration
- Feature branches: `feat/<name>`, fixes: `fix/<name>`

## Pull requests

1. Typecheck + lint + unit/integration tests green
2. Keep PRs focused; avoid drive-by refactors
3. Do not commit secrets (`.env*`)
4. Update docs when adding public APIs or ops flows

## Commit style

Prefer imperative, present tense:

- `feat: add purchase order filters`
- `fix: guard public menu without restaurant slug`
- `docs: refresh deployment checklist`

## Code review focus

- Backward compatibility
- Repository / action boundary integrity
- RBAC on new server actions
- No client→mongoose imports
