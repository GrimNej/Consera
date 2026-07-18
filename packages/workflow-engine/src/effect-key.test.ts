import { describe, expect, it } from 'vitest';

import { workflowEffectKey } from './effect-key';

describe('workflowEffectKey', () => {
  it('is stable for the same run and node', () => {
    expect(workflowEffectKey({ workflowRunId: 'run-1', nodeId: 'create' })).toBe(
      'workflow-effect:run-1:create',
    );
  });
});
