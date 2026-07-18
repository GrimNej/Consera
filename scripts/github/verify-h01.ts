import { execFileSync } from 'node:child_process';

import { fetchValidatedJson } from '@consera/remote-boundary';
import { z } from 'zod';

const GitHubRepositorySchema = z.object({
  private: z.boolean(),
  html_url: z.string().url(),
  default_branch: z.string().min(1),
});

function runGit(args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function parseGitHubRepository(remoteUrl: string): Readonly<{
  owner: string;
  repository: string;
}> {
  const match = remoteUrl.match(
    /^(?:https:\/\/github\.com\/|git@github\.com:)([^/:\s]+)\/([^/\s]+?)(?:\.git)?$/,
  );
  if (!match?.[1] || !match[2]) {
    throw new Error(
      'origin must use a standard github.com HTTPS or SSH repository URL.',
    );
  }
  return { owner: match[1], repository: match[2] };
}

async function main(): Promise<void> {
  const remoteUrl = runGit(['remote', 'get-url', 'origin']);
  const { owner, repository } = parseGitHubRepository(remoteUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const metadata = await fetchValidatedJson(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
      GitHubRepositorySchema,
      {
        signal: controller.signal,
        maxResponseBytes: 64 * 1024,
        headers: {
          'user-agent': 'consera-phase0-h01-verifier',
          accept: 'application/vnd.github+json',
        },
      },
    );
    if (metadata.private) {
      throw new Error(
        'H-01 requires a public GitHub repository for the planned CI path.',
      );
    }

    const localHead = runGit(['rev-parse', 'HEAD']);
    const remoteHead = runGit(['ls-remote', '--heads', 'origin', 'main']);
    if (!remoteHead.startsWith(localHead)) {
      throw new Error(
        'origin/main does not contain the current local bootstrap commit.',
      );
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          remote: metadata.html_url,
          branch: metadata.default_branch,
          commit: localHead,
          visibility: 'public',
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown H-01 verification error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
