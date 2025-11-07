import { environment } from '@/lib/config/environment'

export const TESTNET = process.env.NEXT_PUBLIC_CHIA_NETWORK === 'testnet'

export const xchWcMetadata = environment.wallet.walletConnect.metadata
