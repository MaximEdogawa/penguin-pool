import pino from 'pino'

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface Logger {
  error(message: string, error?: Error): void
  warn(message: string, error?: Error): void
  info(message: string, data?: unknown): void
  debug(message: string, data?: unknown): void
}

class LoggerService implements Logger {
  private readonly logger: pino.Logger

  constructor() {
    this.logger = pino({
      level: import.meta.env.DEV ? 'debug' : 'error',
      browser: {
        asObject: true,
        serialize: true,
        write: (o: object) => {
          const record = o as Record<string, unknown>
          const level = typeof record['level'] === 'number' ? (record['level'] as number) : 30
          const message =
            typeof record['msg'] === 'string'
              ? record['msg']
              : typeof record['message'] === 'string'
                ? record['message']
                : 'No message'
          const data = { ...record }
          delete data['level']
          delete data['msg']
          delete data['message']
          delete data['time']

          const timestamp = `[${new Date().toISOString()}]`

          if (level >= 50) {
            // error
            // eslint-disable-next-line no-console
            console.error(`${timestamp} ERROR: ${message}`, data)
          } else if (level >= 40) {
            // warn
            // eslint-disable-next-line no-console
            console.warn(`${timestamp} WARN: ${message}`, data)
          } else if (level >= 30) {
            // info
            // eslint-disable-next-line no-console
            console.info(`${timestamp} INFO: ${message}`, data)
          } else {
            // debug
            // eslint-disable-next-line no-console
            console.debug(`${timestamp} DEBUG: ${message}`, data)
          }
        },
      },
    })
  }

  error(message: string, error?: Error): void {
    if (error) {
      this.logger.error({ error: error.stack || error.message }, message)
    } else {
      this.logger.error(message)
    }
  }

  warn(message: string, error?: Error): void {
    if (error) {
      this.logger.warn({ error: error.stack || error.message }, message)
    } else {
      this.logger.warn(message)
    }
  }

  info(message: string, data?: unknown): void {
    if (data) {
      this.logger.info({ data }, message)
    } else {
      this.logger.info(message)
    }
  }

  debug(message: string, data?: unknown): void {
    if (data) {
      this.logger.debug({ data }, message)
    } else {
      this.logger.debug(message)
    }
  }
}

export const logger = new LoggerService()
export type { LogLevel, Logger }
