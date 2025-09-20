import { SageMethods } from '../constants/sage-methods'
import { useWalletConnectService } from '../services/WalletConnectService'
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
import type { AssetBalance, AssetCoins, WalletInfo } from '../types/walletConnect.types'

export async function makeWalletRequest<T>(
  method: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { session, fingerprint, chainId, client } = useWalletConnectService.getConnectionInfo()
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
    console.log('makeWalletRequest: Success for', method, ':', result)
    return { success: true, data: result as T }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('makeWalletRequest: Request failed for', method, ':', { error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

export async function getWalletInfo(): Promise<{
  success: boolean
  data?: WalletInfo
  error?: string
}> {
  try {
    const walletService = useWalletConnectService

    if (!walletService.isSessionActivelyConnected()) {
      return { success: false, error: 'Session not actively connected' }
    }

    const { fingerprint } = walletService.getConnectionInfo()
    // Add individual timeouts to prevent hanging
    const addressResult = await getWalletAddress()
    const balanceResult = await getAssetBalance()

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
    console.error('Service getWalletInfo failed:', errorMessage)

    // For disconnection errors, return a more specific error message
    if (errorMessage.includes('User disconnected') || errorMessage.includes('Unknown error')) {
      return { success: false, error: 'Wallet disconnected' }
    }
    return { success: false, error: errorMessage }
  }
}

export async function getWalletAddress(): Promise<{
  success: boolean
  data?: { address: string }
  error?: string
}> {
  return await makeWalletRequest<{ address: string }>(SageMethods.CHIA_GET_ADDRESS, {})
}

export async function getAssetBalance(
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetBalance | null; error?: string }> {
  return await makeWalletRequest<AssetBalance>(SageMethods.CHIP0002_GET_ASSET_BALANCE, {
    type,
    assetId,
  })
}

export async function getAssetCoins(
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetCoins | null; error?: string }> {
  return await makeWalletRequest<AssetCoins>(SageMethods.CHIP0002_GET_ASSET_COINS, {
    type,
    assetId,
  })
}

export async function testRpcConnection(): Promise<{
  success: boolean
  data?: boolean
  error?: string
}> {
  return await makeWalletRequest<boolean>(SageMethods.CHIP0002_CONNECT, {})
}

export async function signCoinSpends(params: {
  walletId: number
  coinSpends: CoinSpend[]
}): Promise<{
  success: boolean
  data?: CoinSpend[]
  error?: string
}> {
  return await makeWalletRequest<CoinSpend[]>(SageMethods.CHIP0002_SIGN_COIN_SPENDS, params)
}

export async function signMessage(params: SignMessageRequest): Promise<{
  success: boolean
  data?: SignMessageResponse
  error?: string
}> {
  return await makeWalletRequest<SignMessageResponse>(SageMethods.CHIP0002_SIGN_MESSAGE, params)
}

export async function sendTransaction(params: TransactionRequest): Promise<{
  success: boolean
  data?: TransactionResponse
  error?: string
}> {
  return await makeWalletRequest<TransactionResponse>(SageMethods.CHIA_SEND, params)
}

export async function createOffer(params: OfferRequest): Promise<{
  success: boolean
  data?: OfferResponse
  error?: string
}> {
  return await makeWalletRequest<OfferResponse>(SageMethods.CHIA_CREATE_OFFER, params)
}

export async function takeOffer(params: TakeOfferRequest): Promise<{
  success: boolean
  data?: TakeOfferResponse
  error?: string
}> {
  return await makeWalletRequest<TakeOfferResponse>(SageMethods.CHIA_TAKE_OFFER, params)
}

export async function cancelOffer(params: CancelOfferRequest): Promise<{
  success: boolean
  data?: CancelOfferResponse
  error?: string
}> {
  return await makeWalletRequest<CancelOfferResponse>(SageMethods.CHIA_CANCEL_OFFER, params)
}
