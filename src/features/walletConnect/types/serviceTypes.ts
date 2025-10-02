import type { WalletConnectSession } from './walletConnect.types'

export interface IOSWalletInfo {
  address: string | null
  balance: string
  network: string
  fingerprint: string | null
}

export interface IOSConnectionState {
  isConnected: boolean
  isConnecting: boolean
  isFullyReady: boolean
  session: WalletConnectSession | null
  accounts: string[]
  chainId: string | null
  error: string | null
  isHealing: boolean
  websocketStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  connectionAttempts: number
  walletInfo: IOSWalletInfo | null
  isWalletInfoLoaded: boolean
}
