# H-03 credit stop evidence

Recorded: 2026-07-18

The account owner reported the following LingoQL service and credit state after stopping the first H-03 server deployment:

| Field                   | Value                |
| ----------------------- | -------------------- |
| Service                 | `consera-web-phase0` |
| Region                  | US EAST (New York)   |
| Service state           | Inactive             |
| Service amount shown    | $5.02                |
| Credit balance          | $14.98               |
| Credit expiration shown | 17th Aug, 2026       |
| Billing mode            | Pay as you go        |

The owner separately confirmed that the displayed credit stopped decreasing once the service was stopped.

No LingoQL credential, billing identifier, or payment method was recorded. The dashboard did not provide a usable itemized build-versus-runtime cost in this evidence, so a reliable hourly burn rate cannot be inferred.

Decision: no restart, redeploy, database provisioning, or Sub0 provisioning is authorized until a future bounded budget window is explicitly approved.
