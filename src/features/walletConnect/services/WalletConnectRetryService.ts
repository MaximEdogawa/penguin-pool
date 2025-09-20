import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'

/**
 * Simple retry service using native SignClient functionality
 */
export class WalletConnectRetryService {
  private retryAttempts = 0
  private maxRetryAttempts = 3
  private retryDelay = 1000

  /**
   * Reset retry state
   */
  reset(): void {
    this.retryAttempts = 0
  }

  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(fn: () => Promise<T>, context: string = 'operation'): Promise<T> {
    while (this.retryAttempts < this.maxRetryAttempts) {
      try {
        console.log(`${context} attempt ${this.retryAttempts + 1}/${this.maxRetryAttempts}`)
        const result = await fn()
        this.retryAttempts = 0 // Reset on success
        return result
      } catch (error) {
        this.retryAttempts++

        if (this.retryAttempts >= this.maxRetryAttempts) {
          console.error(`${context} failed after ${this.maxRetryAttempts} attempts:`, error)
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1)
        console.log(`Retrying ${context} in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error(`${context} failed after ${this.maxRetryAttempts} attempts`)
  }

  /**
   * Check if a session is still valid
   */
  isSessionValid(session: SessionTypes.Struct): boolean {
    if (!session) return false

    const now = Math.floor(Date.now() / 1000)
    return !session.expiry || session.expiry > now
  }

  /**
   * Wait for client to be ready
   */
  async waitForClientReady(
    client: InstanceType<typeof SignClient>,
    timeoutMs: number = 10000
  ): Promise<boolean> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      if (client.core.relayer.connected) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return false
  }
}
