import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';

export interface LogFn {
  (msg: string, ...args: unknown[]): void;
  (obj: object, msg?: string, ...args: unknown[]): void;
}

export interface IAppLogger {
  info: LogFn;
  error: LogFn;
  warn: LogFn;
  debug: LogFn;
  fatal: LogFn;
  child(bindings: Record<string, unknown>): IAppLogger;
}

const defaultOptions: LoggerOptions = {
  level: process.env['LOG_LEVEL'] || (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'secret',
      'token',
      'apiKey',
      'authorization',
      'headers.authorization',
      '*.password',
      '*.secret',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

export function createLogger(name: string, customOptions?: LoggerOptions): PinoLogger {
  return pino({
    ...defaultOptions,
    name,
    ...customOptions,
  });
}

export const logger = createLogger('handloom');
export type { PinoLogger };
