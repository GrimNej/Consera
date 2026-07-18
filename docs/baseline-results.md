# Local quality baseline

Captured: 2026-07-18 UTC before application bootstrap.

## Environment

| Tool | Observed version |
|---|---|
| Git | 2.51.0.windows.2 |
| Node.js | v24.14.0 |
| Corepack | 0.34.6 |
| pnpm | 11.7.0 |
| Docker | 29.5.3 |
| Docker Compose | v5.1.4 |

## Result: `git diff --cached --check`

Exit code: `1`.

The supplied `CONSERA_IMPLEMENTATION_BLUEPRINT.md` contains intentional Markdown trailing spaces that represent hard line breaks. The first reported lines were 3–10 and 85–87; the check output specifically reports `trailing whitespace.` for those lines. The blueprint is user-authored and binding, so it is preserved unchanged. Future formatting checks exclude only this source document or tolerate its intentional Markdown line breaks; all implementation-owned files must pass whitespace checks.

No application lint, type-check, test, security, or architecture baseline exists yet because the local workspace has not been installed. Those results will be appended after the Phase 0 bootstrap rather than represented as passing.
