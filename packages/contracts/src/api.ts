import { z } from 'zod';

export const ApiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    ok: z.literal(true),
    data,
    meta: z.object({
      requestId: z.string().min(1),
      servedAt: z.string().datetime(),
      staleAt: z.string().datetime().optional(),
      nextCursor: z.string().optional(),
    }),
  });

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string().regex(/^[A-Z0-9_]{3,80}$/),
    message: z.string().min(1).max(500),
    retryable: z.boolean(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
  meta: z.object({
    requestId: z.string().min(1),
    servedAt: z.string().datetime(),
  }),
});
