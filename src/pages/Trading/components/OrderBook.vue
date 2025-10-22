<template>
  <div>
    <!-- Header -->

    <!-- Order Book Display -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mt-1 order-book-container"
    >
      <!-- Header -->
      <div
        class="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300"
      >
        <div class="col-span-3 text-right">Price (USD)</div>
        <div class="col-span-6 text-center">Assets</div>
        <div class="col-span-3 text-right">Total (USD)</div>
      </div>

      <!-- Sell Orders (Asks) -->
      <div
        ref="sellScrollRef"
        class="overflow-y-scroll sell-orders-section"
        :style="{
          height: `${sellSectionHeight}%`,
          display: 'flex',
          flexDirection: 'column-reverse',
        }"
      >
        <div class="px-3 py-2">
          <div v-if="loading" class="flex justify-center items-center py-4">
            <ProgressSpinner size="20" />
          </div>

          <div
            v-for="order in filteredSellOrders"
            :key="`sell-${order.id}`"
            @click="handleOrderClick(order)"
            class="w-full group relative mb-1 cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-red-100 dark:bg-red-900 opacity-20 group-hover:opacity-30 transition-opacity"
              :style="{ width: `${Math.min(100, (parseInt(order.id) % 8) * 15)}%`, right: 0 }"
            />

            <div class="relative grid grid-cols-12 gap-2 py-2 text-sm items-center">
              <!-- Price -->
              <div class="col-span-3 text-right">
                <div class="text-red-600 dark:text-red-400 font-mono text-xs">
                  ${{
                    calculatePriceInUsdc(order).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </div>
              </div>

              <!-- Assets -->
              <div class="col-span-6 flex flex-wrap gap-1 justify-center">
                <span
                  v-for="(item, idx) in order.offering"
                  :key="idx"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900 bg-opacity-50 dark:bg-opacity-30 text-red-700 dark:text-red-400 rounded text-xs font-mono whitespace-nowrap"
                >
                  {{ getTickerSymbol(item.id) }}
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ (item.amount || 0).toFixed(6) }}
                  </span>
                </span>
              </div>

              <!-- Total -->
              <div class="col-span-3 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
                ${{
                  order.offeringUsdValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                }}
              </div>
            </div>

            <!-- Tooltip -->
            <div
              class="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 shadow-lg z-20 hidden group-hover:block min-w-[300px]"
            >
              <OrderTooltip :order="order" :usd-prices="usdPrices" />
            </div>
          </div>
        </div>
      </div>

      <!-- Market Price Separator -->
      <div
        class="px-3 py-3 bg-gray-50 dark:bg-gray-700 border-y border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">Market (USDC)</div>
          <div class="text-lg font-bold text-gray-900 dark:text-white font-mono">
            ${{
              calculateMarketPrice().toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </div>
          <div class="text-xs text-green-600 dark:text-green-400">↑ 2.3%</div>
        </div>
      </div>

      <!-- Resize Handle -->
      <div
        class="resize-handle bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 cursor-row-resize transition-colors"
        @mousedown="startResize"
      >
        <div class="h-1 w-full"></div>
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
            class="w-full group relative mb-1 cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-green-100 dark:bg-green-900 opacity-20 group-hover:opacity-30 transition-opacity"
              :style="{ width: `${Math.min(100, (parseInt(order.id) % 8) * 15)}%`, right: 0 }"
            />

            <div class="relative grid grid-cols-12 gap-2 py-2 text-sm items-center">
              <!-- Price -->
              <div class="col-span-3 text-right">
                <div class="text-green-600 dark:text-green-400 font-mono text-xs">
                  ${{
                    calculatePriceInUsdc(order).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </div>
              </div>

              <!-- Assets -->
              <div class="col-span-6 flex flex-wrap gap-1 justify-center">
                <span
                  v-for="(item, idx) in order.offering"
                  :key="idx"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 bg-opacity-50 dark:bg-opacity-30 text-green-700 dark:text-green-400 rounded text-xs font-mono whitespace-nowrap"
                >
                  {{ getTickerSymbol(item.id) }}
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ (item.amount || 0).toFixed(6) }}
                  </span>
                </span>
              </div>

              <!-- Total -->
              <div class="col-span-3 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
                ${{
                  order.offeringUsdValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                }}
              </div>
            </div>

            <!-- Tooltip -->
            <div
              class="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 shadow-lg z-20 hidden group-hover:block min-w-[300px]"
            >
              <OrderTooltip :order="order" :usd-prices="usdPrices" />
            </div>
          </div>

          <div
            v-if="!hasMore && orderBookData.length > 0"
            class="text-center py-4 text-gray-500 dark:text-gray-400 text-xs"
          >
            No more orders
          </div>

          <div
            v-if="!loading && filteredOrders.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm"
          >
            No orders found. Try adjusting your filters.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
    pricePerUnit: number
    status: number
    date_found: string
    date_completed?: string | null
    date_pending?: string | null
    date_expiry?: string | null
    known_taker?: unknown | null
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
    'load-more': []
    'update-filters': [filters: Record<string, string[]>]
    'update-search': [value: string]
    'add-filter': [column: string, value: string]
    'remove-filter': [column: string, value: string]
    'clear-filters': [column: string]
    'fill-from-order-book': [order: Order]
    'use-as-template': [order: Order]
  }>()

  // Services
  const { getTickerSymbol } = useTickerMapping()

  // Local state
  const sellScrollRef = ref<HTMLElement>()
  const buyScrollRef = ref<HTMLElement>()

  // Resize functionality
  const isResizing = ref(false)
  const sellSectionHeight = ref(50) // percentage
  const buySectionHeight = ref(50) // percentage

  const startResize = (event: MouseEvent) => {
    isResizing.value = true
    event.preventDefault()

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.value) return

      const container = sellScrollRef.value?.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const relativeY = e.clientY - containerRect.top
      const percentage = (relativeY / containerRect.height) * 100

      // Constrain between 20% and 80%
      const constrainedPercentage = Math.max(20, Math.min(80, percentage))

      sellSectionHeight.value = constrainedPercentage
      buySectionHeight.value = 100 - constrainedPercentage
    }

    const handleMouseUp = () => {
      isResizing.value = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Mock USD prices
  const usdPrices: Record<string, number> = {
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

  // Computed
  const filteredOrders = computed(() => {
    return props.orderBookData.filter(order => {
      // For buy assets: order must be receiving ALL selected buy assets (AND logic)
      const buyMatch =
        props.filters.buyAsset.length === 0 ||
        props.filters.buyAsset.every(filterAsset =>
          order.receiving.some(orderAsset => getTickerSymbol(orderAsset.id) === filterAsset)
        )

      // For sell assets: order must be offering ALL selected sell assets (AND logic)
      const sellMatch =
        props.filters.sellAsset.length === 0 ||
        props.filters.sellAsset.every(filterAsset =>
          order.offering.some(orderAsset => getTickerSymbol(orderAsset.id) === filterAsset)
        )

      return buyMatch && sellMatch
    })
  })

  const filteredSellOrders = computed(() => {
    const orders = filteredOrders.value
    return orders
      .sort((a, b) => b.pricePerUnit - a.pricePerUnit)
      .slice(0, Math.ceil(orders.length / 2))
  })

  const filteredBuyOrders = computed(() => {
    const orders = filteredOrders.value
    return orders
      .sort((a, b) => b.pricePerUnit - a.pricePerUnit)
      .slice(Math.ceil(orders.length / 2))
  })

  // Methods
  const calculatePriceInUsdc = (order: Order) => {
    const firstAsset = order.offering[0]
    if (!firstAsset) return 0

    if (firstAsset.code === 'USDC') {
      return 1
    } else {
      const usdcReceiving = order.receiving.find(a => a.code === 'USDC')
      if (usdcReceiving) {
        return usdcReceiving.amount / firstAsset.amount
      } else {
        return usdPrices[firstAsset.code] || 1
      }
    }
  }

  const calculateMarketPrice = () => {
    if (filteredOrders.value.length === 0) return 1

    let totalVolume = 0
    let weightedPriceSum = 0

    filteredOrders.value.forEach(order => {
      const firstAsset = order.offering[0]
      if (firstAsset && firstAsset.code !== 'USDC') {
        const usdcItem =
          order.receiving.find(a => a.code === 'USDC') ||
          order.offering.find(a => a.code === 'USDC')
        if (usdcItem) {
          const volume = firstAsset.amount
          const price = usdcItem.amount / volume
          totalVolume += volume
          weightedPriceSum += price * volume
        }
      }
    })

    return totalVolume > 0 ? weightedPriceSum / totalVolume : 1
  }

  const handleOrderClick = (order: Order) => {
    // This would be determined by the parent component's activeTab
    emit('fill-from-order-book', order)
  }

  // Scroll handling for infinite loading
  const handleSellScroll = () => {
    if (!sellScrollRef.value) return
    const { scrollTop } = sellScrollRef.value

    if (scrollTop === 0 && props.hasMore && !props.loading) {
      emit('load-more')
    }
  }

  const handleBuyScroll = () => {
    if (!buyScrollRef.value) return
    const { scrollTop, scrollHeight, clientHeight } = buyScrollRef.value

    if (scrollTop + clientHeight >= scrollHeight - 10 && props.hasMore && !props.loading) {
      emit('load-more')
    }
  }

  // Lifecycle
  onMounted(() => {
    const sellElement = sellScrollRef.value
    const buyElement = buyScrollRef.value

    if (sellElement) {
      sellElement.addEventListener('scroll', handleSellScroll)
    }
    if (buyElement) {
      buyElement.addEventListener('scroll', handleBuyScroll)
    }
  })

  onUnmounted(() => {
    const sellElement = sellScrollRef.value
    const buyElement = buyScrollRef.value

    if (sellElement) {
      sellElement.removeEventListener('scroll', handleSellScroll)
    }
    if (buyElement) {
      buyElement.removeEventListener('scroll', handleBuyScroll)
    }
  })
</script>

<style scoped>
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }

  /* Dark mode for input fields */
  :deep(.p-inputtext) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
  }

  :deep(.p-inputtext:focus) {
    @apply border-primary-500 dark:border-primary-400 ring-primary-500 dark:ring-primary-400;
  }

  /* Dark mode for loading spinner */
  :deep(.p-progress-spinner-circle) {
    @apply stroke-primary-500 dark:stroke-primary-400;
  }

  /* Order Book Container - Responsive and Resizable */
  .order-book-container {
    min-height: 60vh;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  /* Responsive heights for order sections */
  .sell-orders-section {
    min-height: 200px;
    max-height: 400px;
  }

  .buy-orders-section {
    min-height: 200px;
    max-height: 400px;
  }

  /* Resize handle styling */
  .resize-handle {
    flex-shrink: 0;
    user-select: none;
  }

  .resize-handle:hover {
    background-color: rgb(156 163 175) !important; /* gray-400 */
  }

  .dark .resize-handle:hover {
    background-color: rgb(107 114 128) !important; /* gray-500 */
  }

  /* Responsive breakpoints */
  @media (min-width: 640px) {
    .order-book-container {
      min-height: 65vh;
      max-height: 85vh;
    }

    .sell-orders-section,
    .buy-orders-section {
      min-height: 250px;
      max-height: 500px;
    }
  }

  @media (min-width: 1024px) {
    .order-book-container {
      min-height: 70vh;
      max-height: 90vh;
    }

    .sell-orders-section,
    .buy-orders-section {
      min-height: 300px;
      max-height: 600px;
    }
  }

  @media (min-width: 1280px) {
    .order-book-container {
      min-height: 75vh;
      max-height: 95vh;
    }

    .sell-orders-section,
    .buy-orders-section {
      min-height: 350px;
      max-height: 700px;
    }
  }

  /* Dark mode for scrollbars */
  .overflow-y-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-scroll::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-600 rounded;
  }

  .overflow-y-scroll::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-500 rounded;
  }

  .overflow-y-scroll::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-400;
  }
</style>
