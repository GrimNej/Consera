import { access, cp } from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const standaloneRoot = new URL('../.next/standalone/', import.meta.url);
const standaloneApplication = new URL('apps/web/', standaloneRoot);
const standaloneServer = new URL('server.js', standaloneApplication);
const staticSource = new URL('../.next/static/', import.meta.url);
const staticDestination = new URL('.next/static/', standaloneApplication);

await access(standaloneServer);
await access(staticSource);
await cp(staticSource, staticDestination, { recursive: true, force: true });

process.stdout.write(
  `${JSON.stringify({
    event: 'standalone_assets_staged',
    server: fileURLToPath(standaloneServer),
    staticDirectory: fileURLToPath(staticDestination),
  })}\n`,
);
