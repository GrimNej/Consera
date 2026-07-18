import { spawn } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
if (!/^[a-zA-Z0-9.:-]+$/u.test(host)) {
  throw new Error('HOST contains unsupported characters.');
}

const nextCli = fileURLToPath(
  new URL('../node_modules/next/dist/bin/next', import.meta.url),
);
const child = spawn(
  process.execPath,
  [nextCli, 'start', '--hostname', host, '--port', String(port)],
  { stdio: 'inherit' },
);

child.once('exit', (code, signal) => {
  if (signal) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
