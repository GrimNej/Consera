# Consera agent runbook

This repository is governed by [`CONSERA_IMPLEMENTATION_BLUEPRINT.md`](./CONSERA_IMPLEMENTATION_BLUEPRINT.md). The blueprint is binding; this runbook makes its operating rules executable and auditable.

## Current hard gate

Only Phase 0 is authorized until `pnpm platform:gate` passes every mandatory contract and selects a passing queue, scheduler, and realtime implementation. Fixtures may validate local code but never stand in for an unverified production integration.

## Work loop

For each micro-task:

1. Read the relevant blueprint invariant and traceability entry.
2. Mark the atomic task in [`progress.md`](./progress.md) as in progress.
3. Add a failing test where behavior is being implemented.
4. Inspect package boundaries before adding an import or dependency.
5. Implement the smallest complete change.
6. Run the targeted tests, then formatting, linting, and type-checking for the affected package.
7. Review the diff for weakened checks, placeholders, logs, and secret exposure.
8. Update an ADR and operator records when an architecture decision changes.
9. Commit one complete, runnable behavior.
10. Mark the task complete only with test output and an artifact path.

## Non-negotiable implementation rules

- PostgreSQL state reached through verified Sub0 actions is authoritative.
- The browser never receives a Sub0 token or talks directly to Sub0 in P0.
- Current membership is read inside every tenant action; JWT role claims never authorize.
- Aggregate mutation, audit, outbox, and effect records share one verified transaction.
- Reclaimable work always uses owner, unguessable token, generation, expiry, and heartbeat.
- At-least-once delivery is paired with deterministic, transactional business-effect deduplication.
- Model outputs cite stored evidence IDs; UI quotations come only from immutable evidence rows.
- Work and payloads are bounded. Do not render arbitrary remote images.
- Replay, source-only, provider quota, and source outage are explicit degraded modes.
- No paid dependency, payment method, automatic overage, or Oracle default-path dependency.

## Forbidden production patterns

- `TODO`, `FIXME`, ellipsis, fake success, empty catch, or unvalidated input;
- `any` except an immediately narrowed third-party boundary with a documented reason;
- browser token storage, stale-role authorization, direct web/worker database writes;
- read-then-write claims, timestamp-only leases, unfenced completion, or detached promises;
- client-side tenant filtering, unbounded `Promise.all`, assembled raw SQL, or client SQL fragments;
- arbitrary remote images, unsupported P1 workflow nodes, model-generated evidence quotations;
- retrying a mutation with a new idempotency key after timeout; and
- paid services or placeholder integrations.

## Commit and safety policy

Keep every commit runnable. Use conventional, narrowly scoped messages such as `chore(phase0): add operator records` or `test(contracts): prove rollback behavior`. Do not mix unrelated formatting, dependency upgrades, migrations, and features. Never rewrite shared history, delete production data, rotate an active credential, or execute a destructive migration without the recorded H-09 approval.

## Human checkpoints

Use exactly the checkpoint format in blueprint section 33.6. Complete all local preparation before requesting a checkpoint. Never request a password, API key, connection string, cookie, recovery code, or secret in chat. Record non-secret verification evidence in `docs/human-actions.md`; a verbal "done" is not verification.

## Quality tools

Before a phase gate, use the enforcement tools specified in blueprint section 33.4: TypeScript, ESLint, Prettier, Vitest, Playwright/axe, dependency-cruiser, Knip, Gitleaks, Semgrep, Trivy, k6, SQL plans, and bundle analysis where relevant. Missing local tooling is recorded as a baseline failure, never silently skipped.

## Resume protocol

Before pausing, write a resume marker to `progress.md` and `docs/human-actions.md` with the checkpoint ID, commit, completed tests, exact next command, expected files, and verification criterion. On resume, re-read those files and `git status` before proceeding.
