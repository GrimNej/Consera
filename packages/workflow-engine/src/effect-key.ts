export function workflowEffectKey(
  input: Readonly<{ workflowRunId: string; nodeId: string }>,
): string {
  return `workflow-effect:${input.workflowRunId}:${input.nodeId}`;
}
