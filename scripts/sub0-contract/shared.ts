import { readLocalSecrets } from '../secrets/shared';

export type Sub0ContractConfig = Readonly<{
  baseUrl: URL;
  harnessKey: string;
  databaseUrl: string;
}>;

const requiredNames = [
  'SUB0_CONTRACT_BASE_URL',
  'CONTRACT_HARNESS_KEY',
  'DATABASE_URL_CONTRACT',
] as const;

export async function readSub0ContractConfig(): Promise<Sub0ContractConfig> {
  const secrets = await readLocalSecrets();
  const missing = requiredNames.filter((name) => !secrets.get(name));
  if (missing.length > 0) {
    throw new Error(
      `Sub0 contract configuration is incomplete: ${missing.join(', ')}. Use pnpm secrets:set or pnpm secrets:generate; never paste values into chat.`,
    );
  }

  const rawBaseUrl = secrets.get('SUB0_CONTRACT_BASE_URL');
  const harnessKey = secrets.get('CONTRACT_HARNESS_KEY');
  const databaseUrl = secrets.get('DATABASE_URL_CONTRACT');
  if (!rawBaseUrl || !harnessKey || !databaseUrl) {
    throw new Error('Sub0 contract configuration could not be read.');
  }

  const baseUrl = new URL(rawBaseUrl);
  if (baseUrl.protocol !== 'https:') {
    throw new Error(
      'SUB0_CONTRACT_BASE_URL must use HTTPS for the remote contract suite.',
    );
  }
  if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new Error(
      'SUB0_CONTRACT_BASE_URL must be an origin without credentials, query, or fragment.',
    );
  }

  return { baseUrl, harnessKey, databaseUrl };
}

export function contractEndpoint(baseUrl: URL, resource: string): string {
  if (!/^[a-z0-9-]+$/u.test(resource)) {
    throw new Error(`Invalid contract resource: ${resource}`);
  }
  return new URL(resource, `${baseUrl.toString().replace(/\/$/u, '')}/`).toString();
}
