import { spawn } from 'node:child_process';

import { assertSupportedSecretName, readLocalSecrets } from './shared';

async function copyToClipboard(value: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const command = process.platform === 'win32' ? 'clip.exe' : 'clip';
    const child = spawn(command, [], {
      stdio: ['pipe', 'ignore', 'pipe'],
      shell: false,
    });
    let errorOutput = '';

    child.stderr.on('data', (chunk: Buffer) => {
      errorOutput += chunk.toString('utf8');
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Clipboard command failed${errorOutput ? `: ${errorOutput.trim()}` : ''}`,
        ),
      );
    });
    child.stdin.end(value);
  });
}

async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    throw new Error('Usage: pnpm secrets:copy <LOGICAL_SECRET_NAME>');
  }
  assertSupportedSecretName(name);
  const secrets = await readLocalSecrets();
  const value = secrets.get(name);
  if (!value) {
    throw new Error(`${name} is not set locally.`);
  }
  await copyToClipboard(value);
  process.stdout.write(
    `${name} copied to the local clipboard without printing its value.\n`,
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to copy secret';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
