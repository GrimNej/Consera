# Local quality baseline

Captured: 2026-07-18 UTC before application bootstrap.

## Environment

| Tool           | Observed version |
| -------------- | ---------------- |
| Git            | 2.51.0.windows.2 |
| Node.js        | v24.14.0         |
| Corepack       | 0.34.6           |
| pnpm           | 11.7.0           |
| Docker         | 29.5.3           |
| Docker Compose | v5.1.4           |

## Result: `git diff --cached --check`

Exit code: `1`.

The supplied `CONSERA_IMPLEMENTATION_BLUEPRINT.md` contains intentional Markdown trailing spaces that represent hard line breaks. The first reported lines were 3–10 and 85–87; the check output specifically reports `trailing whitespace.` for those lines. The blueprint is user-authored and binding, so it is preserved unchanged. Future formatting checks exclude only this source document or tolerate its intentional Markdown line breaks; all implementation-owned files must pass whitespace checks.

No application lint, type-check, test, security, or architecture baseline exists yet because the local workspace has not been installed. Those results will be appended after the Phase 0 bootstrap rather than represented as passing.

## Bootstrap findings

- pnpm initially blocked package build scripts. `esbuild` was inspected and explicitly approved because Vitest/tsx require its native binary; optional `sharp` remains explicitly blocked because Consera does not process remote images.
- `typescript@7.0.2` was incompatible with `typescript-eslint@8.64.0` (peer range `<6.1.0`). The workspace now pins `typescript@6.0.3`, the latest compatible 6.x release, and `pnpm peers check` passes.
- The first `pnpm check` run failed before application linting because `@typescript-eslint/no-floating-promises` was configured without ESLint type information. The rule configuration was removed rather than ignored; strict TypeScript remains enabled and typed linting will be restored only with a verified project-service configuration.
- TypeScript 6 marks `baseUrl` as deprecated for a future major while workspace source-path mappings still require it. The configuration explicitly records `ignoreDeprecations: "6.0"`; a future TypeScript 7 upgrade requires replacing source-path mappings with emitted package exports before the dependency can be upgraded.

## Verified local baseline

| Command                   | Result                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm peers check`        | pass; no peer dependency issues                                                                            |
| `pnpm check`              | pass; formatting, ESLint zero-warning mode, strict TypeScript, and 8 unit/property tests                   |
| `pnpm db:up`              | pass after starting Docker Desktop; PostgreSQL 18.2 local harness is reversible through `pnpm db:down`     |
| `pnpm db:migrate:local`   | pass; applied `0001_contract_harness.sql`                                                                  |
| `pnpm test:integration`   | pass; 3 local PostgreSQL tests including rollback, tenant schema, and fenced job/schedule behavior         |
| `pnpm test:platform`      | pass; ABI guardrails plus proof that an unconnected report cannot pass the platform gate                   |
| `pnpm platform:gate`      | expected fail: all eight mandatory checks plus background/scheduled execution remain untested pending H-04 |
| `pnpm cost:preflight`     | expected fail: `startingCreditUsd` and `billingEvidence` are unavailable before H-02                       |
| `pnpm check:architecture` | pass; dependency-cruiser and Knip clean                                                                    |
| `pnpm build`              | pass; web and worker build clean after the documented Next.js `typedRoutes` migration                      |
| `pnpm check:security`     | expected fail: Gitleaks, Semgrep, and Trivy are not installed on this machine                              |

The local PostgreSQL test is evidence that the test harness behaves correctly. It is not evidence that LingoQL/Sub0 satisfies any mandatory platform contract.

After the first production build, ESLint scanned generated `apps/web/.next` output because its ignore pattern only matched a root `.next` directory. The source lint configuration now ignores `**/.next/**`; no generated file was changed or treated as source code.

## Security-tool status

- Docker Gitleaks scan: passed with the official `ghcr.io/gitleaks/gitleaks:latest` image, digest `sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f`. It scanned 665.34 KB and reported no leaks. The `.gitleaks.toml` allowlist excludes only ignored generated `.next`, `node_modules`, and `.secrets` paths.
- Semgrep: unresolved. Two bounded Docker attempts (run, then pull) produced no registry progress or local image; both were terminated without a scan result. No Semgrep-clean claim is made.
- Trivy: unresolved. It remains unavailable as a host command and has not been represented as a passing scan.

`pnpm check:security` remains intentionally failing until all three required scanners execute successfully through a reproducible local or CI path.

## Contract-harness extension

The isolated Sub0 ABI package, direct PostgreSQL schema script, remote runner, redeploy-sentinel probes, fenced background fallback, and schedule-deduplication fallback are present and locally tested. They have not contacted LingoQL or Sub0. `pnpm platform:gate` remains correctly closed until the H-04 evidence replaces every `not_tested` result in `docs/platform-contract-report.json`.

## H-02 verified cost preflight

At 2026-07-18T09:58:05Z, the account owner confirmed a $20.00 credit, no payment method, and automatic overage disabled. The sanitized evidence is `docs/platform-evidence/2026-07-18_H-02-lingoql-credit.md`; `pnpm cost:preflight` passed without reading or printing any account secret.

## H-03 local deployment preflight

`pnpm build` passed with the dynamic health route, and `pnpm web:smoke` passed against the production Next.js server bound to a local `HOST`/`PORT`. At that capture point this was local readiness only; the later LingoQL deployment history is recorded in the H-03 evidence files.

## H-03 Linux lifecycle diagnosis

On 2026-07-19, `pnpm web:smoke:linux` reproduced the LingoQL Node `24.18.0` runtime at 1 vCPU and 256 MB. Before the fix, the real application served health successfully but the pnpm-mediated container exited `1` on normal SIGTERM. After switching the reproducible runtime to the direct Node launcher, pinning its cwd, and normalizing only expected POSIX signal codes, the same command passed health and exited `0`. The evidence is `docs/platform-evidence/2026-07-19_H-03-linux-lifecycle.md`, with analysis in `docs/research/2026-07-19-h03-runtime-diagnosis.md`; public LingoQL verification remains pending.

## H-03 LingoQL routing isolation

On 2026-07-19, commit `dd94f3f` was hard-deployed with the direct Next.js launcher. LingoQL reported the service ready on `0.0.0.0:8080`, but the repository HTTPS verifier received `502`. A second hard build replaced Next.js with a bounded, framework-free Node HTTP probe; LingoQL accepted it on readiness trial 1 and logged its listener on `0.0.0.0:8080`, while both public routes still returned the same `502 Bad Gateway`. The valid hard-rebuild A/B evidence is `docs/platform-evidence/2026-07-19_H-03-lingoql-routing-isolation.md`. H-03 remains blocked on LingoQL's service-specific public route; no production integration has been represented as passing.
