# Credential matrix

Values are never written to this file. `Verified` means the agent performed a non-secret check, not that a value was disclosed.

| Logical name                   | Owner/source       | Local location       | LingoQL secret name            | Readers         | Class              | Rotation / revocation                                        | Verified |
| ------------------------------ | ------------------ | -------------------- | ------------------------------ | --------------- | ------------------ | ------------------------------------------------------------ | -------- |
| `APP_BASE_URL`                 | platform-generated | `.secrets/local.env` | `APP_BASE_URL`                 | web             | platform-generated | Update URL then redeploy; remove old value                   | no       |
| `SUB0_BASE_URL`                | platform-generated | `.secrets/local.env` | `SUB0_BASE_URL`                | web, worker     | platform-generated | Replace after Sub0 cutover; remove old endpoint              | no       |
| `SUB0_SERVICE_TOKEN_CURRENT`   | platform-generated | `.secrets/local.env` | `SUB0_SERVICE_TOKEN_CURRENT`   | web, worker     | platform-generated | Overlap with previous token; drain leases; revoke old        | no       |
| `SUB0_SERVICE_TOKEN_PREVIOUS`  | platform-generated | `.secrets/local.env` | `SUB0_SERVICE_TOKEN_PREVIOUS`  | web, worker     | platform-generated | Remove after overlap and negative verification               | no       |
| `SUB0_CONTRACT_BASE_URL`       | platform-generated | `.secrets/local.env` | â€”                            | contract runner | non-secret config  | Replace only with a new H-04 contract project                | no       |
| `DATABASE_URL_CONTRACT`        | platform-generated | `.secrets/local.env` | â€”                            | schema setup    | connection secret  | Delete local value after Phase 0; never print or commit      | no       |
| `CONTRACT_HARNESS_KEY`         | agent-generated    | `.secrets/local.env` | `CONTRACT_HARNESS_KEY`         | contract runner | test secret        | Replace both local and Sub0 value together; delete after P0  | no       |
| `CONTRACT_JWT_KEY`             | agent-generated    | `.secrets/local.env` | `CONTRACT_JWT_KEY`             | Sub0 only       | test secret        | Replace both local and Sub0 value together; delete after P0  | no       |
| `CONTRACT_RUNTIME_PROBE`       | agent-generated    | `.secrets/local.env` | `CONTRACT_RUNTIME_PROBE`       | Sub0 only       | test secret        | Replace both local and Sub0 value together; delete after P0  | no       |
| `SESSION_KEY_CURRENT`          | agent-generated    | `.secrets/local.env` | `SESSION_KEY_CURRENT`          | web             | agent-generated    | Add next key; accept overlap; remove old key after expiry    | no       |
| `SESSION_KEY_PREVIOUS`         | agent-generated    | `.secrets/local.env` | `SESSION_KEY_PREVIOUS`         | web             | agent-generated    | Remove after all old cookies expire                          | no       |
| `GROQ_API_KEY`                 | user-acquired      | `.secrets/local.env` | `GROQ_API_KEY`                 | worker          | user-acquired      | Create replacement project key; deploy; revoke old key       | no       |
| `AI_MODEL_FAST`                | configuration      | `.secrets/local.env` | `AI_MODEL_FAST`                | worker          | platform-generated | Change only after capability probe and ADR                   | no       |
| `AI_MODEL_DEEP`                | configuration      | `.secrets/local.env` | `AI_MODEL_DEEP`                | worker          | platform-generated | Change only after capability probe and ADR                   | no       |
| `AI_DAILY_REQUEST_BUDGET`      | configuration      | `.secrets/local.env` | `AI_DAILY_REQUEST_BUDGET`      | worker          | platform-generated | Lower immediately if necessary; never exceed verified limits | no       |
| `AI_DAILY_TOTAL_TOKEN_BUDGET`  | configuration      | `.secrets/local.env` | `AI_DAILY_TOTAL_TOKEN_BUDGET`  | worker          | platform-generated | Lower immediately if necessary; never exceed verified limits | no       |
| `CRON_TRIGGER_SECRET_CURRENT`  | agent-generated    | `.secrets/local.env` | `CRON_TRIGGER_SECRET_CURRENT`  | web, scheduler  | agent-generated    | Overlap with previous secret; then revoke old                | no       |
| `CRON_TRIGGER_SECRET_PREVIOUS` | agent-generated    | `.secrets/local.env` | `CRON_TRIGGER_SECRET_PREVIOUS` | web, scheduler  | agent-generated    | Remove after scheduler overlap ends                          | no       |
