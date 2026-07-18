# ADR-006: Replay is a first-class operational mode

- Status: accepted
- Blueprint: sections 4.10, 27

## Decision

Replay uses versioned, captured public HN data and validated model outputs through the same ingestion, outbox, workflow, and decision domain paths. The UI labels replay clearly. Source-only mode provides verified source/event data without fabricated AI conclusions.

## Consequences

The demo remains deterministic when HN or Groq is unavailable, while never pretending that replay data is live.
