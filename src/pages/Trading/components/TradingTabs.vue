<template>
  <div class="lg:col-span-1 flex flex-col h-full">
    <!-- Trading Tab Menu -->
    <div class="flex gap-2 mb-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <button
        v-for="tab in tradingTabs"
        :key="tab.key"
        @click="$emit('update:activeTradingView', tab.key)"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors',
          activeTradingView === tab.key
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Trading Content based on active view -->
    <div class="flex-1 flex flex-col min-h-0">
      <TradingContent
        :active-trading-view="activeTradingView"
        :order-book-data="orderBookData"
        :order-book-loading="orderBookLoading"
        :order-book-has-more="orderBookHasMore"
        :shared-filters="sharedFilters"
        :shared-search-value="sharedSearchValue"
        :shared-filtered-suggestions="sharedFilteredSuggestions"
        @refresh-order-book="refreshOrderBook"
        @fill-from-order-book="fillFromOrderBook"
        @use-as-template="useAsTemplate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FilterState, OrderBookOrder, SuggestionItem } from '@/pages/Trading/types'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import TradingContent from './TradingContent.vue'

  interface TradingTab {
    key: 'orderbook' | 'chart' | 'depth' | 'trades'
    label: string
  }

  interface Props {
    activeTradingView: 'orderbook' | 'chart' | 'depth' | 'trades'
    orderBookData: OrderBookOrder[]
    orderBookLoading: boolean
    orderBookHasMore: boolean
    sharedFilters: FilterState
    sharedSearchValue: string
    sharedFilteredSuggestions: SuggestionItem[]
  }

  interface Emits {
    (e: 'update:activeTradingView', value: 'orderbook' | 'chart' | 'depth' | 'trades'): void
    (e: 'refreshOrderBook'): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Window width tracking for responsive behavior
  const windowWidth = ref(window.innerWidth)
  const isMobile = computed(() => windowWidth.value < 768)

  // Track window resize
  const handleResize = () => {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  const allTradingTabs: TradingTab[] = [
    { key: 'orderbook', label: 'Order Book' },
    { key: 'chart', label: 'Chart' },
    { key: 'depth', label: 'Depth' },
    { key: 'trades', label: 'Market Trades' },
  ]

  // Filter tabs based on screen size - only show Order Book on mobile
  const tradingTabs = computed(() => {
    return isMobile.value ? allTradingTabs.filter(tab => tab.key === 'orderbook') : allTradingTabs
  })

  const refreshOrderBook = () => {
    emit('refreshOrderBook')
  }

  const fillFromOrderBook = (order: OrderBookOrder) => {
    emit('fillFromOrderBook', order)
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    emit('useAsTemplate', order)
  }
</script>
