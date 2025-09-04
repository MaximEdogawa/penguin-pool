// Basic Chia RPC types
export interface LogInRequest {
  fingerprint: number
}

export interface LogInResponse {
  fingerprint: number
  success: true
}

export interface GetWalletsRequest {
  includeData?: boolean
}

export interface WalletInfo {
  id: number
  name: string
  type: number
  data: Record<string, unknown>
}

export interface GetWalletsResponse {
  wallets: WalletInfo[]
}

export interface GetWalletBalanceRequest {
  walletId: number
}

export interface WalletBalance {
  confirmed_wallet_balance: number
  unconfirmed_wallet_balance: number
  spendable_balance: number
  pending_change: number
  max_send_amount: number
  unspent_coin_count: number
  pending_coin_removal_count: number
}

export interface GetWalletBalanceResponse {
  walletBalance: WalletBalance
}

export interface GetCurrentAddressRequest {
  walletId: number
}

export interface GetCurrentAddressResponse {
  address: string
}

export interface GetNextAddressRequest {
  walletId?: number
  newAddress?: boolean
}

export interface GetNextAddressResponse {
  address: string
  walletId: number
}

export interface SendTransactionRequest {
  walletId: number
  amount: number
  fee: number
  address: string
  memos?: string[]
  waitForConfirmation?: boolean
}

export interface SendTransactionResponse {
  transaction: Record<string, unknown>
}

export type GetSyncStatusRequest = Record<string, never>

export interface GetSyncStatusResponse {
  synced: boolean
  syncing: boolean
  genesis_initialized: boolean
}

// Chia-specific types for the application
export interface ChiaWalletInfo {
  fingerprint: number
  address: string
  balance: WalletBalance
  isConnected: boolean
}

export interface SageConnectionState {
  isConnected: boolean
  isConnecting: boolean
  fingerprint?: number
  address?: string
  balance?: WalletBalance
  error?: string
}
