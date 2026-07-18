# Human action ledger

Only non-secret confirmations and sanitized verification artifacts belong here. State values: `not_ready`, `ready_for_user`, `waiting_for_user`, `verification_pending`, `verified`, `blocked`, `not_required`.

| ID | Action | Why human-only | State | Requested at | Verified at | Evidence |
|---|---|---|---|---|---|---|
| H-01 | Create/confirm public GitHub repository `consera` and authorize remote integration | Requires account ownership and OAuth/visibility choices | not_ready | — | — | Bootstrap verification is not prepared yet |
| H-02 | Confirm LingoQL $20 credit and billing protections | Requires account access; payment/overage settings are security/financial controls | not_ready | — | — | — |
| H-03 | Create/select Consera LingoQL project and connect repository | Requires LingoQL account authorization | not_ready | — | — | — |
| H-04 | Provision smallest LingoQL PostgreSQL and Sub0 resources | Requires platform resource creation and secret handling | not_ready | — | — | — |
| H-05 | Create restricted Groq project key and set data controls | Requires account access and secret generation | not_ready | — | — | — |
| H-06 | Install platform and generated secrets in LingoQL | Requires secure secret entry in user-owned service | not_ready | — | — | — |
| H-07 | Confirm six-hour ending LingoQL balance | Requires account balance access if no API exists | not_ready | — | — | — |
| H-08 | Select documented safe option after mandatory contract failure | Requires explicit architecture decision | not_ready | — | — | — |
| H-09 | Approve destructive production migration/reset | Requires explicit approval and data-impact acknowledgement | not_ready | — | — | — |
| H-10 | Approve judge accounts and privately copy credentials to Devpost | Requires account distribution and publishing authority | not_ready | — | — | — |
| H-11 | Submit final Devpost project | Requires submission-account authority | not_ready | — | — | — |
| H-12 | Obtain organizer approval before Oracle is considered | Requires external written approval | not_required | — | — | Oracle is excluded from the default path |

## Resume marker

```yaml
checkpoint: none
git_commit: uncommitted-bootstrap
completed_tests: []
next_command: pnpm install
expected_files: []
verification_criterion: Phase 0 workspace baseline is installed and recorded
```
