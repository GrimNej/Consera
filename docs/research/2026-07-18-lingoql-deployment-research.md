# LingoQL H-03 deployment research record

Verified on 2026-07-18 before requesting the first LingoQL deployment.

- [Services you can deploy](https://docs.lingoql.com/introduction/services-you-can-deploy.md) lists Next.js/SSR support through Railpack or Nixpacks and states that LingoQL injects `HOST` and `PORT`.
- [Deploy checklist](https://docs.lingoql.com/introduction/troubleshooting-deploys/deploy-checklist.md) requires a local production build, one lockfile, a pinned runtime, a long-running start process, externalized secrets, and binding to the platform host/port.
- [Runtime and startup failures](https://docs.lingoql.com/introduction/troubleshooting-deploys/runtime-and-startup-failures.md) confirms that a failed rollout does not replace a healthy deploy and warns against fixed ports, `localhost`, and one-off commands.

The public documentation does not specify the authenticated GitHub-connect UI labels. The H-03 operator instructions therefore identify the required configuration and verification outcome without inventing a dashboard path that may have changed.
