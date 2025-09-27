import type { ComputedRef } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import type {
  AssetType,
  CancelOfferRequest,
  CancelOfferResponse,
  CoinSpend,
  OfferRequest,
  OfferResponse,
  SignMessageRequest,
  SignMessageResponse,
  TakeOfferRequest,
  TakeOfferResponse,
  TransactionRequest,
  TransactionResponse,
} from '../types/command.types'
import type {
  AppSignClient,
  AssetBalance,
  AssetCoins,
  WalletConnectState,
} from '../types/walletConnect.types'

// Simple request queue to prevent concurrent wallet requests
class WalletRequestQueue {
  private queue: Array<() => Promise<unknown>> = []
  private isProcessing = false

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    while (this.queue.length > 0) {
      const request = this.queue.shift()
      if (request) await request()
    }
    this.isProcessing = false
  }
}

const walletRequestQueue = new WalletRequestQueue()

export async function makeWalletRequest<T>(
  method: string,
  data: Record<string, unknown>,
  walletState: ComputedRef<WalletConnectState>
): Promise<{ success: boolean; data?: T; error?: string }> {
  return walletRequestQueue.add(async () => {
    return makeWalletRequestInternal<T>(method, data, walletState)
  })
}

async function makeWalletRequestInternal<T>(
  method: string,
  data: Record<string, unknown>,
  walletState: ComputedRef<WalletConnectState>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const timeoutMs = import.meta.env.PROD ? 15000 : 10000

  try {
    if (!walletState.value.isConnected || !walletState.value.session) {
      throw new Error('WalletConnect not connected')
    }
    const signClient = walletState.value.signClient
    if (!signClient) throw new Error('SignClient not available')

    const sessionTopic = walletState.value.session.topic as string
    if (!sessionTopic) throw new Error('Session topic not available')

    const requestPromise = (signClient as AppSignClient).request({
      topic: sessionTopic,
      chainId: `chia:${walletState.value.chainId}`,
      request: {
        method,
        params: {
          fingerprint: parseInt(walletState.value.accounts[0] || '0'),
          ...data,
        },
      },
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    })

    const result = (await Promise.race([requestPromise, timeoutPromise])) as
      | T
      | { error: Record<string, unknown> }

    if (result && typeof result === 'object' && 'error' in result) {
      return { success: false, error: 'Wallet returned an error' }
    }

    return { success: true, data: result as T }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

export async function getWalletAddress(walletState: ComputedRef<WalletConnectState>): Promise<{
  success: boolean
  data?: { address: string }
  error?: string
}> {
  return await makeWalletRequest<{ address: string }>(SageMethods.CHIA_GET_ADDRESS, {}, walletState)
}

export async function getAssetBalance(
  walletState: ComputedRef<WalletConnectState>,
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetBalance | null; error?: string }> {
  const result = await makeWalletRequest<AssetBalance>(
    SageMethods.CHIP0002_GET_ASSET_BALANCE,
    { type, assetId },
    walletState
  )

  if (result.success) {
    return result
  }

  const fallbackResult = await makeWalletRequest<AssetBalance>(
    SageMethods.CHIP0002_GET_ASSET_BALANCE,
    {},
    walletState
  )

  if (fallbackResult.success) {
    return fallbackResult
  }

  return {
    success: false,
    error: result.error || 'Balance request failed',
    data: null,
  }
}

export async function getAssetCoins(
  walletState: ComputedRef<WalletConnectState>,
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetCoins | null; error?: string }> {
  return await makeWalletRequest<AssetCoins>(
    SageMethods.CHIP0002_GET_ASSET_COINS,
    {
      type,
      assetId,
    },
    walletState
  )
}

export async function testRpcConnection(walletState: ComputedRef<WalletConnectState>): Promise<{
  success: boolean
  data?: boolean
  error?: string
}> {
  return await makeWalletRequest<boolean>(SageMethods.CHIP0002_CONNECT, {}, walletState)
}

export async function signCoinSpends(
  walletState: ComputedRef<WalletConnectState>,
  params: {
    walletId: number
    coinSpends: CoinSpend[]
  }
): Promise<{
  success: boolean
  data?: CoinSpend[]
  error?: string
}> {
  return await makeWalletRequest<CoinSpend[]>(
    SageMethods.CHIP0002_SIGN_COIN_SPENDS,
    params,
    walletState
  )
}

export async function signMessage(
  walletState: ComputedRef<WalletConnectState>,
  params: SignMessageRequest
): Promise<{
  success: boolean
  data?: SignMessageResponse
  error?: string
}> {
  return await makeWalletRequest<SignMessageResponse>(
    SageMethods.CHIP0002_SIGN_MESSAGE,
    params,
    walletState
  )
}

export async function sendTransaction(
  walletState: ComputedRef<WalletConnectState>,
  params: TransactionRequest
): Promise<{
  success: boolean
  data?: TransactionResponse
  error?: string
}> {
  return await makeWalletRequest<TransactionResponse>(SageMethods.CHIA_SEND, params, walletState)
}

export async function createOffer(
  walletState: ComputedRef<WalletConnectState>,
  params: OfferRequest
): Promise<{
  success: boolean
  data?: OfferResponse
  error?: string
}> {
  return await makeWalletRequest<OfferResponse>(SageMethods.CHIA_CREATE_OFFER, params, walletState)
}

export async function takeOffer(
  walletState: ComputedRef<WalletConnectState>,
  params: TakeOfferRequest
): Promise<{
  success: boolean
  data?: TakeOfferResponse
  error?: string
}> {
  return await makeWalletRequest<TakeOfferResponse>(
    SageMethods.CHIA_TAKE_OFFER,
    params,
    walletState
  )
}

export async function cancelOffer(
  walletState: ComputedRef<WalletConnectState>,
  params: CancelOfferRequest
): Promise<{
  success: boolean
  data?: CancelOfferResponse
  error?: string
}> {
  return await makeWalletRequest<CancelOfferResponse>(
    SageMethods.CHIA_CANCEL_OFFER,
    params,
    walletState
  )
}
