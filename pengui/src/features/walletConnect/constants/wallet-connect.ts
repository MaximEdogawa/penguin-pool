import { environment, CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID } from '@/lib/config/environment'
import { SageMethods } from './sage-methods'

export const CHIA_CHAIN_ID = environment.wallet.walletConnect.networks.chia.current

export const CHIA_METADATA = {
  name: environment.wallet.walletConnect.metadata.name,
  description: environment.wallet.walletConnect.metadata.description,
  url: environment.wallet.walletConnect.metadata.url,
  icons: [...environment.wallet.walletConnect.metadata.icons],
}

export const OPTIONAL_NAMESPACES = {
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

// Deprecated: Use OPTIONAL_NAMESPACES instead
// Kept for backward compatibility
export const REQUIRED_NAMESPACES = OPTIONAL_NAMESPACES

export const SIGN_CLIENT_CONFIG = {
  projectId: environment.wallet.walletConnect.projectId,
  relayUrl: environment.wallet.walletConnect.relayUrl,
  metadata: CHIA_METADATA,
}

export const MODAL_CONFIG = {
  projectId: environment.wallet.walletConnect.projectId,
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

export { CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID }
