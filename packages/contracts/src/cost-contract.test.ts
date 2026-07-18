import { describe, expect, it } from 'vitest';

import { assertCostPreflight, CostRecordSchema } from './cost-contract';

describe('cost preflight', () => {
  it('rejects unverified credits and billing controls', () => {
    const record = CostRecordSchema.parse({
      schemaVersion: 1,
      billingSafety: {
        paymentMethodAttached: false,
        automaticOverageEnabled: false,
        reviewedAt: null,
        evidence: null,
      },
      startingCreditUsd: null,
      endingCreditUsd: null,
      burnExperiment: {
        startedAt: null,
        endedAt: null,
        resourceSummary: 'No LingoQL resource has been provisioned.',
      },
    });

    expect(() => assertCostPreflight(record)).toThrow('startingCreditUsd');
  });

  it('requires both billing safety controls and $20 credit', () => {
    const record = CostRecordSchema.parse({
      schemaVersion: 1,
      billingSafety: {
        paymentMethodAttached: false,
        automaticOverageEnabled: false,
        reviewedAt: '2026-07-18T00:00:00.000Z',
        evidence: {
          artifactPath: 'docs/platform-evidence/example.md',
          recordedAt: '2026-07-18T00:00:00.000Z',
        },
      },
      startingCreditUsd: 20,
      endingCreditUsd: null,
      burnExperiment: {
        startedAt: null,
        endedAt: null,
        resourceSummary: 'No LingoQL resource has been provisioned.',
      },
    });

    expect(() => assertCostPreflight(record)).not.toThrow();
  });
});
