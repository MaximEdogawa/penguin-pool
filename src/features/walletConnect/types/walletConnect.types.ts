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

export interface AssetBalance {
  confirmed: string
  spendable: string
  spendableCoinCount: number
}

export interface CoinInfo {
  parent_coin_info: string
  puzzle_hash: string
  amount: number
}

export interface LineageProof {
  parentName: string
  innerPuzzleHash: string
  amount: number
}

export interface AssetCoin {
  coin: CoinInfo
  coinName: string
  confirmedBlockIndex: number
  lineageProof: LineageProof
  locked: boolean
  puzzle: string
}

export type AssetCoins = AssetCoin[]

export interface WalletInfo {
  fingerprint: number
  address: string
  balance: AssetBalance | null
  isConnected: boolean
}

export interface ExtendedWalletInfo {
  fingerprint: string | null
  chainId: string | null
  network: WalletConnectNetwork | null
  accounts: string[]
  session: WalletConnectSession | null
}

// Define WalletConnectNetwork interface for Chia networks
export interface WalletConnectNetwork {
  id: string
  name: string
  rpcUrls: {
    default: { http: string[] }
  }
  blockExplorers: {
    default: { name: string; url: string }
  }
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

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

// Wallet request parameter types
export interface WalletRequestParams {
  [key: string]: unknown
}

// Specific parameter interfaces for different wallet methods
export interface GetAssetBalanceParams {
  type?: string | null
  assetId?: string | null
}

export interface GetAssetCoinsParams {
  type?: string | null
  assetId?: string | null
}

export interface SignMessageParams {
  message: string
  address?: string
}

export interface SendTransactionParams {
  transaction: unknown
}

export interface CreateOfferParams {
  offer: unknown
}

export interface TakeOfferParams {
  offer: string
}

export interface CancelOfferParams {
  offerId: string
}

export interface SignCoinSpendsParams {
  walletId: number
  coinSpends: unknown[]
}

// Method-specific parameter mapping
export type WalletMethodParams =
  | GetAssetBalanceParams
  | GetAssetCoinsParams
  | SignMessageParams
  | SendTransactionParams
  | CreateOfferParams
  | TakeOfferParams
  | CancelOfferParams
  | SignCoinSpendsParams
  | Record<string, never> // For methods with no parameters
