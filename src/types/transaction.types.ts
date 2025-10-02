// Transaction types for the Penguin Pool application

export interface TransactionAsset {
  assetId: string
  amount: number
  type: 'xch' | 'cat' | 'nft'
  symbol?: string
}

export interface TransactionDetails {
  id: string
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled'
  createdAt: Date
  confirmedAt?: Date
  fromAddress: string
  toAddress: string
  asset: TransactionAsset
  fee: number
  memo?: string
  blockHeight?: number
}

export interface SendTransactionForm {
  recipient: string
  amount: number
  assetType: 'xch' | 'cat' | 'nft'
  assetId?: string
  fee: number
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
