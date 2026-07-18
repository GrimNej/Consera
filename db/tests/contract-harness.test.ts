import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const connectionString =
  process.env.DATABASE_URL ??
  'postgres://consera:consera_local_only@localhost:54329/consera_contracts';
const client = new Client({ connectionString });
let connected = false;

beforeAll(async () => {
  await client.connect();
  await client.query(
    await readFile('sub0/contract-tests/sql/001_contract_schema.sql', 'utf8'),
  );
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

  it('keeps the remote contract schema tenant-scoped before Sub0 invokes it', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const subject = await client.query<{ id: string }>(
      'INSERT INTO consera_contract.contract_subjects (email) VALUES ($1) RETURNING id',
      [`${suffix}@example.invalid`],
    );
    const subjectId = subject.rows[0]?.id;
    expect(subjectId).toBeDefined();

    const organization = await client.query<{ organization_id: string }>(
      'SELECT * FROM consera_contract.contract_create_organization($1, $2)',
      [subjectId, `organization-${suffix}`],
    );
    const organizationId = organization.rows[0]?.organization_id;
    expect(organizationId).toBeDefined();

    const uniqueFirst = await client.query<{ claim_state: string }>(
      'SELECT * FROM consera_contract.contract_claim_unique($1, $2, $3)',
      [subjectId, organizationId, `claim-${suffix}`],
    );
    const uniqueSecond = await client.query<{ claim_state: string }>(
      'SELECT * FROM consera_contract.contract_claim_unique($1, $2, $3)',
      [subjectId, organizationId, `claim-${suffix}`],
    );
    expect(uniqueFirst.rows[0]?.claim_state).toBe('CREATED');
    expect(uniqueSecond.rows[0]?.claim_state).toBe('CONFLICT');
  });

  it('fences stale job workers and deduplicates a schedule bucket', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const subject = await client.query<{ id: string }>(
      'INSERT INTO consera_contract.contract_subjects (email) VALUES ($1) RETURNING id',
      [`fence-${suffix}@example.invalid`],
    );
    const subjectId = subject.rows[0]?.id;
    expect(subjectId).toBeDefined();

    const organization = await client.query<{ organization_id: string }>(
      'SELECT * FROM consera_contract.contract_create_organization($1, $2)',
      [subjectId, `fence-organization-${suffix}`],
    );
    const organizationId = organization.rows[0]?.organization_id;
    expect(organizationId).toBeDefined();
    const jobKey = `job-${suffix}`;

    const enqueued = await client.query<{ enqueue_state: string }>(
      'SELECT * FROM consera_contract.contract_enqueue_job($1, $2, $3)',
      [subjectId, organizationId, jobKey],
    );
    expect(enqueued.rows[0]?.enqueue_state).toBe('ENQUEUED');

    const firstClaim = await client.query<{
      lease_token: string;
      lease_generation: string;
    }>('SELECT * FROM consera_contract.contract_claim_job($1, $2, $3, $4)', [
      subjectId,
      organizationId,
      jobKey,
      'local-worker-a',
    ]);
    const firstLeaseToken = firstClaim.rows[0]?.lease_token;
    const firstLeaseGeneration = firstClaim.rows[0]?.lease_generation;
    expect(firstLeaseToken).toBeDefined();
    expect(firstLeaseGeneration).toBeDefined();

    await client.query(
      'SELECT * FROM consera_contract.contract_expire_job_lease($1, $2, $3)',
      [subjectId, organizationId, jobKey],
    );
    const secondClaim = await client.query<{
      lease_token: string;
      lease_generation: string;
    }>('SELECT * FROM consera_contract.contract_claim_job($1, $2, $3, $4)', [
      subjectId,
      organizationId,
      jobKey,
      'local-worker-b',
    ]);
    const secondLeaseToken = secondClaim.rows[0]?.lease_token;
    const secondLeaseGeneration = secondClaim.rows[0]?.lease_generation;
    expect(secondLeaseToken).toBeDefined();
    expect(secondLeaseGeneration).toBeDefined();

    const staleCompletion = await client.query<{ completion_state: string }>(
      'SELECT * FROM consera_contract.contract_complete_job($1, $2, $3, $4, $5, $6)',
      [
        subjectId,
        organizationId,
        jobKey,
        'local-worker-a',
        firstLeaseToken,
        firstLeaseGeneration,
      ],
    );
    expect(staleCompletion.rows[0]?.completion_state).toBe('STALE_LEASE');

    const currentCompletion = await client.query<{ completion_state: string }>(
      'SELECT * FROM consera_contract.contract_complete_job($1, $2, $3, $4, $5, $6)',
      [
        subjectId,
        organizationId,
        jobKey,
        'local-worker-b',
        secondLeaseToken,
        secondLeaseGeneration,
      ],
    );
    expect(currentCompletion.rows[0]?.completion_state).toBe('COMPLETED');

    const firstSchedule = await client.query<{ schedule_state: string }>(
      'SELECT * FROM consera_contract.contract_schedule_tick($1, $2, $3)',
      [subjectId, organizationId, `schedule-${suffix}`],
    );
    const secondSchedule = await client.query<{ schedule_state: string }>(
      'SELECT * FROM consera_contract.contract_schedule_tick($1, $2, $3)',
      [subjectId, organizationId, `schedule-${suffix}`],
    );
    expect(firstSchedule.rows[0]?.schedule_state).toBe('RUN_STARTED');
    expect(secondSchedule.rows[0]?.schedule_state).toBe('DUPLICATE');
  });
});
