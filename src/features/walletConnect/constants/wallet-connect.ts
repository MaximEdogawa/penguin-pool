import {
  CHIA_MAINNET_CHAIN_ID,
  CHIA_TESTNET_CHAIN_ID,
  environment,
} from '@/shared/config/environment'
import type { CoreTypes } from '@walletconnect/types'
import { SageMethods } from './sage-methods'

// Use chain ID from environment configuration
export const CHIA_CHAIN_ID = environment.wallet.walletConnect.chainId

// Export chain ID constants for use in other parts of the app
export { CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID }

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
