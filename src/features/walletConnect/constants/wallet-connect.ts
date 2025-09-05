import type { CoreTypes } from '@walletconnect/types'
// Determine chain ID based on environment
const isTestnet =
  typeof window !== 'undefined'
    ? window.location.hostname.includes('localhost') || window.location.hostname.includes('testnet')
    : true

export const CHIA_CHAIN_ID = isTestnet ? 'chia:testnet' : 'chia:mainnet'

export const CHIA_METADATA: CoreTypes.Metadata = {
  name: 'Penguin Pool',
  description: 'Decentralized lending platform on Chia Network',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://penguin.pool',
  icons: ['https://penguin.pool/icon.png'],
}

// Required namespaces for Sage wallet connect commands
export const REQUIRED_NAMESPACES = {
  chia: {
    methods: [
      // CHIP-0002 Commands
      'chip0002_connect',
      'chip0002_chainId',
      'chip0002_getPublicKeys',
      'chip0002_filterUnlockedCoins',
      'chip0002_getAssetCoins',
      'chip0002_getAssetBalance',
      'chip0002_signCoinSpends',
      'chip0002_signMessage',
      'chip0002_sendTransaction',
      // Chia-specific Commands
      'chia_createOffer',
      'chia_takeOffer',
      'chia_cancelOffer',
      'chia_getNfts',
      'chia_send',
      'chia_getAddress',
      'chia_signMessageByAddress',
      'chia_bulkMintNfts',
    ],
    chains: [CHIA_CHAIN_ID],
    events: ['chainChanged', 'accountsChanged'],
  },
}
