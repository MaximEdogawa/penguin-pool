import { logger as RNLogger, consoleTransport, fileAsyncTransport } from 'react-native-logs'
import { FunctionDescription, describeFunction } from './functionDescriptions'

const config = {
  severity: __DEV__ ? 'info' : 'error',
  transport: __DEV__ ? consoleTransport : fileAsyncTransport,
  transportOptions: {
    colors: {
      info: 'blue',
      warn: 'yellow',
      error: 'red',
    },
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
}

export const logger = RNLogger.createLogger(config)

export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  info(message: string, data?: unknown): void {
    logger.info(`[${this.context}] ${message}`, data)
  }

  warn(message: string, data?: unknown): void {
    logger.warn(`[${this.context}] ${message}`, data)
  }

  error(message: string, error?: Error | unknown): void {
    logger.error(`[${this.context}] ${message}`, error)
  }

  describeFunction(description: FunctionDescription): void {
    this.warn(`Function Description: ${description.name}`, describeFunction(description))
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context)
}
