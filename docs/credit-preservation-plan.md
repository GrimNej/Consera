# Credit-preservation plan

Status: active as of 2026-07-18. This is a delivery control, not a substitute for platform billing data.

## What happened

The first H-03 LingoQL server deployment built successfully but the public health endpoint returned `502`. The service was stopped after the account owner noticed the credit balance decreasing. The account owner then confirmed that the balance no longer decreased. The stopped-service dashboard showed a $5.02 service amount and $14.98 remaining credit. See `docs/platform-evidence/2026-07-18_H-03-credit-stop.md`.

The build log confirms that this was a server deployment with 1 vCPU, 256 MB memory, a 20 MB volume, and 10 GB egress. Public LingoQL material describes compute as pay-as-you-go and static deployments as free; it does not provide a trustworthy public rate card for this account or resource combination. Actual dashboard balance and usage are therefore the primary spending authority. The account owner reports that a LingoQL representative clarified the $5.02 as a one-time monthly charge; this is recorded in `docs/platform-evidence/2026-07-18_H-03-provider-billing-clarification.md`.

## Default workflow: local first

| Activity                                                     | Where it runs                     | Cloud credit allowed?               |
| ------------------------------------------------------------ | --------------------------------- | ----------------------------------- |
| Source changes, commits, checks, builds, and web smoke tests | Local workstation                 | No                                  |
| Database schema and integration contracts                    | Local Docker PostgreSQL           | No                                  |
| Sub0 JSON/ABI validation                                     | Local static and contract harness | No                                  |
| GitHub branch backup                                         | Non-deployment branch only        | No LingoQL deployment               |
| Platform compatibility proof                                 | LingoQL, bounded window           | Only after approval                 |
| Final judging/demo deployment                                | LingoQL, bounded window           | Only after a measured burn decision |

## Budget-window protocol

Before any action that can make LingoQL build, deploy, provision, or restart a resource:

1. The account owner reads the dashboard's exact **remaining credit** and any **current usage** figure.
2. We record those values without credentials in a dated evidence file.
3. We agree on a maximum spend and a maximum elapsed runtime for that single proof. The reported monthly-charge clarification allows the implementation to resume, but it does not authorize unattended or unnecessary resources.
4. The account owner starts only the named resource. We verify the exact acceptance criterion immediately.
5. The account owner stops the resource immediately after the result is captured, successful or not.
6. We record the ending balance and decide whether another proof is justified.

If any step cannot be completed, the resource remains stopped.

## Git deployment guardrail

The H-03 service is connected to `main`. Since LingoQL advertises Git-provider auto-deploys, no routine development commit is pushed to `main` while the service is configured for deployment. Work proceeds on `work/phase0-credit-safe` until a deliberately approved deployment window.

## Phase gates

1. Finish the application structure and contracts locally.
2. Fix the H-03 runtime issue locally and collect the minimal runtime evidence needed to make the next deployment a single short proof.
3. Do not provision H-04 PostgreSQL or Sub0 until the account owner supplies the exact remaining credit and approves a capped H-04 window.
4. Measure a short, stopped-after-test resource window before considering the blueprint's six-hour burn experiment.
5. Only run the six-hour experiment if the measured rate predicts the required 30% reserve. Otherwise use the blueprint's paused/replay and bounded-scheduler fallback.

## Current hold

- H-03: deployment verification pending; service stopped; no redeploy authorized.
- H-04 and later: not ready; no cloud resources authorized.
- Current development: local-only.
