import type { WalletConnectModal } from '@walletconnect/modal'
import type { SignClient } from '@walletconnect/sign-client/dist/types/client'
import type { SessionTypes } from '@walletconnect/types'
import type { ComputedRef, Ref } from 'vue'

export interface WalletConnectInstance {
  signClient: SignClient
  modal: WalletConnectModal
}

export interface ChiaNamespace {
  accounts: string[]
  methods: string[]
  events: string[]
  chains: string[]
}
export interface GenericNamespace {
  accounts?: string[]
  methods: string[]
  events: string[]
  chains?: string[]
}

export interface WalletConnectNamespace {
  chia: ChiaNamespace
}

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

export interface WalletConnectState {
  signClient: SignClient | null
  isInitialized: boolean
  isConnected: boolean
  isConnecting: boolean
  session: SessionTypes.Struct | undefined
  address: string | undefined
  fingerprint: string | undefined
  accounts: string[]
  chainId: string | undefined
  error: string | undefined
}

export interface ConnectionResult {
  success: boolean
  session?: SessionTypes.Struct
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
  | string

export interface WalletConnectEvent {
  type: WalletConnectEventType
  data: unknown
}

export interface AssetBalance {
  confirmed: string
  spendable: string
  spendableCoinCount: number
}

export interface LegacyAssetBalance {
  balance: number
  assetId: string
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
  session: SessionTypes.Struct | null
}

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
export interface CommandExecutionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface TransactionData {
  amount: number
  fee: number
  recipient: string
  assetId?: string
  memo?: string
}

export interface OfferData {
  offerAssets: OfferAsset[]
  requestAssets: OfferAsset[]
  fee: number
  expirationHours?: number
  memo?: string
}

export interface OfferAsset {
  assetId: string
  amount: number
  type: 'xch' | 'cat' | 'nft'
  symbol?: string
}

export interface CoinSpend {
  coin: CoinInfo
  puzzle_reveal: string
  solution: string
}

export interface WalletCommand {
  command: string
  params: WalletMethodParams
}

export interface WalletRequestParams {
  [key: string]: unknown
}

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
  transaction: TransactionData
}

export interface CreateOfferParams {
  offer: OfferData
}

export interface TakeOfferParams {
  offer: string
}

export interface CancelOfferParams {
  offerId: string
}

export interface SignCoinSpendsParams {
  walletId: number
  coinSpends: CoinSpend[]
}

export type WalletMethodParams =
  | GetAssetBalanceParams
  | GetAssetCoinsParams
  | SignMessageParams
  | SendTransactionParams
  | CreateOfferParams
  | TakeOfferParams
  | CancelOfferParams
  | SignCoinSpendsParams
  | Record<string, never>

export type AppSignClient = Awaited<
  ReturnType<typeof import('@walletconnect/sign-client').SignClient.init>
>

export interface WalletConnectSession {
  data: Ref<SessionTypes.Struct | undefined>
  chainId: ComputedRef<string>
  fingerprint: ComputedRef<number>
  topic: ComputedRef<string>
  isConnecting: Ref<boolean>
  isConnected: Ref<boolean>
  waitForApproval: () => void
}
