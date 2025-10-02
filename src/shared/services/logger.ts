import winston from 'winston'

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface Logger {
  error(message: string, error?: Error): void
  warn(message: string, error?: Error): void
  info(message: string, error?: Error): void
  debug(message: string, error?: Error): void
}

class LoggerService implements Logger {
  private readonly logger: winston.Logger

  constructor() {
    this.logger = winston.createLogger({
      level: import.meta.env.DEV ? 'debug' : 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    })
  }

  error(message: string, error?: Error): void {
    this.logger.error(message, { error: error?.stack })
  }

  warn(message: string, error?: Error): void {
    this.logger.warn(message, { error: error?.stack })
  }

  info(message: string, error?: Error): void {
    this.logger.info(message, { error: error?.stack })
  }

  debug(message: string, error?: Error): void {
    this.logger.debug(message, { error: error?.stack })
  }
}

export const logger = new LoggerService()
export type { LogLevel, Logger }
