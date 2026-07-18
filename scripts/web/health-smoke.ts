import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

const port = 3147;
const endpoint = `http://127.0.0.1:${port}/api/health`;

async function waitForHealth(): Promise<unknown> {
  let latestFailure = 'No HTTP response received.';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(500) });
      if (response.ok) return await response.json();
      latestFailure = `Unexpected HTTP status ${response.status}.`;
    } catch (error) {
      latestFailure =
        error instanceof Error ? error.message : 'Unknown HTTP startup failure.';
    }
    await delay(250);
  }
  throw new Error(
    `Web health endpoint did not become ready within 10 seconds: ${latestFailure}`,
  );
}

async function main(): Promise<void> {
  const webDirectory = path.resolve('apps/web');
  const nextCli = path.join(webDirectory, 'node_modules/next/dist/bin/next');
  const child = spawn(
    process.execPath,
    [nextCli, 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: webDirectory,
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
      stdio: 'ignore',
      shell: false,
    },
  );

  try {
    const health = await waitForHealth();
    process.stdout.write(`${JSON.stringify({ ok: true, health }, null, 2)}\n`);
  } finally {
    child.kill('SIGTERM');
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Web health smoke test failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
