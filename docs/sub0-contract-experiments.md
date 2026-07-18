# Sub0 remote contract experiments

This is the H-04 execution plan for the isolated `consera_contract` schema. It is ready before resource provisioning, but none of these commands has run against LingoQL or Sub0 yet.

## What the harness proves

| Requirement                             | Resource / mechanism                                        | Automated assertion                                                          |
| --------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Identity integrity                      | `contract-profile` uses `$PROTECTED.id`                     | A token for subject A ignores a submitted subject B ID                       |
| Tenant read/write/list/cursor isolation | stored functions with membership joins                      | A cannot read, rename, enumerate, or cursor-reuse B's organization           |
| Unique conflicts                        | primary key on `(organization_id, claim_key)`               | first claim is `CREATED`; second is deterministic `CONFLICT`                 |
| Conditional mutation                    | `contract_compare_and_set` stored function                  | 50 bounded concurrent calls yield exactly one update                         |
| Rollback                                | `contract_insert_then_fail` stored function                 | injected error leaves mutation count at zero                                 |
| One-action transaction boundary         | one `QUERY` calling one stored function                     | ABI structure test and remote function call both pass                        |
| Runtime secret injection                | `contract-runtime-secret` reads `$ENV` without returning it | API returns `available`; client bundle scan finds none of the three values   |
| Redeploy persistence                    | durable sentinel + fresh token                              | sentinel remains readable after safe redeploy                                |
| Background fallback                     | fenced PostgreSQL job lease                                 | a stale worker cannot complete after a newer lease generation claims the job |
| Scheduler fallback                      | unique `(organization_id, schedule_key)` run                | 50 bounded concurrent ticks produce exactly one `RUN_STARTED`                |

## Required H-04 Custom Variables

Create these only in the disposable Sub0 contract project. They are test secrets, not product secrets.

| Name                     | Local command                                  | Sub0 value source                                                                      | Exposure rule                                  |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `CONTRACT_HARNESS_KEY`   | `pnpm secrets:generate CONTRACT_HARNESS_KEY`   | `pnpm secrets:copy CONTRACT_HARNESS_KEY`, then paste in the Sub0 Custom Variables UI   | Header for two public bootstrap resources only |
| `CONTRACT_JWT_KEY`       | `pnpm secrets:generate CONTRACT_JWT_KEY`       | `pnpm secrets:copy CONTRACT_JWT_KEY`, then paste in the Sub0 Custom Variables UI       | JWT signing key; never use in a browser        |
| `CONTRACT_RUNTIME_PROBE` | `pnpm secrets:generate CONTRACT_RUNTIME_PROBE` | `pnpm secrets:copy CONTRACT_RUNTIME_PROBE`, then paste in the Sub0 Custom Variables UI | Probe only reports `available` or `missing`    |

`SUB0_CONTRACT_BASE_URL` and `DATABASE_URL_CONTRACT` are recorded locally with `pnpm secrets:set <NAME>`; they are never put into a tracked `.env` file. The former must be an HTTPS origin with no path, query string, fragment, or embedded credentials.

## Safe execution order after H-04

1. Enter the five local values through the secure commands above. Never enter any value into chat.
2. Run `pnpm sub0-contract:setup`. It uses the static idempotent SQL in `sub0/contract-tests/sql/001_contract_schema.sql` and creates only the `consera_contract` schema.
3. Import all JSON files in `sub0/contract-tests/abi/` into the new Sub0 project and deploy them. Do not merge them with eventual production ABIs.
4. Run `pnpm build`, then `pnpm security:client-secrets`.
5. Run `pnpm sub0-contract:run`. It uses two fresh disposable subjects and prints only a sanitized run summary.
6. Run `pnpm sub0-contract:redeploy:seed`; perform the smallest safe Sub0, web, and worker redeploy offered by the platform; then run `pnpm sub0-contract:redeploy:verify`.
7. Save sanitized output under `docs/platform-evidence/`, update `docs/platform-contract-report.json`, and run `pnpm platform:gate`.

If any mandatory probe fails, do not proceed to product implementation or substitute a client-side check. Stop at H-08 with the sanitized failing output and the blueprint's documented safe choices.
