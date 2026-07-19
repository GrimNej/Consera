import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import process from 'node:process';
import { URL } from 'node:url';

const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write('PORT must be an integer between 1 and 65535.\n');
  process.exit(1);
}
if (!/^[a-zA-Z0-9.:-]+$/u.test(host)) {
  process.stderr.write('HOST contains unsupported characters.\n');
  process.exit(1);
}

const healthBody = JSON.stringify({
  status: 'ok',
  service: 'consera-platform-probe',
  phase: 0,
  runtime: 'node-http',
});

const server = createServer((request, response) => {
  const method = request.method ?? 'GET';
  const pathname = new URL(request.url ?? '/', 'http://probe.local').pathname;
  const healthPath = pathname === '/' || pathname === '/api/health';

  if ((method === 'GET' || method === 'HEAD') && healthPath) {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      Connection: 'close',
      'Content-Length': Buffer.byteLength(healthBody),
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(method === 'HEAD' ? undefined : healthBody);
    return;
  }

  const body =
    method === 'GET' || method === 'HEAD' ? 'Not Found\n' : 'Method Not Allowed\n';
  response.writeHead(method === 'GET' || method === 'HEAD' ? 404 : 405, {
    'Cache-Control': 'no-store',
    Connection: 'close',
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(method === 'HEAD' ? undefined : body);
});

server.keepAliveTimeout = 70_000;
server.headersTimeout = 71_000;
server.requestTimeout = 10_000;

server.once('error', (error) => {
  process.stderr.write(`Platform probe server error: ${error.message}\n`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  process.stdout.write(
    `${JSON.stringify({ event: 'platform_probe_ready', host, port })}\n`,
  );
});

let shutdownStarted = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    server.close((error) => {
      if (error) {
        process.stderr.write(`Platform probe shutdown error: ${error.message}\n`);
        process.exitCode = 1;
        return;
      }
      process.exitCode = 0;
    });
  });
}
