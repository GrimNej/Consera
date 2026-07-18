import { z } from 'zod';

import { fetchValidatedJson } from '@consera/remote-boundary';

const HealthSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('consera-web'),
  phase: z.literal(0),
});

function parseHealthUrl(value: string | undefined): URL {
  if (!value) {
    throw new Error('Usage: pnpm lingoql:verify-h03 -- <HTTPS_HEALTH_URL>');
  }
  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('The H-03 health URL must use HTTPS.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      'The H-03 health URL must not include credentials, query, or fragment.',
    );
  }
  if (url.pathname !== '/api/health') {
    throw new Error('The H-03 health URL must end exactly in /api/health.');
  }
  return url;
}

async function main(): Promise<void> {
  const url = parseHealthUrl(process.argv[2]);
  const health = await fetchValidatedJson(url.toString(), HealthSchema, {
    signal: AbortSignal.timeout(10_000),
    maxResponseBytes: 8 * 1024,
  });
  process.stdout.write(`${JSON.stringify({ ok: true, health }, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'H-03 health verification failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
