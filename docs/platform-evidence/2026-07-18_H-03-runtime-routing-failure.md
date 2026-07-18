# H-03 runtime routing evidence

Recorded: 2026-07-18

## Sanitized runtime log

```text
$ node ./scripts/start-server.mjs

▲ Next.js 16.2.10

- Local:         http://localhost:8080
- Network:       http://0.0.0.0:8080

✓ Ready in 466ms

/app/apps/web:

[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @consera/web@0.1.0 start: `node ./scripts/start-server.mjs`

Command failed with signal "SIGTERM"

$ node ./scripts/start-server.mjs

▲ Next.js 16.2.10

- Local:         http://localhost:8080
- Network:       http://0.0.0.0:8080

✓ Ready in 817ms
```

## Independent public-route checks

While the second process reported ready, both of these HTTPS requests returned `502` with no application response body:

- `GET /`
- `GET /api/health`

The production launcher reads the injected `HOST` and `PORT`, and the runtime log proves that it bound to `0.0.0.0:8080`. The same launcher passes the local production smoke test. The application has no runtime secrets or external dependencies in this H-03 health deployment.

Conclusion: this evidence does not support a Consera application startup failure. It indicates a LingoQL routing, health-check, or container-lifecycle issue that requires platform-side diagnosis.

## Support report text

> A GitHub-backed Next.js service builds successfully and logs `Ready` on `0.0.0.0:8080`, using LingoQL's injected `HOST` and `PORT`. Both the public root URL and `/api/health` return HTTP 502 with no application body. The process was once terminated with `SIGTERM` by the platform and then restarted. There are no runtime secrets or external dependencies. Please inspect the service routing/health-check target and container lifecycle for `consera-web-phase0` in US East.
