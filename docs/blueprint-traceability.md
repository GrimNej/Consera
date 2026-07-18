# Blueprint traceability

All implementation records derive from [`../CONSERA_IMPLEMENTATION_BLUEPRINT.md`](../CONSERA_IMPLEMENTATION_BLUEPRINT.md), which remains the binding architecture specification. This index prevents undocumented divergence.

| Artifact                                | Blueprint sections     | Purpose                                     |
| --------------------------------------- | ---------------------- | ------------------------------------------- |
| `agents.md`                             | 0.1, 4, 33             | Operational invariants and work loop        |
| `progress.md`                           | 31–33                  | Atomic, test-backed execution ledger        |
| `docs/human-actions.md`                 | 4.11, 31.1, 33.6–33.10 | Human-only action ledger and resume markers |
| `docs/operator-setup.md`                | 8.1, 31.1, 33.6        | Safe, current operator instructions         |
| `docs/credential-matrix.md`             | 8.1, 24.4, 33.7        | Credential lifecycle without secret values  |
| `docs/platform-connection-checklist.md` | 3, 8.1, 28.2           | Health and failure-isolation checks         |
| `docs/platform-contract-report.json`    | 3.2–3.4                | Executable platform-gate evidence           |
| `docs/cost-model.md`                    | 2.3, 6.4, 26           | LingoQL burn and reserve evidence           |
| `docs/threat-model.md`                  | 17, 19, 24             | Security and privacy controls               |
| `docs/architecture-decisions/`          | 33.5                   | Immutable decision rationale                |

Any new production capability must be added here with its blueprint section(s), tests, and an ADR if it changes an architectural choice.
