export class FixtureAiProvider {
  public async classify(input: Readonly<{ title: string }>): Promise<{
    relevant: boolean;
    model: 'fixture-provider-v1';
  }> {
    return {
      relevant: input.title.toLowerCase().includes('ai'),
      model: 'fixture-provider-v1',
    };
  }
}
