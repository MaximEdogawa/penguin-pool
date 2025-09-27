import type { SignClient } from '@walletconnect/sign-client/dist/types/client'
import type { SessionTypes } from '@walletconnect/types'
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
import type { AssetBalance, AssetCoins } from '../types/walletConnect.types'

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
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{ success: boolean; data?: T; error?: string }> {
  return walletRequestQueue.add(async () => {
    return makeWalletRequestInternal<T>(method, data, signClient, session)
  })
}

async function makeWalletRequestInternal<T>(
  method: string,
  data: Record<string, unknown>,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{ success: boolean; data?: T; error?: string }> {
  const timeoutMs = import.meta.env.PROD ? 15000 : 10000

  try {
    if (!signClient) throw new Error('SignClient not available')
    if (!session) throw new Error('Session topic not available')

    const requestPromise = signClient.request({
      topic: session.topic,
      chainId: `chia:${session?.namespaces?.chia?.chains?.[0]}`,
      request: {
        method,
        params: {
          fingerprint: parseInt(session?.namespaces?.chia?.accounts?.[0] || '0'),
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
    console.error('Wallet request error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

export async function getWalletAddress(
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: { address: string }
  error?: string
}> {
  return await makeWalletRequest<{ address: string }>(
    SageMethods.CHIA_GET_ADDRESS,
    {},
    signClient,
    session
  )
}

export async function getAssetBalance(
  type: AssetType | null = null,
  assetId: string | null = null,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{ success: boolean; data?: AssetBalance | null; error?: string }> {
  const result = await makeWalletRequest<AssetBalance>(
    SageMethods.CHIP0002_GET_ASSET_BALANCE,
    { type, assetId },
    signClient,
    session
  )

  return {
    success: false,
    error: result.error || 'Balance request failed',
    data: null,
  }
}

export async function getAssetCoins(
  type: AssetType | null = null,
  assetId: string | null = null,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{ success: boolean; data?: AssetCoins | null; error?: string }> {
  return await makeWalletRequest<AssetCoins>(
    SageMethods.CHIP0002_GET_ASSET_COINS,
    {
      type,
      assetId,
    },
    signClient,
    session
  )
}

export async function testRpcConnection(
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: boolean
  error?: string
}> {
  return await makeWalletRequest<boolean>(SageMethods.CHIP0002_CONNECT, {}, signClient, session)
}

export async function signCoinSpends(
  params: {
    walletId: number
    coinSpends: CoinSpend[]
  },
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: CoinSpend[]
  error?: string
}> {
  return await makeWalletRequest<CoinSpend[]>(
    SageMethods.CHIP0002_SIGN_COIN_SPENDS,
    params,
    signClient,
    session
  )
}

export async function signMessage(
  params: SignMessageRequest,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: SignMessageResponse
  error?: string
}> {
  return await makeWalletRequest<SignMessageResponse>(
    SageMethods.CHIP0002_SIGN_MESSAGE,
    params,
    signClient,
    session
  )
}

export async function sendTransaction(
  params: TransactionRequest,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: TransactionResponse
  error?: string
}> {
  return await makeWalletRequest<TransactionResponse>(
    SageMethods.CHIA_SEND,
    params,
    signClient,
    session
  )
}

export async function createOffer(
  params: OfferRequest,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: OfferResponse
  error?: string
}> {
  return await makeWalletRequest<OfferResponse>(
    SageMethods.CHIA_CREATE_OFFER,
    params,
    signClient,
    session
  )
}

export async function takeOffer(
  params: TakeOfferRequest,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: TakeOfferResponse
  error?: string
}> {
  return await makeWalletRequest<TakeOfferResponse>(
    SageMethods.CHIA_TAKE_OFFER,
    params,
    signClient,
    session
  )
}

export async function cancelOffer(
  params: CancelOfferRequest,
  signClient: SignClient | null,
  session: SessionTypes.Struct | undefined
): Promise<{
  success: boolean
  data?: CancelOfferResponse
  error?: string
}> {
  return await makeWalletRequest<CancelOfferResponse>(
    SageMethods.CHIA_CANCEL_OFFER,
    params,
    signClient,
    session
  )
}
