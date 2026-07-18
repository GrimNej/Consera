# Sub0 Phase 0 ABI probes

These resources are an isolated, disposable contract harness. They prove the platform behavior required by the blueprint; they are not Consera production endpoints and must never be copied into the product unchanged.

## Import order after H-04

1. Run `pnpm sub0-contract:setup` only after `DATABASE_URL_CONTRACT` has been entered through the secure local prompt. It creates the `consera_contract` schema only; it does not alter existing tables.
2. In the Sub0 project, add the required Custom Variables listed in `docs/sub0-contract-experiments.md`. Use `pnpm secrets:copy <NAME>` to move each local value to the clipboard without printing it.
3. Import every resource JSON file in this directory. These resources use `$ENV`, `$HEADER`, `$PAYLOAD`, and `$PROTECTED` accessors documented by LingoQL/Sub0.
4. Deploy from the Sub0 editor, then run `pnpm sub0-contract:run` locally.

All protected resources derive their subject from `$PROTECTED.id`. The only public resources are token bootstrap routes guarded by `x-contract-key`, a dedicated test secret. Do not expose that key in a browser, build log, or chat.

The runner treats undocumented response behavior as a failure. A passing local PostgreSQL test is not a passing Sub0 test.
