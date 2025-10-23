import type { DexieOffer } from '@/shared/services/DexieDataService'
import { useDexieDataService } from '@/shared/services/DexieDataService'
import { logger } from '@/shared/services/logger'
import { onUnmounted, ref } from 'vue'

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

export interface ToastOptions {
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail: string
  life: number
  closable: boolean
  group: string
}

export function useOrderBookData(toastService?: { add: (options: ToastOptions) => void }) {
  const dexieDataService = useDexieDataService()

  // State
  const orderBookData = ref<OrderBookOrder[]>([])
  const orderBookLoading = ref(false)
  const orderBookHasMore = ref(true)
  const orderBookPage = ref(0)
  const refreshInterval = ref<NodeJS.Timeout | null>(null)

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

  // Methods
  const refreshOrderBookData = async () => {
    orderBookLoading.value = true
    orderBookPage.value = 0
    orderBookHasMore.value = true
    orderBookData.value = []

    try {
      const response = await dexieDataService.searchOffers({
        page: orderBookPage.value,
        page_size: rowsPerPage,
        status: 0, // Only open offers
      })

      if (response.success && Array.isArray(response.data)) {
        const newOrders = (response.data as DexieOffer[])
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
        orderBookData.value = newOrders
        orderBookPage.value++

        // Check if we have more data
        if (newOrders.length < rowsPerPage) {
          orderBookHasMore.value = false
        }
      } else {
        logger.error('No data or unsuccessful response:', response)
      }
    } catch (error) {
      logger.error('Error refreshing order book data:', error)
      void error // Suppress unused variable warning
    } finally {
      orderBookLoading.value = false
    }
  }

  const loadOrderBookData = async () => {
    if (orderBookLoading.value || !orderBookHasMore.value) return

    orderBookLoading.value = true
    try {
      const response = await dexieDataService.searchOffers({
        page: orderBookPage.value,
        page_size: rowsPerPage,
        status: 0, // Only open offers
      })

      if (response.success && Array.isArray(response.data)) {
        const newOrders = (response.data as DexieOffer[])
          .filter((offer: DexieOffer) => offer && offer.offered && offer.requested) // Filter out invalid offers
          .map(convertDexieOfferToOrderBookOrder)
        orderBookData.value.push(...newOrders)

        // Sort the entire order book after adding new orders
        orderBookData.value.sort((a, b) => {
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

        orderBookPage.value++

        // Check if we have more data
        if (newOrders.length < rowsPerPage) {
          orderBookHasMore.value = false
        }
      } else {
        logger.error('No data or unsuccessful response:', response)
      }
    } catch (error) {
      logger.error('Error loading order book data:', error)
      // Handle error appropriately - could emit an event or show a toast notification
      void error // Suppress unused variable warning
    } finally {
      orderBookLoading.value = false
    }
  }

  // Interval management
  const startRefreshInterval = () => {
    if (refreshInterval.value) return // Already started

    refreshInterval.value = setInterval(() => {
      refreshOrderBookData()

      // Show subtle toast for automatic refresh (only if toast service is provided)
      if (toastService && orderBookData.value.length > 0) {
        toastService.add({
          severity: 'info',
          summary: '🔄 Market Data Updated',
          detail: 'Order book refreshed with latest market data',
          life: 4000,
          closable: true,
          group: 'auto-refresh',
        })
      }
    }, 30000) // 30 seconds
  }

  const stopRefreshInterval = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopRefreshInterval()
  })

  return {
    // State
    orderBookData,
    orderBookLoading,
    orderBookHasMore,

    // Methods
    loadOrderBookData,
    refreshOrderBookData,
    startRefreshInterval,
    stopRefreshInterval,
  }
}
