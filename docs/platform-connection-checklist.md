# Platform connection checklist

Each integration requires a health test and a failure-isolation test before it is marked connected. Public documentation is not implementation evidence; the executable platform-contract report is authoritative.

| System            | Health test                                           | Failure-isolation test                                           | State         |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------- | ------------- |
| Local Git         | `git status --short --branch`                         | Verify no unrelated file is changed before a commit              | verified      |
| GitHub            | `pnpm github:verify-h01` and `git ls-remote origin`   | Invalid/removed remote must fail without modifying local history | verified H-01 |
| LingoQL project   | Official project API/health deployment after H-03     | Invalid project ID must fail with sanitized error                | pending H-03  |
| Sub0              | Authenticated action probe after H-04                 | Caller-supplied identity override must be rejected               | pending H-04  |
| PostgreSQL        | Transaction probe after H-04                          | Injected failure must roll back all mutations                    | pending H-04  |
| Scheduler/worker  | Fenced claim probe after H-04                         | Expired generation cannot publish                                | pending H-04  |
| Groq              | Model capability + structured-output probe after H-05 | Invalid/missing key must be redacted and never logged            | pending H-05  |
| Public deployment | BFF readiness after H-06                              | No Sub0 token in browser bundle/cookie-readable data             | pending H-06  |

The detailed contract mapping and evidence paths live in `docs/platform-contract-report.json` and `docs/platform-evidence/`.
