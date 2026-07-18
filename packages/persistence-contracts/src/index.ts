export type AuthoritativeAction<Input, Output> = Readonly<{
  name: string;
  minimumRole: 'owner' | 'admin' | 'member' | 'viewer';
  requiresTransaction: boolean;
  requiresIdempotency: boolean;
  input: Input;
  output: Output;
}>;
