# Cost model

Status: controlled. A short H-03 server deployment was created on 2026-07-18, returned an external `502`, and was then stopped by the account owner. The account owner confirmed that credit stopped decreasing after the service was stopped, then reported a provider clarification that the displayed $5.02 is a one-time monthly charge. No payment method will be attached.

`docs/cost-record.json` is the machine-validated source for H-02 and H-07. `pnpm cost:preflight` refuses to pass until it has a sanitized H-02 evidence reference, at least $20 starting credit, no payment method, and automatic overage disabled.

## Assumptions fixed by the blueprint

- Hard out-of-pocket ceiling: $0.
- LingoQL hackathon credit: $20, to be confirmed at H-02.
- Preferred topology: web, Sub0, PostgreSQL, smallest worker/cron service.
- Fallback topology: web, Sub0, PostgreSQL, one bounded signed scheduler tick.
- A production topology is not selected until the six-hour burn experiment preserves a 30% judging reserve.

## Credit-preserving operating rule

The project must not keep any LingoQL compute resource running between explicitly approved proof windows.

- Work, unit tests, integration tests, architecture checks, builds, and browser smoke tests run locally by default.
- The LingoQL-connected `main` branch is deployment-sensitive. Ongoing work is committed on a non-deployment branch and is not merged to `main` until a proof window is approved.
- Before each LingoQL action that can start a build or resource, record the displayed remaining credit, a maximum acceptable spend, and a maximum runtime in `docs/platform-evidence/`.
- Stop or suspend every temporary service as soon as the proof result is captured. Never leave a worker, database, or web service running merely for convenience.
- Prefer the blueprint's single bounded scheduler-tick fallback over an always-on worker. Use the free static deployment option only for pages that no longer require server-side behavior.
- If the platform cannot show a reliable cost estimate or remaining balance before an action, do not start that action; ask the account owner for a decision.

See `docs/credit-preservation-plan.md` for the phase-by-phase workflow.

## Burn experiment record

| Field                         | Value                                                             |
| ----------------------------- | ----------------------------------------------------------------- |
| Environment / resource sizes  | H-03: 1 vCPU, 256 MB memory, 20 MB volume, 10 GB egress; stopped  |
| Start timestamp (UTC)         | pending                                                           |
| End timestamp (UTC)           | pending                                                           |
| Starting credit               | pending H-02                                                      |
| Ending credit                 | $14.98 after H-03                                                 |
| Duration hours                | pending                                                           |
| Observed burn per hour        | not calculable; dashboard reported $5.02 without an itemized rate |
| Projected judging-period burn | pending                                                           |
| Required 30% reserve          | pending                                                           |
| Selected mode                 | pending ADR-004                                                   |

If the calculation fails the reserve requirement, Mode B, paused ingestion, or replay/source-only is selected; no paid fallback is allowed.
