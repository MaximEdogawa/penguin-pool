export interface WalletConnectConfig {
  projectId: string
  metadata: {
    name: string
    description: string
    url: string
    icons: string[]
  }
  chains?: string[]
  methods?: string[]
  events?: string[]
}

export interface WalletInfo {
  id: string
  name: string
  description: string
  icon: string
  homepage: string
  chains: string[]
  app: {
    browser: string
    ios: string
    android: string
    mac: string
    windows: string
    linux: string
  }
  mobile: {
    native: string
    universal: string
  }
  desktop: {
    native: string
    universal: string
  }
}

export interface WalletConnectSession {
  topic: string
  pairingTopic: string
  relay: {
    protocol: string
    data?: string
  }
  namespaces: Record<string, unknown>
  requiredNamespaces: Record<string, unknown>
  optionalNamespaces: Record<string, unknown>
  self: {
    publicKey: string
    metadata: {
      name: string
      description: string
      url: string
      icons: string[]
    }
  }
  peer: {
    publicKey: string
    metadata: {
      name: string
      description: string
      url: string
      icons: string[]
    }
  }
  acknowledged: boolean
  controller: string
  expiry: number
}

export interface WalletConnectState {
  isConnected: boolean
  isConnecting: boolean
  session: WalletConnectSession | null
  accounts: string[]
  chainId: string | null
  error: string | null
}

export interface ConnectionResult {
  success: boolean
  session?: WalletConnectSession
  accounts?: string[]
  error?: string
}

export interface DisconnectResult {
  success: boolean
  error?: string
}

export type WalletConnectEventType =
  | 'session_proposal'
  | 'session_approve'
  | 'session_reject'
  | 'session_delete'
  | 'session_update'
  | 'session_expire'
  | 'session_restored'
  | 'session_ping'
  | 'session_event'
  | 'session_request'
  | 'session_response'
  | 'session_request_sent'
  | 'session_response_sent'
  | 'session_request_expire'
  | 'session_response_expire'
  | string // Allow any string for custom events

export interface WalletConnectEvent {
  type: WalletConnectEventType
  data: unknown
}

export interface SageWalletInfo {
  fingerprint: number
  address: string
  balance: {
    confirmed_wallet_balance: number
    unconfirmed_wallet_balance: number
    spendable_balance: number
    pending_change: number
    max_send_amount: number
    unspent_coin_count: number
    pending_coin_removal_count: number
  }
  isConnected: boolean
}

// Alias for backward compatibility
export type ChiaWalletInfo = SageWalletInfo

// Command execution result type
export interface CommandExecutionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Wallet command interface for easier usage
export interface WalletCommand {
  command: string
  params: Record<string, unknown>
}

// Chia connection state interface
export interface ChiaConnectionState {
  isConnected: boolean
  isConnecting: boolean
  fingerprint?: number
  address?: string
  balance?: {
    confirmed_wallet_balance: number
    unconfirmed_wallet_balance: number
    spendable_balance: number
    pending_change: number
    max_send_amount: number
    unspent_coin_count: number
    pending_coin_removal_count: number
  }
  error?: string
}
