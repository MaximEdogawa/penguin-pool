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
import type {
  AppSignClient,
  AssetBalance,
  AssetCoins,
  WalletInfo,
} from '../types/walletConnect.types'

export async function makeWalletRequest<T>(
  method: string,
  data: Record<string, unknown>,
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const state = connectionService.state.value

    if (!state.isConnected || !state.session) {
      throw new Error('WalletConnect not connected')
    }

    const signClient = instanceService.getSignClient.value
    if (!signClient) throw new Error('SignClient not available')

    const result = (await (signClient as AppSignClient).request({
      topic: (state.session as Record<string, unknown>).topic as string,
      chainId: `chia:${state.chainId}`,
      request: {
        method,
        params: {
          fingerprint: parseInt(state.accounts[0] || '0'),
          ...data,
        },
      },
    })) as T | { error: Record<string, unknown> }

    if (result && typeof result === 'object' && 'error' in result) {
      return { success: false, error: 'Wallet returned an error' }
    }

    console.log('Wallet request for :', { method, result })
    return { success: true, data: result as T }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('WalletConnect request failed:', { method, error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

export async function getWalletInfo(
  connectionService: ReturnType<typeof useConnectionDataService>,
  instanceService: ReturnType<typeof useInstanceDataService>
): Promise<{
  success: boolean
  data?: WalletInfo
  error?: string
}> {
  try {
    const fingerprint = connectionService.state.value.accounts[0] || '0'

    const [addressResult, balanceResult] = await Promise.all([
      getWalletAddress(connectionService, instanceService),
      getAssetBalance(connectionService, instanceService, null, null),
    ])

    if (!addressResult.success) {
      return { success: false, error: addressResult.error }
    }
    if (!balanceResult.success) {
      return { success: false, error: balanceResult.error }
    }

    const walletInfo: WalletInfo = {
      address: addressResult.data!.address,
      balance: balanceResult.data ?? null,
      fingerprint: parseInt(fingerprint),
      isConnected: true,
    }

    return { success: true, data: walletInfo }
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
    {
      type,
      assetId,
    },
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
