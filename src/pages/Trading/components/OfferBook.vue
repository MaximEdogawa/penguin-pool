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
        <div class="col-span-4 text-right">Price (Receiving)</div>
        <div class="col-span-4 text-center">Amount (Requested)</div>
        <div class="col-span-4 text-right">Total (USD)</div>
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
            class="w-full group relative mb-1 cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-red-100 dark:bg-red-900 opacity-20 group-hover:opacity-30 transition-opacity"
              :style="{ width: `${Math.min(100, (parseInt(order.id) % 8) * 15)}%`, right: 0 }"
            />

            <div class="relative grid grid-cols-12 gap-2 py-2 text-sm items-center">
              <!-- Price (What the other side is offering) -->
              <div class="col-span-4 text-right">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.receiving"
                    :key="idx"
                    class="text-red-600 dark:text-red-400 font-mono text-xs"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Amount -->
              <div class="col-span-4 text-center">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.offering"
                    :key="idx"
                    class="text-xs font-mono text-gray-700 dark:text-gray-300"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Total -->
              <div class="col-span-4 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
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
              <div class="space-y-2">
                <div class="text-sm font-semibold text-gray-900 dark:text-white">Order Details</div>

                <!-- Order ID -->
                <div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                  <span class="text-xs font-mono text-gray-900 dark:text-white ml-1"
                    >{{ order.id.slice(0, 16) }}...</span
                  >
                </div>

                <!-- Offering Assets -->
                <div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Offering:</span>
                  <div class="mt-1 space-y-1">
                    <div
                      v-for="(asset, idx) in order.offering"
                      :key="idx"
                      class="flex items-center justify-between text-xs"
                    >
                      <span class="text-gray-900 dark:text-white">{{
                        getTickerSymbol(asset.id)
                      }}</span>
                      <div class="flex flex-col items-end">
                        <span class="font-mono text-gray-700 dark:text-gray-300">{{
                          formatAmount(asset.amount || 0)
                        }}</span>
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                          Full: {{ (asset.amount || 0).toFixed(8) }}
                        </span>
                        <span class="font-mono text-xs text-green-600 dark:text-green-400">
                          ${{ calculateAssetUsdValue(asset).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Receiving Assets -->
                <div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Receiving:</span>
                  <div class="mt-1 space-y-1">
                    <div
                      v-for="(asset, idx) in order.receiving"
                      :key="idx"
                      class="flex items-center justify-between text-xs"
                    >
                      <span class="text-gray-900 dark:text-white">{{
                        getTickerSymbol(asset.id)
                      }}</span>
                      <div class="flex flex-col items-end">
                        <span class="font-mono text-gray-700 dark:text-gray-300">{{
                          formatAmount(asset.amount || 0)
                        }}</span>
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                          Full: {{ (asset.amount || 0).toFixed(8) }}
                        </span>
                        <span class="font-mono text-xs text-green-600 dark:text-green-400">
                          ${{ calculateAssetUsdValue(asset).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Maker: {{ order.maker.slice(0, 8) }}...
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ new Date(order.timestamp).toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Price Separator -->
      <div
        class="px-3 py-3 bg-gray-50 dark:bg-gray-700 border-y border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">Market (TXCH)</div>
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
              <!-- Price (What the other side is offering) -->
              <div class="col-span-4 text-right">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.receiving"
                    :key="idx"
                    class="text-green-600 dark:text-green-400 font-mono text-xs"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Amount -->
              <div class="col-span-4 text-center">
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(item, idx) in order.offering"
                    :key="idx"
                    class="text-xs font-mono text-gray-700 dark:text-gray-300"
                  >
                    {{ formatAmount(item.amount || 0) }} {{ getTickerSymbol(item.id) }}
                  </div>
                </div>
              </div>

              <!-- Total -->
              <div class="col-span-4 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
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
              <div class="space-y-2">
                <div class="text-sm font-semibold text-gray-900 dark:text-white">Order Details</div>

                <!-- Order ID -->
                <div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                  <span class="text-xs font-mono text-gray-900 dark:text-white ml-1"
                    >{{ order.id.slice(0, 16) }}...</span
                  >
                </div>

                <!-- Offering Assets -->
                <div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Offering:</span>
                  <div class="mt-1 space-y-1">
                    <div
                      v-for="(asset, idx) in order.offering"
                      :key="idx"
                      class="flex items-center justify-between text-xs"
                    >
                      <span class="text-gray-900 dark:text-white">{{
                        getTickerSymbol(asset.id)
                      }}</span>
                      <div class="flex flex-col items-end">
                        <span class="font-mono text-gray-700 dark:text-gray-300">{{
                          formatAmount(asset.amount || 0)
                        }}</span>
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                          Full: {{ (asset.amount || 0).toFixed(8) }}
                        </span>
                        <span class="font-mono text-xs text-green-600 dark:text-green-400">
                          ${{ calculateAssetUsdValue(asset).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Receiving Assets -->
                <div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">Receiving:</span>
                  <div class="mt-1 space-y-1">
                    <div
                      v-for="(asset, idx) in order.receiving"
                      :key="idx"
                      class="flex items-center justify-between text-xs"
                    >
                      <span class="text-gray-900 dark:text-white">{{
                        getTickerSymbol(asset.id)
                      }}</span>
                      <div class="flex flex-col items-end">
                        <span class="font-mono text-gray-700 dark:text-gray-300">{{
                          formatAmount(asset.amount || 0)
                        }}</span>
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                          Full: {{ (asset.amount || 0).toFixed(8) }}
                        </span>
                        <span class="font-mono text-xs text-green-600 dark:text-green-400">
                          ${{ calculateAssetUsdValue(asset).toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Maker: {{ order.maker.slice(0, 8) }}...
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ new Date(order.timestamp).toLocaleString() }}
                </div>
              </div>
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
    'load-more': []
    'fill-from-order-book': [order: Order]
    'use-as-template': [order: Order]
  }>()

  const { getTickerSymbol } = useTickerMapping()

  // Refs for resizing
  const sellScrollRef = ref<HTMLElement>()
  const buyScrollRef = ref<HTMLElement>()
  const sellSectionHeight = ref(50)
  const buySectionHeight = ref(50)

  // Mock USD prices
  const usdPrices: Record<string, number> = {
    TXCH: 30,
    BTC: 45000,
    ETH: 3000,
    USDT: 1,
    USDC: 1,
    SOL: 120,
    MATIC: 0.85,
    AVAX: 35,
    LINK: 15,
  }

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
    return props.orderBookData.filter(order => {
      // Show offers that involve BOTH the buy and sell assets (AND logic)
      // This means the offer must contain both types of assets

      // Check if the order involves any of the buy assets
      const buyAssetMatch =
        props.filters.buyAsset.length === 0 ||
        props.filters.buyAsset.some(
          filterAsset =>
            order.offering.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            ) ||
            order.receiving.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
        )

      // Check if the order involves any of the sell assets
      const sellAssetMatch =
        props.filters.sellAsset.length === 0 ||
        props.filters.sellAsset.some(
          filterAsset =>
            order.offering.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            ) ||
            order.receiving.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
        )

      // Show orders that involve BOTH types of assets (AND logic)
      return buyAssetMatch && sellAssetMatch
    })
  })

  const filteredSellOrders = computed(() => {
    const orders = filteredOrders.value
    // Sell orders: offers where you can sell the sell-assets to get buy-assets
    // These are offers where maker is offering sell-assets and receiving buy-assets
    return orders
      .filter(order => {
        // Check if maker is offering sell-assets (what you want to sell)
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

        // Check if maker is receiving buy-assets (what you want to buy)
        const receivingBuyAsset =
          props.filters.buyAsset.length === 0 ||
          props.filters.buyAsset.some(filterAsset =>
            order.receiving.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
          )

        return offeringSellAsset && receivingBuyAsset
      })
      .sort((a, b) => a.offeringUsdValue - b.offeringUsdValue) // Lower USD values first for selling (asks) - bottom alignment
  })

  const filteredBuyOrders = computed(() => {
    const orders = filteredOrders.value
    // Buy orders: offers where you can buy the buy-assets by giving sell-assets
    // These are offers where maker is offering buy-assets and receiving sell-assets
    return orders
      .filter(order => {
        // Check if maker is offering buy-assets (what you want to buy)
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

        // Check if maker is receiving sell-assets (what you want to sell)
        const receivingSellAsset =
          props.filters.sellAsset.length === 0 ||
          props.filters.sellAsset.some(filterAsset =>
            order.receiving.some(
              orderAsset =>
                getTickerSymbol(orderAsset.id).toLowerCase() === filterAsset.toLowerCase() ||
                orderAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
                (orderAsset.code && orderAsset.code.toLowerCase() === filterAsset.toLowerCase())
            )
          )

        return offeringBuyAsset && receivingSellAsset
      })
      .sort((a, b) => b.offeringUsdValue - a.offeringUsdValue) // Higher USD values first for buying (bids)
  })

  // Methods
  const calculateAssetUsdValue = (asset: {
    id: string
    code: string
    name: string
    amount: number
  }) => {
    if (asset.code === 'USDC') {
      return asset.amount
    } else {
      return asset.amount * (usdPrices[asset.code] || 1)
    }
  }

  const calculateMarketPrice = () => {
    if (filteredOrders.value.length === 0) return 1

    let totalVolume = 0
    let weightedPriceSum = 0

    filteredOrders.value.forEach(order => {
      const firstAsset = order.offering[0]
      if (firstAsset && firstAsset.code !== 'USDC') {
        const usdcItem = order.receiving.find(item => item.code === 'USDC')
        if (usdcItem) {
          const volume = firstAsset.amount
          const price = usdcItem.amount / firstAsset.amount
          totalVolume += volume
          weightedPriceSum += volume * price
        }
      }
    })

    return totalVolume > 0 ? weightedPriceSum / totalVolume : 1
  }

  const handleOrderClick = (order: Order) => {
    emit('fill-from-order-book', order)
  }

  const startResize = (event: MouseEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startSellHeight = sellSectionHeight.value

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const containerHeight = 100
      const newSellHeight = Math.max(
        20,
        Math.min(80, startSellHeight + (deltaY / containerHeight) * 100)
      )
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
    height: 60vh;
    min-height: 400px;
    max-height: 800px;
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
    height: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .resize-handle:hover {
    background-color: #d1d5db;
  }

  .dark .resize-handle:hover {
    background-color: #4b5563;
  }

  @media (max-width: 768px) {
    .order-book-container {
      height: 50vh;
      min-height: 300px;
      max-height: 600px;
    }
  }

  @media (max-width: 480px) {
    .order-book-container {
      height: 40vh;
      min-height: 250px;
      max-height: 500px;
    }
  }
</style>
