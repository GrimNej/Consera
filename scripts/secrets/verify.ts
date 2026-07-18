import { readLocalSecrets } from './shared';

const requiredForLocalSession = ['SESSION_KEY_CURRENT', 'CRON_TRIGGER_SECRET_CURRENT'];

async function main(): Promise<void> {
  const secrets = await readLocalSecrets();
  const missing = requiredForLocalSession.filter((name) => !secrets.has(name));
  process.stdout.write(
    `${JSON.stringify({ ok: missing.length === 0, missing }, null, 2)}\n`,
  );
  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown secret verification error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
