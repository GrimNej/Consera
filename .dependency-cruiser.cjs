/* global module */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-framework-or-network',
      comment: 'Domain logic remains framework and network independent.',
      severity: 'error',
      from: { path: '^packages/domain' },
      to: {
        path: '^(next|react|@xyflow/react|openai|pg|undici|node:net|node:http)',
      },
    },
    {
      name: 'worker-no-web-framework',
      comment: 'Worker code never imports Next.js or React.',
      severity: 'error',
      from: { path: '^apps/worker' },
      to: { path: '^(next|react|@xyflow/react)' },
    },
    {
      name: 'web-no-worker-implementation',
      comment: 'Web code may share contracts but not worker implementation.',
      severity: 'error',
      from: { path: '^apps/web' },
      to: { path: '^apps/worker' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    reporterOptions: { dot: { theme: { graph: { splines: 'ortho' } } } },
  },
};
