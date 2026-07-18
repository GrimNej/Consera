# Operator setup

This guide contains only actions that require the project owner. It never contains a secret. Follow checkpoints in order; no LingoQL, Sub0, or Groq action is needed until its local preparation is committed and the agent formally opens the checkpoint.

## Current status

H-01 is ready. All later checkpoints remain blocked until H-01 is verified.

## H-01 — GitHub remote

In GitHub, choose **+ → New repository**, choose the intended owner, enter `consera` as the repository name, select **Public**, and leave all initialization options off: no README, license, `.gitignore`, template, or imported code. GitHub's current guidance for adding an existing local project also says not to initialize the new remote, which avoids divergent first commits. Copy the repository's HTTPS or SSH clone URL from Quick Setup. Authorize no other apps or permissions.

Expected result: the repository URL is visible and has no conflicting initial commit. Return only its HTTPS or SSH clone URL. The agent will add the remote, push the prepared bootstrap commit, and verify visibility with `pnpm github:verify-h01`. Safe rollback: remove the remote or delete the empty repository from GitHub; local work remains intact.

## Upcoming LingoQL and Sub0 actions

H-02 through H-04 will be issued only after H-01 is verified and the local deployment/contract harness has passed. Before following a LingoQL UI instruction, the agent will re-check official documentation and provide the exact current navigation path, expected screen, verification command, and a rollback action.

## Upcoming Groq action

H-05 will request a project-scoped key through the Groq Console after the provider adapter and local capability probe are ready. Enter the key only through `pnpm secrets:set GROQ_API_KEY` or the verified LingoQL secret interface. Never paste it in chat, Git, issues, a screenshot, or a command line.

## Safety rules

- Never attach a payment method or enable automatic overages.
- Never enable an unrestricted production signup flow.
- Never enter secrets into source files or `.env.example`.
- Never approve H-09 without the stated backup checksum, downtime, and rollback plan.
