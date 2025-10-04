/**
 * Logger Service for React Native
 * Provides structured logging with different levels
 */

/* eslint-disable no-console */

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
  private readonly isDev: boolean

  constructor() {
    this.isDev = __DEV__ || false
  }

  error(message: string, error?: Error): void {
    const logEntry = `[ERROR] ${message}`
    if (this.isDev) {
      console.error(logEntry, error || '')
    }
  }

  warn(message: string, error?: unknown): void {
    const logEntry = `[WARN] ${message}`
    if (this.isDev) {
      console.warn(logEntry, error || '')
    }
  }

  info(message: string, data?: unknown): void {
    const logEntry = `[INFO] ${message}`
    if (this.isDev) {
      console.info(logEntry, data || '')
    }
  }

  debug(message: string, data?: unknown): void {
    const logEntry = `[DEBUG] ${message}`
    if (this.isDev) {
      console.debug(logEntry, data || '')
    }
  }
}

// Export singleton instance
export const logger = new LoggerService()

// Export types
export type { LogLevel, Logger }
