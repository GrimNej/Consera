import { localSecretFileState, readLocalSecrets } from './shared';

async function main(): Promise<void> {
  const state = await localSecretFileState();
  const secrets = await readLocalSecrets();
  process.stdout.write(
    `${JSON.stringify({ file: state, configuredNames: [...secrets.keys()].sort() }, null, 2)}\n`,
  );
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown secret status error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
