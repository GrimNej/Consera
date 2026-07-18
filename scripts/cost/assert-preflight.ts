import { readFile } from 'node:fs/promises';

import { assertCostPreflight, CostRecordSchema } from '@consera/contracts';

async function main(): Promise<void> {
  const raw = await readFile('docs/cost-record.json', 'utf8');
  const record = CostRecordSchema.parse(JSON.parse(raw));
  assertCostPreflight(record);
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        startingCreditUsd: record.startingCreditUsd,
        paymentMethodAttached: record.billingSafety.paymentMethodAttached,
        automaticOverageEnabled: record.billingSafety.automaticOverageEnabled,
      },
      null,
      2,
    )}\n`,
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Cost preflight failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
