# ADR-003: Polling-first realtime

- Status: accepted for P0
- Blueprint: sections 3.3, 6.3, 23.5

## Decision

P0 uses authenticated same-origin polling. Visible decision/workflow pages poll at two seconds, background tabs at fifteen seconds, and radar/dossiers at thirty seconds. Direct Sub0 WebSockets are deferred unless tenant authorization, revocation, reconnection, sequence, and backpressure contracts all pass.

## Consequences

This provides a verified-safe fallback without placing browser tokens in client storage or relying on client-side organization filtering. WebSockets, if added, are invalidation-only.
