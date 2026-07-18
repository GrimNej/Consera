# LingoQL and Sub0 Phase 0 research record

Verified on 2026-07-18 before creating the remote contract package. This record separates platform documentation from executable evidence; a documented capability is never marked as a passed Consera contract until the corresponding probe succeeds.

## Official sources consulted

- [Zero to Query: LingoQL Hackathon](https://ztq.devpost.com/) says registration leads to a LingoQL signup link and $20 credit, and requires Sub0 for the backend with LingoQL hosting for the deployment.
- [Sub0 Getting Started](https://docs.lingoql.com/sub0/getting-started.md) directs the operator to create a Sub0 project, then define models and endpoint specifications.
- [Sub0 ABI structure](https://docs.lingoql.com/sub0/apis-abi/structure.md) documents resources, actionables, sequential execution, SQL queries, and `returnables`.
- [Sub0 accessors](https://docs.lingoql.com/sub0/apis-abi/accessors.md) documents `$ENV`, `$PAYLOAD`, `$HEADER`, and `$PROTECTED` values.
- [Sub0 authentication](https://docs.lingoql.com/sub0/apis-abi/authentication.md) and [security enforcements](https://docs.lingoql.com/sub0/apis-abi/security-enforcements.md) direct protected endpoints to use verified `$PROTECTED` claims rather than caller-supplied account IDs.
- [Sub0 environment variables](https://docs.lingoql.com/sub0/managing-env.-variables.md) documents Custom Variables, the project-management path, and runtime access through `$ENV`.
- [Sub0 extras](https://docs.lingoql.com/sub0/extras.md) documents blue-green deployment behavior, but that assertion remains insufficient without a Consera redeploy persistence probe.
- [Sub0 queueing](https://docs.lingoql.com/sub0/apis-abi/queueing.md) and [cron jobs](https://docs.lingoql.com/sub0/apis-abi/cron-jobs.md) document available native features, but not every failure and fencing guarantee required by the blueprint.

## Resulting implementation decisions

1. Every protected ABI resource in `sub0/contract-tests/abi/` obtains the subject exclusively from `$PROTECTED.id`; `subjectId` is deliberately ignored in the identity-override probe.
2. Multi-row contract mutations use one PostgreSQL stored-function call in one `QUERY` actionable. The available official documentation describes sequential actions but does not document a shared transaction across several actionables, so Consera will not assume one.
3. `CONTRACT_HARNESS_KEY`, `CONTRACT_JWT_KEY`, and `CONTRACT_RUNTIME_PROBE` are dedicated, short-lived test-only Custom Variables. Values are created or entered locally through secure helpers and never printed, committed, or sent in chat.
4. Native queue, cron, and WebSocket capabilities remain untrusted until executable tests prove the specific blueprint requirements. The ABI package therefore includes PostgreSQL fenced-job and deduplicated-schedule fallbacks; polling stays the selected P0 realtime fallback.
5. The redeploy check is a two-step experiment because redeployment is a user-owned platform action: seed a sentinel, perform the safe platform redeploy, then verify the sentinel through a fresh protected call.

## Known documentation limits

The public documentation consulted does not establish a shared transaction across multiple ABI actionables, a durable at-least-once execution guarantee for a mid-execution worker crash, or organization-scoped WebSocket subscription semantics. Those gaps are intentionally not filled with assumptions. The runner and report will leave the relevant check failing or select the documented PostgreSQL/polling fallback until evidence exists.
