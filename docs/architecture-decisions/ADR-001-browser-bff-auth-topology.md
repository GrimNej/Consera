# ADR-001: Browser BFF authentication topology

- Status: accepted
- Blueprint: sections 4.2, 4.3, 6.1, 22.5, 24.2

## Decision

Browser requests use same-origin Next.js route handlers. The BFF keeps the Sub0 token in an authenticated, encrypted HTTP-only cookie and forwards typed requests to Sub0. Browser JavaScript never receives a Sub0 token. Sub0 remains the final tenant authorization boundary through current membership lookup in the transaction.

## Consequences

Every route needs body limits, schema validation, CSRF protection, request IDs, server-only cookie handling, and validated Sub0 envelopes. Direct browser-to-Sub0 access is prohibited.
