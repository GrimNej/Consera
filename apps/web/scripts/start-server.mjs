import { spawn } from 'node:child_process';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';
import { fileURLToPath, URL } from 'node:url';

const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
if (!/^[a-zA-Z0-9.:-]+$/u.test(host)) {
  throw new Error('HOST contains unsupported characters.');
}

const standaloneServer = fileURLToPath(
  new URL('../.next/standalone/apps/web/server.js', import.meta.url),
);
const standaloneDirectory = fileURLToPath(
  new URL('../.next/standalone/apps/web/', import.meta.url),
);
const child = spawn(process.execPath, [standaloneServer], {
  cwd: standaloneDirectory,
  env: {
    ...process.env,
    HOSTNAME: host,
    PORT: String(port),
  },
  stdio: 'inherit',
});

let requestedShutdownSignal = null;
let forcedShutdownTimer;
const expectedSignalExitCodes = new Map([
  ['SIGINT', 130],
  ['SIGTERM', 143],
]);

child.once('exit', (code, signal) => {
  if (forcedShutdownTimer) clearTimeout(forcedShutdownTimer);
  if (
    requestedShutdownSignal !== null &&
    (signal === requestedShutdownSignal ||
      code === expectedSignalExitCodes.get(requestedShutdownSignal))
  ) {
    process.exitCode = 0;
    return;
  }
  if (signal) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    if (requestedShutdownSignal !== null) return;
    requestedShutdownSignal = signal;
    child.kill(signal);
    forcedShutdownTimer = setTimeout(() => child.kill('SIGKILL'), 10_000);
    forcedShutdownTimer.unref();
  });
}
