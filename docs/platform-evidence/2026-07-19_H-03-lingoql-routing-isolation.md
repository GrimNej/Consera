# H-03 LingoQL routing-isolation evidence

Recorded: 2026-07-19

Status: H-03 remains blocked. Consera's production-process defects were fixed, but the remaining public `502` was reproduced with a framework-free HTTP server and is therefore outside the Consera request handler.

## Fixed application deployment

- Service: `consera-web-phase0`
- Region: US East (New York)
- Repository branch used for isolation: `work/phase0-credit-safe`
- Tested implementation commit: `dd94f3f`
- Runtime: Node `24.18.0`, Railpack `0.18.0`, 1 vCPU, 512 MB memory
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @consera/web build`
- Start command: `node apps/web/scripts/start-server.mjs`
- Hard deployment ID: `6a5c5cd3d3a54524953d9107`

The hard build passed Next.js compilation and TypeScript, emitted `/` and `/api/health`, and LingoQL marked the service deployed. The runtime log then reported:

```text
▲ Next.js 16.2.10
- Local: http://localhost:8080
- Network: http://0.0.0.0:8080
✓ Ready in 649ms
```

The repository verifier still failed:

```text
$ pnpm lingoql:verify-h03 -- https://us-east-fmw5kf5-m1.lingoql.com/api/health
Unexpected status 502
```

## Framework-free A/B deployment

The start command was changed to the bounded diagnostic server `node apps/web/scripts/platform-probe.mjs`. A soft redeploy was excluded from the evidence because its runtime log proved that LingoQL had reused the previous Next.js image metadata.

A subsequent hard rebuild explicitly listed the diagnostic start command and created deployment `6a5c5e66d3a54524953d9114`. LingoQL marked it deployed on readiness trial 1. Its runtime log contained exactly:

```json
{ "event": "platform_probe_ready", "host": "0.0.0.0", "port": 8080 }
```

At `2026-07-19T05:22:27Z`, independent requests to both public paths returned the same non-application response:

```text
HTTP/1.1 502 Bad Gateway
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Xss-Protection: 1; mode=block
Content-Length: 11

Bad Gateway
```

Tested paths:

- `GET https://us-east-fmw5kf5-m1.lingoql.com/`
- `GET https://us-east-fmw5kf5-m1.lingoql.com/api/health`

The diagnostic server returns bounded JSON with HTTP `200` for both paths and cannot produce the observed `Bad Gateway` body. It has no Next.js dependency, database connection, secret, remote call, or application middleware.

## Repository validation

The following checks passed after the real application was restored and the records were updated:

- `pnpm check`: Prettier, zero-warning ESLint, strict TypeScript, 5 test files, and 10 tests;
- `pnpm check:architecture`: 119 modules and 113 dependencies, with no dependency violations or Knip findings;
- `pnpm build`: all workspace packages passed and Next.js emitted `/` plus `/api/health`;
- `pnpm cost:preflight`: starting credit `$20`, no payment method, and automatic overage disabled;
- Docker Gitleaks image `sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f`: 1.39 MB scanned with no leaks; and
- `git diff --check`: pass.

`pnpm lingoql:verify-h03 -- https://us-east-fmw5kf5-m1.lingoql.com/api/health` remains an expected failure with HTTP `502`; it is not represented as a passing gate.

## Classification

The original Consera deployment did contain code defects: pnpm converted expected SIGTERM into exit `1`, and the direct launcher initially relied on pnpm's working directory. Commit `dd94f3f` fixes both and passes the exact Linux lifecycle smoke test.

The remaining failure is classified as a **LingoQL-controlled public-routing or service-upstream configuration failure**, not a Consera code, credential, quota, memory, or Next.js failure. This does not prove a platform-wide outage; it may be specific to the service's hostname-to-container route record.

## Restored real-application state

After the isolation test, the diagnostic command was removed. Commit `dd94f3f` was fast-forwarded to and pushed on `main`, and LingoQL was restored to:

- Git branch: `main`
- Start command: `node apps/web/scripts/start-server.mjs`
- Hard deployment ID: `6a5c5fc6d3a54524953d911d`

LingoQL accepted the final real-application deployment on readiness trial 1. The final runtime log reported Next.js ready on `0.0.0.0:8080` in 587 ms. The repository verifier and an independent root request still returned `502`; the root response was captured at `2026-07-19T05:28:37Z`. The service was deliberately left running with the real `main` application so the maintainer can inspect the failing current route rather than a diagnostic process.

## Maintainer request

Please inspect the public route for `consera-web-phase0` in US East and confirm:

1. `us-east-fmw5kf5-m1.lingoql.com` is attached to the current service/container rather than a stale deployment;
2. the reverse proxy targets the injected runtime port `8080` in the correct container network namespace;
3. the readiness target and the public upstream resolve to the same running container;
4. an internal request from the proxy/network plane reaches `http://<current-container>:8080/api/health`; and
5. any proxy/upstream error or request ID corresponding to `2026-07-19T05:22:27Z` is returned in sanitized form.

No credential, cookie, connection string, billing identifier, or secret is present in this artifact.
