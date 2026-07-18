import { FixtureAiProvider } from '@consera/ai-provider';
import { classifyFixtureCandidate } from '@consera/test-fixtures';

export type FixtureTickResult = Readonly<{
  didWork: boolean;
  classification: 'candidate' | 'rejected';
}>;

export async function runFixtureTick(title: string): Promise<FixtureTickResult> {
  const provider = new FixtureAiProvider();
  const candidate = classifyFixtureCandidate(title);

  if (!candidate) {
    return { didWork: false, classification: 'rejected' };
  }

  await provider.classify({ title });
  return { didWork: true, classification: 'candidate' };
}
