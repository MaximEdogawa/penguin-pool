import type { ComputedRef } from 'vue'
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

export interface IOSWalletConnectService {
  // Core connection state
  connection: unknown // TanStack Query return type
  state: ComputedRef<IOSConnectionState>

  // Core wallet methods
  openModal: () => Promise<void>
  connect: (session: WalletConnectSession) => Promise<void>
  disconnect: () => Promise<void>
  restoreSessions: () => Promise<void>
  refreshSession: () => Promise<void>
  healConnection: () => Promise<void>
  resetConnectionState: () => void

  // Status indicators
  isConnecting: ComputedRef<boolean>
  isDisconnecting: ComputedRef<boolean>
  isOpeningModal: ComputedRef<boolean>
  isHealing: ComputedRef<boolean>
  websocketStatus: ComputedRef<string>
  connectionAttempts: ComputedRef<number>

  // Wallet info
  walletInfo: ComputedRef<IOSWalletInfo | null>
  isWalletInfoLoaded: ComputedRef<boolean>
}

export interface StandardWalletConnectService {
  // Core connection state
  state: ComputedRef<{
    isConnected: boolean
    isConnecting: boolean
    session: WalletConnectSession | null
    accounts: string[]
    chainId: string | null
    error: string | null
  }>

  // Core wallet methods
  openModal: () => Promise<{
    success: boolean
    session: WalletConnectSession | null
    error: string | null
  }>
  connect: (session: WalletConnectSession) => Promise<{
    success: boolean
    session: WalletConnectSession | null
    error: string | null
  }>
  disconnect: () => Promise<{
    success: boolean
    error: string | null
  }>
  restoreSessions: () => Promise<void>

  // Wallet info
  walletInfo: ComputedRef<{
    fingerprint: string | null
    chainId: string | null
    network: string
    accounts: string[]
    session: WalletConnectSession | null
  }>
}
