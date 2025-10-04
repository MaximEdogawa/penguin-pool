// Transaction types for the Penguin Pool application

// Import shared types
import type { AssetAmount, AssetType, BaseAsset } from './asset.types'

export type TransactionAsset = BaseAsset

export interface TransactionDetails {
  id: string
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled'
  createdAt: Date
  confirmedAt?: Date
  fromAddress: string
  toAddress: string
  asset: TransactionAsset
  fee: AssetAmount
  memo?: string
  blockHeight?: number
}

export interface SendTransactionForm {
  recipient: string
  amount: AssetAmount
  assetType: AssetType
  assetId?: string
  fee: AssetAmount
  memo?: string
}

// Wallet request interfaces for better type safety
export interface SendTransactionWalletRequest {
  transaction: {
    amount: number
    fee: number
    recipient: string
    assetId?: string
    memo?: string
  }
}

export interface SendTransactionWalletResponse {
  success: boolean
  transactionId?: string
  data?: {
    transactionId: string
    status: string
    fee: number
  }
  error?: string | null
}

export interface TransactionFilters {
  status?: string
  assetType?: string
  minAmount?: number
  maxAmount?: number
  fromAddress?: string
  toAddress?: string
}

export interface TransactionSortOptions {
  field: 'createdAt' | 'amount' | 'status' | 'confirmedAt'
  direction: 'asc' | 'desc'
}
