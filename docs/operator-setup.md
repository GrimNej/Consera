# Operator setup

This guide contains only actions that require the project owner. It never contains a secret. Follow checkpoints in order; no LingoQL, Sub0, or Groq action is needed until its local preparation is committed and the agent formally opens the checkpoint.

## Current status

No human action is required yet. Local Phase 0 bootstrap is in progress.

## H-01 — GitHub remote

When H-01 is opened, create or confirm a repository named `consera` under the intended account or organization. Use **Public** visibility so GitHub Actions public-repository minutes are available. Do not add a README, license, or `.gitignore` during creation because this repository already has tracked files. Authorize only the repository connection requested by the official GitHub flow.

Expected result: the repository URL is visible and has no conflicting initial commit. Return only its HTTPS or SSH clone URL. The agent will add the remote, fetch it, push the prepared bootstrap commit, and verify visibility. Safe rollback: remove the remote or delete the empty repository from GitHub; local work remains intact.

## Upcoming LingoQL and Sub0 actions

H-02 through H-04 will be issued only after H-01 is verified and the local deployment/contract harness has passed. Before following a LingoQL UI instruction, the agent will re-check official documentation and provide the exact current navigation path, expected screen, verification command, and a rollback action.

## Upcoming Groq action

H-05 will request a project-scoped key through the Groq Console after the provider adapter and local capability probe are ready. Enter the key only through `pnpm secrets:set GROQ_API_KEY` or the verified LingoQL secret interface. Never paste it in chat, Git, issues, a screenshot, or a command line.

## Safety rules

- Never attach a payment method or enable automatic overages.
- Never enable an unrestricted production signup flow.
- Never enter secrets into source files or `.env.example`.
- Never approve H-09 without the stated backup checksum, downtime, and rollback plan.
