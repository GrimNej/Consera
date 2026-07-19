# H-03 LingoQL deployment preflight

Prepared on 2026-07-18 before creating a LingoQL project or authorizing the GitHub integration.

## Verified local deployment contract

| Check            | Command                             | Result                                                               |
| ---------------- | ----------------------------------- | -------------------------------------------------------------------- |
| Production build | `pnpm build`                        | pass; the dynamic `GET /api/health` route is emitted                 |
| Runtime health   | `pnpm web:smoke`                    | pass; local `127.0.0.1:3147/api/health` returns the expected JSON    |
| Linux lifecycle  | `pnpm web:smoke:linux`              | pass; Node 24.18, 1 vCPU/256 MB, health response, and SIGTERM exit 0 |
| Runtime pin      | `apps/web/package.json`             | Node `>=24.14.0 <25`, pnpm `11.7.0`                                  |
| Port binding     | `apps/web/scripts/start-server.mjs` | reads LingoQL `HOST` and `PORT`, with safe local defaults            |

## Intended no-secret service configuration

| Setting               | Value                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------- |
| Repository            | `https://github.com/GrimNej/Consera.git`                                                |
| Branch                | `main`                                                                                  |
| Service role          | Web / Next.js SSR app                                                                   |
| Source directory      | repository root; the current dashboard exposes no separate app-root field               |
| Build command         | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @consera/web build` |
| Start command         | `node apps/web/scripts/start-server.mjs`                                                |
| Buildpack             | Railpack first; use Nixpacks only if Railpack demonstrably fails detection              |
| Environment variables | none for this health deployment                                                         |
| Health route          | `/api/health`                                                                           |

The health response is deliberately non-sensitive:

```json
{
  "status": "ok",
  "service": "consera-web",
  "phase": 0
}
```

## Official platform basis

LingoQL documents support for Next.js SSR apps, default Railpack with Nixpacks as an alternative, and injected `HOST`/`PORT` variables. Its deploy checklist requires a locally successful production build, a long-running start command, runtime-pinned dependencies, and no reliance on local `.env` files. See [services you can deploy](https://docs.lingoql.com/introduction/services-you-can-deploy.md) and the [deploy checklist](https://docs.lingoql.com/introduction/troubleshooting-deploys/deploy-checklist.md).

The original pnpm-mediated start command was replaced after the 2026-07-19 Linux diagnosis proved that it exited `1` on a normal SIGTERM. `docs/research/2026-07-19-h03-runtime-diagnosis.md` records the failing and passing experiments.

## H-03 verification procedure

After the account owner creates the project, connects only this repository, and performs the no-secret health deployment, the agent will run:

```powershell
pnpm lingoql:verify-h03 -- https://<lingoql-host>/api/health
```

The command accepts only an HTTPS health URL without embedded credentials, query parameters, or fragments. It validates the exact response schema and never needs a LingoQL password, API key, cookie, or connection string.
