import { SageMethods } from '../constants/sage-methods'
import { CHIA_CHAIN_ID } from '../constants/wallet-connect'
import { sageWalletConnectService } from '../services/SageWalletConnectService'
import type { AssetType } from '../types/command.types'
import type { AssetBalance, AssetCoins, SageWalletInfo } from '../types/walletConnect.types'

interface WalletConnectClient {
  request: (params: {
    topic: string
    chainId: string
    request: {
      method: string
      params: Record<string, unknown>
    }
  }) => Promise<unknown>
}

/**
 * Make request to wallet
 */
export async function makeWalletRequest<T>(
  method: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    if (!sageWalletConnectService.isInitialized()) {
      return { success: false, error: 'WalletConnect is not initialized' }
    }
    if (!sageWalletConnectService.isConnected()) {
      return { success: false, error: 'Session is not connected' }
    }

    const session = sageWalletConnectService.getSession()
    if (!session) {
      return { success: false, error: 'No active session' }
    }

    // Extract fingerprint from session
    const allNamespaceAccounts =
      session.namespaces && typeof session.namespaces === 'object'
        ? Object.values(session.namespaces)
            .map((namespace: unknown) => (namespace as { accounts: string[] }).accounts)
            .flat()
        : []

    let fingerprint: string | null = null
    let chainId: string | null = null

    if (allNamespaceAccounts.length > 0) {
      const firstAccount = allNamespaceAccounts[0]
      const parts = firstAccount.split(':')
      if (parts.length >= 3) {
        chainId = `${parts[0]}:${parts[1]}` // e.g., "chia:testnet"
        fingerprint = parts[2]
      } else if (parts.length >= 2) {
        chainId = `${parts[0]}:${parts[1]}` // e.g., "chia:testnet"
        fingerprint = parts[1]
      } else {
        fingerprint = parts[0]
        chainId = CHIA_CHAIN_ID // fallback to constant
      }
    }

    if (!fingerprint) {
      return { success: false, error: 'Fingerprint is not loaded' }
    }

    if (!chainId) {
      return { success: false, error: 'Chain ID is not loaded' }
    }

    const client = (sageWalletConnectService as { client: WalletConnectClient }).client
    if (!client) {
      return { success: false, error: 'WalletConnect client not available' }
    }

    const result = (await client.request({
      topic: session.topic,
      chainId: chainId,
      request: {
        method,
        params: { fingerprint: parseInt(fingerprint), ...data },
      },
    })) as T | { error: Record<string, unknown> }

    if (result && typeof result === 'object' && 'error' in result) {
      return { success: false, error: 'Wallet returned an error' }
    }

    return { success: true, data: result as T }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('WalletConnect request failed:', { method, error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

/**
 * Get wallet address
 */
export async function getWalletAddress(): Promise<{
  success: boolean
  data?: { address: string }
  error?: string
}> {
  if (!sageWalletConnectService.isConnected()) {
    return { success: false, error: 'Wallet not connected' }
  }

  const result = await makeWalletRequest<{ address: string }>(SageMethods.CHIA_GET_ADDRESS, {})

  if (!result.success) {
    return { success: false, error: result.error }
  }

  if (!result.data?.address) {
    return { success: false, error: 'No address data received from wallet' }
  }

  return { success: true, data: result.data }
}

/**
 * Get asset balance
 */
export async function getAssetBalance(
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetBalance | null; error?: string }> {
  if (!sageWalletConnectService.isConnected()) {
    return { success: false, error: 'Wallet not connected' }
  }

  const result = await makeWalletRequest<AssetBalance>(SageMethods.CHIP0002_GET_ASSET_BALANCE, {
    type,
    assetId,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, data: result.data || null }
}

/**
 * Get asset coins
 */
export async function getAssetCoins(
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetCoins | null; error?: string }> {
  if (!sageWalletConnectService.isConnected()) {
    return { success: false, error: 'Wallet not connected' }
  }

  const result = await makeWalletRequest<AssetCoins>(SageMethods.CHIP0002_GET_ASSET_COINS, {
    type,
    assetId,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, data: result.data || null }
}

/**
 * Get complete wallet information
 */
export async function getWalletInfo(): Promise<{
  success: boolean
  data?: SageWalletInfo
  error?: string
}> {
  // Add detailed debugging
  const isConnected = sageWalletConnectService.isConnected()
  const session = sageWalletConnectService.getSession()
  const rawSession = (sageWalletConnectService as unknown as { session: { expiry: number } | null })
    .session

  // If we have a session but isConnected() returns false, try to proceed anyway
  // This handles cases where there might be timing issues with the connection state
  if (!isConnected && !session) {
    return { success: false, error: 'Wallet not connected' }
  }

  if (!session) {
    return { success: false, error: 'No active wallet session' }
  }

  // If isConnected() returned false but we have a session, log a warning but proceed
  if (!isConnected) {
    console.warn('isConnected() returned false but session exists, proceeding anyway', {
      isConnected,
      hasSession: !!session,
      sessionExpiry: rawSession?.expiry,
      currentTime: Date.now() / 1000,
    })
  }

  // Extract fingerprint from session
  const allNamespaceAccounts =
    session.namespaces && typeof session.namespaces === 'object'
      ? Object.values(session.namespaces)
          .map((namespace: unknown) => (namespace as { accounts: string[] }).accounts)
          .flat()
      : []

  let fingerprint: string | null = null
  if (allNamespaceAccounts.length > 0) {
    const firstAccount = allNamespaceAccounts[0]
    const parts = firstAccount.split(':')
    if (parts.length >= 3) {
      fingerprint = parts[2]
    } else if (parts.length >= 2) {
      fingerprint = parts[1]
    } else {
      fingerprint = parts[0]
    }
  }

  if (!fingerprint) {
    return { success: false, error: 'Failed to get wallet fingerprint' }
  }

  const addressResult = await getWalletAddress()
  if (!addressResult.success) {
    return { success: false, error: addressResult.error }
  }

  const balanceResult = await getAssetBalance()
  if (!balanceResult.success) {
    return { success: false, error: balanceResult.error }
  }

  const walletInfo: SageWalletInfo = {
    address: addressResult.data!.address,
    balance: balanceResult.data
      ? {
          confirmed_wallet_balance: parseInt(balanceResult.data.confirmed),
          unconfirmed_wallet_balance: 0,
          spendable_balance: parseInt(balanceResult.data.spendable),
          pending_change: 0,
          max_send_amount: parseInt(balanceResult.data.spendable),
          unspent_coin_count: balanceResult.data.spendableCoinCount,
          pending_coin_removal_count: 0,
        }
      : null,
    fingerprint: parseInt(fingerprint),
    isConnected: true,
  }

  return { success: true, data: walletInfo }
}

/**
 * Test RPC connection
 */
export async function testRpcConnection(): Promise<{
  success: boolean
  data?: boolean
  error?: string
}> {
  if (!sageWalletConnectService.isConnected()) {
    return { success: false, error: 'Wallet not connected' }
  }

  const result = await makeWalletRequest<boolean>(SageMethods.CHIP0002_CONNECT, {})

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, data: !!result.data }
}
