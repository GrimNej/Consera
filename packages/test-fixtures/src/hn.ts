import { z } from 'zod';

export const HnItemSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['story', 'comment', 'job', 'poll', 'pollopt']),
  by: z.string().min(1).optional(),
  time: z.number().int().nonnegative(),
  title: z.string().max(1_000).optional(),
  text: z.string().max(20_000).optional(),
  url: z.string().url().optional(),
  score: z.number().int().nonnegative().optional(),
  descendants: z.number().int().nonnegative().optional(),
  kids: z.array(z.number().int().positive()).max(500).optional(),
  dead: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

const candidateTerms = [
  'ai',
  'llm',
  'language model',
  'inference',
  'openai',
  'anthropic',
  'gemini',
  'qwen',
  'llama',
  'copilot',
  'model release',
];

export function classifyFixtureCandidate(title: string): boolean {
  const normalized = title.normalize('NFKC').toLowerCase();
  return candidateTerms.some((term) => normalized.includes(term));
}

export const fixtureHnStory = {
  id: 1,
  type: 'story' as const,
  by: 'fixture-author',
  time: 1_752_840_000,
  title: 'Fixture: a bounded AI coding release',
  url: 'https://example.com/fixture-release',
  score: 42,
  descendants: 5,
};
