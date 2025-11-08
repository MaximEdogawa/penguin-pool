// Re-export Redux hooks and utilities from chia-wallet-connect for convenience
export { useAppSelector, useAppDispatch, WalletManager, ConnectButton } from '@chia/wallet-connect'
export type { RootState, AppDispatch } from '@chia/wallet-connect'

// Legacy exports - deprecated, use Redux hooks from @chia/wallet-connect instead
// Keeping for backward compatibility during migration
export { default as WalletConnectAutoConnect } from './WalletConnectAutoConnect'
export * from './config'
export * from './constants/wallet-connect'
export * from './constants/sage-methods'
