import {
  CHIA_MAINNET_CHAIN_ID,
  CHIA_TESTNET_CHAIN_ID,
  environment,
} from '@/shared/config/environment'
import { SageMethods } from './sage-methods'

export const WALLET_CONNECT_STORAGE_KEY = 'walletconnect'
export const CHIA_CHAIN_ID = environment.wallet.walletConnect.networks.chia.current
export { CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID }

export const CHIA_METADATA = {
  name: environment.wallet.walletConnect.metadata.name,
  description: environment.wallet.walletConnect.metadata.description,
  url: environment.wallet.walletConnect.metadata.url,
  icons: [...environment.wallet.walletConnect.metadata.icons],
}

export const REQUIRED_NAMESPACES = {
  chia: {
    methods: [
      // CHIP-0002 Commands
      SageMethods.CHIP0002_CONNECT,
      SageMethods.CHIP0002_CHAIN_ID,
      SageMethods.CHIP0002_GET_PUBLIC_KEYS,
      SageMethods.CHIP0002_FILTER_UNLOCKED_COINS,
      SageMethods.CHIP0002_GET_ASSET_COINS,
      SageMethods.CHIP0002_GET_ASSET_BALANCE,
      SageMethods.CHIP0002_SIGN_COIN_SPENDS,
      SageMethods.CHIP0002_SIGN_MESSAGE,
      SageMethods.CHIP0002_SEND_TRANSACTION,
      // Chia-specific Commands
      SageMethods.CHIA_CREATE_OFFER,
      SageMethods.CHIA_TAKE_OFFER,
      SageMethods.CHIA_CANCEL_OFFER,
      SageMethods.CHIA_GET_NFTS,
      SageMethods.CHIA_SEND,
      SageMethods.CHIA_GET_ADDRESS,
      SageMethods.CHIA_SIGN_MESSAGE_BY_ADDRESS,
      SageMethods.CHIA_BULK_MINT_NFTS,
    ],
    chains: [CHIA_CHAIN_ID],
    events: ['chainChanged', 'accountsChanged'],
  },
}

export const SIGN_CLIENT_CONFIG = {
  projectId: import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID,
  relayUrl: import.meta.env?.VITE_WALLET_CONNECT_RELAY_URL || 'wss://relay.walletconnect.com',
  metadata: {
    name: import.meta.env?.VITE_APP_NAME || 'Penguin Pool',
    description: 'Chia Pool Management Platform',
    url: window.location.origin,
    icons: [
      `${window.location.origin}/penguin-pool.svg`,
      `${window.location.origin}/icons/icon-192x192.png`,
      `${window.location.origin}/icons/icon-512x512.png`,
    ],
  },
}

export const MODAL_CONFIG = {
  projectId: import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID,
  enableExplorer: false,
  themeMode: 'dark' as const,
  themeVariables: {
    '--wcm-z-index': '1000',
    '--wcm-background-color': '#1f2937',
    '--wcm-accent-color': '#3b82f6',
    '--wcm-accent-fill-color': '#ffffff',
    '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
  },
}
