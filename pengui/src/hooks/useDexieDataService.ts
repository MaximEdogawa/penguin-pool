'use client'

import {
  dexieRepository,
  type DexieOfferSearchParams,
  type DexiePostOfferParams,
  type DexiePostOfferResponse,
} from '@/lib/dexie/DexieRepository'
import { logger } from '@/lib/logger'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const DEXIE_KEY = 'dexie'
const TICKERS_KEY = 'tickers'
const PAIRS_KEY = 'pairs'

export function useDexieDataService() {
  const queryClient = useQueryClient()

  const tickersQuery = useQuery({
    queryKey: [DEXIE_KEY, TICKERS_KEY],
    queryFn: async () => {
      return await dexieRepository.getAllTickers()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
  })

  const pairsQuery = useQuery({
    queryKey: [DEXIE_KEY, PAIRS_KEY],
    queryFn: async () => {
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
    onError: (error) => {
      logger.error('Failed to search offers:', error)
    },
  })

  const inspectOfferMutation = useMutation({
    mutationFn: async (dexieId: string) => {
      logger.info('Inspecting offer with ID:', dexieId)
      return await dexieRepository.inspectOfferById(dexieId)
    },
    gcTime: 0, // Don't cache mutations
    onSuccess: (data) => {
      logger.info('Offer inspected successfully:', data)
      if (data.success && data.id) {
        queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, 'offers'] })
      }
    },
    onError: (error) => {
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
    onError: (error) => {
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
    onError: (error) => {
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
    onError: (error) => {
      logger.error('Failed to get historical trades:', error)
    },
  })

  const postOfferMutation = useMutation({
    mutationFn: async (params: DexiePostOfferParams): Promise<DexiePostOfferResponse> => {
      return await dexieRepository.postOffer(params)
    },
    onSuccess: (data) => {
      logger.info('Offer posted successfully:', data)
      // Invalidate offers queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [DEXIE_KEY, 'offers'] })
    },
    onError: (error) => {
      logger.error('Failed to post offer:', error)
    },
  })

  const inspectOfferWithPolling = async (dexieId: string, maxAttempts: number = 30) => {
    if (!dexieId) throw new Error('Dexie ID is required for polling')

    let attempts = 0

    const pollOfferStatus = async (): Promise<DexiePostOfferResponse> => {
      const result = await inspectOfferMutation.mutateAsync(dexieId)
      const finalStates = [3, 4, 6] // Complete states
      if (result.offer && finalStates.includes(result.offer.status)) {
        return result
      }

      attempts++
      if (attempts >= maxAttempts) {
        logger.warn(`Offer polling timed out after ${maxAttempts} attempts`)
        return result
      }

      await new Promise((resolve) => setTimeout(resolve, 20000))
      return pollOfferStatus()
    }

    return await pollOfferStatus()
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

  const validateOfferString = (offerString: string): boolean => {
    if (!offerString || offerString.trim().length === 0) {
      return false
    }

    const cleanOffer = offerString.trim()
    if (cleanOffer.length < 50) {
      return false
    }

    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(cleanOffer)
    const startsWithOffer = cleanOffer.startsWith('offer')

    return isBase64 || startsWithOffer
  }

  const isLoading =
    searchOffersMutation.isPending ||
    inspectOfferMutation.isPending ||
    getTickerMutation.isPending ||
    getOrderBookMutation.isPending ||
    getHistoricalTradesMutation.isPending ||
    postOfferMutation.isPending

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

    offers: [],
    currentOffer: null,
    isLoading,
    error: null,
    isSearching: searchOffersMutation.isPending,
    isInspecting: inspectOfferMutation.isPending,
    isPosting: postOfferMutation.isPending,
    isGettingTicker: getTickerMutation.isPending,
    isGettingOrderBook: getOrderBookMutation.isPending,
    isGettingTrades: getHistoricalTradesMutation.isPending,
  }
}
