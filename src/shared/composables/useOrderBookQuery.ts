import type { DexieAssetItem, OrderBookOrder } from '@/pages/Trading/types'
import type { DexieOffer } from '@/shared/services/DexieDataService'
import { useDexieDataService } from '@/shared/services/DexieDataService'
import { logger } from '@/shared/services/logger'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

export interface OrderBookFilters {
  buyAsset?: string[]
  sellAsset?: string[]
}

export type { DexieAssetItem, OrderBookOrder }

/**
 * Composable for order book data using TanStack Query
 * Provides caching, loading states, and automatic refetching
 */
export function useOrderBookQuery(filters?: Ref<OrderBookFilters>) {
  const dexieDataService = useDexieDataService()

  // Constants
  const rowsPerPage = 20

  // Mock USD prices for assets (in a real app, this would come from an API)
  const usdPrices: Record<string, number> = {
    TXCH: 30,
    BTC: 122013,
    ETH: 3500,
    USDT: 1,
    USDC: 1,
    SOL: 120,
    MATIC: 0.85,
    AVAX: 35,
    LINK: 15,
  }

  // Helper function to convert Dexie offer to OrderBookOrder format
  const convertDexieOfferToOrderBookOrder = (dexieOffer: DexieOffer): OrderBookOrder => {
    // Ensure amounts are numbers and handle undefined/null values
    const safeOffered = dexieOffer.offered.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))
    const safeRequested = dexieOffer.requested.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))

    const offeringUsdValue = safeOffered.reduce(
      (sum: number, item: DexieAssetItem) => sum + item.amount * (usdPrices[item.code] || 0),
      0
    )
    const requestingUsdValue = safeRequested.reduce(
      (sum: number, item: DexieAssetItem) => sum + item.amount * (usdPrices[item.code] || 0),
      0
    )

    const offeringXchValue = safeOffered.reduce((sum: number, item: DexieAssetItem) => {
      if (item.code === 'TXCH') {
        return sum + item.amount
      } else {
        return sum + (item.amount * (usdPrices[item.code] || 0)) / usdPrices.TXCH
      }
    }, 0)
    const requestingXchValue = safeRequested.reduce((sum: number, item: DexieAssetItem) => {
      if (item.code === 'TXCH') {
        return sum + item.amount
      } else {
        return sum + (item.amount * (usdPrices[item.code] || 0)) / usdPrices.TXCH
      }
    }, 0)

    return {
      id: dexieOffer.id,
      offering: safeOffered,
      requesting: safeRequested,
      maker: `0x${dexieOffer.id.substring(0, 8)}...${dexieOffer.id.substring(-8)}`,
      timestamp: new Date(dexieOffer.date_found).toLocaleTimeString(),
      offeringUsdValue,
      requestingUsdValue,
      offeringXchValue,
      requestingXchValue,
      pricePerUnit: requestingUsdValue / offeringUsdValue,
      status: dexieOffer.status,
      date_found: dexieOffer.date_found,
      date_completed: dexieOffer.date_completed,
      date_pending: dexieOffer.date_pending,
      date_expiry: dexieOffer.date_expiry,
      known_taker: dexieOffer.known_taker,
    }
  }

  // Helper function to determine if an offer is a sell order (offering XCH/TXCH)
  const isSellOrder = (order: OrderBookOrder): boolean => {
    return order.offering.some(asset => asset.code === 'TXCH' || asset.code === 'XCH')
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
      page_size: rowsPerPage,
      status: 0, // Only open offers
    }

    // Use provided parameters or fall back to filters
    const targetBuyAsset = buyAsset || filters?.value?.buyAsset?.[0]
    const targetSellAsset = sellAsset || filters?.value?.sellAsset?.[0]

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

    // Debug logging
    logger.info('Building search params:', params)
    return params
  }

  // Create query key that includes filters for proper caching
  const queryKey = computed(() => {
    const filterParams = filters?.value
      ? {
          buyAsset: filters.value.buyAsset || [],
          sellAsset: filters.value.sellAsset || [],
        }
      : {}

    return ['orderBook', filterParams]
  })

  // Main order book query
  const orderBookQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const allOrders: OrderBookOrder[] = []
      let totalCount = 0

      // If we have both buy and sell assets, fetch both directions
      if (
        filters?.value?.buyAsset &&
        filters.value.buyAsset.length > 0 &&
        filters?.value?.sellAsset &&
        filters.value.sellAsset.length > 0
      ) {
        const buyAsset = filters.value.buyAsset[0]
        const sellAsset = filters.value.sellAsset[0]

        // Query 1: Original direction (buyAsset/sellAsset)
        const params1 = buildSearchParams(0, buyAsset, sellAsset)
        const response1 = await dexieDataService.searchOffers(params1)

        if (response1.success && Array.isArray(response1.data)) {
          const orders1 = (response1.data as DexieOffer[])
            .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
            .map(convertDexieOfferToOrderBookOrder)
          allOrders.push(...orders1)
          totalCount += response1.total || orders1.length
        }

        // Query 2: Reverse direction (sellAsset/buyAsset)
        const params2 = buildSearchParams(0, sellAsset, buyAsset)
        const response2 = await dexieDataService.searchOffers(params2)

        if (response2.success && Array.isArray(response2.data)) {
          const orders2 = (response2.data as DexieOffer[])
            .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
            .map(convertDexieOfferToOrderBookOrder)
          allOrders.push(...orders2)
          totalCount += response2.total || orders2.length
        }
      } else {
        // Single query for cases without both buy/sell filters
        const params = buildSearchParams(0)
        const response = await dexieDataService.searchOffers(params)

        if (response.success && Array.isArray(response.data)) {
          const orders = (response.data as DexieOffer[])
            .filter((offer: DexieOffer) => offer && offer.offered && offer.requested)
            .map(convertDexieOfferToOrderBookOrder)
          allOrders.push(...orders)
          totalCount = response.total || orders.length
        }
      }

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
        hasMore: allOrders.length >= rowsPerPage,
        total: totalCount,
      }
    },
    staleTime: 0, // Data is never considered stale - always refetch
    gcTime: 30 * 1000, // Keep in cache for only 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
  })

  // Computed properties for easy access
  const orderBookData = computed(() => orderBookQuery.data.value?.orders || [])
  const orderBookLoading = computed(() => orderBookQuery.isLoading.value)
  const orderBookError = computed(() => orderBookQuery.error.value)
  const orderBookHasMore = computed(() => orderBookQuery.data.value?.hasMore || false)
  const orderBookTotal = computed(() => orderBookQuery.data.value?.total || 0)

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
