# H-03 memory test evidence

Recorded: 2026-07-18

The account owner explicitly approved a memory-only diagnostic change for the existing LingoQL `consera-web-phase0` service.

## Change

| Setting              |    Before |     After |
| -------------------- | --------: | --------: |
| Memory               |    256 MB |    512 MB |
| vCPU                 |         1 |         1 |
| Volume               |     20 MB |     20 MB |
| Egress               |     10 GB |     10 GB |
| Build/start commands | unchanged | unchanged |

Before saving, the authenticated LingoQL configuration page displayed a `$2.03` price indicator for the revised configuration. The dashboard did not label that value with a billing interval in this view.

## Result

- LingoQL created a resource-only redeployment and reported it as deployed.
- Its first health-check trial failed; its second trial was reported as ready.
- Independent HTTPS verification of `/api/health` still returned `502`.
- The resource increase did not resolve the public-routing failure.
- The service was then stopped and the authenticated dashboard showed `Stopped`.

Decision: retain 512 MB only as the current saved configuration; do not perform further blind resource or command changes. H-03 remains blocked on a platform routing/health-check diagnosis.
