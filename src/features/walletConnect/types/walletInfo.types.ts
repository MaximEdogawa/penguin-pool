import type { AssetBalance } from './walletConnect.types'

export interface WalletInfo {
  fingerprint: string | null
  chainId: string | null
  network: string
  accounts: string[]
  session: {
    topic: string
    pairingTopic: string
    relay: {
      protocol: string
      data?: string
    }
    namespaces: Record<string, unknown>
    expiry: number
  } | null
  balance?: AssetBalance | null
  address?: string | null
}
