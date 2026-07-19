import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { z } from 'zod';

const execFileAsync = promisify(execFile);
const containerName = `consera-h03-next-smoke-${process.pid}`;
const imageName = 'consera-h03-next:smoke';
const hostPort = 31_810;

const ContainerStateSchema = z.object({
  ExitCode: z.number().int(),
  OOMKilled: z.boolean(),
  Error: z.string(),
});

async function docker(args: readonly string[], timeout = 30_000): Promise<string> {
  const result = await execFileAsync('docker', [...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout,
    windowsHide: true,
  });
  return result.stdout.trim();
}

async function waitForHealth(): Promise<unknown> {
  let lastFailure = 'No response received.';
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${hostPort}/api/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return await response.json();
      lastFailure = `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'Unknown fetch failure.';
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Linux web runtime did not become healthy: ${lastFailure}`);
}

async function cleanup(): Promise<void> {
  const matches = await docker([
    'ps',
    '-a',
    '--filter',
    `name=^/${containerName}$`,
    '--format',
    '{{.Names}}',
  ]);
  if (matches === '') return;

  const running = await docker([
    'inspect',
    containerName,
    '--format',
    '{{.State.Running}}',
  ]);
  if (running === 'true') {
    await docker(['stop', '--timeout', '5', containerName]);
  }
  await docker(['rm', containerName]);
}

async function main(): Promise<void> {
  await docker(
    ['build', '--file', 'apps/web/Dockerfile.h03', '--tag', imageName, '.'],
    10 * 60_000,
  );

  await docker([
    'run',
    '-d',
    '--name',
    containerName,
    '--cpus',
    '1',
    '--memory',
    '256m',
    '--memory-swap',
    '256m',
    '-p',
    `127.0.0.1:${hostPort}:8080`,
    imageName,
  ]);

  const health = await waitForHealth();
  await docker(['stop', '--timeout', '10', containerName]);

  const rawState = await docker([
    'inspect',
    containerName,
    '--format',
    '{{json .State}}',
  ]);
  const state = ContainerStateSchema.parse(JSON.parse(rawState));
  if (state.OOMKilled || state.Error !== '' || state.ExitCode !== 0) {
    throw new Error(
      `Linux web runtime failed graceful shutdown: ${JSON.stringify({
        exitCode: state.ExitCode,
        oomKilled: state.OOMKilled,
        error: state.Error,
      })}`,
    );
  }

  process.stdout.write(
    `${JSON.stringify({ ok: true, health, exitCode: state.ExitCode }, null, 2)}\n`,
  );
}

async function run(): Promise<void> {
  try {
    await main();
  } finally {
    await cleanup();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Linux web smoke failed.';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
