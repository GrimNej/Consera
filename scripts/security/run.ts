import { spawnSync } from 'node:child_process';

const checks = [
  { command: 'gitleaks', args: ['detect', '--no-git'] },
  { command: 'semgrep', args: ['scan', '--config', 'auto'] },
  { command: 'trivy', args: ['fs', '.'] },
];

let failed = false;

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    encoding: 'utf8',
  });
  if (result.error) {
    failed = true;
    process.stderr.write(`${check.command} unavailable: ${result.error.message}\n`);
    continue;
  }
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
}
