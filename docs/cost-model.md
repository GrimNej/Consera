# Cost model

Status: unmeasured. No LingoQL resource has been provisioned and no payment method will be attached.

## Assumptions fixed by the blueprint

- Hard out-of-pocket ceiling: $0.
- LingoQL hackathon credit: $20, to be confirmed at H-02.
- Preferred topology: web, Sub0, PostgreSQL, smallest worker/cron service.
- Fallback topology: web, Sub0, PostgreSQL, one bounded signed scheduler tick.
- A production topology is not selected until the six-hour burn experiment preserves a 30% judging reserve.

## Burn experiment record

| Field | Value |
|---|---|
| Environment / resource sizes | pending H-03/H-04 |
| Start timestamp (UTC) | pending |
| End timestamp (UTC) | pending |
| Starting credit | pending H-02 |
| Ending credit | pending H-07 |
| Duration hours | pending |
| Observed burn per hour | pending |
| Projected judging-period burn | pending |
| Required 30% reserve | pending |
| Selected mode | pending ADR-004 |

If the calculation fails the reserve requirement, Mode B, paused ingestion, or replay/source-only is selected; no paid fallback is allowed.
