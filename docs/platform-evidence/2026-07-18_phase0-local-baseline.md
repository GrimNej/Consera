# Phase 0 local baseline evidence

- Captured: 2026-07-18 UTC
- Scope: local repository only; no LingoQL, Sub0, Groq, or GitHub account was accessed.

## Passing evidence

| Command                   | Observed                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| `pnpm check`              | 6 unit/property tests passed; format, lint, and strict type-check passed |
| `pnpm db:migrate:local`   | `0001_contract_harness.sql` applied to PostgreSQL 18.2 local container   |
| `pnpm test:integration`   | 1 stored-function rollback test passed                                   |
| `pnpm test:platform`      | 1 report-guard test passed                                               |
| `pnpm check:architecture` | no dependency-cruiser or Knip violations                                 |
| `pnpm build`              | web and worker build passed                                              |

## Expected non-passing evidence

`pnpm platform:gate` reports these unresolved conditions because no LingoQL/Sub0 resources exist yet:

```text
authenticationIdentityIntegrity
tenantReadIsolation
tenantWriteIsolation
uniqueConflictEnforcement
conditionalMutationAtomicity
multiMutationRollback
databaseRedeployPersistence
secretRuntimeInjection
backgroundExecution
scheduledExecution
```

`pnpm check:security` reports `gitleaks`, `semgrep`, and `trivy` as unavailable. This is a local tooling gap, recorded without claiming a clean security result.

## Additional secret-scan evidence

The official Docker Gitleaks image scanned the repository read-only with `--redact` and returned `no leaks found`. The first run identified only ephemeral Next.js preview/encryption values in ignored `apps/web/.next` output. A path-only `.gitleaks.toml` exclusion for generated artifacts was added, then the redacted rerun passed. No source finding was allowlisted.
