import { SageMethods } from '../constants/sage-methods'
import type { useConnectionDataService } from '../services/ConnectionDataService'
import type { useInstanceDataService } from '../services/InstanceDataService'
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
import type { AppSignClient, AssetBalance, AssetCoins } from '../types/walletConnect.types'

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
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>
): Promise<{ success: boolean; data?: T; error?: string }> {
  return walletRequestQueue.add(async () => {
    return makeWalletRequestInternal<T>(method, data, connectionService, instanceService)
  })
}

async function makeWalletRequestInternal<T>(
  method: string,
  data: Record<string, unknown>,
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const timeoutMs = import.meta.env.PROD ? 15000 : 10000

  try {
    const state = connectionService.state.value
    if (!state.isConnected || !state.session) {
      throw new Error('WalletConnect not connected')
    }

    const signClient = instanceService.getSignClient.value
    if (!signClient) throw new Error('SignClient not available')

    const sessionTopic = (state.session as Record<string, unknown>).topic as string
    if (!sessionTopic) throw new Error('Session topic not available')

    const requestPromise = (signClient as AppSignClient).request({
      topic: sessionTopic,
      chainId: `chia:${state.chainId}`,
      request: {
        method,
        params: {
          fingerprint: parseInt(state.accounts[0] || '0'),
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

export async function getWalletAddress(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>
): Promise<{
  success: boolean
  data?: { address: string }
  error?: string
}> {
  return await makeWalletRequest<{ address: string }>(
    SageMethods.CHIA_GET_ADDRESS,
    {},
    connectionService,
    instanceService
  )
}

export async function getAssetBalance(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetBalance | null; error?: string }> {
  return await makeWalletRequest<AssetBalance>(
    SageMethods.CHIP0002_GET_ASSET_BALANCE,
    { type, assetId },
    connectionService,
    instanceService
  )
}

export async function getAssetCoins(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetCoins | null; error?: string }> {
  return await makeWalletRequest<AssetCoins>(
    SageMethods.CHIP0002_GET_ASSET_COINS,
    {
      type,
      assetId,
    },
    connectionService,
    instanceService
  )
}

export async function testRpcConnection(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>
): Promise<{
  success: boolean
  data?: boolean
  error?: string
}> {
  return await makeWalletRequest<boolean>(
    SageMethods.CHIP0002_CONNECT,
    {},
    connectionService,
    instanceService
  )
}

export async function signCoinSpends(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
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
    connectionService,
    instanceService
  )
}

export async function signMessage(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  params: SignMessageRequest
): Promise<{
  success: boolean
  data?: SignMessageResponse
  error?: string
}> {
  return await makeWalletRequest<SignMessageResponse>(
    SageMethods.CHIP0002_SIGN_MESSAGE,
    params,
    connectionService,
    instanceService
  )
}

export async function sendTransaction(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  params: TransactionRequest
): Promise<{
  success: boolean
  data?: TransactionResponse
  error?: string
}> {
  return await makeWalletRequest<TransactionResponse>(
    SageMethods.CHIA_SEND,
    params,
    connectionService,
    instanceService
  )
}

export async function createOffer(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  params: OfferRequest
): Promise<{
  success: boolean
  data?: OfferResponse
  error?: string
}> {
  return await makeWalletRequest<OfferResponse>(
    SageMethods.CHIA_CREATE_OFFER,
    params,
    connectionService,
    instanceService
  )
}

export async function takeOffer(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  params: TakeOfferRequest
): Promise<{
  success: boolean
  data?: TakeOfferResponse
  error?: string
}> {
  return await makeWalletRequest<TakeOfferResponse>(
    SageMethods.CHIA_TAKE_OFFER,
    params,
    connectionService,
    instanceService
  )
}

export async function cancelOffer(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>,
  params: CancelOfferRequest
): Promise<{
  success: boolean
  data?: CancelOfferResponse
  error?: string
}> {
  return await makeWalletRequest<CancelOfferResponse>(
    SageMethods.CHIA_CANCEL_OFFER,
    params,
    connectionService,
    instanceService
  )
}
