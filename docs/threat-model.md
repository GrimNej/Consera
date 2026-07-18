# Threat model

Derived from blueprint sections 17, 19, and 24. This is a living record; every new external boundary or mutation requires an update.

| Threat                               | Control                                                                               | Verification                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Cross-tenant data access             | Authoritative action membership lookup, composite tenant foreign keys, cursor binding | Cross-tenant action, cursor, polling, and database tests |
| Token exposure                       | Server-only encrypted HTTP-only cookie; BFF-only Sub0 access                          | Bundle/cookie confidentiality test                       |
| Stale authorization                  | Database membership and session/authz version check per action                        | Suspend member then assert next action fails             |
| Mutation replay                      | UUID idempotency key + canonical request hash                                         | Same-key, same-body and same-key, different-body tests   |
| Worker split brain                   | Token/generation fenced leases and global database slots                              | Late-worker/overlap chaos tests                          |
| Duplicate effects                    | Workflow effect key and target creation key in one transaction                        | Crash after effect insert test                           |
| SSRF / hostile source                | Validated JSON reader, strict URL/IP/redirect rules, no remote image rendering        | SSRF corpus and poison-pill tests                        |
| Prompt injection / unsupported claim | Untrusted source boundary, no tools, strict schemas, evidence-ID checks               | Prompt-injection and evidence validation tests           |
| Free-tier exhaustion                 | Persistent reservation ledger, quotas, bounded retries, degradation modes             | Reservation/429/ambiguous-crash tests                    |
| Secret disclosure                    | Gitignore, non-echo secret entry, Gitleaks, redacted logs                             | Local and CI secret scan                                 |
