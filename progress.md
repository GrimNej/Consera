# Progress

Source of truth: [`CONSERA_IMPLEMENTATION_BLUEPRINT.md`](./CONSERA_IMPLEMENTATION_BLUEPRINT.md). Update this ledger before and after every atomic task. Parent items remain incomplete while any child is incomplete.

## Repository status

- Current phase: Phase 0 — repository, platform contracts, and cost proof
- Gate: `pnpm platform:gate` must pass before Phase 1
- Resume marker: H-01 ready; local bootstrap commit `181f343a0066e60625b621fcb22c277896d21323`

## Phase 0 — bootstrap and operator records

- [x] Read the complete implementation blueprint (2026-07-18)
- [x] Audit repository: empty workspace; no user-authored code overwritten
- [x] Initialize Git on `main`
- [x] Create mandatory operator records and blueprint traceability map
- [x] Record initial repository-integrity baseline (`docs/baseline-results.md`)
- [x] Bootstrap workspace, local PostgreSQL, strict checks, fixtures, and contract harness
- [x] Run local quality baseline and record exact results
- [x] Prepare H-01 verification script, harmless bootstrap commit, and remote checklist
- [x] Verify H-01 GitHub remote (public `origin/main`, verified commit `ff50ec5`)

### Authentication identity integrity

- [ ] Write failing identity-override contract test
- [ ] Implement Sub0 action experiment
- [ ] Capture command and observed output
- [ ] Store sanitized artifact under `docs/platform-evidence/`
- [ ] Mark report result
- [ ] Run platform gate

### Tenant and transaction contracts

- [ ] Test cross-tenant read, write, enumeration, and cursor reuse denial
- [ ] Create unique-conflict contract fixture
- [ ] Create compare-and-set fixture and run 50 concurrent calls
- [ ] Assert exactly one compare-and-set success
- [ ] Inject a multi-mutation failure and assert complete rollback
- [ ] Prove stored-function or equivalent action transaction boundary
- [ ] Prove database redeploy persistence
- [ ] Prove runtime secret injection without client/build exposure

### Alternative contracts and cost proof

- [ ] Test or select fenced background execution fallback
- [ ] Test or select scheduled execution fallback
- [ ] Select polling unless tenant-safe WebSockets pass every required contract
- [ ] Measure LingoQL request timeout
- [ ] Run six-hour LingoQL burn experiment
- [ ] Record cost model and 30% reserve

## Phase 1 — reliable vertical slice (blocked by Phase 0 gate)

- [ ] Fixture/live source → normalized source → immutable evidence → analysis → dossier → manual decision → two-session transition

## Phase 2 — AI budget fencing (blocked by Phase 0 gate)

- [ ] Initialize daily ledger with non-increasing limits
- [ ] Reserve maximum tokens idempotently
- [ ] Separate claim, provider, and deferral counters
- [ ] Test ambiguous in-flight pessimistic reconciliation
- [ ] Assert a late worker cannot publish

## Phase 3 — impact and opportunity consistency (blocked by Phase 0 gate)

- [ ] Require exact ten component-evidence keys
- [ ] Implement six deterministic score formulas
- [ ] Persist score contribution rows
- [ ] Add opportunity fingerprint/input hash and relational evidence links
- [ ] Prove duplicate analysis emits one outbox event

## Phase 4 — workflow create-decision effect (blocked by Phase 0 gate)

- [ ] Define deterministic effect key and criticality
- [ ] Implement reservation and transactional duplicate-return behavior
- [ ] Execute under a fenced lease and recover after crash
- [ ] Reject graphs where a referenced decision does not dominate dependent nodes
- [ ] Validate every realtime route stream/type mapping

## Phase 5 — hardening and submission (blocked by Phase 0 gate)

- [ ] Run E2E, chaos, accessibility, cost, replay, rollback, secret, and submission checks
