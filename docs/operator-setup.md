# Operator setup

This guide contains only actions that require the project owner. It never contains a secret. Follow checkpoints in order; no LingoQL, Sub0, or Groq action is needed until its local preparation is committed and the agent formally opens the checkpoint.

## Current status

H-01 is verified. The local cost preflight and full isolated Sub0 contract harness are committed. H-02 is the only action currently requested; no LingoQL project, service, Sub0 resource, credential, or deployment should be created yet.

## H-01 — GitHub remote

In GitHub, choose **+ → New repository**, choose the intended owner, enter `consera` as the repository name, select **Public**, and leave all initialization options off: no README, license, `.gitignore`, template, or imported code. GitHub's current guidance for adding an existing local project also says not to initialize the new remote, which avoids divergent first commits. Copy the repository's HTTPS or SSH clone URL from Quick Setup. Authorize no other apps or permissions.

Expected result: the repository URL is visible and has no conflicting initial commit. Return only its HTTPS or SSH clone URL. The agent will add the remote, push the prepared bootstrap commit, and verify visibility with `pnpm github:verify-h01`. Safe rollback: remove the remote or delete the empty repository from GitHub; local work remains intact.

## H-02 â€” verify credit and billing safety

The hackathon's current [Get started instructions](https://ztq.devpost.com/) say that Devpost registration provides a LingoQL signup link and $20 credit; they also provide a direct LingoQL link if the email has not arrived. The public LingoQL docs do not document the authenticated billing screen, so use the current account screen's **Credits**, **Usage**, or **Billing** area rather than relying on a guessed button name.

1. Sign in to the Zero to Query Devpost event. If you have not joined it, join first; otherwise use the email signup link or the event's direct LingoQL link to sign in to LingoQL.
2. Before creating any project or service, open the LingoQL account view that shows available credit and billing/usage controls.
3. Confirm all three facts: available credit is at least **$20.00**, there is **no payment method attached**, and **automatic overage is disabled** (or unavailable because no payment method exists).
4. Do not attach a payment method, activate overages, create a resource, or enter any secret. If any required fact is false or unclear, stop without changing it.

Return only a sanitized line such as: `credit=$20.00; payment_method=none; automatic_overage=disabled`. Do not send screenshots, account identifiers, payment details, passwords, API keys, cookies, or connection strings. The agent will create the sanitized evidence record and run `pnpm cost:preflight`; no resource exists to roll back at this checkpoint.

If the credit is not visible, return `credit_not_visible`; if billing protections are not confirmed, return `billing_not_confirmed`. In either case the project remains safely paused before any billable provisioning.

## Upcoming LingoQL and Sub0 actions

H-03 and H-04 are intentionally blocked until H-02 verifies the credit and billing controls. Before each, the agent will re-check official documentation and provide the current user action, expected screen, verification command, and rollback action.

## Upcoming Groq action

H-05 will request a project-scoped key through the Groq Console after the provider adapter and local capability probe are ready. Enter the key only through `pnpm secrets:set GROQ_API_KEY` or the verified LingoQL secret interface. Never paste it in chat, Git, issues, a screenshot, or a command line.

## Safety rules

- Never attach a payment method or enable automatic overages.
- Never enable an unrestricted production signup flow.
- Never enter secrets into source files or `.env.example`.
- Never approve H-09 without the stated backup checksum, downtime, and rollback plan.
