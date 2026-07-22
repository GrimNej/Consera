# H-03 Next.js standalone and live-ingress recheck

Recorded: 2026-07-22

Status: H-03 remains blocked. The maintainer-requested application and deploy-path audit is complete. A canonical Next.js standalone artifact passes locally, in a constrained Linux container, and through LingoQL's build and readiness checks. The attached LingoQL public hostname still returns an edge-generated `502` before the ready application can answer.

## Current documentation checked

The recheck used current primary documentation rather than remembered deployment conventions:

- LingoQL's service documentation states that server applications must bind to the injected `HOST` and `PORT`, with the host resolving to `0.0.0.0`: <https://docs.lingoql.com/introduction/services-you-can-deploy>
- LingoQL's deployment checklist requires a long-running process bound to the injected host and port: <https://docs.lingoql.com/introduction/troubleshooting-deploys/deploy-checklist>
- LingoQL's runtime troubleshooting page repeats the same startup and binding contract: <https://docs.lingoql.com/introduction/troubleshooting-deploys/runtime-and-startup-failures>
- Next.js documents `next build` plus `next start` as a supported full-feature Node.js deployment: <https://nextjs.org/docs/app/getting-started/deploying>
- Next.js documents `output: 'standalone'`, the minimal generated `server.js`, manual static-asset staging, and `PORT`/`HOSTNAME`: <https://nextjs.org/docs/app/api-reference/config/next-config-js/output>

The original `next start` deployment was therefore supported. Standalone output was added as a stricter A/B test that removes the Next CLI and workspace dependency resolution from the runtime request path.

## Live service configuration audit

The signed-in LingoQL dashboard showed:

- service ID: `6a5b52268c77a6fcf5af19a5`;
- service name: `consera-web-phase0`;
- deployment type: `Server`;
- buildpack: Railpack;
- region: US East (New York);
- resources: 1 vCPU, 512 MB memory, 20 MB volume, 10 GB egress;
- build command: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @consera/web build`;
- start command: `node apps/web/scripts/start-server.mjs`;
- Publish Directory: empty, as required for a server deployment;
- public URL: `https://us-east-fmw5kf5-m1.lingoql.com`;
- public base URL: `https://us-east-fmw5kf5-m1.lingoql.com/`; and
- no deploy-path or URL-prefix override in the Links view.

This rules out a Static deployment, populated publish directory, wrong public prefix, fixed localhost binding, fixed port, and the previously suspected missing root path.

## Test-first standalone implementation

Diagnostic branch: `work/h03-next-standalone`

Tested implementation commit: `ca62083`

The first standalone smoke failed as expected because the build did not yet emit a standalone server:

```text
ENOENT: no such file or directory, access '.../apps/web/.next/standalone/server.js'
```

After enabling standalone output, the next red run exposed the actual monorepo deploy path:

```text
apps/web/.next/standalone/apps/web/server.js
```

The implementation now stages `.next/static` beside that server and launches it through the existing bounded `HOST`/`PORT` adapter. The final smoke verified:

```json
{
  "ok": true,
  "health": {
    "status": "ok",
    "service": "consera-web",
    "phase": 0
  },
  "rootStatus": 200,
  "staticAssetStatus": 200
}
```

The LingoQL-style launcher smoke also returned the exact health JSON. The Linux lifecycle smoke then passed at 1 vCPU and 256 MB with no OOM and clean exit code `0`, below the live service's 512 MB allocation.

Repository checks passed:

- `pnpm check`: Prettier, zero-warning ESLint, strict TypeScript, 5 test files, and 10 tests;
- `pnpm check:architecture`: 166 modules and 166 dependencies, no violations or Knip findings;
- `pnpm web:smoke:standalone`;
- `pnpm web:smoke`;
- `pnpm web:smoke:linux`; and
- `git diff --check`.

## Uncached LingoQL deployment

Only the Git branch was changed for the A/B test. The Link, resources, deployment type, Publish Directory, build command, and start command were not changed.

- branch: `work/h03-next-standalone`;
- hard deployment ID: `6a608c4a9e4a08e1d9907db5`;
- image manifest: `sha256:4c3ef66304f1d78a8e9e70faa3c6e79b44f293c4fdc426359090a43da8be1a3a`;
- build result: deployed;
- readiness: passed on trial 1.

The uncached Linux build log recorded:

```json
{
  "event": "standalone_assets_staged",
  "server": "/app/apps/web/.next/standalone/apps/web/server.js",
  "staticDirectory": "/app/apps/web/.next/standalone/apps/web/.next/static/"
}
```

The current runtime log recorded:

```text
▲ Next.js 16.2.10
- Local:   http://localhost:8080
- Network: http://0.0.0.0:8080
✓ Ready in 0ms
```

Live metrics showed 86 MB memory in use from 512 MB and the service state `Running`.

After the evidence was captured, commits `ca62083` and `eaeeb9f` were fast-forwarded to `main` and pushed. The LingoQL Git Branch setting was then restored to `main` without replacing the inspected running container. Deployment `6a608c4a9e4a08e1d9907db5` therefore remains the live standalone runtime for maintainer inspection, while future deployments again follow `main`.

## Public ingress result

At `2026-07-22T09:27:55Z`, independent requests to both public routes returned the same 11-byte response:

```text
HTTP/1.1 502 Bad Gateway
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Xss-Protection: 1; mode=block
Content-Length: 11

Bad Gateway
```

Tested routes:

- `GET /?h03=1784712467756`;
- `GET /api/health?h03=1784712467756`; and
- the query-free repository verifier at `/api/health`, which failed with the expected `Unexpected status 502`.

LingoQL Analytics independently correlated the requests from Nepal:

| Dashboard time | Method | Path          | Status | Edge duration |
| -------------- | ------ | ------------- | ------ | ------------- |
| 03:12:57 PM    | GET    | `/`           | 502    | 19 ms         |
| 03:12:57 PM    | GET    | `/api/health` | 502    | 10 ms         |
| 03:13:06 PM    | GET    | `/api/health` | 502    | 11 ms         |

The response body and security headers are not emitted by Consera. The identical result on a static page and dynamic route, very short edge duration, successful LingoQL readiness, and absent application request output are consistent with a service-upstream lookup or connection failure after LingoQL accepts the public request but before it reaches the listening process.

## Classification and maintainer request

This evidence does not claim a LingoQL-wide outage. It isolates a service-specific public-ingress/upstream failure for `consera-web-phase0`. The application-side alternatives requested by the maintainer have now been exercised with the documented server topology and exact monorepo standalone path.

Please inspect deployment `6a608c4a9e4a08e1d9907db5` and confirm, with sanitized output:

1. which container address and port the public hostname resolves to after readiness trial 1;
2. whether the readiness probe and public proxy use the same container instance and network namespace;
3. the upstream connect error corresponding to the Analytics entries at 03:12:57 PM and 03:13:06 PM;
4. whether the hostname's upstream record was refreshed when the hard deployment replaced the previous image; and
5. whether an internal proxy-plane request to the current container's `http://<address>:8080/api/health` returns the Consera JSON.

No credential, cookie, connection string, billing identifier, or secret is present in this artifact.
