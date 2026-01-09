'use client'

import { useDexieDataService } from '@/features/offers/api/useDexieDataService'
import type { DexieOffer } from '@/features/offers/lib/dexieTypes'
import type {
  OrderBookFilters,
  OrderBookOrder,
  OrderBookPagination,
  OrderBookQueryResult,
} from '../lib/orderBookTypes'
import { logger } from '@/shared/lib/logger'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'

const DEFAULT_PAGINATION: OrderBookPagination = 50

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

    // Calculate USD values - for now set to 0 since we don't have real prices
    const offeringUsdValue = 0
    const receivingUsdValue = 0

    // Calculate XCH values - only count native token amounts
    const offeringXchValue = safeOffered.reduce((sum: number, item) => {
      if (item.code === 'TXCH' || item.code === 'XCH' || !item.code) {
        return sum + item.amount
      }
      return sum
    }, 0)
    const receivingXchValue = safeRequested.reduce((sum: number, item) => {
      if (item.code === 'TXCH' || item.code === 'XCH' || !item.code) {
        return sum + item.amount
      }
      return sum
    }, 0)

    return {
      id: dexieOffer.id,
      offering: safeOffered,
      requesting: safeRequested,
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

  // Helper function to sort orders by price
  // Future: Check API response for sorted indicator to skip client-side sorting
  const sortOrdersByPrice = (
    orders: OrderBookOrder[],
    apiResponse?: { sorted?: boolean }
  ): OrderBookOrder[] => {
    // Future: If API indicates it's sorted, trust it
    // if (apiResponse?.sorted === true) {
    //   return orders // API already sorted it
    // }

    // Current: Always sort client-side (defensive)
    return orders.sort((a, b) => {
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
  }

  // Calculate refetch interval based on pagination
  const calculateRefetchInterval = (pagination: OrderBookPagination): number | false => {
    const intervals: Record<OrderBookPagination, number | false> = {
      10: 10 * 1000, // 10 seconds
      15: 15 * 1000, // 15 seconds
      50: 30 * 1000, // 30 seconds
      100: 60 * 1000, // 60 seconds
      all: false, // No auto-refetch
    }
    return intervals[pagination]
  }

  // Calculate stale time based on pagination
  const calculateStaleTime = (pagination: OrderBookPagination): number => {
    const staleTimes: Record<OrderBookPagination, number> = {
      10: 5 * 1000, // 5 seconds
      15: 5 * 1000, // 5 seconds
      50: 15 * 1000, // 15 seconds
      100: 30 * 1000, // 30 seconds
      all: 60 * 1000, // 60 seconds
    }
    return staleTimes[pagination]
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

  // Get pagination value from filters or use default
  const pagination = filters?.pagination || DEFAULT_PAGINATION

  // Helper function to fetch all pages recursively
  const fetchAllPages = async (
    buyAsset?: string | null,
    sellAsset?: string | null,
    page = 0,
    accumulatedOrders: OrderBookOrder[] = [],
    accumulatedTotal = 0
  ): Promise<{ orders: OrderBookOrder[]; total: number }> => {
    const params = buildSearchParams(page, buyAsset, sellAsset, 100)
    const response = await dexieDataService.searchOffers(params)

    if (response.success && Array.isArray(response.data)) {
      const orders = (response.data as DexieOffer[])
        .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
        .map(convertDexieOfferToOrderBookOrder)

      const newOrders = [...accumulatedOrders, ...orders]
      const newTotal = accumulatedTotal + (response.total || orders.length)

      // If we got a full page (100 items), there might be more
      if (response.data.length === 100) {
        return fetchAllPages(buyAsset, sellAsset, page + 1, newOrders, newTotal)
      }

      return { orders: newOrders, total: newTotal }
    }

    return { orders: accumulatedOrders, total: accumulatedTotal }
  }

  // Helper function to build search parameters based on filters
  const buildSearchParams = (
    page: number,
    buyAsset?: string | null,
    sellAsset?: string | null,
    pageSize?: number
  ) => {
    const params: {
      page: number
      page_size: number
      status: number
      requested?: string
      offered?: string
    } = {
      page,
      page_size: pageSize || (pagination === 'all' ? 100 : pagination),
      status: 0, // Only open offers
    }

    // Use provided parameters or fall back to filters
    // If explicitly passed as null, don't use filters (treat as "don't use this parameter")
    // If undefined, use filter if available
    let targetBuyAsset: string | undefined
    if (buyAsset === null) {
      // Explicitly null: don't use this parameter
      targetBuyAsset = undefined
    } else if (buyAsset !== undefined) {
      // Explicitly provided value
      targetBuyAsset = buyAsset
    } else {
      // Undefined: use filter if available
      targetBuyAsset = filters?.buyAsset?.[0]
    }

    let targetSellAsset: string | undefined
    if (sellAsset === null) {
      // Explicitly null: don't use this parameter
      targetSellAsset = undefined
    } else if (sellAsset !== undefined) {
      // Explicitly provided value
      targetSellAsset = sellAsset
    } else {
      // Undefined: use filter if available
      targetSellAsset = filters?.sellAsset?.[0]
    }

    // Normalize tickers for API (XCH -> TXCH on testnet, etc.)
    if (targetBuyAsset) {
      targetBuyAsset = normalizeTickerForApi(targetBuyAsset)
    }
    if (targetSellAsset) {
      targetSellAsset = normalizeTickerForApi(targetSellAsset)
    }

    // For buy/sell filtering, we need to determine which asset is being bought/sold
    // If user wants to buy XCH (buyAsset), they're looking for offers where XCH is offered (buy side)
    // If user wants to sell TDBX (sellAsset), they're looking for offers where TDBX is requested (sell side)

    // When buyAsset is passed (even as null placeholder), use offered field
    // When sellAsset is passed (even as null placeholder), use requested field
    // This allows us to query for an asset in either field by passing it in the appropriate position

    if (targetBuyAsset && !targetSellAsset) {
      // Only buyAsset: it should be in the offered field (buy side)
      params.offered = targetBuyAsset
    } else if (targetSellAsset && !targetBuyAsset) {
      // Only sellAsset: it should be in the requested field (sell side)
      params.requested = targetSellAsset
    } else if (targetBuyAsset && targetSellAsset) {
      // Both filters set: bidirectional query (handled in queryFn)
      // For the first query: buyAsset requested, sellAsset offered
      params.requested = targetBuyAsset
      params.offered = targetSellAsset
    }

    return params
  }

  // Create query key that includes filters and pagination for proper caching
  // Use arrays directly - React Query will handle deep comparison
  const queryKey = useMemo(() => {
    const buyAssets = filters?.buyAsset || []
    const sellAssets = filters?.sellAsset || []

    // Create a stable key based on filter values
    // Sort arrays to ensure consistent key generation
    const buyKey = [...buyAssets].sort().join(',')
    const sellKey = [...sellAssets].sort().join(',')

    return ['orderBook', buyKey, sellKey, pagination]
  }, [
    // Depend on the actual array contents for proper change detection
    // Use JSON.stringify to ensure deep equality
    JSON.stringify(filters?.buyAsset || []),
    JSON.stringify(filters?.sellAsset || []),
    pagination,
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

        // Handle pagination for "all" case
        if (pagination === 'all') {
          // Fetch all pages for both directions using recursive helper
          const result1 = await fetchAllPages(buyAsset, sellAsset)
          allOrders.push(...result1.orders)
          totalCount += result1.total

          const result2 = await fetchAllPages(sellAsset, buyAsset)
          allOrders.push(...result2.orders)
          totalCount += result2.total
        } else {
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
        }
      } else if (
        (filters?.buyAsset && filters.buyAsset.length > 0) ||
        (filters?.sellAsset && filters.sellAsset.length > 0)
      ) {
        // Single filter case: fetch orders in both directions to populate both buy and sell sides
        const buyAsset = filters?.buyAsset?.[0]
        const sellAsset = filters?.sellAsset?.[0]

        logger.info(`Fetching orders with single filter: buy=${buyAsset}, sell=${sellAsset}`)

        // If only buyAsset is set: fetch orders where buyAsset is offered AND requested
        // If only sellAsset is set: fetch orders where sellAsset is offered AND requested
        // This ensures we get both buy and sell sides populated

        if (buyAsset && !sellAsset) {
          // Query 1: Orders where buyAsset is offered (buy side)
          const params1 = buildSearchParams(0, buyAsset, undefined)
          logger.info('Query 1 params (offered):', params1)
          const response1 = await dexieDataService.searchOffers(params1)
          if (response1.success && Array.isArray(response1.data)) {
            const orders1 = (response1.data as DexieOffer[])
              .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
              .map(convertDexieOfferToOrderBookOrder)
            allOrders.push(...orders1)
            totalCount += response1.total || orders1.length
            logger.info(`Query 1: Added ${orders1.length} orders`)
          }

          // Query 2: Orders where buyAsset is requested (sell side - opposite)
          const params2 = buildSearchParams(0, null, buyAsset)
          logger.info('Query 2 params (requested):', params2)
          const response2 = await dexieDataService.searchOffers(params2)
          if (response2.success && Array.isArray(response2.data)) {
            const orders2 = (response2.data as DexieOffer[])
              .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
              .map(convertDexieOfferToOrderBookOrder)
            allOrders.push(...orders2)
            totalCount += response2.total || orders2.length
            logger.info(`Query 2: Added ${orders2.length} orders`)
          }
        } else if (sellAsset && !buyAsset) {
          // Query 1: Orders where sellAsset is requested (sell side)
          const params1 = buildSearchParams(0, undefined, sellAsset)
          logger.info('Query 1 params (requested):', params1)
          const response1 = await dexieDataService.searchOffers(params1)
          if (response1.success && Array.isArray(response1.data)) {
            const orders1 = (response1.data as DexieOffer[])
              .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
              .map(convertDexieOfferToOrderBookOrder)
            allOrders.push(...orders1)
            totalCount += response1.total || orders1.length
            logger.info(`Query 1: Added ${orders1.length} orders`)
          }

          // Query 2: Orders where sellAsset is offered (buy side - opposite)
          const params2 = buildSearchParams(0, sellAsset, null)
          logger.info('Query 2 params (offered):', params2)
          const response2 = await dexieDataService.searchOffers(params2)
          if (response2.success && Array.isArray(response2.data)) {
            const orders2 = (response2.data as DexieOffer[])
              .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
              .map(convertDexieOfferToOrderBookOrder)
            allOrders.push(...orders2)
            totalCount += response2.total || orders2.length
            logger.info(`Query 2: Added ${orders2.length} orders`)
          }
        }
      } else {
        // No filters - fetch all orders
        logger.info('Fetching all orders (no filters)')
        if (pagination === 'all') {
          // Fetch all pages using recursive helper
          const result = await fetchAllPages(undefined, undefined)
          allOrders.push(...result.orders)
          totalCount = result.total
        } else {
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
      }

      logger.info(`Total orders fetched: ${allOrders.length}`)

      // Deduplicate orders by ID to prevent duplicate keys
      const uniqueOrdersMap = new Map<string, OrderBookOrder>()
      allOrders.forEach((order) => {
        if (!uniqueOrdersMap.has(order.id)) {
          uniqueOrdersMap.set(order.id, order)
        }
      })
      const deduplicatedOrders = Array.from(uniqueOrdersMap.values())
      logger.info(`Orders after deduplication: ${deduplicatedOrders.length}`)

      // Sort all orders by price before returning
      const sortedOrders = sortOrdersByPrice(deduplicatedOrders)

      // Determine hasMore based on pagination
      const pageSize = pagination === 'all' ? 100 : pagination
      const hasMore = sortedOrders.length >= pageSize && pagination !== 'all'

      return {
        orders: sortedOrders,
        hasMore,
        total: totalCount,
      }
    },
    staleTime: calculateStaleTime(pagination),
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: calculateRefetchInterval(pagination),
    refetchIntervalInBackground: pagination !== 'all', // Continue refetching only if not "all"
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: pagination !== 'all', // Refetch on focus only if not "all"
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
