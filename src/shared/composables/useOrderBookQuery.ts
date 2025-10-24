import type { DexieOffer } from '@/shared/services/DexieDataService'
import { useDexieDataService } from '@/shared/services/DexieDataService'
import { logger } from '@/shared/services/logger'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

export interface OrderBookFilters {
  buyAsset?: string[]
  sellAsset?: string[]
}

export interface DexieAssetItem {
  id: string
  code: string
  name: string
  amount: number
}

export interface OrderBookOrder {
  id: string
  offering: DexieAssetItem[]
  receiving: DexieAssetItem[]
  maker: string
  timestamp: string
  offeringUsdValue: number
  receivingUsdValue: number
  offeringXchValue: number
  receivingXchValue: number
  pricePerUnit: number
  status: number
  date_found: string
  date_completed?: string | null
  date_pending?: string | null
  date_expiry?: string | null
  known_taker?: unknown | null
  offerString?: string
  creatorAddress?: string
}

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
    const receivingUsdValue = safeRequested.reduce(
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
    const receivingXchValue = safeRequested.reduce((sum: number, item: DexieAssetItem) => {
      if (item.code === 'TXCH') {
        return sum + item.amount
      } else {
        return sum + (item.amount * (usdPrices[item.code] || 0)) / usdPrices.TXCH
      }
    }, 0)

    return {
      id: dexieOffer.id,
      offering: safeOffered,
      receiving: safeRequested,
      maker: `0x${dexieOffer.id.substring(0, 8)}...${dexieOffer.id.substring(-8)}`,
      timestamp: new Date(dexieOffer.date_found).toLocaleTimeString(),
      offeringUsdValue,
      receivingUsdValue,
      offeringXchValue,
      receivingXchValue,
      pricePerUnit: receivingUsdValue / offeringUsdValue,
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
  const buildSearchParams = (page: number) => {
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

    // If we have filters, use server-side filtering
    if (filters?.value) {
      const { buyAsset, sellAsset } = filters.value

      // For buy/sell filtering, we need to determine which asset is being bought/sold
      // If user wants to buy TXCH, they're looking for offers where TXCH is requested
      // If user wants to sell TXCH, they're looking for offers where TXCH is offered

      if (buyAsset && buyAsset.length > 0) {
        // User wants to buy these assets - they should be in the requested field
        params.requested = buyAsset[0] // Use the actual ticker from filters
      }

      if (sellAsset && sellAsset.length > 0) {
        // User wants to sell these assets - they should be in the offered field
        params.offered = sellAsset[0] // Use the actual ticker from filters
      }
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
      const params = buildSearchParams(0) // Start with page 0
      const response = await dexieDataService.searchOffers(params)

      if (response.success && Array.isArray(response.data)) {
        const orders = (response.data as DexieOffer[])
          .filter((offer: DexieOffer) => offer && offer.offered && offer.requested) // Filter out invalid offers
          .map(convertDexieOfferToOrderBookOrder)
          .sort((a, b) => {
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
          orders,
          hasMore: orders.length >= rowsPerPage,
          total: response.total || orders.length,
        }
      } else {
        logger.error('No data or unsuccessful response:', response)
        return {
          orders: [],
          hasMore: false,
          total: 0,
        }
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
