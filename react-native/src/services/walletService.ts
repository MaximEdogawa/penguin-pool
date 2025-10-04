/**
 * API Service for Wallet Operations
 * Handles wallet balance, transactions, and related operations
 */

import { env } from '../shared/config/env'
import { logger } from '../shared/services/logger'
import type { TransactionDetails, TransactionRequest, WalletBalance } from '../shared/types'

export interface WalletService {
  getBalance: (walletAddress: string) => Promise<WalletBalance>
  sendTransaction: (request: TransactionRequest) => Promise<string>
  getTransactionHistory: (walletAddress: string, limit?: number) => Promise<TransactionDetails[]>
}

class WalletApiService implements WalletService {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = env.API_BASE_URL
    this.timeout = env.API_TIMEOUT
  }

  async getBalance(walletAddress: string): Promise<WalletBalance> {
    try {
      const response = await fetch(`${this.baseUrl}/api/wallet/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`)
      }

      const data = await response.json()
      return data.balance
    } catch (_error) {
      logger.error('Failed to fetch wallet balance', _error as Error)
      // Return zero balance on error
      return {
        confirmed: '0',
        spendable: '0',
        unconfirmed: '0',
      }
    }
  }

  async sendTransaction(request: TransactionRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/wallet/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to send transaction: ${response.statusText}`)
      }

      const data = await response.json()
      return data.transactionId
    } catch (_error) {
      logger.error('Failed to send transaction', _error as Error)
      throw _error
    }
  }

  async getTransactionHistory(walletAddress: string, limit = 50): Promise<TransactionDetails[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/wallet/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress, limit }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction history: ${response.statusText}`)
      }

      const data = await response.json()
      return data.transactions || []
    } catch (_error) {
      logger.error('Failed to fetch transaction history', _error as Error)
      return []
    }
  }
}

// Export singleton instance
export const walletService = new WalletApiService()
