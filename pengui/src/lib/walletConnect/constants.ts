import { environment, CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID } from '../config/environment'

export const CHIA_CHAIN_ID = environment.wallet.walletConnect.networks.chia.current

export const CHIA_METADATA = {
  name: environment.wallet.walletConnect.metadata.name,
  description: environment.wallet.walletConnect.metadata.description,
  url: environment.wallet.walletConnect.metadata.url,
  icons: [...environment.wallet.walletConnect.metadata.icons],
}

export const REQUIRED_NAMESPACES = {
  chia: {
    methods: [
      'chia_getCurrentAddress',
      'chia_createOfferForIds',
      'chia_getWallets',
      'chia_addCATToken',
    ],
    chains: [CHIA_CHAIN_ID],
    events: [],
  },
}

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
