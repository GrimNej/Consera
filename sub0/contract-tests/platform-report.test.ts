import { readFile } from 'node:fs/promises';

import { assertPlatformGate, PlatformContractReportSchema } from '@consera/contracts';
import { describe, expect, it } from 'vitest';

describe('platform contract report', () => {
  it('does not permit an unconnected platform to pass the gate', async () => {
    const text = await readFile('docs/platform-contract-report.json', 'utf8');
    const report = PlatformContractReportSchema.parse(JSON.parse(text));

    expect(report.mandatory.authenticationIdentityIntegrity.status).toBe('not_tested');
    expect(() => assertPlatformGate(report)).toThrow('mandatoryFailures');
  });
});
