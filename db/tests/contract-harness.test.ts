import { randomUUID } from 'node:crypto';

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://consera:consera_local_only@localhost:54329/consera_contracts';
const client = new Client({ connectionString });
let connected = false;

beforeAll(async () => {
  await client.connect();
  connected = true;
});

afterAll(async () => {
  if (connected) {
    await client.end();
  }
});

describe('local PostgreSQL contract harness', () => {
  it('rolls back a mutation when a stored function fails', async () => {
    const organization = await client.query<{ id: string }>(
      'INSERT INTO contract_organizations (slug) VALUES ($1) RETURNING id',
      [`local-${randomUUID()}`],
    );
    const organizationId = organization.rows[0]?.id;
    expect(organizationId).toBeDefined();

    await expect(
      client.query('SELECT contract_insert_then_fail($1, $2)', [
        organizationId,
        'rollback',
      ]),
    ).rejects.toThrow('CONTRACT_INJECTED_FAILURE');

    const mutations = await client.query<{ count: string }>(
      'SELECT count(*) FROM contract_mutations WHERE organization_id = $1',
      [organizationId],
    );
    expect(mutations.rows[0]?.count).toBe('0');
  });
});
