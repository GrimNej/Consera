# H-03 runtime diagnosis

Date: 2026-07-19

Status: Consera lifecycle causes found and fixed; remaining public `502` isolated to LingoQL-controlled routing.

## Question

Could the public `502` be caused by Consera even though Next.js logged ready on `0.0.0.0:8080`?

Yes. The original evidence proved that the request listener started, but it did not prove correct process lifecycle behavior during a LingoQL restart or rolling deployment.

## Official requirements checked

- LingoQL requires a long-running process bound to its injected `HOST` and `PORT`; binding to `0.0.0.0` is explicitly supported. Its public documentation does not identify the health-check path or a separate dashboard upstream-port setting: <https://docs.lingoql.com/introduction/troubleshooting-deploys/runtime-and-startup-failures.md> and <https://docs.lingoql.com/introduction/troubleshooting-deploys/deploy-checklist.md>.
- Next.js officially supports `next start`, the `PORT` environment variable, and `--hostname`: <https://nextjs.org/docs/app/api-reference/cli/next>.
- Next.js supports a normal Node server deployment after `next build`: <https://nextjs.org/docs/app/getting-started/deploying>.
- Railpack supports an explicit start command. Its LingoQL documentation does not provide a canonical pnpm-workspace SSR command: <https://railpack.com/reference/cli> and <https://railpack.com/languages/node>.

## Differential experiments

All local Linux experiments used Node `24.18.0`, matching the LingoQL build log.

| Experiment                                                     | Result                                                                                                  | Meaning                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Plain Node probe on `0.0.0.0:8080`                             | health passed; SIGTERM exit `0`                                                                         | Node, the port contract, and Linux signal handling work                                           |
| Real Next build in Linux, 1 vCPU, 256 MB                       | `/` and `/api/health` returned `200`; 100/100 sequential health requests passed; about 124 MiB observed | Next.js and the application run under the original resource limit                                 |
| Original container command `pnpm --filter @consera/web start`  | health passed; normal stop exited `1`                                                                   | pnpm was PID 1 and converted expected SIGTERM into a failed container exit, matching LingoQL logs |
| Direct command before cwd fix                                  | Next reported no production build                                                                       | launcher incorrectly depended on pnpm changing cwd to `apps/web`                                  |
| Direct command after cwd fix, before signal-code normalization | normal stop exited `143`                                                                                | expected POSIX SIGTERM was still represented as failure                                           |
| Final direct command                                           | health passed; normal stop exited `0`; no OOM                                                           | proposed LingoQL runtime path satisfies startup and lifecycle contracts                           |

## Root cause in Consera

Two deployment weaknesses existed:

1. LingoQL started pnpm as the container's top-level process. During a platform stop/restart, pnpm reported the child termination as a recursive-run failure.
2. The Node launcher assumed the current working directory was `apps/web`; starting it directly from the repository root made Next look for the production build in the wrong directory.

The launcher now pins the child cwd to `apps/web`, forwards SIGINT/SIGTERM, bounds forced shutdown to ten seconds, and treats only the corresponding POSIX `130`/`143` termination as a clean requested shutdown. Unexpected signals and exit codes remain failures.

## Proposed LingoQL A/B sequence

1. Keep the existing Railpack build command.
2. Change only the Start Command from `pnpm --filter @consera/web start` to `node apps/web/scripts/start-server.mjs`.
3. Deploy the fixed commit and run the exact H-03 HTTPS verifier.
4. If the public URL still returns `502`, temporarily use `node apps/web/scripts/platform-probe.mjs` on the same image. A failing plain probe would isolate the remaining fault to LingoQL; a passing probe would isolate it to Next.js/runtime packaging.

The plain probe is diagnostic only and cannot satisfy H-03's final Consera health contract.

## Executed LingoQL A/B result

The sequence was executed against hard-built deployment artifacts on 2026-07-19:

1. the fixed direct Next.js launcher started on `0.0.0.0:8080`, while the public health route returned `502`;
2. a framework-free Node HTTP probe was then hard-built into the same service and logged `platform_probe_ready` on `0.0.0.0:8080`;
3. LingoQL accepted the probe on readiness trial 1; and
4. public `GET /` and `GET /api/health` still returned the identical `502 Bad Gateway` response.

The soft-redeploy attempt was excluded because the service log proved that it reused the prior Next.js image metadata. The hard-rebuild result is the valid isolation test.

The remaining failure is not in the Consera handler or Next.js packaging. It is a LingoQL-controlled hostname-to-upstream routing or service attachment failure. This classification is deliberately service-specific; the evidence does not establish a platform-wide outage. Full timestamps, deployment IDs, headers, and the maintainer checklist are recorded in `docs/platform-evidence/2026-07-19_H-03-lingoql-routing-isolation.md`.
