import pino from 'pino';

export const logger = pino({
  base: null,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'csrfToken',
      'token',
      'secret',
    ],
    censor: '[REDACTED]',
  },
});
