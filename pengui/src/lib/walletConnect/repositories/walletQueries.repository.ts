import { logger } from '@/lib/logger'
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
import type { AssetBalance, AssetCoins, WalletConnectSession } from '../types/walletConnect.types'
import type SignClient from '@walletconnect/sign-client'

const REQUEST_TIMEOUT = 30000

export async function makeWalletRequest<T>(
  method: string,
  data: Record<string, unknown>,
  signClient: SignClient | undefined,
  session: WalletConnectSession
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    if (!signClient) throw new Error('SignClient is not initialized')

    if (!session.isConnected || !session.session) {
      logger.warn('❌ Session is not connected')
      return { success: false, error: 'Session is not connected' }
    }

    const activeSessions = signClient.session.getAll()
    const sessionExists = activeSessions.some((s) => s.topic === session.topic)

    if (!sessionExists) {
      logger.warn(`❌ Session ${session.topic} no longer exists in SignClient`)
      return { success: false, error: 'Session no longer exists' }
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout after 30 seconds'))
      }, REQUEST_TIMEOUT)
    })

    const walletRequestPromise = signClient.request({
      topic: session.topic,
      chainId: session.chainId,
      request: {
        method,
        params: { fingerprint: session.fingerprint, ...data },
      },
    })

    const result = (await Promise.race([walletRequestPromise, timeoutPromise])) as
      | T
      | { error: Record<string, unknown> }

    if (result && typeof result === 'object' && 'error' in result) {
      return { success: false, error: 'Wallet returned an error' }
    }
    logger.info(`Wallet request for ${method}:`, result)
    return { success: true, data: result as T }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle relay message errors (often non-critical)
    if (
      errorMessage.includes('onRelayMessage') ||
      errorMessage.includes('failed to process an inbound message') ||
      errorMessage.includes('relay')
    ) {
      logger.warn('⚠️ WalletConnect relay message error (non-critical):', errorMessage)
      // These are often transient relay errors, don't fail the request
      return { success: false, error: 'Relay communication error. Please try again.' }
    }

    if (errorMessage.includes('Missing or invalid') || errorMessage.includes('recently deleted')) {
      logger.warn('🗑️ Session was deleted')
    }

    return { success: false, error: errorMessage }
  }
}

export async function getWalletAddress(
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession,
  type: AssetType | null = null,
  assetId: string | null = null
): Promise<{ success: boolean; data?: AssetBalance | null; error?: string }> {
  return await makeWalletRequest<AssetBalance>(
    SageMethods.CHIP0002_GET_ASSET_BALANCE,
    { type, assetId },
    signClient,
    session
  )
}

export async function getAssetCoins(
  signClient: SignClient | undefined,
  session: WalletConnectSession,
  type: AssetType | null = null,
  assetId: string | null = null
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
  signClient: SignClient | undefined,
  session: WalletConnectSession
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
