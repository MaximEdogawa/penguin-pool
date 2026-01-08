<template>
  <div class="h-full flex flex-col">
    <!-- Header -->

    <!-- Order Book Display -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mt-1 mb-6 order-book-container flex-1 flex flex-col"
    >
      <!-- Header -->
      <div
        class="grid grid-cols-10 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300"
      >
        <div class="col-span-2 text-right">Count</div>
        <div class="col-span-3 text-right">Receive</div>
        <div class="col-span-3 text-right">Request</div>
        <div class="col-span-2 text-right">Price ({{ getPriceHeaderTicker() }})</div>
      </div>

      <!-- Sell Orders (Asks) - Top Section -->
      <div
        ref="sellScrollRef"
        class="overflow-y-scroll sell-orders-section"
        :style="{
          height: `${sellSectionHeight}%`,
        }"
      >
        <div class="px-3 py-2 flex flex-col justify-end min-h-full">
          <div v-if="loading" class="flex justify-center items-center py-4">
            <ProgressSpinner size="20" />
          </div>

          <div
            v-for="order in filteredSellOrders"
            :key="`sell-${order.id}`"
            @click="handleOrderClick(order)"
            @mousemove="event => updateTooltipPosition(event, order, 'sell')"
            @mouseleave="hideTooltip"
            class="w-full group relative mb-1 cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-red-100 dark:bg-red-900 opacity-20 group-hover:opacity-30 transition-opacity"
              :style="{ width: `${Math.min(100, (parseInt(order.id) % 8) * 15)}%`, right: 0 }"
            />

            <div class="relative grid grid-cols-10 gap-2 py-2 text-sm items-center">
              <!-- Count -->
              <div class="col-span-2 text-right text-gray-500 dark:text-gray-500 font-mono text-xs">
                {{ order.offering.length + order.requesting.length }}
              </div>

              <!-- Receive -->
              <div class="col-span-3 text-right">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.requesting"
                    :key="idx"
                    class="text-red-600 dark:text-red-400 font-mono text-xs"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ item.code || getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Request -->
              <div class="col-span-3 text-right">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.offering"
                    :key="idx"
                    class="text-xs font-mono text-gray-700 dark:text-gray-300"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ item.code || getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Price (TXCH) -->
              <div class="col-span-2 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
                {{ calculateOrderPrice(order, 'sell') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize Handle / Market Price Separator-->
      <div
        class="resize-handle bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 cursor-row-resize transition-colors flex items-center justify-center relative"
        @mousedown="startResize"
        title="Drag to resize sections"
      >
        <div class="w-full flex items-center justify-between px-3">
          <div class="flex items-center gap-1"></div>
        </div>

        <!-- Invisible larger hit area -->
        <div class="absolute inset-0 w-full h-6 -top-1 pr-2"></div>
        <div
          class="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono pr-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm"
        >
          {{ calculateAveragePrice() }}
        </div>
      </div>

      <!-- Buy Orders (Bids) -->
      <div
        ref="buyScrollRef"
        class="overflow-y-scroll buy-orders-section"
        :style="{ height: `${buySectionHeight}%` }"
      >
        <div class="px-3 py-2">
          <div
            v-for="order in filteredBuyOrders"
            :key="`buy-${order.id}`"
            @click="handleOrderClick(order)"
            @mousemove="event => updateTooltipPosition(event, order, 'buy')"
            @mouseleave="hideTooltip"
            class="w-full group relative mb-1 cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-green-100 dark:bg-green-900 opacity-20 group-hover:opacity-30 transition-opacity"
              :style="{ width: `${Math.min(100, (parseInt(order.id) % 8) * 15)}%`, right: 0 }"
            />

            <div class="relative grid grid-cols-10 gap-2 py-2 text-sm items-center">
              <!-- Count -->
              <div class="col-span-2 text-right text-gray-500 dark:text-gray-500 font-mono text-xs">
                {{ order.offering.length + order.requesting.length }}
              </div>

              <!-- Receive -->
              <div class="col-span-3 text-right">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.requesting"
                    :key="idx"
                    class="text-green-600 dark:text-green-400 font-mono text-xs"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ item.code || getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Request -->
              <div class="col-span-3 text-right">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.offering"
                    :key="idx"
                    class="text-xs font-mono text-gray-700 dark:text-gray-300"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ item.code || getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Price (TXCH) -->
              <div class="col-span-2 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
                {{ calculateOrderPrice(order, 'buy') }}
              </div>
            </div>
          </div>

          <div
            v-if="!hasMore && orderBookData.length > 0"
            class="text-right py-4 text-gray-500 dark:text-gray-400 text-xs"
          >
            No more orders
          </div>

          <div
            v-if="!loading && filteredOrders.length === 0"
            class="text-right py-8 text-gray-500 dark:text-gray-400 text-sm"
          >
            No orders found. Try adjusting your filters.
          </div>
        </div>
      </div>
    </div>

    <!-- Generic Order Tooltip -->
    <OrderTooltip
      :order="hoveredOrder"
      :visible="tooltipVisible"
      :position="tooltipPosition"
      :direction="hoveredOrder && filteredBuyOrders.includes(hoveredOrder) ? 'top' : 'bottom'"
    />
  </div>
</template>

<script setup lang="ts">
  import OrderTooltip from '@/components/OrderTooltip.vue'
  import { useTickerMapping } from '@/shared/composables/useTickerMapping'
  import ProgressSpinner from 'primevue/progressspinner'
  import { computed, onMounted, onUnmounted, ref } from 'vue'

  interface Order {
    id: string
    offering: Array<{ id: string; code: string; name: string; amount: number }>
    receiving: Array<{ id: string; code: string; name: string; amount: number }>
    maker: string
    timestamp: string
    offeringUsdValue: number
    receivingUsdValue: number
    offeringXchValue: number
    receivingXchValue: number
    pricePerUnit: number
  }

  interface Props {
    orderBookData: Order[]
    loading: boolean
    hasMore: boolean
    filters: {
      buyAsset: string[]
      sellAsset: string[]
    }
    searchValue: string
    filteredSuggestions: Array<{
      value: string
      column: string
      label: string
    }>
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'refresh-order-book': []
    'fill-from-order-book': [order: Order]
    'use-as-template': [order: Order]
  }>()

  const { getTickerSymbol } = useTickerMapping()

  // Refs for resizing
  const sellScrollRef = ref<HTMLElement>()
  const buyScrollRef = ref<HTMLElement>()
  const sellSectionHeight = ref(50)
  const buySectionHeight = ref(50)

  // Tooltip state
  const hoveredOrder = ref<Order | null>(null)
  const tooltipPosition = ref({ x: 0, y: 0 })
  const tooltipVisible = ref(false)

  // Utility functions
  const formatAmount = (amount: number): string => {
    if (amount === 0) return '0'
    if (amount < 0.000001) return amount.toExponential(2)
    if (amount < 0.01) return amount.toFixed(6)
    if (amount < 1) return amount.toFixed(4)
    if (amount < 100) return amount.toFixed(2)
    if (amount < 10000) return amount.toFixed(1)
    return amount.toFixed(0)
  }

  // Computed
  const filteredOrders = computed(() => {
    // Since we're using server-side filtering, return the data as-is
    return props.orderBookData
  })

  const filteredSellOrders = computed(() => {
    const orders = filteredOrders.value
    // Sell orders: offers where people are offering what you want to buy and requesting what you want to sell
    // Show orders that match the current asset pair, but always show sell side
    return orders
      .filter(order => {
        // If no filters, show all orders
        if (props.filters.buyAsset.length === 0 && props.filters.sellAsset.length === 0) {
          return true
        }

        // Check if this order involves the filtered assets
        const hasBuyAsset =
          props.filters.buyAsset.length === 0 ||
          props.filters.buyAsset.some(
            filterAsset =>
              order.offering.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              ) ||
              order.requesting.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              )
          )

        const hasSellAsset =
          props.filters.sellAsset.length === 0 ||
          props.filters.sellAsset.some(
            filterAsset =>
              order.offering.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              ) ||
              order.requesting.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              )
          )

        return hasBuyAsset && hasSellAsset
      })
      .filter(order => {
        // This is a sell order: offering what you want to buy, requesting what you want to sell
        const offeringBuyAsset =
          props.filters.buyAsset.length === 0 ||
          props.filters.buyAsset.some(filterAsset =>
            order.offering.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
          )

        const requestingSellAsset =
          props.filters.sellAsset.length === 0 ||
          props.filters.sellAsset.some(filterAsset =>
            order.requesting.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
          )

        return offeringBuyAsset && requestingSellAsset
      })
      .sort((a, b) => {
        // Sort sell orders by price (low to high - best asks first)
        const priceA = a.receiving[0]?.amount / a.offering[0]?.amount || 0
        const priceB = b.receiving[0]?.amount / b.offering[0]?.amount || 0
        return priceA - priceB
      })
  })

  const filteredBuyOrders = computed(() => {
    const orders = filteredOrders.value
    // Buy orders: offers where people are offering what you want to sell and requesting what you want to buy
    // Show orders that match the current asset pair, but always show buy side
    return orders
      .filter(order => {
        // If no filters, show all orders
        if (props.filters.buyAsset.length === 0 && props.filters.sellAsset.length === 0) {
          return true
        }

        // Check if this order involves the filtered assets
        const hasBuyAsset =
          props.filters.buyAsset.length === 0 ||
          props.filters.buyAsset.some(
            filterAsset =>
              order.offering.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              ) ||
              order.requesting.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              )
          )

        const hasSellAsset =
          props.filters.sellAsset.length === 0 ||
          props.filters.sellAsset.some(
            filterAsset =>
              order.offering.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              ) ||
              order.requesting.some(
                orderAsset =>
                  getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                  orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                  (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
              )
          )

        return hasBuyAsset && hasSellAsset
      })
      .filter(order => {
        // This is a buy order: offering what you want to sell, requesting what you want to buy
        const offeringSellAsset =
          props.filters.sellAsset.length === 0 ||
          props.filters.sellAsset.some(filterAsset =>
            order.offering.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
          )

        const requestingBuyAsset =
          props.filters.buyAsset.length === 0 ||
          props.filters.buyAsset.some(filterAsset =>
            order.requesting.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
          )

        return offeringSellAsset && requestingBuyAsset
      })
      .sort((a, b) => {
        // Sort buy orders by price (high to low - best bids first)
        const priceA = a.offering[0]?.amount / a.receiving[0]?.amount || 0
        const priceB = b.offering[0]?.amount / b.receiving[0]?.amount || 0
        return priceB - priceA
      })
  })

  // Methods

  const getPriceHeaderTicker = (): string => {
    // Price is expressed in terms of the sell asset (what you're giving up)
    // If we have sell asset filters, use the first one
    if (props.filters.sellAsset.length > 0) {
      return props.filters.sellAsset[0]
    }

    // If we have buy asset filters, use the first one
    if (props.filters.buyAsset.length > 0) {
      return props.filters.buyAsset[0]
    }

    // Default fallback
    return 'TXCH'
  }

  const isSingleAssetPair = (order: Order): boolean => {
    // Check if both offering and receiving have only one asset each
    return order.offering.length === 1 && order.requesting.length === 1
  }

  const calculateOrderPrice = (order: Order, _orderType: 'buy' | 'sell'): string => {
    if (isSingleAssetPair(order)) {
      const receivingAsset = order.requesting[0]
      const offeringAsset = order.offering[0]

      if (
        receivingAsset &&
        offeringAsset &&
        receivingAsset.amount > 0 &&
        offeringAsset.amount > 0
      ) {
        let price

        if (props.filters.buyAsset.length > 0 && props.filters.sellAsset.length > 0) {
          // Calculate price based on what you're buying (buyAsset) vs what you're selling (sellAsset)
          // Price should always be: sellAsset/buyAsset (how much sell asset per buy asset)

          // Determine which asset is the buy asset and which is the sell asset
          const receivingIsBuyAsset = props.filters.buyAsset.some(
            filterAsset =>
              getTickerSymbol(receivingAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
              receivingAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (receivingAsset.code &&
                receivingAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          const offeringIsBuyAsset = props.filters.buyAsset.some(
            filterAsset =>
              getTickerSymbol(offeringAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
              offeringAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (offeringAsset.code && offeringAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          if (receivingIsBuyAsset && !offeringIsBuyAsset) {
            // Receiving buy asset, offering sell asset
            // Price = sell asset amount / buy asset amount
            price = offeringAsset.amount / receivingAsset.amount
          } else if (offeringIsBuyAsset && !receivingIsBuyAsset) {
            // Offering buy asset, receiving sell asset
            // Price = sell asset amount / buy asset amount
            price = receivingAsset.amount / offeringAsset.amount
          } else {
            // Fallback to original logic
            price = offeringAsset.amount / receivingAsset.amount
          }

          // Format price with appropriate precision
          return `${formatAmount(price)}`
        } else {
          // No filters, show price as offered/received
          price = offeringAsset.amount / receivingAsset.amount
          return `${formatAmount(price)}`
        }
      }
    }

    // For multiple asset pairs, show USD total
    return `$${order.offeringUsdValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const calculateAveragePrice = (): string => {
    if (props.filters.buyAsset.length === 0 || props.filters.sellAsset.length === 0) {
      return 'N/A'
    }

    // Get best sell price (lowest ask)
    const bestSellOrder = filteredSellOrders.value[0]
    const bestSellPrice = bestSellOrder
      ? bestSellorder.requesting[0]?.amount / bestSellOrder.offering[0]?.amount
      : 0

    // Get best buy price (highest bid)
    const bestBuyOrder = filteredBuyOrders.value[0]
    const bestBuyPrice = bestBuyOrder
      ? bestBuyOrder.offering[0]?.amount / bestBuyorder.requesting[0]?.amount
      : 0

    // Calculate average if both prices exist
    if (bestSellPrice > 0 && bestBuyPrice > 0) {
      const averagePrice = (bestSellPrice + bestBuyPrice) / 2
      return `${formatAmount(averagePrice)}`
    }

    // Fallback to individual prices if only one exists
    if (bestSellPrice > 0) {
      return `${formatAmount(bestSellPrice)}`
    }
    if (bestBuyPrice > 0) {
      return `${formatAmount(bestBuyPrice)}`
    }

    return 'N/A'
  }

  const handleOrderClick = (order: Order) => {
    emit('fill-from-order-book', order)
  }

  const updateTooltipPosition = (event: MouseEvent, order: Order, _orderType: 'buy' | 'sell') => {
    hoveredOrder.value = order
    tooltipPosition.value = { x: event.clientX, y: event.clientY }
    tooltipVisible.value = true
  }

  const hideTooltip = () => {
    tooltipVisible.value = false
    hoveredOrder.value = null
  }

  const startResize = (event: MouseEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startSellHeight = sellSectionHeight.value
    const containerElement = document.querySelector('.order-book-container')
    const containerHeight = containerElement?.clientHeight || 400

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const deltaPercent = (deltaY / containerHeight) * 100
      const newSellHeight = Math.max(20, Math.min(80, startSellHeight + deltaPercent))
      const newBuyHeight = 100 - newSellHeight

      sellSectionHeight.value = newSellHeight
      buySectionHeight.value = newBuyHeight
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Intersection Observer for infinite scrolling
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (sellScrollRef.value) {
      observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && props.hasMore && !props.loading) {
            emit('load-more')
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(sellScrollRef.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })
</script>

<style scoped>
  .order-book-container {
    min-height: 400px;
  }

  .sell-orders-section {
    min-height: 20%;
    max-height: 80%;
  }

  .buy-orders-section {
    min-height: 20%;
    max-height: 80%;
  }

  .resize-handle {
    height: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    position: relative;
    z-index: 10;
  }

  .resize-handle:hover {
    background-color: #d1d5db;
    border-top-color: #9ca3af;
    border-bottom-color: #9ca3af;
  }

  .dark .resize-handle {
    border-top-color: #4b5563;
    border-bottom-color: #4b5563;
  }

  .dark .resize-handle:hover {
    background-color: #4b5563;
    border-top-color: #6b7280;
    border-bottom-color: #6b7280;
  }

  /* Prevent hover tooltips from interfering with resize handle */
  .resize-handle * {
    pointer-events: none;
  }
</style>
