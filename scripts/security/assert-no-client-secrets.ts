import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { readLocalSecrets } from '../secrets/shared';

const scannedSecretNames = [
  'CONTRACT_HARNESS_KEY',
  'CONTRACT_JWT_KEY',
  'CONTRACT_RUNTIME_PROBE',
] as const;

async function walk(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(candidate)));
    } else if (entry.isFile()) {
      files.push(candidate);
    }
  }
  return files;
}

async function main(): Promise<void> {
  const outputDirectory = path.resolve('apps/web/.next');
  try {
    const directory = await stat(outputDirectory);
    if (!directory.isDirectory()) throw new Error('not a directory');
  } catch {
    throw new Error(
      'apps/web/.next is missing. Run pnpm build before the client-secret probe.',
    );
  }

  const secrets = await readLocalSecrets();
  const missing = scannedSecretNames.filter((name) => !secrets.get(name));
  if (missing.length > 0) {
    throw new Error(
      `Client-secret probe is missing local values: ${missing.join(', ')}.`,
    );
  }

  const files = await walk(outputDirectory);
  for (const file of files) {
    const content = await readFile(file);
    for (const name of scannedSecretNames) {
      const value = secrets.get(name);
      if (value && content.includes(Buffer.from(value, 'utf8'))) {
        throw new Error(`Client bundle contains ${name}; inspect ${file}.`);
      }
    }
  }

  process.stdout.write(
    `${JSON.stringify({ ok: true, scannedFiles: files.length, scannedSecrets: scannedSecretNames.length })}\n`,
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Client-secret probe failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
