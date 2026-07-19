import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const probePath = path.resolve('apps/web/scripts/platform-probe.mjs');
const children = new Set<ChildProcessWithoutNullStreams>();

async function allocatePort(): Promise<number> {
  const reservation = createServer();
  await new Promise<void>((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const address = reservation.address();
  if (address === null || typeof address === 'string') {
    reservation.close();
    throw new Error('Unable to allocate a TCP port for the platform probe test.');
  }
  await new Promise<void>((resolve, reject) => {
    reservation.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

async function waitForResponse(url: string): Promise<Response> {
  let lastError = 'No response received.';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(250) });
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown fetch error.';
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Platform probe did not start: ${lastError}`);
}

async function waitForExit(
  child: ChildProcessWithoutNullStreams,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { code: child.exitCode, signal: child.signalCode };
  }
  return await new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

afterEach(async () => {
  await Promise.all(
    [...children].map(async (child) => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM');
      }
      await waitForExit(child);
    }),
  );
  children.clear();
});

describe('LingoQL differential platform probe', () => {
  it('serves bounded health responses and shuts down cleanly', async () => {
    const port = await allocatePort();
    const child = spawn(process.execPath, [probePath], {
      env: { ...process.env, HOST: '0.0.0.0', PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);

    const health = await waitForResponse(`http://127.0.0.1:${port}/api/health`);
    expect(health.status).toBe(200);
    expect(health.headers.get('content-type')).toBe('application/json; charset=utf-8');
    await expect(health.json()).resolves.toEqual({
      status: 'ok',
      service: 'consera-platform-probe',
      phase: 0,
      runtime: 'node-http',
    });

    const root = await fetch(`http://127.0.0.1:${port}/`);
    expect(root.status).toBe(200);
    expect(root.headers.get('connection')).toBe('close');

    const head = await fetch(`http://127.0.0.1:${port}/`, { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');

    const missing = await fetch(`http://127.0.0.1:${port}/missing`);
    expect(missing.status).toBe(404);

    child.kill('SIGTERM');
    const expectedExit =
      process.platform === 'win32'
        ? { code: null, signal: 'SIGTERM' as const }
        : { code: 0, signal: null };
    await expect(waitForExit(child)).resolves.toEqual(expectedExit);
    children.delete(child);
  });

  it('rejects an invalid injected port', async () => {
    const child = spawn(process.execPath, [probePath], {
      env: { ...process.env, HOST: '127.0.0.1', PORT: 'invalid' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    await expect(waitForExit(child)).resolves.toEqual({ code: 1, signal: null });
    expect(stderr).toContain('PORT must be an integer between 1 and 65535.');
    children.delete(child);
  });
});
