import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { contractEndpoint, readSub0ContractConfig } from './shared';

const maximumRequestBytes = 8 * 1024;
const maximumResponseBytes = 256 * 1024;
const requestTimeoutMs = 20_000;
const concurrentCompareAndSetRequests = 50;
const redeploySentinelPath = path.resolve(
  '.secrets/sub0-contract-redeploy-sentinel.json',
);

type Json =
  null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

type ContractHttpResponse = Readonly<{
  status: number;
  body: Json | null;
}>;

type Subject = Readonly<{
  id: number;
  email: string;
  token: string;
}>;

type RedeploySentinel = Readonly<{
  schemaVersion: 1;
  email: string;
  organizationId: number;
  organizationLabel: string;
}>;

const RedeploySentinelSchema = z.object({
  schemaVersion: z.literal(1),
  email: z.string().email(),
  organizationId: z.number().int().positive(),
  organizationLabel: z.string().min(1),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asJson(value: unknown): Json {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(asJson);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, asJson(item)]),
    );
  }
  throw new Error('Sub0 response contained a non-JSON value.');
}

function collectNamedValues(
  value: Json | null,
  name: string,
  depth = 0,
): readonly Json[] {
  if (depth > 12 || value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectNamedValues(item, name, depth + 1));
  }

  const direct = Object.prototype.hasOwnProperty.call(value, name) ? [value[name]] : [];
  return [
    ...direct,
    ...Object.values(value).flatMap((item) =>
      collectNamedValues(item, name, depth + 1),
    ),
  ];
}

function scalarIntegers(value: readonly Json[]): readonly number[] {
  return value.flatMap((candidate) => {
    if (typeof candidate === 'number' && Number.isSafeInteger(candidate))
      return [candidate];
    if (typeof candidate === 'string' && /^-?\d+$/u.test(candidate)) {
      const parsed = Number(candidate);
      if (Number.isSafeInteger(parsed)) return [parsed];
    }
    return [];
  });
}

function requireUniqueInteger(body: Json | null, field: string): number {
  const candidates = [...new Set(scalarIntegers(collectNamedValues(body, field)))];
  if (candidates.length !== 1 || candidates[0] === undefined) {
    throw new Error(`Expected exactly one integer ${field} in the Sub0 response.`);
  }
  return candidates[0];
}

function requireUniqueString(body: Json | null, field: string): string {
  const candidates = [
    ...new Set(
      collectNamedValues(body, field).filter(
        (value): value is string => typeof value === 'string',
      ),
    ),
  ];
  if (candidates.length !== 1 || candidates[0] === undefined) {
    throw new Error(`Expected exactly one string ${field} in the Sub0 response.`);
  }
  return candidates[0];
}

function containsString(body: Json | null, expected: string): boolean {
  return JSON.stringify(body).includes(expected);
}

function authorizationHeader(token: string): Readonly<Record<string, string>> {
  return { Authorization: `Bearer ${token}` };
}

async function post(
  baseUrl: URL,
  resource: string,
  payload: Readonly<Record<string, unknown>>,
  headers: Readonly<Record<string, string>> = {},
): Promise<ContractHttpResponse> {
  const encodedPayload = JSON.stringify(payload);
  if (Buffer.byteLength(encodedPayload, 'utf8') > maximumRequestBytes) {
    throw new Error(
      `Contract request for ${resource} exceeds ${maximumRequestBytes} bytes.`,
    );
  }

  const response = await fetch(contractEndpoint(baseUrl, resource), {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...headers,
    },
    body: encodedPayload,
  });
  const bodyBytes = new Uint8Array(await response.arrayBuffer());
  if (bodyBytes.byteLength > maximumResponseBytes) {
    throw new Error(
      `Contract response for ${resource} exceeds ${maximumResponseBytes} bytes.`,
    );
  }

  if (bodyBytes.byteLength === 0) return { status: response.status, body: null };
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Contract response for ${resource} is not JSON.`);
  }

  try {
    return {
      status: response.status,
      body: asJson(
        JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bodyBytes)),
      ),
    };
  } catch {
    throw new Error(`Contract response for ${resource} is not valid JSON.`);
  }
}

function requireSuccess(response: ContractHttpResponse, resource: string): Json | null {
  if (response.status < 200 || response.status > 299) {
    throw new Error(
      `${resource} returned status ${response.status}; expected a successful response.`,
    );
  }
  return response.body;
}

async function registerSubject(
  baseUrl: URL,
  harnessKey: string,
  email: string,
): Promise<Subject> {
  const body = requireSuccess(
    await post(
      baseUrl,
      'consera-contract-register',
      { email },
      { 'x-contract-key': harnessKey },
    ),
    'consera-contract-register',
  );
  const token = requireUniqueString(body, 'token');
  if (token.split('.').length !== 3) {
    throw new Error('Sub0 token bootstrap did not return a compact JWT.');
  }
  return { id: requireUniqueInteger(body, 'id'), email, token };
}

async function createOrganization(
  baseUrl: URL,
  subject: Subject,
  label: string,
): Promise<number> {
  const body = requireSuccess(
    await post(
      baseUrl,
      'consera-contract-create-organization',
      { label },
      authorizationHeader(subject.token),
    ),
    'consera-contract-create-organization',
  );
  return requireUniqueInteger(body, 'organization_id');
}

async function issueToken(
  baseUrl: URL,
  harnessKey: string,
  email: string,
): Promise<Subject> {
  const body = requireSuccess(
    await post(
      baseUrl,
      'consera-contract-issue-token',
      { email },
      { 'x-contract-key': harnessKey },
    ),
    'consera-contract-issue-token',
  );
  const token = requireUniqueString(body, 'token');
  if (token.split('.').length !== 3) {
    throw new Error('Sub0 token issuance did not return a compact JWT.');
  }
  return { id: requireUniqueInteger(body, 'id'), email, token };
}

function uniqueRunPrefix(): string {
  return `consera-contract-${randomUUID().replaceAll('-', '')}`;
}

async function runFullSuite(): Promise<void> {
  const config = await readSub0ContractConfig();
  const runPrefix = uniqueRunPrefix();
  const subjectA = await registerSubject(
    config.baseUrl,
    config.harnessKey,
    `${runPrefix}-a@example.invalid`,
  );
  const subjectB = await registerSubject(
    config.baseUrl,
    config.harnessKey,
    `${runPrefix}-b@example.invalid`,
  );
  const organizationALabel = `${runPrefix}-organization-a`;
  const organizationBLabel = `${runPrefix}-organization-b`;
  const organizationAId = await createOrganization(
    config.baseUrl,
    subjectA,
    organizationALabel,
  );
  const organizationBId = await createOrganization(
    config.baseUrl,
    subjectB,
    organizationBLabel,
  );

  const outcomes: Record<string, 'pass'> = {};

  const identityBody = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-profile',
      { subjectId: subjectB.id },
      authorizationHeader(subjectA.token),
    ),
    'consera-contract-profile',
  );
  if (
    requireUniqueInteger(identityBody, 'id') !== subjectA.id ||
    containsString(identityBody, String(subjectB.id))
  ) {
    throw new Error('Caller-supplied identity override was not rejected.');
  }
  outcomes.authenticationIdentityIntegrity = 'pass';

  const crossRead = await post(
    config.baseUrl,
    'consera-contract-read-organization',
    { organizationId: organizationBId },
    authorizationHeader(subjectA.token),
  );
  if (
    crossRead.status >= 200 &&
    crossRead.status < 300 &&
    containsString(crossRead.body, organizationBLabel)
  ) {
    throw new Error('Cross-tenant organization read was permitted.');
  }

  const attemptedLabel = `${runPrefix}-unauthorized-rename`;
  const crossWrite = await post(
    config.baseUrl,
    'consera-contract-rename-organization',
    { organizationId: organizationBId, label: attemptedLabel },
    authorizationHeader(subjectA.token),
  );
  if (
    crossWrite.status >= 200 &&
    crossWrite.status < 300 &&
    containsString(crossWrite.body, attemptedLabel)
  ) {
    throw new Error('Cross-tenant organization mutation was permitted.');
  }
  const ownerRead = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-read-organization',
      { organizationId: organizationBId },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-read-organization',
  );
  if (
    !containsString(ownerRead, organizationBLabel) ||
    containsString(ownerRead, attemptedLabel)
  ) {
    throw new Error('Cross-tenant mutation changed the protected organization.');
  }
  outcomes.tenantReadIsolation = 'pass';
  outcomes.tenantWriteIsolation = 'pass';

  const enumeration = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-list-organizations',
      { cursorId: 0 },
      authorizationHeader(subjectA.token),
    ),
    'consera-contract-list-organizations',
  );
  const cursorReuse = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-list-organizations',
      { cursorId: organizationBId },
      authorizationHeader(subjectA.token),
    ),
    'consera-contract-list-organizations',
  );
  if (
    containsString(enumeration, organizationBLabel) ||
    containsString(cursorReuse, organizationBLabel)
  ) {
    throw new Error('Cross-tenant enumeration or cursor reuse was permitted.');
  }
  outcomes.tenantEnumerationAndCursorIsolation = 'pass';

  const claimKey = `${runPrefix}-unique`;
  const firstClaim = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-claim-unique',
      { organizationId: organizationBId, claimKey },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-claim-unique',
  );
  const secondClaim = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-claim-unique',
      { organizationId: organizationBId, claimKey },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-claim-unique',
  );
  if (
    requireUniqueString(firstClaim, 'claim_state') !== 'CREATED' ||
    requireUniqueString(secondClaim, 'claim_state') !== 'CONFLICT'
  ) {
    throw new Error('Unique conflict behavior was not deterministic.');
  }
  outcomes.uniqueConflictEnforcement = 'pass';

  const compareAndSetResponses = await Promise.all(
    Array.from({ length: concurrentCompareAndSetRequests }, () =>
      post(
        config.baseUrl,
        'consera-contract-compare-and-set',
        { organizationId: organizationBId, expectedVersion: 0 },
        authorizationHeader(subjectB.token),
      ),
    ),
  );
  const compareAndSetSuccesses = compareAndSetResponses.filter((response) => {
    if (response.status < 200 || response.status > 299) return false;
    return collectNamedValues(response.body, 'updated_version').some(
      (value) => value === 1 || value === '1',
    );
  });
  if (compareAndSetSuccesses.length !== 1) {
    throw new Error(
      `Expected exactly one successful compare-and-set request; observed ${compareAndSetSuccesses.length}.`,
    );
  }
  outcomes.conditionalMutationAtomicity = 'pass';

  const mutationKey = `${runPrefix}-rollback`;
  const injectedFailure = await post(
    config.baseUrl,
    'consera-contract-insert-then-fail',
    { organizationId: organizationBId, mutationKey },
    authorizationHeader(subjectB.token),
  );
  if (injectedFailure.status >= 200 && injectedFailure.status < 300) {
    throw new Error('Injected database failure unexpectedly returned success.');
  }
  const mutationCount = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-mutation-count',
      { organizationId: organizationBId, mutationKey },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-mutation-count',
  );
  if (requireUniqueInteger(mutationCount, 'mutation_count') !== 0) {
    throw new Error('Injected failure did not roll back the previous mutation.');
  }
  outcomes.multiMutationRollback = 'pass';
  outcomes.storedFunctionSingleAction = 'pass';

  const runtimeSecret = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-runtime-secret',
      {},
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-runtime-secret',
  );
  if (requireUniqueString(runtimeSecret, 'runtime_secret_status') !== 'available') {
    throw new Error('Sub0 runtime secret probe did not observe an injected secret.');
  }
  outcomes.runtimeSecretInjection = 'pass';

  const jobKey = `${runPrefix}-fenced-job`;
  const enqueue = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-enqueue-job',
      { organizationId: organizationBId, jobKey },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-enqueue-job',
  );
  if (requireUniqueString(enqueue, 'enqueue_state') !== 'ENQUEUED') {
    throw new Error('Fenced job probe could not enqueue its test job.');
  }
  const firstClaim = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-claim-job',
      { organizationId: organizationBId, jobKey, leaseOwner: `${runPrefix}-worker-a` },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-claim-job',
  );
  const firstLeaseToken = requireUniqueString(firstClaim, 'lease_token');
  const firstLeaseGeneration = requireUniqueInteger(firstClaim, 'lease_generation');
  requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-expire-job-lease',
      { organizationId: organizationBId, jobKey },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-expire-job-lease',
  );
  const secondClaim = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-claim-job',
      { organizationId: organizationBId, jobKey, leaseOwner: `${runPrefix}-worker-b` },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-claim-job',
  );
  const secondLeaseToken = requireUniqueString(secondClaim, 'lease_token');
  const secondLeaseGeneration = requireUniqueInteger(secondClaim, 'lease_generation');
  if (secondLeaseGeneration <= firstLeaseGeneration) {
    throw new Error('Reclaimed job lease did not advance its generation.');
  }
  const staleCompletion = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-complete-job',
      {
        organizationId: organizationBId,
        jobKey,
        leaseOwner: `${runPrefix}-worker-a`,
        leaseToken: firstLeaseToken,
        leaseGeneration: firstLeaseGeneration,
      },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-complete-job',
  );
  if (requireUniqueString(staleCompletion, 'completion_state') !== 'STALE_LEASE') {
    throw new Error('Expired worker lease was allowed to publish a completion.');
  }
  const validCompletion = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-complete-job',
      {
        organizationId: organizationBId,
        jobKey,
        leaseOwner: `${runPrefix}-worker-b`,
        leaseToken: secondLeaseToken,
        leaseGeneration: secondLeaseGeneration,
      },
      authorizationHeader(subjectB.token),
    ),
    'consera-contract-complete-job',
  );
  if (requireUniqueString(validCompletion, 'completion_state') !== 'COMPLETED') {
    throw new Error('Current worker lease could not publish a completion.');
  }
  outcomes.fencedBackgroundExecution = 'pass';

  const scheduleKey = `${runPrefix}-schedule`;
  const scheduleResponses = await Promise.all(
    Array.from({ length: concurrentCompareAndSetRequests }, () =>
      post(
        config.baseUrl,
        'consera-contract-schedule-tick',
        { organizationId: organizationBId, scheduleKey },
        authorizationHeader(subjectB.token),
      ),
    ),
  );
  const scheduleStates = scheduleResponses.map((response) =>
    requireUniqueString(
      requireSuccess(response, 'consera-contract-schedule-tick'),
      'schedule_state',
    ),
  );
  if (scheduleStates.filter((state) => state === 'RUN_STARTED').length !== 1) {
    throw new Error('Expected exactly one scheduled run for the shared schedule key.');
  }
  if (
    scheduleStates.some((state) => state !== 'RUN_STARTED' && state !== 'DUPLICATE')
  ) {
    throw new Error('Scheduled fallback returned an unexpected deduplication state.');
  }
  outcomes.scheduledExecutionDeduplication = 'pass';

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        runId: runPrefix,
        outcomes,
        note: 'Redeploy persistence must be run separately with sub0-contract:redeploy:* commands.',
      },
      null,
      2,
    )}\n`,
  );
  void organizationAId;
}

async function seedRedeploySentinel(): Promise<void> {
  const config = await readSub0ContractConfig();
  const runPrefix = uniqueRunPrefix();
  const email = `${runPrefix}-redeploy@example.invalid`;
  const subject = await registerSubject(config.baseUrl, config.harnessKey, email);
  const organizationLabel = `${runPrefix}-redeploy-organization`;
  const organizationId = await createOrganization(
    config.baseUrl,
    subject,
    organizationLabel,
  );
  const sentinel: RedeploySentinel = {
    schemaVersion: 1,
    email,
    organizationId,
    organizationLabel,
  };
  await mkdir(path.dirname(redeploySentinelPath), { recursive: true });
  await writeFile(redeploySentinelPath, `${JSON.stringify(sentinel, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  process.stdout.write(
    `${JSON.stringify({ ok: true, sentinel: 'stored locally', next: 'redeploy then run pnpm sub0-contract:redeploy:verify' })}\n`,
  );
}

async function verifyRedeploySentinel(): Promise<void> {
  const config = await readSub0ContractConfig();
  const raw = await readFile(redeploySentinelPath, 'utf8');
  const sentinel = RedeploySentinelSchema.parse(JSON.parse(raw));
  const subject = await issueToken(config.baseUrl, config.harnessKey, sentinel.email);
  const body = requireSuccess(
    await post(
      config.baseUrl,
      'consera-contract-read-organization',
      { organizationId: sentinel.organizationId },
      authorizationHeader(subject.token),
    ),
    'consera-contract-read-organization',
  );
  if (!containsString(body, sentinel.organizationLabel)) {
    throw new Error(
      'Redeploy persistence probe could not recover the sentinel organization.',
    );
  }
  process.stdout.write(
    `${JSON.stringify({ ok: true, databaseRedeployPersistence: 'pass' })}\n`,
  );
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? 'run';
  switch (mode) {
    case 'run':
      await runFullSuite();
      return;
    case 'redeploy:seed':
      await seedRedeploySentinel();
      return;
    case 'redeploy:verify':
      await verifyRedeploySentinel();
      return;
    default:
      throw new Error(
        'Usage: pnpm sub0-contract:run [run|redeploy:seed|redeploy:verify]',
      );
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Sub0 contract suite failed';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
