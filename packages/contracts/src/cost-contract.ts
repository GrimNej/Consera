import { z } from 'zod';

const EvidenceReferenceSchema = z.object({
  artifactPath: z.string().min(1),
  recordedAt: z.string().datetime(),
});

export const CostRecordSchema = z.object({
  schemaVersion: z.literal(1),
  billingSafety: z.object({
    paymentMethodAttached: z.boolean(),
    automaticOverageEnabled: z.boolean(),
    reviewedAt: z.string().datetime().nullable(),
    evidence: EvidenceReferenceSchema.nullable(),
  }),
  startingCreditUsd: z.number().finite().nonnegative().nullable(),
  endingCreditUsd: z.number().finite().nonnegative().nullable(),
  burnExperiment: z.object({
    startedAt: z.string().datetime().nullable(),
    endedAt: z.string().datetime().nullable(),
    resourceSummary: z.string().min(1),
  }),
});

export type CostRecord = z.infer<typeof CostRecordSchema>;

export function assertCostPreflight(record: unknown): void {
  const parsed = CostRecordSchema.parse(record);
  const failures: string[] = [];

  if (parsed.billingSafety.paymentMethodAttached) {
    failures.push('paymentMethodAttached');
  }
  if (parsed.billingSafety.automaticOverageEnabled) {
    failures.push('automaticOverageEnabled');
  }
  if (parsed.startingCreditUsd === null || parsed.startingCreditUsd < 20) {
    failures.push('startingCreditUsd');
  }
  if (!parsed.billingSafety.reviewedAt || !parsed.billingSafety.evidence) {
    failures.push('billingEvidence');
  }

  if (failures.length > 0) {
    throw new Error(JSON.stringify({ failures }, null, 2));
  }
}
