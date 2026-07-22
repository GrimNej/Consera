import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const port = 3148;
const webDirectory = path.resolve('apps/web');
const standaloneServer = path.join(
  webDirectory,
  '.next',
  'standalone',
  'apps',
  'web',
  'server.js',
);
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
    `Standalone web endpoint did not become ready within 10 seconds: ${latestFailure}`,
  );
}

async function main(): Promise<void> {
  await access(standaloneServer);

  const child = spawn(process.execPath, [standaloneServer], {
    cwd: webDirectory,
    env: {
      ...process.env,
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
    },
    stdio: 'ignore',
    shell: false,
  });

  try {
    const health = await waitForHealth();
    const rootResponse = await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(2_000),
    });
    if (!rootResponse.ok) {
      throw new Error(`Standalone root route returned HTTP ${rootResponse.status}.`);
    }
    const rootHtml = await rootResponse.text();
    const staticAssetPath = rootHtml.match(/\/_next\/static\/[^"']+/)?.[0];
    if (staticAssetPath === undefined) {
      throw new Error(
        'Standalone root route did not reference a Next.js static asset.',
      );
    }
    const assetResponse = await fetch(`http://127.0.0.1:${port}${staticAssetPath}`, {
      signal: AbortSignal.timeout(2_000),
    });
    if (!assetResponse.ok) {
      throw new Error(
        `Standalone static asset returned HTTP ${assetResponse.status}: ${staticAssetPath}`,
      );
    }
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          health,
          rootStatus: rootResponse.status,
          staticAssetStatus: assetResponse.status,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    child.kill('SIGTERM');
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Standalone web smoke test failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
