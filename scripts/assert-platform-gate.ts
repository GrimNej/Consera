import { readFile } from 'node:fs/promises';

import { assertPlatformGate, PlatformContractReportSchema } from '@consera/contracts';

async function main(): Promise<void> {
  const reportText = await readFile('docs/platform-contract-report.json', 'utf8');
  const report = PlatformContractReportSchema.parse(JSON.parse(reportText));
  assertPlatformGate(report);
  process.stdout.write('Platform contract gate passed.\n');
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown platform gate error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
