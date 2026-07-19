# H-03 Linux lifecycle evidence

Recorded: 2026-07-19

Environment: local Docker Linux, Node `24.18.0`, 1 vCPU, 256 MB memory, pnpm `11.7.0`, Next.js `16.2.10`.

## Failing baseline

The first automated `pnpm web:smoke:linux` run served the correct health response but rejected the original pnpm-mediated shutdown:

```text
Linux web runtime failed graceful shutdown: {"exitCode":1,"oomKilled":false,"error":""}
```

After moving the container command to the direct Node launcher but before normalizing the expected POSIX result, the same test observed exit `143` for SIGTERM.

## Passing result

After pinning the launcher cwd and handling only requested SIGINT/SIGTERM exit representations as clean shutdown, `pnpm web:smoke:linux` passed:

```json
{
  "ok": true,
  "health": {
    "status": "ok",
    "service": "consera-web",
    "phase": 0
  },
  "exitCode": 0
}
```

Additional verified results:

| Command/check                     | Result                                                            |
| --------------------------------- | ----------------------------------------------------------------- |
| Plain Node probe unit tests       | 2 passed                                                          |
| Real Next Linux root request      | HTTP 200                                                          |
| Real Next Linux health request    | exact H-03 JSON, HTTP 200                                         |
| Sequential Linux health requests  | 100 requests, 0 failures                                          |
| Internal container health request | HTTP 200                                                          |
| Original 256 MB limit             | passed; no OOM, about 124 MiB observed after startup              |
| `pnpm check`                      | 5 test files, 10 tests passed; format, lint, and typecheck passed |
| `pnpm build`                      | passed                                                            |
| `pnpm check:architecture`         | passed; 119 modules and 113 dependencies checked                  |
| `pnpm web:smoke`                  | passed                                                            |

This artifact contains no account credential, cookie, token, secret, or private service identifier.

Public LingoQL verification is still required. A local pass does not mark H-03 verified.
