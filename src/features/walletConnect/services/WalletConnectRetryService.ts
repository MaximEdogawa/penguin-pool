import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import { getWalletInfo } from '../queries/walletQueries'

/**
 * Service to handle WebSocket reconnection and retry logic for WalletConnect
 */
export class WalletConnectRetryService {
  private retryAttempts = 0
  private maxRetryAttempts = 5
  private retryDelay = 1000
  private isRetrying = false

  /**
   * Attempt to re-establish WebSocket connection with exponential backoff
   */
  async reestablishConnection(
    client: InstanceType<typeof SignClient>,
    session: SessionTypes.Struct,
    onSessionRestored: (session: SessionTypes.Struct) => void
  ): Promise<boolean> {
    if (this.isRetrying) {
      console.log('Retry already in progress, skipping...')
      return false
    }

    this.isRetrying = true
    console.log('Starting WebSocket re-establishment process...')

    // Use a proper loop instead of recursive setTimeout
    while (this.retryAttempts < this.maxRetryAttempts) {
      try {
        console.log(
          `Attempting WebSocket re-establishment (attempt ${this.retryAttempts + 1}/${this.maxRetryAttempts})...`
        )

        // Calculate delay with exponential backoff and jitter
        const baseDelay = this.retryDelay * Math.pow(2, this.retryAttempts)
        const jitter = Math.random() * 1000 // Add up to 1 second of jitter
        const delay = baseDelay + jitter

        console.log(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))

        // Try to re-initialize the client to re-establish WebSocket
        await client.core.start()

        // Check if the session is still valid and connected
        const activeSessions = client.session.getAll()
        const currentSession = activeSessions.find(s => s.topic === session.topic)
        if (currentSession) {
          console.log('Client re-initialized and session found. Testing connection...')

          // Test the connection by trying to get wallet info
          const walletInfo = await getWalletInfo()
          if (walletInfo.success && walletInfo.data) {
            console.log('Connection re-established successfully:', walletInfo.data)

            // Reset retry attempts on success
            this.retryAttempts = 0
            this.isRetrying = false

            // Notify that session is restored
            onSessionRestored(session)
            return true
          } else {
            throw new Error(`Failed to get wallet info: ${walletInfo.error || 'Unknown error'}`)
          }
        } else {
          throw new Error('Session not found after client re-initialization')
        }
      } catch (error) {
        this.retryAttempts++
        console.warn(`WebSocket re-establishment attempt ${this.retryAttempts} failed:`, error)

        if (this.retryAttempts < this.maxRetryAttempts) {
          console.log(`Retrying in ${this.retryDelay * Math.pow(2, this.retryAttempts)}ms...`)
        }
      }
    }

    console.error('Max WebSocket re-establishment attempts reached. Connection remains unstable.')
    this.isRetrying = false
    return false
  }

  /**
   * Reset retry state
   */
  reset(): void {
    this.retryAttempts = 0
    this.isRetrying = false
  }

  /**
   * Check if currently retrying
   */
  isCurrentlyRetrying(): boolean {
    return this.isRetrying
  }

  /**
   * Get current retry attempt number
   */
  getRetryAttempts(): number {
    return this.retryAttempts
  }
}
