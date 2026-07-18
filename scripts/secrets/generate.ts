import {
  assertSupportedSecretName,
  generateOpaqueSecret,
  readLocalSecrets,
  writeLocalSecrets,
} from './shared';

async function main(): Promise<void> {
  const name = process.argv[2];
  if (!name) {
    throw new Error('Usage: pnpm secrets:generate <LOGICAL_SECRET_NAME>');
  }
  assertSupportedSecretName(name);

  const secrets = await readLocalSecrets();
  if (secrets.has(name)) {
    throw new Error(`${name} already exists locally. Refusing to overwrite it.`);
  }

  secrets.set(name, generateOpaqueSecret());
  await writeLocalSecrets(secrets);
  process.stdout.write(
    `${name} generated and stored locally without printing its value.\n`,
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to generate secret';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
