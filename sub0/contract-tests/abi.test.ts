import { readFile, readdir } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

type AbiResource = Readonly<{
  resource: string;
  tokenize?: Readonly<{ encryption_key?: string }>;
  protected?: Readonly<{ extract_claims?: readonly string[] }>;
  actionables?: readonly Readonly<{
    sql_query?: Readonly<{ query?: string; parameters?: readonly string[] }>;
  }>[];
}>;

const abiDirectory = 'sub0/contract-tests/abi';
const publicBootstrapResources = new Set([
  'consera-contract-register',
  'consera-contract-issue-token',
]);

async function readAbiResources(): Promise<readonly AbiResource[]> {
  const files = (await readdir(abiDirectory))
    .filter((name) => name.endsWith('.json'))
    .sort();
  const resources: AbiResource[] = [];
  for (const file of files) {
    resources.push(
      JSON.parse(await readFile(`${abiDirectory}/${file}`, 'utf8')) as AbiResource,
    );
  }
  return resources;
}

describe('Sub0 ABI contract probes', () => {
  it('uses server-derived identity for every protected resource', async () => {
    const resources = await readAbiResources();
    expect(resources).not.toHaveLength(0);

    for (const resource of resources) {
      if (publicBootstrapResources.has(resource.resource)) continue;
      expect(resource.tokenize?.encryption_key).toBe('$ENV.CONTRACT_JWT_KEY');
      expect(resource.protected?.extract_claims).toContain('id');

      const parameters = resource.actionables?.flatMap(
        (actionable) => actionable.sql_query?.parameters ?? [],
      );
      expect(parameters).toContain('$PROTECTED.id');
      expect(parameters).not.toContain('$PAYLOAD.subjectId');
    }
  });

  it('restricts public bootstrap routes with the dedicated harness key', async () => {
    const resources = await readAbiResources();
    const publicResources = resources.filter((resource) =>
      publicBootstrapResources.has(resource.resource),
    );
    expect(publicResources).toHaveLength(2);

    for (const resource of publicResources) {
      const parameters = resource.actionables?.flatMap(
        (actionable) => actionable.sql_query?.parameters ?? [],
      );
      expect(parameters).toContain('$HEADER.x-contract-key');
      expect(parameters).toContain('$ENV.CONTRACT_HARNESS_KEY');
    }
  });

  it('keeps multi-row mutation tests inside one stored-function action', async () => {
    const resource = (await readAbiResources()).find(
      (candidate) => candidate.resource === 'consera-contract-insert-then-fail',
    );
    const query = resource?.actionables?.[0]?.sql_query?.query;
    expect(query).toBe('SELECT consera_contract.contract_insert_then_fail($1, $2, $3)');
    expect(resource?.actionables).toHaveLength(1);
  });
});
