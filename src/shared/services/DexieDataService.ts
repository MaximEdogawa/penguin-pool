import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import {
  dexieRepository,
  type DexieOfferSearchParams,
  type DexiePairsResponse,
  type DexiePostOfferResponse,
  type DexieTicker,
  type DexieTickerResponse,
} from '../repositories/DexieRepository'
import { logger } from './logger'

// Legacy types for backward compatibility
export interface DexieOfferResponse {
  success: boolean
  id: string
  known: boolean
  offer: DexieOffer
}

export interface DexieOffer {
  id: string
  status: number // 0=Open, 1=Pending, 2=Cancelling, 3=Cancelled, 4=Completed, 5=Unknown, 6=Expired
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

// CAT token mapping for human-readable names
export interface CatTokenInfo {
  assetId: string
  ticker: string
  name: string
  symbol: string
}

export function useDexieDataService() {
  const queryClient = useQueryClient()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Tickers query - invalidates once per day
  const tickersQuery = {
    queryKey: ['dexie', 'tickers'],
    queryFn: async (): Promise<DexieTickerResponse> => {
      return await dexieRepository.getAllTickers()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  }

  // Pairs query
  const pairsQuery = {
    queryKey: ['dexie', 'pairs'],
    queryFn: async (): Promise<DexiePairsResponse> => {
      return await dexieRepository.getAllPairs()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  }

  // Search offers query
  const searchOffers = async (params: DexieOfferSearchParams = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'offers', 'search', params],
        queryFn: async ({ queryKey }) => {
          const params = (queryKey[3] as DexieOfferSearchParams) || {}
          return await dexieRepository.searchOffers(params)
        },
        staleTime: 30 * 1000, // 30 seconds
      })

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Inspect offer query
  const inspectOffer = async (offerString: string) => {
    try {
      isLoading.value = true
      error.value = null

      // Basic validation
      if (!offerString || offerString.trim().length === 0) {
        throw new Error('Offer string cannot be empty')
      }

      const cleanOffer = offerString.trim()

      // Check minimum length for complete offers
      if (cleanOffer.length < 50) {
        throw new Error('Offer string too short')
      }

      // Check if it looks like a valid offer string
      const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(cleanOffer)
      const startsWithOffer = cleanOffer.startsWith('offer')

      if (!isBase64 && !startsWithOffer) {
        throw new Error('Invalid offer format')
      }

      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'offers', 'inspect', offerString],
        queryFn: async ({ queryKey }) => {
          const offerString = queryKey[3] as string
          return await dexieRepository.inspectOffer(offerString)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get offer by ID
  const getOfferById = async (offerId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'offers', 'by-id', offerId],
        queryFn: async ({ queryKey }) => {
          const offerId = queryKey[3] as string
          return await dexieRepository.getOfferById(offerId)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get ticker by ID
  const getTicker = async (tickerId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'ticker', tickerId],
        queryFn: async ({ queryKey }) => {
          const tickerId = queryKey[2] as string
          return await dexieRepository.getTicker(tickerId)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get order book
  const getOrderBook = async (tickerId: string, depth: number = 10) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'orderbook', tickerId, depth],
        queryFn: async ({ queryKey }) => {
          const tickerId = queryKey[2] as string
          const depth = (queryKey[3] as number) || 10
          return await dexieRepository.getOrderBook(tickerId, depth)
        },
        staleTime: 30 * 1000, // 30 seconds
      })

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get historical trades
  const getHistoricalTrades = async (tickerId: string, limit: number = 100) => {
    try {
      isLoading.value = true
      error.value = null

      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'trades', tickerId, limit],
        queryFn: async ({ queryKey }) => {
          const tickerId = queryKey[2] as string
          const limit = (queryKey[3] as number) || 100
          return await dexieRepository.getHistoricalTrades(tickerId, limit)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Post offer mutation
  const postOfferMutation = useMutation({
    mutationFn: async (params: DexiePostOfferParams): Promise<DexiePostOfferResponse> => {
      return await dexieRepository.postOffer(params)
    },
    onSuccess: data => {
      logger.info('Offer posted successfully:', data)
      // Invalidate offers queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['dexie', 'offers'] })
    },
    onError: error => {
      logger.error('Failed to post offer:', error)
    },
  })

  // Computed properties
  const offers = computed(() => [])
  const currentOffer = computed(() => null)
  const isSearching = computed(() => isLoading.value)
  const isInspecting = computed(() => isLoading.value)
  const isPosting = computed(() => postOfferMutation.isPending.value)

  return {
    // Queries
    tickersQuery,
    pairsQuery,
    searchOffers,
    inspectOffer,
    getOfferById,
    getTicker,
    getOrderBook,
    getHistoricalTrades,

    // Mutations
    postOfferMutation,
    postOffer: postOfferMutation.mutateAsync,

    // State
    offers,
    currentOffer,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isSearching,
    isInspecting,
    isPosting,
  }
}

// Utility functions for converting between Dexie and app formats
export function convertDexieOfferToAppOffer(dexieResponse: DexiePostOfferResponse) {
  const dexieOffer = dexieResponse.offer

  return {
    id: dexieOffer.id,
    tradeId: dexieOffer.id,
    offerString: '', // Not provided in response
    status: convertDexieStatus(dexieOffer.status),
    dexieStatus: dexieOffer.status, // Include raw Dexie status number
    createdAt: new Date(dexieOffer.date_found),
    assetsOffered: dexieOffer.offered.map(convertDexieAsset),
    assetsRequested: dexieOffer.requested.map(convertDexieAsset),
    fee: dexieOffer.fees,
  }
}

export function convertDexieAsset(dexieAsset: DexieAsset) {
  // Determine asset type based on ID
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
      return 'active' // Open
    case 1:
      return 'pending' // Pending
    case 2:
      return 'pending' // Cancelling
    case 3:
      return 'cancelled' // Cancelled
    case 4:
      return 'completed' // Completed
    case 5:
      return 'failed' // Unknown
    case 6:
      return 'expired' // Expired
    default:
      return 'failed'
  }
}

export function getDexieStatusDescription(status: number | string): string {
  // Handle both legacy number status and new string state
  if (typeof status === 'string') {
    return status // Already a string state
  }

  // Legacy number status conversion
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

// CAT token mapping utilities
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
