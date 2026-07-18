# ADR-002: Sub0 transaction invocation is a release gate

- Status: pending executable validation
- Blueprint: sections 3, 4.4, 10, 31

## Decision

No production aggregate mutation ships until a verified Sub0 action can invoke the required PostgreSQL transaction or stored function with rollback, conditional mutation atomicity, tenant isolation, uniqueness, persistence, and runtime secret injection proven by executable contract tests.

## Consequences

Local fixtures are useful only for code development. A failed mandatory test stops full implementation at H-08; no browser-side, process-local, or retry-loop workaround is acceptable.
