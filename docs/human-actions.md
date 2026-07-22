# Human action ledger

Only non-secret confirmations and sanitized verification artifacts belong here. States: `not_ready`, `ready_for_user`, `waiting_for_user`, `verification_pending`, `verified`, `blocked`, `not_required`.

| ID   | Action                                                                             | Why human-only                                                                    | State        | Requested at | Verified at          | Evidence                                                                                                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------ | ------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-01 | Create/confirm public GitHub repository `consera` and authorize remote integration | Requires account ownership and OAuth/visibility choices                           | verified     | 2026-07-18   | 2026-07-18T09:20:48Z | `docs/platform-evidence/2026-07-18_H-01-github.md`                                                                                                                                                                         |
| H-02 | Confirm LingoQL $20 credit and billing protections                                 | Requires account access; payment/overage settings are security/financial controls | verified     | 2026-07-18   | 2026-07-18T09:58:05Z | `docs/platform-evidence/2026-07-18_H-02-lingoql-credit.md`                                                                                                                                                                 |
| H-03 | Create/select Consera LingoQL project and connect repository                       | Requires LingoQL account authorization                                            | blocked      | 2026-07-18   | —                    | Canonical standalone deployment `6a608c4a9e4a08e1d9907db5` is ready internally, but LingoQL Analytics records `/` and `/api/health` as edge `502`; see `docs/platform-evidence/2026-07-22_H-03-next-standalone-recheck.md` |
| H-04 | Provision smallest LingoQL PostgreSQL and Sub0 resources                           | Requires platform resource creation and secret handling                           | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-05 | Create restricted Groq project key and set data controls                           | Requires account access and secret generation                                     | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-06 | Install platform and generated secrets in LingoQL                                  | Requires secure secret entry in user-owned service                                | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-07 | Confirm six-hour ending LingoQL balance                                            | Requires account balance access if no API exists                                  | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-08 | Select documented safe option after mandatory contract failure                     | Requires explicit architecture decision                                           | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-09 | Approve destructive production migration/reset                                     | Requires explicit approval and data-impact acknowledgement                        | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-10 | Approve judge accounts and privately copy credentials to Devpost                   | Requires account distribution and publishing authority                            | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-11 | Submit final Devpost project                                                       | Requires submission-account authority                                             | not_ready    | —            | —                    | —                                                                                                                                                                                                                          |
| H-12 | Obtain organizer approval before Oracle is considered                              | Requires external written approval                                                | not_required | —            | —                    | Oracle is excluded from the default path                                                                                                                                                                                   |

## Resume marker

```yaml
checkpoint: H-03
git_commit_at_marker_creation: ca62083
completed_tests:
  - pnpm check
  - pnpm check:architecture
  - pnpm web:smoke:standalone
  - pnpm web:smoke
  - pnpm web:smoke:linux
  - hard-deployed canonical standalone branch as deployment 6a608c4a9e4a08e1d9907db5
  - verified exact Linux standalone artifact and staged static path in the uncached build log
  - verified LingoQL readiness trial 1 and runtime listener 0.0.0.0:8080
  - reproduced public root and health HTTP 502 and correlated both in LingoQL Analytics
  - git diff --check
next_command: pnpm lingoql:verify-h03 -- https://us-east-fmw5kf5-m1.lingoql.com/api/health
expected_files:
  - docs/platform-evidence/<timestamp>_H-03-lingoql-health.md after provider route repair
  - docs/human-actions.md
  - progress.md
verification_criterion: HTTPS health route returns HTTP 200 with the exact Consera health response from deployed code ca62083, and LingoQL Analytics records the same request as HTTP 200
```

## H-03 maintainer handoff

The maintainer requested an application-side debug and verification against the current Next.js server-deployment documentation. That re-audit is complete in `docs/platform-evidence/2026-07-22_H-03-next-standalone-recheck.md`. Keep standalone deployment `6a608c4a9e4a08e1d9907db5` running so the maintainer can inspect the current failed ingress. Record only a non-secret ticket/request ID or sanitized response here; never record credentials, cookies, or connection strings.
