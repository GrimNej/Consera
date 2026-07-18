import { z } from 'zod';

export class RemotePayloadError extends Error {
  public constructor(
    public readonly code:
      | 'REMOTE_TIMEOUT'
      | 'REMOTE_STATUS'
      | 'REMOTE_CONTENT_TYPE'
      | 'REMOTE_BODY_TOO_LARGE'
      | 'REMOTE_JSON_INVALID'
      | 'REMOTE_SCHEMA_INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'RemotePayloadError';
  }
}

async function readBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error('maxBytes must be a positive safe integer.');
  }

  if (!response.body) {
    return new Uint8Array();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('body limit exceeded');
        throw new RemotePayloadError(
          'REMOTE_BODY_TOO_LARGE',
          `Body exceeded ${maxBytes} bytes`,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export async function requestValidatedJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: Readonly<{
    method: 'GET' | 'POST';
    signal: AbortSignal;
    maxResponseBytes: number;
    acceptedStatuses?: readonly number[];
    headers?: Readonly<Record<string, string>>;
    body?: string;
  }>,
): Promise<T> {
  let response: Response;

  try {
    const request: RequestInit = {
      method: options.method,
      signal: options.signal,
      redirect: 'error',
      headers: { accept: 'application/json', ...options.headers },
    };
    if (options.body !== undefined) {
      request.body = options.body;
    }
    response = await fetch(url, request);
  } catch (error) {
    if (options.signal.aborted) {
      throw new RemotePayloadError('REMOTE_TIMEOUT', 'Remote request aborted');
    }
    throw error;
  }

  const accepted = options.acceptedStatuses ?? [200];
  if (!accepted.includes(response.status)) {
    throw new RemotePayloadError(
      'REMOTE_STATUS',
      `Unexpected status ${response.status}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new RemotePayloadError(
      'REMOTE_CONTENT_TYPE',
      `Unexpected content type ${contentType}`,
    );
  }

  const bytes = await readBoundedBody(response, options.maxResponseBytes);
  let value: unknown;

  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new RemotePayloadError(
      'REMOTE_JSON_INVALID',
      'Remote body was not valid UTF-8 JSON',
    );
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new RemotePayloadError('REMOTE_SCHEMA_INVALID', parsed.error.message);
  }
  return parsed.data;
}

export function fetchValidatedJson<T>(
  url: string,
  schema: z.ZodType<T>,
  options: Omit<Parameters<typeof requestValidatedJson<T>>[2], 'method' | 'body'>,
): Promise<T> {
  return requestValidatedJson(url, schema, { ...options, method: 'GET' });
}
