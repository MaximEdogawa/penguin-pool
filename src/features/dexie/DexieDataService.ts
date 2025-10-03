import { logger } from '@/shared/logger/logger'
import {
  dexieRepository,
  type DexieOfferSearchParams,
  type DexiePairsResponse,
  type DexiePostOfferResponse,
  type DexieTicker,
  type DexieTickerResponse,
} from '@/shared/repositories/DexieRepository'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'

export interface DexieOfferResponse {
  success: boolean
  id: string
  known: boolean
  offer: DexieOffer
}

export interface DexieOffer {
  id: string
  status: number
  involved_coins: string[]
  date_found: string
  date_completed?: string
  date_pending?: string
  date_expiry?: string
  block_expiry?: number | null
  spent_block_index?: number
  price: number
  offered: DexieAsset[]
  requested: DexieAsset[]
  fees: number
  mempool?: unknown
  related_offers: unknown[]
  mod_version: number
  trade_id: string
  known_taker?: unknown
  input_coins: Record<string, unknown[]>
  output_coins: Record<string, unknown[]>
}

export interface DexieAsset {
  id: string
  code: string
  name: string
  amount: number
}

export interface DexieSearchParams {
  maker_address?: string
  taker_address?: string
  asset_id?: string
  status?: number
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'updated_at' | 'amount'
  sort_order?: 'asc' | 'desc'
}

export interface DexiePostOfferParams {
  offer: string
  drop_only?: boolean
  claim_rewards?: boolean
}

export interface CatTokenInfo {
  assetId: string
  ticker: string
  name: string
  symbol: string
}

export type ValidatedOfferString = string & { readonly __validated: true }

export function validateOfferString(offerString: string): ValidatedOfferString {
  if (!offerString || offerString.trim().length === 0) {
    throw new Error('Offer string cannot be empty')
  }

  const cleanOffer = offerString.trim()
  if (cleanOffer.length < 50) {
    throw new Error('Offer string too short')
  }

  const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(cleanOffer)
  const startsWithOffer = cleanOffer.startsWith('offer')

  if (!isBase64 && !startsWithOffer) {
    throw new Error('Invalid offer format')
  }

  return cleanOffer as ValidatedOfferString
}

const DEXIE_KEY = 'dexie'
const TICKERS_KEY = 'tickers'
const PAIRS_KEY = 'pairs'

export function useDexieDataService() {
  const queryClient = useQueryClient()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const tickersQuery = useQuery({
    queryKey: [DEXIE_KEY, TICKERS_KEY],
    queryFn: async (): Promise<DexieTickerResponse> => {
      return await dexieRepository.getAllTickers()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
  })

  const pairsQuery = useQuery({
    queryKey: [DEXIE_KEY, PAIRS_KEY],
    queryFn: async (): Promise<DexiePairsResponse> => {
      return await dexieRepository.getAllPairs()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })

  const searchOffersMutation = useMutation({
    mutationFn: async (params: DexieOfferSearchParams = {}) => {
      return await dexieRepository.searchOffers(params)
    },
    onSuccess: () => {
      logger.info('Offers searched successfully')
    },
    onError: error => {
      logger.error('Failed to search offers:', error)
    },
  })

  const inspectOfferMutation = useMutation({
    mutationFn: async (dexieId: string) => {
      logger.info('Inspecting offer with ID:', dexieId)

      try {
        const baseUrl = 'https://api-testnet.dexie.space'
        const response = await fetch(`${baseUrl}/v1/offers/${dexieId}`)
        const result = await response.json()

        logger.info(`Direct GET response status: ${response.status}, Result:`, result)

        if (!response.ok) {
          logger.warn(`Offer not found or expired for ID ${dexieId}:`, result)
          return {
            success: false,
            id: dexieId,
            known: false,
            offer: null,
            error_message: result.error_message || `HTTP error! status: ${response.status}`,
          }
        }

        return {
          success: result.success,
          id: result.offer?.id || dexieId,
          known: true,
          offer: result.offer,
        }
      } catch (error) {
        logger.error('Failed to fetch offer by ID:', error)
        throw error
      }
    },
    gcTime: 0, // Don't cache mutations
    onSuccess: data => {
      logger.info('Offer inspected successfully:', data)
      if (data.success && data.id)
        queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, 'offers'] })
    },
    onError: error => {
      logger.error('Failed to inspect offer:', error)
    },
  })

  const getTickerMutation = useMutation({
    mutationFn: async (tickerId: string) => {
      return await dexieRepository.getTicker(tickerId)
    },
    onSuccess: () => {
      logger.info('Ticker retrieved successfully')
    },
    onError: error => {
      logger.error('Failed to get ticker:', error)
    },
  })

  const getOrderBookMutation = useMutation({
    mutationFn: async ({ tickerId, depth = 10 }: { tickerId: string; depth?: number }) => {
      return await dexieRepository.getOrderBook(tickerId, depth)
    },
    onSuccess: () => {
      logger.info('Order book retrieved successfully')
    },
    onError: error => {
      logger.error('Failed to get order book:', error)
    },
  })

  const getHistoricalTradesMutation = useMutation({
    mutationFn: async ({ tickerId, limit = 100 }: { tickerId: string; limit?: number }) => {
      return await dexieRepository.getHistoricalTrades(tickerId, limit)
    },
    onSuccess: () => {
      logger.info('Historical trades retrieved successfully')
    },
    onError: error => {
      logger.error('Failed to get historical trades:', error)
    },
  })

  const postOfferMutation = useMutation({
    mutationFn: async (params: DexiePostOfferParams): Promise<DexiePostOfferResponse> => {
      return await dexieRepository.postOffer(params)
    },
    onSuccess: data => {
      logger.info('Offer posted successfully:', data)
      // Invalidate offers queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, 'offers'] })
    },
    onError: error => {
      logger.error('Failed to post offer:', error)
    },
  })

  const inspectOfferWithPolling = async (dexieId: string, maxAttempts: number = 30) => {
    try {
      isLoading.value = true
      error.value = null

      if (!dexieId) throw new Error('Dexie ID is required for polling')

      let attempts = 0

      const pollOfferStatus = async (): Promise<DexiePostOfferResponse> => {
        const result = await inspectOfferMutation.mutateAsync(dexieId)
        const finalStates = [3, 4, 6] // Complete states
        if (finalStates.includes(result.offer.status)) {
          return result
        }

        attempts++
        if (attempts >= maxAttempts) {
          logger.warn(`Offer polling timed out after ${maxAttempts} attempts`)
          return result
        }

        await new Promise(resolve => setTimeout(resolve, 20000))
        return pollOfferStatus()
      }

      return await pollOfferStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const refreshTickers = async () => {
    await queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, TICKERS_KEY] })
  }

  const refreshPairs = async () => {
    await queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, PAIRS_KEY] })
  }

  const refreshOffers = async () => {
    await queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, 'offers'] })
  }

  // Computed properties
  const offers = computed(() => [])
  const currentOffer = computed(() => null)

  return {
    tickersQuery,
    pairsQuery,
    searchOffers: searchOffersMutation.mutateAsync,
    inspectOffer: async (dexieId: string) => {
      return await inspectOfferMutation.mutateAsync(dexieId)
    },
    getTicker: getTickerMutation.mutateAsync,
    getOrderBook: ({ tickerId, depth }: { tickerId: string; depth?: number }) =>
      getOrderBookMutation.mutateAsync({ tickerId, depth }),
    getHistoricalTrades: ({ tickerId, limit }: { tickerId: string; limit?: number }) =>
      getHistoricalTradesMutation.mutateAsync({ tickerId, limit }),
    inspectOfferWithPolling,
    postOffer: postOfferMutation.mutateAsync,
    refreshTickers,
    refreshPairs,
    refreshOffers,
    validateOfferString,
    searchOffersMutation,
    inspectOfferMutation,
    getTickerMutation,
    getOrderBookMutation,
    getHistoricalTradesMutation,
    postOfferMutation,

    offers,
    currentOffer,
    isLoading: computed(
      () =>
        isLoading.value ||
        searchOffersMutation.isPending.value ||
        inspectOfferMutation.isPending.value ||
        getTickerMutation.isPending.value ||
        getOrderBookMutation.isPending.value ||
        getHistoricalTradesMutation.isPending.value ||
        postOfferMutation.isPending.value
    ),
    error: computed(() => error.value),
    isSearching: searchOffersMutation.isPending,
    isInspecting: inspectOfferMutation.isPending,
    isPosting: postOfferMutation.isPending,
    isGettingTicker: getTickerMutation.isPending,
    isGettingOrderBook: getOrderBookMutation.isPending,
    isGettingTrades: getHistoricalTradesMutation.isPending,
  }
}

export function convertDexieOfferToAppOffer(dexieResponse: DexiePostOfferResponse) {
  const dexieOffer = dexieResponse.offer

  return {
    id: dexieOffer.id,
    tradeId: dexieOffer.id,
    offerString: dexieOffer.offer || '', // Offer string available in POST response only
    status: convertDexieStatus(dexieOffer.status),
    dexieStatus: dexieOffer.status,
    createdAt: new Date(dexieOffer.date_found),
    expiresAt: dexieOffer.date_expiry ? new Date(dexieOffer.date_expiry) : undefined,
    assetsOffered: dexieOffer.offered.map(convertDexieAsset),
    assetsRequested: dexieOffer.requested.map(convertDexieAsset),
    fee: dexieOffer.fees,
    creatorAddress: undefined, // Dexie API doesn't provide direct creator address, would need blockchain lookup

    // Store additional Dexie date fields for state calculation
    dateFound: dexieOffer.date_found,
    dateCompleted: dexieOffer.date_completed,
    datePending: dexieOffer.date_pending,
    dateExpiry: dexieOffer.date_expiry,
    blockExpiry: dexieOffer.block_expiry,
    spentBlockIndex: dexieOffer.spent_block_index,
    knownTaker: dexieOffer.known_taker,
  }
}

export function convertDexieAsset(dexieAsset: DexieAsset) {
  const assetType = dexieAsset.id === 'xch' ? 'xch' : 'cat'
  return {
    assetId: dexieAsset.id,
    amount: dexieAsset.amount,
    type: assetType,
    symbol: dexieAsset.code,
    name: dexieAsset.name,
  }
}

export function convertDexieStatus(
  status: number
): 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'failed' {
  switch (status) {
    case 0:
      return 'active'
    case 1:
      return 'pending'
    case 2:
      return 'pending'
    case 3:
      return 'cancelled'
    case 4:
      return 'completed'
    case 5:
      return 'failed'
    case 6:
      return 'expired'
    default:
      return 'failed'
  }
}

export function getDexieStatusDescription(status: number | string): string {
  if (typeof status === 'string') return status

  switch (status) {
    case 0:
      return 'Open'
    case 1:
      return 'Pending'
    case 2:
      return 'Cancelling'
    case 3:
      return 'Cancelled'
    case 4:
      return 'Completed'
    case 5:
      return 'Unknown'
    case 6:
      return 'Expired'
    default:
      return 'Unknown'
  }
}

export function createCatTokenMap(tickers: DexieTicker[]): Map<string, CatTokenInfo> {
  const catMap = new Map<string, CatTokenInfo>()

  tickers.forEach(ticker => {
    if (ticker.target_currency === 'xch' && ticker.base_currency !== 'xch') {
      catMap.set(ticker.base_currency, {
        assetId: ticker.base_currency,
        ticker: ticker.base_code,
        name: ticker.base_name,
        symbol: ticker.base_code,
      })
    }
  })

  return catMap
}

export function getCatTokenInfo(assetId: string, catMap: Map<string, CatTokenInfo>): CatTokenInfo {
  return (
    catMap.get(assetId) || {
      assetId,
      ticker: assetId,
      name: assetId,
      symbol: assetId,
    }
  )
}
