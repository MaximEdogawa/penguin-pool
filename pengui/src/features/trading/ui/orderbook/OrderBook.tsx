'use client'

import { useThemeClasses } from '@/shared/hooks'
import { useCatTokens } from '@/shared/hooks/useTickers'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatPriceForDisplay } from '../../lib/formatAmount'
import type { OrderBookOrder } from '../../lib/orderBookTypes'
import { useOrderBook } from '../../model/useOrderBook'
import OrderRow from './OrderRow'
import OrderTooltip from './OrderTooltip'

interface OrderBookProps {
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
  onOrderClick: (order: OrderBookOrder) => void
}

export default function OrderBook({ filters, onOrderClick }: OrderBookProps) {
  const { t } = useThemeClasses()
  const { getCatTokenInfo } = useCatTokens()
  // Pass filters directly - useOrderBook will react to changes via query key
  const { orderBookData, orderBookLoading, orderBookHasMore, orderBookError } =
    useOrderBook(filters)

  // Helper function to get ticker symbol for an asset
  const getTickerSymbol = useCallback(
    (assetId: string, code?: string): string => {
      if (code) return code
      if (!assetId) return getNativeTokenTicker()
      const tickerInfo = getCatTokenInfo(assetId)
      return tickerInfo?.ticker || assetId.slice(0, 8)
    },
    [getCatTokenInfo]
  )

  // Helper function to check if an asset matches a filter asset
  const assetMatchesFilter = useCallback(
    (asset: { id: string; code?: string }, filterAssets: string[]): boolean => {
      if (!filterAssets || filterAssets.length === 0) return false
      return filterAssets.some((filterAsset) => {
        const assetTicker = getTickerSymbol(asset.id, asset.code)
        return (
          assetTicker.toLowerCase() === filterAsset.toLowerCase() ||
          asset.id.toLowerCase() === filterAsset.toLowerCase() ||
          (asset.code && asset.code.toLowerCase() === filterAsset.toLowerCase())
        )
      })
    },
    [getTickerSymbol]
  )

  // Resize state
  const [sellSectionHeight, setSellSectionHeight] = useState(50)
  const [buySectionHeight, setBuySectionHeight] = useState(50)

  // Tooltip state
  const [hoveredOrder, setHoveredOrder] = useState<OrderBookOrder | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipVisible, setTooltipVisible] = useState(false)

  // Refs for scrolling
  const sellScrollRef = useRef<HTMLDivElement>(null)
  const buyScrollRef = useRef<HTMLDivElement>(null)

  const getPriceHeaderTicker = useCallback((): string => {
    // Price is expressed in terms of the buy asset (buyAsset/sellAsset)
    // If we have buy asset filters, use the first one
    if (filters?.buyAsset && filters.buyAsset.length > 0) {
      return filters.buyAsset[0]
    }

    // If we have sell asset filters, use the first one as fallback
    if (filters?.sellAsset && filters.sellAsset.length > 0) {
      return filters.sellAsset[0]
    }

    // Default fallback
    return getNativeTokenTicker()
  }, [filters])

  // Helper function to calculate price for sorting: buyAsset/sellAsset
  // This ensures consistent price calculation for both buy and sell orders
  const calculateOrderPriceForSorting = useCallback(
    (order: OrderBookOrder): number => {
      if (
        !filters?.buyAsset ||
        filters.buyAsset.length === 0 ||
        !filters?.sellAsset ||
        filters.sellAsset.length === 0
      ) {
        return order.pricePerUnit
      }

      // For single asset pairs, calculate price as buyAsset/sellAsset
      if (order.offering.length === 1 && order.requesting.length === 1) {
        const requestingAsset = order.requesting[0]
        const offeringAsset = order.offering[0]

        if (
          requestingAsset &&
          offeringAsset &&
          requestingAsset.amount > 0 &&
          offeringAsset.amount > 0
        ) {
          // Determine which asset is the buy asset and which is the sell asset
          const requestingIsBuyAsset = filters.buyAsset.some(
            (filterAsset) =>
              getTickerSymbol(requestingAsset.id, requestingAsset.code).toLowerCase() ===
                filterAsset.toLowerCase() ||
              requestingAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (requestingAsset.code &&
                requestingAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          const offeringIsBuyAsset = filters.buyAsset.some(
            (filterAsset) =>
              getTickerSymbol(offeringAsset.id, offeringAsset.code).toLowerCase() ===
                filterAsset.toLowerCase() ||
              offeringAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (offeringAsset.code && offeringAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          // Calculate price from buy side: buyAsset amount / sellAsset amount
          if (requestingIsBuyAsset && !offeringIsBuyAsset) {
            // requesting buy asset, offering sell asset
            return requestingAsset.amount / offeringAsset.amount
          } else if (offeringIsBuyAsset && !requestingIsBuyAsset) {
            // Offering buy asset, requesting sell asset
            return offeringAsset.amount / requestingAsset.amount
          }
        }
      }

      // Fallback to pricePerUnit for multi-asset pairs or when calculation fails
      return order.pricePerUnit
    },
    [filters, getTickerSymbol]
  )

  // Helper function to filter and sort orders
  const filterAndSortOrders = useCallback(
    (
      orderData: OrderBookOrder[],
      filterCondition: (order: OrderBookOrder) => boolean,
      sortAscending: boolean
    ): OrderBookOrder[] => {
      if (
        !filters?.buyAsset ||
        filters.buyAsset.length === 0 ||
        !filters?.sellAsset ||
        filters.sellAsset.length === 0
      ) {
        return []
      }

      return orderData.filter(filterCondition).sort((a, b) => {
        const priceA = calculateOrderPriceForSorting(a)
        const priceB = calculateOrderPriceForSorting(b)
        return sortAscending ? priceA - priceB : priceB - priceA
      })
    },
    [filters, calculateOrderPriceForSorting]
  )

  const filteredBuyOrders = useMemo(() => {
    return filterAndSortOrders(
      orderBookData,
      (order) => {
        const isOfferingBuySideAsset = order.offering.some((asset) =>
          assetMatchesFilter(asset, filters?.buyAsset || [])
        )

        const isRequestingBuySideAsset = order.requesting.some((asset) =>
          assetMatchesFilter(asset, filters?.sellAsset || [])
        )

        return isOfferingBuySideAsset && isRequestingBuySideAsset
      },
      false // Sort descending (high to low)
    )
  }, [orderBookData, filters, assetMatchesFilter, filterAndSortOrders])

  const filteredSellOrders = useMemo(() => {
    return filterAndSortOrders(
      orderBookData,
      (order) => {
        const isOfferingSellSideAsset = order.offering.some((asset) =>
          assetMatchesFilter(asset, filters?.sellAsset || [])
        )

        const isRequestingSellSideAsset = order.requesting.some((asset) =>
          assetMatchesFilter(asset, filters?.buyAsset || [])
        )

        return isRequestingSellSideAsset && isOfferingSellSideAsset
      },
      false // Sort descending (high to low)
    )
  }, [orderBookData, filters, assetMatchesFilter, filterAndSortOrders])

  const calculateAveragePrice = useCallback((): string => {
    if (!filters || (!filters.buyAsset && !filters.sellAsset)) {
      return 'N/A'
    }

    // Get best sell price (lowest ask) - use same calculation logic as OrderRow
    const bestSellOrder = filteredSellOrders[filteredSellOrders.length - 1]
    const bestSellPrice = bestSellOrder ? calculateOrderPriceForSorting(bestSellOrder) : 0

    // Get best buy price (highest bid) - use same calculation logic as OrderRow
    const bestBuyOrder = filteredBuyOrders[0]
    const bestBuyPrice = bestBuyOrder ? calculateOrderPriceForSorting(bestBuyOrder) : 0

    // Calculate average (middle price) if both prices exist
    if (bestSellPrice > 0 && bestBuyPrice > 0) {
      const averagePrice = (bestSellPrice + bestBuyPrice) / 2
      return formatPriceForDisplay(averagePrice)
    }

    // Fallback to individual prices if only one exists
    if (bestSellPrice > 0) {
      const formatAmount = (amount: number): string => {
        if (amount < 0.01) return amount.toFixed(6)
        if (amount < 1) return amount.toFixed(4)
        if (amount < 100) return amount.toFixed(2)
        return amount.toFixed(1)
      }
      return formatAmount(bestSellPrice)
    }
    if (bestBuyPrice > 0) {
      const formatAmount = (amount: number): string => {
        if (amount < 0.01) return amount.toFixed(6)
        if (amount < 1) return amount.toFixed(4)
        if (amount < 100) return amount.toFixed(2)
        return amount.toFixed(1)
      }
      return formatAmount(bestBuyPrice)
    }

    return 'N/A'
  }, [filters, filteredSellOrders, filteredBuyOrders])

  const handleOrderClick = useCallback(
    (order: OrderBookOrder) => {
      onOrderClick(order)
    },
    [onOrderClick]
  )

  const updateTooltipPosition = useCallback(
    (event: React.MouseEvent, order: OrderBookOrder, _orderType: 'buy' | 'sell') => {
      setHoveredOrder(order)
      setTooltipPosition({ x: event.clientX, y: event.clientY })
      setTooltipVisible(true)
    },
    []
  )

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false)
    setHoveredOrder(null)
  }, [])

  const startResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const startY = event.clientY
      const startSellHeight = sellSectionHeight
      const containerElement = document.querySelector('.order-book-container')
      const containerHeight = containerElement?.clientHeight || 400

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY
        const deltaPercent = (deltaY / containerHeight) * 100
        const newSellHeight = Math.max(20, Math.min(80, startSellHeight + deltaPercent))
        const newBuyHeight = 100 - newSellHeight

        setSellSectionHeight(newSellHeight)
        setBuySectionHeight(newBuyHeight)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [sellSectionHeight]
  )

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!buyScrollRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && orderBookHasMore && !orderBookLoading) {
          // Load more would be handled by parent component
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(buyScrollRef.current)

    return () => {
      observer.disconnect()
    }
  }, [orderBookHasMore, orderBookLoading])

  const allFilteredOrders = useMemo(() => {
    return [...filteredSellOrders, ...filteredBuyOrders]
  }, [filteredSellOrders, filteredBuyOrders])

  return (
    <div className="h-full flex flex-col">
      {/* Order Book Display */}
      <div
        className={`${t.card} rounded-lg overflow-hidden border ${t.border} mt-1 mb-6 order-book-container flex-1 flex flex-col`}
      >
        {/* Header */}
        <div
          className={`grid grid-cols-12 gap-2 px-3 py-2 ${t.card} border-b ${t.border} text-xs font-medium ${t.textSecondary}`}
        >
          <div className="col-span-1 text-left">Count</div>
          <div className="col-span-3 text-right">Buy</div>
          <div className="col-span-3 text-right">Sell</div>
          <div className="col-span-5 text-right">Price ({getPriceHeaderTicker()})</div>
        </div>

        {/* Sell Orders*/}
        <div
          ref={sellScrollRef}
          className="overflow-y-scroll sell-orders-section"
          style={{
            height: `${sellSectionHeight}%`,
          }}
        >
          <div className="px-3 py-2 flex flex-col justify-end min-h-full">
            {orderBookLoading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className={`ml-2 text-xs ${t.textSecondary}`}>Loading orders...</span>
              </div>
            )}

            {orderBookError && (
              <div className={`text-center py-4 text-xs ${t.textSecondary}`}>
                Error loading orders. Please try again.
              </div>
            )}

            {filteredSellOrders.map((order) => (
              <OrderRow
                key={`sell-${order.id}`}
                order={order}
                orderType="sell"
                filters={filters}
                onClick={handleOrderClick}
                onHover={updateTooltipPosition}
                onMouseLeave={hideTooltip}
              />
            ))}
          </div>
        </div>

        {/* Resize Handle / Market Price Separator */}
        <div
          className={`resize-handle ${t.card} hover:bg-gray-300 dark:hover:bg-gray-500 cursor-row-resize transition-colors flex items-center justify-center relative`}
          onMouseDown={startResize}
          title="Drag to resize sections"
        >
          <div className="w-full flex items-center justify-between px-3">
            <div className="flex items-center gap-1"></div>
          </div>

          {/* Invisible larger hit area */}
          <div className="absolute inset-0 w-full h-6 -top-1 pr-2"></div>
          <div className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono pr-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
            {calculateAveragePrice()}
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div
          ref={buyScrollRef}
          className="overflow-y-scroll buy-orders-section"
          style={{ height: `${buySectionHeight}%` }}
        >
          <div className="px-3 py-2">
            {filteredBuyOrders.map((order) => (
              <OrderRow
                key={`buy-${order.id}`}
                order={order}
                orderType="buy"
                filters={filters}
                onClick={handleOrderClick}
                onHover={updateTooltipPosition}
                onMouseLeave={hideTooltip}
              />
            ))}

            {!orderBookHasMore && orderBookData.length > 0 && (
              <div className={`text-right py-4 ${t.textSecondary} text-xs`}>No more orders</div>
            )}

            {!orderBookLoading && !orderBookError && allFilteredOrders.length === 0 && (
              <div className={`text-center py-8 ${t.textSecondary} text-sm`}>
                {filters &&
                ((filters.buyAsset && filters.buyAsset.length > 0) ||
                  (filters.sellAsset && filters.sellAsset.length > 0))
                  ? 'No orders found matching your filters. Try adjusting your filters.'
                  : 'No orders found. Add filters to see orders.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Tooltip */}
      <OrderTooltip
        order={hoveredOrder}
        visible={tooltipVisible}
        position={tooltipPosition}
        direction={hoveredOrder && filteredBuyOrders.includes(hoveredOrder) ? 'top' : 'bottom'}
      />
    </div>
  )
}
