import pino from 'pino'

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface Logger {
  error(message: string, error?: Error): void
  warn(message: string, error?: unknown): void
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

          const now = new Date()
          const timestamp = `${now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}.${now.getMilliseconds().toString().padStart(3, '0')}`

          // Determine log level and emoji
          let levelText: string
          let emoji: string

          if (level >= 50) {
            levelText = 'ERROR'
            emoji = '❌'
          } else if (level >= 40) {
            levelText = 'WARN'
            emoji = '⚠️'
          } else if (level >= 30) {
            levelText = 'INFO'
            emoji = 'ℹ️'
          } else {
            levelText = 'DEBUG'
            emoji = '🐛'
          }

          // Create formatted log entry
          const logEntry = `${emoji} [${timestamp}] ${levelText}: ${message}`

          // Log with appropriate console method
          if (level >= 50) {
            // eslint-disable-next-line no-console
            console.error(logEntry, Object.keys(data).length > 0 ? data : '')
          } else if (level >= 40) {
            // eslint-disable-next-line no-console
            console.warn(logEntry, Object.keys(data).length > 0 ? data : '')
          } else if (level >= 30) {
            // eslint-disable-next-line no-console
            console.info(logEntry, Object.keys(data).length > 0 ? data : '')
          } else {
            // eslint-disable-next-line no-console
            console.debug(logEntry, Object.keys(data).length > 0 ? data : '')
          }
        },
      },
    })
  }

  error(message: string, error?: Error | unknown | undefined): void {
    if (error) {
      if (error instanceof Error) {
        this.logger.error({ error: error.stack || error.message }, message)
      } else {
        this.logger.error({ error }, message)
      }
    } else {
      this.logger.error(message)
    }
  }

  warn(message: string, error?: Error | unknown | undefined): void {
    if (error) {
      if (error instanceof Error) {
        this.logger.warn({ error: error.stack || error.message }, message)
      } else {
        this.logger.warn({ error }, message)
      }
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
export type { Logger, LogLevel }
