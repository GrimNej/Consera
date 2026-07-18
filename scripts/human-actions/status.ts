import { readFile } from 'node:fs/promises';

const validStates = new Set([
  'not_ready',
  'ready_for_user',
  'waiting_for_user',
  'verification_pending',
  'verified',
  'blocked',
  'not_required',
]);

async function main(): Promise<void> {
  const ledger = await readFile('docs/human-actions.md', 'utf8');
  const rows = ledger.split('\n').filter((line) => line.startsWith('| H-'));
  const actions = rows.map((row) => {
    const columns = row.split('|').map((column) => column.trim());
    const id = columns[1] ?? '';
    const state = columns[4] ?? '';
    if (!validStates.has(state)) {
      throw new Error(`Invalid state for ${id}: ${state}`);
    }
    return { id, state };
  });

  process.stdout.write(`${JSON.stringify(actions, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown ledger error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
