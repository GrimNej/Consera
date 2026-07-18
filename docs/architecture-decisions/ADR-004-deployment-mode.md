# ADR-004: Deployment mode remains unselected until burn evidence

- Status: pending six-hour burn experiment
- Blueprint: sections 2.3, 6.4, 26, 30

## Decision

Prefer Mode A (web, Sub0, PostgreSQL, smallest worker/cron). Select Mode B only if its bounded scheduler tick fits the measured request timeout with a 30% margin or Mode A fails the credit-reserve calculation.

## Consequences

No worker topology is assumed from marketing documentation. The six-hour LingoQL burn experiment and `docs/cost-model.md` decide the production mode.
