'use client'

import { useDexieDataService } from '../api/useDexieDataService'
import type { DexieOffer } from '../lib/dexieTypes'
import type { OrderBookFilters, OrderBookOrder, OrderBookQueryResult } from '../lib/orderBookTypes'
import { logger } from '@/shared/lib/logger'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'

const ROWS_PER_PAGE = 20

// Mock USD prices for assets (in a real app, this would come from an API)
const USD_PRICES: Record<string, number> = {
  TXCH: 30,
  XCH: 30,
  BTC: 122013,
  ETH: 3500,
  USDT: 1,
  USDC: 1,
  SOL: 120,
  MATIC: 0.85,
  AVAX: 35,
  LINK: 15,
}

/**
 * Hook for fetching and managing order book data from Dexie API
 * Provides caching, loading states, and automatic refetching
 */
export function useOrderBook(filters?: OrderBookFilters) {
  const dexieDataService = useDexieDataService()

  // Log filters on mount and when they change
  useEffect(() => {
    logger.info('useOrderBook filters changed:', filters)
  }, [filters])

  // Helper function to convert Dexie offer to OrderBookOrder format
  const convertDexieOfferToOrderBookOrder = (dexieOffer: DexieOffer): OrderBookOrder => {
    // Ensure amounts are numbers and handle undefined/null values
    const safeOffered = dexieOffer.offered.map((item) => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))
    const safeRequested = dexieOffer.requested.map((item) => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))

    const offeringUsdValue = safeOffered.reduce(
      (sum: number, item) => sum + item.amount * (USD_PRICES[item.code] || 0),
      0
    )
    const receivingUsdValue = safeRequested.reduce(
      (sum: number, item) => sum + item.amount * (USD_PRICES[item.code] || 0),
      0
    )

    const offeringXchValue = safeOffered.reduce((sum: number, item) => {
      if (item.code === 'TXCH' || item.code === 'XCH') {
        return sum + item.amount
      } else {
        return sum + (item.amount * (USD_PRICES[item.code] || 0)) / USD_PRICES.TXCH
      }
    }, 0)
    const receivingXchValue = safeRequested.reduce((sum: number, item) => {
      if (item.code === 'TXCH' || item.code === 'XCH') {
        return sum + item.amount
      } else {
        return sum + (item.amount * (USD_PRICES[item.code] || 0)) / USD_PRICES.TXCH
      }
    }, 0)

    return {
      id: dexieOffer.id,
      offering: safeOffered,
      receiving: safeRequested,
      maker: `0x${dexieOffer.id.substring(0, 8)}...${dexieOffer.id.substring(dexieOffer.id.length - 8)}`,
      timestamp: new Date(dexieOffer.date_found).toLocaleTimeString(),
      offeringUsdValue,
      receivingUsdValue,
      offeringXchValue,
      receivingXchValue,
      pricePerUnit: offeringUsdValue > 0 ? receivingUsdValue / offeringUsdValue : 0,
      status: dexieOffer.status,
      date_found: dexieOffer.date_found,
      date_completed: dexieOffer.date_completed,
      date_pending: dexieOffer.date_pending,
      date_expiry: dexieOffer.date_expiry,
      known_taker: dexieOffer.known_taker,
    }
  }

  // Helper function to determine if an offer is a sell order (offering native token)
  const isSellOrder = (order: OrderBookOrder): boolean => {
    const nativeTicker = getNativeTokenTicker()
    return order.offering.some(
      (asset) => asset.code === nativeTicker || asset.code === 'TXCH' || asset.code === 'XCH'
    )
  }

  // Helper function to normalize ticker for API (XCH -> TXCH on testnet, etc.)
  const normalizeTickerForApi = (ticker: string): string => {
    const nativeTicker = getNativeTokenTicker()
    // If the ticker is XCH or TXCH, normalize to the correct native token for the network
    if (ticker.toUpperCase() === 'XCH' || ticker.toUpperCase() === 'TXCH') {
      return nativeTicker
    }
    // Return ticker as-is for other assets
    return ticker
  }

  // Helper function to build search parameters based on filters
  const buildSearchParams = (page: number, buyAsset?: string, sellAsset?: string) => {
    const params: {
      page: number
      page_size: number
      status: number
      requested?: string
      offered?: string
    } = {
      page,
      page_size: ROWS_PER_PAGE,
      status: 0, // Only open offers
    }

    // Use provided parameters or fall back to filters
    let targetBuyAsset = buyAsset || filters?.buyAsset?.[0]
    let targetSellAsset = sellAsset || filters?.sellAsset?.[0]

    // Normalize tickers for API (XCH -> TXCH on testnet, etc.)
    if (targetBuyAsset) {
      targetBuyAsset = normalizeTickerForApi(targetBuyAsset)
    }
    if (targetSellAsset) {
      targetSellAsset = normalizeTickerForApi(targetSellAsset)
    }

    // For buy/sell filtering, we need to determine which asset is being bought/sold
    // If user wants to buy TXCH, they're looking for offers where TXCH is requested
    // If user wants to sell TXCH, they're looking for offers where TXCH is offered

    if (targetBuyAsset) {
      // User wants to buy these assets - they should be in the requested field
      params.requested = targetBuyAsset
    }

    if (targetSellAsset) {
      // User wants to sell these assets - they should be in the offered field
      params.offered = targetSellAsset
    }

    logger.info('Building search params:', params)
    return params
  }

  // Create query key that includes filters for proper caching
  // Use arrays directly - React Query will handle deep comparison
  const queryKey = useMemo(() => {
    const buyAssets = filters?.buyAsset || []
    const sellAssets = filters?.sellAsset || []

    // Create a stable key based on filter values
    // Sort arrays to ensure consistent key generation
    const buyKey = [...buyAssets].sort().join(',')
    const sellKey = [...sellAssets].sort().join(',')

    return ['orderBook', buyKey, sellKey]
  }, [
    // Depend on the actual array contents for proper change detection
    // Use JSON.stringify to ensure deep equality
    JSON.stringify(filters?.buyAsset || []),
    JSON.stringify(filters?.sellAsset || []),
  ])

  // Main order book query
  const orderBookQuery = useQuery<OrderBookQueryResult>({
    queryKey,
    queryFn: async () => {
      logger.info('Fetching order book with filters:', filters)
      const allOrders: OrderBookOrder[] = []
      let totalCount = 0

      // If we have both buy and sell assets, fetch both directions
      if (
        filters?.buyAsset &&
        filters.buyAsset.length > 0 &&
        filters?.sellAsset &&
        filters.sellAsset.length > 0
      ) {
        const buyAsset = filters.buyAsset[0]
        const sellAsset = filters.sellAsset[0]

        logger.info(`Fetching orders for pair: ${buyAsset}/${sellAsset}`)

        // Query 1: Original direction (buyAsset/sellAsset)
        const params1 = buildSearchParams(0, buyAsset, sellAsset)
        logger.info('Query 1 params:', params1)
        const response1 = await dexieDataService.searchOffers(params1)
        logger.info('Query 1 response:', {
          success: response1.success,
          count: response1.data?.length || 0,
        })

        if (response1.success && Array.isArray(response1.data)) {
          const orders1 = (response1.data as DexieOffer[])
            .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
            .map(convertDexieOfferToOrderBookOrder)
          allOrders.push(...orders1)
          totalCount += response1.total || orders1.length
          logger.info(`Query 1: Added ${orders1.length} orders`)
        }

        // Query 2: Reverse direction (sellAsset/buyAsset)
        const params2 = buildSearchParams(0, sellAsset, buyAsset)
        logger.info('Query 2 params:', params2)
        const response2 = await dexieDataService.searchOffers(params2)
        logger.info('Query 2 response:', {
          success: response2.success,
          count: response2.data?.length || 0,
        })

        if (response2.success && Array.isArray(response2.data)) {
          const orders2 = (response2.data as DexieOffer[])
            .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
            .map(convertDexieOfferToOrderBookOrder)
          allOrders.push(...orders2)
          totalCount += response2.total || orders2.length
          logger.info(`Query 2: Added ${orders2.length} orders`)
        }
      } else {
        // Single query for cases without both buy/sell filters
        logger.info('Fetching all orders (no specific filters)')
        const params = buildSearchParams(0)
        logger.info('Query params:', params)
        const response = await dexieDataService.searchOffers(params)
        logger.info('Query response:', {
          success: response.success,
          count: response.data?.length || 0,
        })

        if (response.success && Array.isArray(response.data)) {
          const orders = (response.data as DexieOffer[])
            .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
            .map(convertDexieOfferToOrderBookOrder)
          allOrders.push(...orders)
          totalCount = response.total || orders.length
          logger.info(`Added ${orders.length} orders`)
        }
      }

      logger.info(`Total orders fetched: ${allOrders.length}`)

      // Sort all orders
      allOrders.sort((a, b) => {
        // Sell orders: sort by price descending (high to low)
        // Buy orders: sort by price ascending (low to high)
        if (isSellOrder(a) && isSellOrder(b)) {
          return b.pricePerUnit - a.pricePerUnit // High to low for sell orders
        } else if (!isSellOrder(a) && !isSellOrder(b)) {
          return a.pricePerUnit - b.pricePerUnit // Low to high for buy orders
        } else {
          // Mixed order types: sell orders first, then buy orders
          return isSellOrder(a) ? -1 : 1
        }
      })

      return {
        orders: allOrders,
        hasMore: allOrders.length >= ROWS_PER_PAGE,
        total: totalCount,
      }
    },
    staleTime: 0, // Data is never considered stale - always refetch
    gcTime: 30 * 1000, // Keep in cache for only 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
  })

  // Computed properties for easy access
  const orderBookData = orderBookQuery.data?.orders || []
  const orderBookLoading = orderBookQuery.isLoading
  const orderBookError = orderBookQuery.error
  const orderBookHasMore = orderBookQuery.data?.hasMore || false
  const orderBookTotal = orderBookQuery.data?.total || 0

  // Manual refresh function
  const refreshOrderBook = () => {
    // Invalidate and refetch to ensure fresh data
    orderBookQuery.refetch()
  }

  return {
    // Data
    orderBookData,
    orderBookTotal,

    // Loading states
    orderBookLoading,
    orderBookError,
    orderBookHasMore,

    // Methods
    refreshOrderBook,

    // Query for advanced usage
    orderBookQuery,
  }
}
