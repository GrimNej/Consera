import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const localSecretPath = path.resolve('.secrets/local.env');

const supportedNames = new Set([
  'APP_BASE_URL',
  'SUB0_BASE_URL',
  'SUB0_SERVICE_TOKEN_CURRENT',
  'SUB0_SERVICE_TOKEN_PREVIOUS',
  'SESSION_KEY_CURRENT',
  'SESSION_KEY_PREVIOUS',
  'GROQ_API_KEY',
  'AI_MODEL_FAST',
  'AI_MODEL_DEEP',
  'AI_DAILY_REQUEST_BUDGET',
  'AI_DAILY_TOTAL_TOKEN_BUDGET',
  'CRON_TRIGGER_SECRET_CURRENT',
  'CRON_TRIGGER_SECRET_PREVIOUS',
  'DEMO_MODE',
  'DEMO_DATASET_VERSION',
  'LOG_LEVEL',
]);

export function assertSupportedSecretName(name: string): void {
  if (!supportedNames.has(name)) {
    throw new Error(`Unsupported secret name: ${name}`);
  }
}

export async function readLocalSecrets(): Promise<Map<string, string>> {
  try {
    const body = await readFile(localSecretPath, 'utf8');
    const entries = body
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)] as const;
      });
    return new Map(entries);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return new Map();
    }
    throw error;
  }
}

export async function writeLocalSecrets(
  secrets: ReadonlyMap<string, string>,
): Promise<void> {
  await mkdir(path.dirname(localSecretPath), { recursive: true });
  const content = [...secrets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join('\n');
  await writeFile(localSecretPath, `${content}\n`, { encoding: 'utf8', mode: 0o600 });
}

export async function localSecretFileState(): Promise<'missing' | 'present'> {
  try {
    await stat(localSecretPath);
    return 'present';
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
}
