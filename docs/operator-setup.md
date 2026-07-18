# Operator setup

This guide contains only actions that require the project owner. It never contains a secret. Follow checkpoints in order; no LingoQL, Sub0, or Groq action is needed until its local preparation is committed and the agent formally opens the checkpoint.

## Current status

H-01 and H-02 are verified. H-03 is ready: create only the minimal no-secret web deployment described below. Do not create a database, Sub0 resource, worker, scheduled job, custom domain, or credential yet.

## H-01 — GitHub remote

In GitHub, choose **+ → New repository**, choose the intended owner, enter `consera` as the repository name, select **Public**, and leave all initialization options off: no README, license, `.gitignore`, template, or imported code. GitHub's current guidance for adding an existing local project also says not to initialize the new remote, which avoids divergent first commits. Copy the repository's HTTPS or SSH clone URL from Quick Setup. Authorize no other apps or permissions.

Expected result: the repository URL is visible and has no conflicting initial commit. Return only its HTTPS or SSH clone URL. The agent will add the remote, push the prepared bootstrap commit, and verify visibility with `pnpm github:verify-h01`. Safe rollback: remove the remote or delete the empty repository from GitHub; local work remains intact.

## H-02 â€” verify credit and billing safety (verified)

The hackathon's current [Get started instructions](https://ztq.devpost.com/) say that Devpost registration provides a LingoQL signup link and $20 credit; they also provide a direct LingoQL link if the email has not arrived. The public LingoQL docs do not document the authenticated billing screen, so use the current account screen's **Credits**, **Usage**, or **Billing** area rather than relying on a guessed button name.

1. Sign in to the Zero to Query Devpost event. If you have not joined it, join first; otherwise use the email signup link or the event's direct LingoQL link to sign in to LingoQL.
2. Before creating any project or service, open the LingoQL account view that shows available credit and billing/usage controls.
3. Confirm all three facts: available credit is at least **$20.00**, there is **no payment method attached**, and **automatic overage is disabled** (or unavailable because no payment method exists).
4. Do not attach a payment method, activate overages, create a resource, or enter any secret. If any required fact is false or unclear, stop without changing it.

Return only a sanitized line such as: `credit=$20.00; payment_method=none; automatic_overage=disabled`. Do not send screenshots, account identifiers, payment details, passwords, API keys, cookies, or connection strings. The agent will create the sanitized evidence record and run `pnpm cost:preflight`; no resource exists to roll back at this checkpoint.

If the credit is not visible, return `credit_not_visible`; if billing protections are not confirmed, return `billing_not_confirmed`. In either case the project remains safely paused before any billable provisioning.

## Upcoming LingoQL and Sub0 actions

## H-03 â€” create the LingoQL project, connect GitHub, and deploy the health route

LingoQL's public documentation confirms that it supports Next.js SSR apps, injects `HOST` and `PORT`, and uses Railpack or Nixpacks. It does not publish the authenticated dashboard labels for GitHub connection, so use the current dashboard's project/service and GitHub connection flow without granting access to any repository other than `GrimNej/Consera`.

1. Sign in to LingoQL and create or select a project named **Consera**. Choose the smallest available web/app runtime; do not add data services.
2. Use the official GitHub connection flow to authorize only `https://github.com/GrimNej/Consera.git`, then select branch `main`.
3. Create one web/SSR service with source directory `apps/web`, build command `pnpm build`, start command `pnpm start`, and Railpack. Set **no** environment variables.
4. Deploy the service using the platform's existing default access setting; do not change visibility, add a custom domain, or create a database/worker/Sub0 service. Wait until it reports healthy and copy its HTTPS health URL ending in `/api/health`.

Return only: `project=Consera; service=<display-name>; health_url=https://<host>/api/health`. Do not send OAuth codes, passwords, cookies, API keys, build logs, project secrets, or connection strings.

The agent will run `pnpm lingoql:verify-h03 -- <health_url>` and validate the exact health JSON. Safe rollback: cancel/delete only this empty no-secret web service and disconnect the GitHub app from this repository; no database data exists yet.

## H-04 follows H-03

H-04 remains blocked until the project/repository connection and no-secret health deployment are verified.

## Upcoming Groq action

H-05 will request a project-scoped key through the Groq Console after the provider adapter and local capability probe are ready. Enter the key only through `pnpm secrets:set GROQ_API_KEY` or the verified LingoQL secret interface. Never paste it in chat, Git, issues, a screenshot, or a command line.

## Safety rules

- Never attach a payment method or enable automatic overages.
- Never enable an unrestricted production signup flow.
- Never enter secrets into source files or `.env.example`.
- Never approve H-09 without the stated backup checksum, downtime, and rollback plan.
