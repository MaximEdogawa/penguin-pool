<template>
  <div class="card p-4">
    <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Order Book</h2>

    <!-- Search Input -->
    <div class="relative mb-4">
      <InputText
        v-model="localSearchValue"
        placeholder="Search by asset... (AND logic - all selected assets must match)"
        class="w-full"
        @input="handleSearchChange"
      />
      <div
        v-if="filteredSuggestions.length > 0 && localSearchValue"
        class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      >
        <div
          v-for="(suggestion, idx) in filteredSuggestions"
          :key="idx"
          @click="addFilter(suggestion.column, suggestion.value)"
          class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm flex items-center justify-between"
        >
          <span>{{ suggestion.label }}</span>
          <span
            :class="[
              'text-xs px-2 py-0.5 rounded-full',
              suggestion.column === 'buyAsset'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
            ]"
          >
            {{ suggestion.column === 'buyAsset' ? 'Buy' : 'Sell' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Filters -->
    <div v-if="hasActiveFilters" class="space-y-2 mb-4">
      <div
        v-for="(values, column) in filters"
        :key="column"
        v-show="values.length > 0"
        class="flex items-start gap-2"
      >
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize min-w-12">
          {{ column === 'buyAsset' ? 'Buy' : 'Sell' }}:
        </span>
        <div class="flex items-center gap-1 flex-wrap">
          <span
            v-for="value in values"
            :key="value"
            :class="[
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              column === 'buyAsset'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
            ]"
          >
            {{ value }}
            <button
              @click="removeFilter(column, value)"
              class="ml-0.5 hover:bg-black hover:bg-opacity-10 rounded-full"
            >
              ×
            </button>
          </span>
          <button
            @click="clearFilters(column)"
            class="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Order Book Display -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
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
        class="overflow-y-scroll"
        style="height: 280px; display: flex; flex-direction: column-reverse"
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
              :style="{ width: `${Math.min(100, (order.id % 8) * 15)}%`, right: 0 }"
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
                  {{ item.asset }}
                  <span class="text-gray-600 dark:text-gray-400">
                    {{
                      parseFloat(item.amount).toFixed(
                        item.asset === 'BTC' ? 4 : item.asset === 'USDC' ? 2 : 2
                      )
                    }}
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

      <!-- Buy Orders (Bids) -->
      <div ref="buyScrollRef" class="overflow-y-scroll" style="height: 280px">
        <div class="px-3 py-2">
          <div
            v-for="order in filteredBuyOrders"
            :key="`buy-${order.id}`"
            @click="handleOrderClick(order)"
            class="w-full group relative mb-1 cursor-pointer"
          >
            <div
              class="absolute inset-0 bg-green-100 dark:bg-green-900 opacity-20 group-hover:opacity-30 transition-opacity"
              :style="{ width: `${Math.min(100, (order.id % 8) * 15)}%`, right: 0 }"
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
                  {{ item.asset }}
                  <span class="text-gray-600 dark:text-gray-400">
                    {{
                      parseFloat(item.amount).toFixed(
                        item.asset === 'BTC' ? 4 : item.asset === 'USDC' ? 2 : 2
                      )
                    }}
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
  import InputText from 'primevue/inputtext'
  import ProgressSpinner from 'primevue/progressspinner'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import OrderTooltip from './OrderTooltip.vue'

  interface Order {
    id: number
    offering: Array<{ asset: string; amount: string }>
    receiving: Array<{ asset: string; amount: string }>
    maker: string
    timestamp: string
    offeringUsdValue: number
    receivingUsdValue: number
    pricePerUnit: number
    assetPriceInUsdc: number
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

  // Local state
  const localSearchValue = ref(props.searchValue)
  const sellScrollRef = ref<HTMLElement>()
  const buyScrollRef = ref<HTMLElement>()

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

  const availableAssets = ['XCH', 'BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'MATIC', 'AVAX', 'LINK']

  // Computed
  const hasActiveFilters = computed(() => {
    return Object.values(props.filters).some(f => f.length > 0)
  })

  const filteredOrders = computed(() => {
    return props.orderBookData.filter(order => {
      // For buy assets: order must be receiving ALL selected buy assets (AND logic)
      const buyMatch =
        props.filters.buyAsset.length === 0 ||
        props.filters.buyAsset.every(filterAsset =>
          order.receiving.some(orderAsset => orderAsset.asset === filterAsset)
        )

      // For sell assets: order must be offering ALL selected sell assets (AND logic)
      const sellMatch =
        props.filters.sellAsset.length === 0 ||
        props.filters.sellAsset.every(filterAsset =>
          order.offering.some(orderAsset => orderAsset.asset === filterAsset)
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

  const filteredSuggestions = computed(() => {
    if (!localSearchValue.value) return []
    const lowerSearch = localSearchValue.value.toLowerCase()
    const suggestions: Array<{ value: string; column: string; label: string }> = []

    availableAssets.forEach(asset => {
      if (asset.toLowerCase().includes(lowerSearch)) {
        if (!props.filters.buyAsset.includes(asset)) {
          suggestions.push({ value: asset, column: 'buyAsset', label: `Buy ${asset}` })
        }
        if (!props.filters.sellAsset.includes(asset)) {
          suggestions.push({ value: asset, column: 'sellAsset', label: `Sell ${asset}` })
        }
      }
    })

    return suggestions
  })

  // Methods
  const calculatePriceInUsdc = (order: Order) => {
    const firstAsset = order.offering[0]

    if (firstAsset.asset === 'USDC') {
      return 1
    } else {
      const usdcReceiving = order.receiving.find(a => a.asset === 'USDC')
      if (usdcReceiving) {
        return parseFloat(usdcReceiving.amount) / parseFloat(firstAsset.amount)
      } else {
        return usdPrices[firstAsset.asset] || 1
      }
    }
  }

  const calculateMarketPrice = () => {
    if (filteredOrders.value.length === 0) return 1

    let totalVolume = 0
    let weightedPriceSum = 0

    filteredOrders.value.forEach(order => {
      const firstAsset = order.offering[0]
      if (firstAsset.asset !== 'USDC') {
        const usdcItem =
          order.receiving.find(a => a.asset === 'USDC') ||
          order.offering.find(a => a.asset === 'USDC')
        if (usdcItem) {
          const volume = parseFloat(firstAsset.amount)
          const price = parseFloat(usdcItem.amount) / volume
          totalVolume += volume
          weightedPriceSum += price * volume
        }
      }
    })

    return totalVolume > 0 ? weightedPriceSum / totalVolume : 1
  }

  const handleSearchChange = () => {
    emit('update-search', localSearchValue.value)
  }

  const addFilter = (column: string, value: string) => {
    emit('add-filter', column, value)
    localSearchValue.value = ''
  }

  const removeFilter = (column: string, value: string) => {
    emit('remove-filter', column, value)
  }

  const clearFilters = (column: string) => {
    emit('clear-filters', column)
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

  // Watch for prop changes
  watch(
    () => props.searchValue,
    newValue => {
      localSearchValue.value = newValue
    }
  )
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
