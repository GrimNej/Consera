import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import {
  assertSupportedSecretName,
  readLocalSecrets,
  writeLocalSecrets,
} from './shared';

async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    throw new Error('Usage: pnpm secrets:set <LOGICAL_SECRET_NAME>');
  }
  assertSupportedSecretName(name);
  if (!input.isTTY) {
    throw new Error('Secret entry requires an interactive terminal.');
  }

  const readline = createInterface({ input, output, terminal: true });
  const value = await readline.question(`${name}: `, { hideEchoBack: true });
  readline.close();

  if (!value) {
    throw new Error('An empty secret was not written.');
  }

  const secrets = await readLocalSecrets();
  secrets.set(name, value);
  await writeLocalSecrets(secrets);
  process.stdout.write(`${name} saved locally without printing its value.\n`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown secret entry error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
