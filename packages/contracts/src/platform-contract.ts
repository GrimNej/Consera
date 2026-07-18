import { z } from 'zod';

const EvidenceSchema = z.object({
  command: z.string().min(1),
  expected: z.string().min(1),
  observed: z.string().min(1),
  artifactPath: z.string().min(1),
});

const MandatoryCheckSchema = z.object({
  status: z.enum(['pass', 'fail', 'not_tested']),
  evidence: z.array(EvidenceSchema).min(1),
});

const AlternativeCheckSchema = z.object({
  status: z.enum(['native_pass', 'fallback_pass', 'fail', 'not_tested']),
  selectedImplementation: z.string().min(1),
  evidence: z.array(EvidenceSchema).min(1),
});

export const PlatformContractReportSchema = z.object({
  schemaVersion: z.literal(1),
  testedAt: z.string().datetime(),
  lingoqlEnvironmentId: z.string().min(1),
  sub0Version: z.string().min(1),
  mandatory: z.object({
    authenticationIdentityIntegrity: MandatoryCheckSchema,
    tenantReadIsolation: MandatoryCheckSchema,
    tenantWriteIsolation: MandatoryCheckSchema,
    uniqueConflictEnforcement: MandatoryCheckSchema,
    conditionalMutationAtomicity: MandatoryCheckSchema,
    multiMutationRollback: MandatoryCheckSchema,
    databaseRedeployPersistence: MandatoryCheckSchema,
    secretRuntimeInjection: MandatoryCheckSchema,
  }),
  alternatives: z.object({
    backgroundExecution: AlternativeCheckSchema,
    scheduledExecution: AlternativeCheckSchema,
    tenantSafeRealtime: AlternativeCheckSchema,
  }),
});

export type PlatformContractReport = z.infer<typeof PlatformContractReportSchema>;

export function assertPlatformGate(report: unknown): void {
  const parsed = PlatformContractReportSchema.parse(report);
  const mandatoryFailures = Object.entries(parsed.mandatory).filter(
    ([, result]) => result.status !== 'pass',
  );
  const alternativeFailures = Object.entries(parsed.alternatives).filter(
    ([, result]) =>
      result.status !== 'native_pass' && result.status !== 'fallback_pass',
  );

  if (mandatoryFailures.length > 0 || alternativeFailures.length > 0) {
    throw new Error(
      JSON.stringify(
        {
          mandatoryFailures: mandatoryFailures.map(([name]) => name),
          alternativeFailures: alternativeFailures.map(([name]) => name),
        },
        null,
        2,
      ),
    );
  }
}
