import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { requestValidatedJson } from './json';

describe('requestValidatedJson', () => {
  it('rejects a non-JSON content type before schema parsing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response('<html></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

    try {
      await expect(
        requestValidatedJson('https://example.test', z.object({ ok: z.boolean() }), {
          method: 'GET',
          signal: new AbortController().signal,
          maxResponseBytes: 1024,
        }),
      ).rejects.toMatchObject({
        code: 'REMOTE_CONTENT_TYPE',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects bodies over the configured byte limit', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    try {
      await expect(
        requestValidatedJson('https://example.test', z.object({ ok: z.boolean() }), {
          method: 'GET',
          signal: new AbortController().signal,
          maxResponseBytes: 4,
        }),
      ).rejects.toMatchObject({
        code: 'REMOTE_BODY_TOO_LARGE',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
