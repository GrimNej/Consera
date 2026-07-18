import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { Client } from 'pg';

const migrationDirectory = path.resolve('db/contract-harness');
const connectionString =
  process.env.DATABASE_URL ??
  'postgres://consera:consera_local_only@localhost:54329/consera_contracts';

async function migrate(): Promise<void> {
  const files = (await readdir(migrationDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));
  const client = new Client({ connectionString });

  await client.connect();
  try {
    for (const file of files) {
      const migration = await readFile(path.join(migrationDirectory, file), 'utf8');
      await client.query(migration);
      process.stdout.write(`Applied ${file}\n`);
    }
  } finally {
    await client.end();
  }
}

void migrate().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown migration error';
  process.stderr.write(`Local migration failed: ${message}\n`);
  process.exitCode = 1;
});
