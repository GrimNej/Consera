import { readFile } from 'node:fs/promises';

import { Client } from 'pg';

import { readSub0ContractConfig } from './shared';

async function main(): Promise<void> {
  const config = await readSub0ContractConfig();
  const migration = await readFile(
    'sub0/contract-tests/sql/001_contract_schema.sql',
    'utf8',
  );
  const client = new Client({ connectionString: config.databaseUrl });

  await client.connect();
  try {
    await client.query(migration);
  } finally {
    await client.end();
  }

  process.stdout.write(
    `${JSON.stringify({ ok: true, schema: 'consera_contract', migration: '001_contract_schema.sql' })}\n`,
  );
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Sub0 contract schema setup failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
