# ADR-005: Groq models and persistent budget fencing

- Status: accepted subject to account capability probe
- Blueprint: sections 7.4, 15, 26.2

## Decision

Use Groq only from server/worker code. Configure `openai/gpt-oss-20b` for bounded fast classification and `openai/gpt-oss-120b` for deep analysis only after a model capability and strict structured-output probe. Persistent database slots and reservations enforce app budgets; local limiters only optimize.

## Consequences

Model IDs and conservative caps are configuration, not domain constants. A 429 defers safely; quota exhaustion switches to an honest degraded mode.
