<template>
  <div class="lg:col-span-1">
    <!-- Trading Tab Menu -->
    <div class="flex gap-2 mb-2 border-b border-gray-200 dark:border-gray-700">
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
    <TradingContent
      :active-trading-view="activeTradingView"
      :order-book-data="orderBookData"
      :order-book-loading="orderBookLoading"
      :order-book-has-more="orderBookHasMore"
      :shared-filters="sharedFilters"
      :shared-search-value="sharedSearchValue"
      :shared-filtered-suggestions="sharedFilteredSuggestions"
      @load-more="loadOrderBookData"
      @fill-from-order-book="fillFromOrderBook"
      @use-as-template="useAsTemplate"
    />
  </div>
</template>

<script setup lang="ts">
  import type { FilterState, OrderBookOrder, SuggestionItem } from '@/pages/Trading/types'
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
    (e: 'loadOrderBookData'): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const tradingTabs: TradingTab[] = [
    { key: 'orderbook', label: 'Order Book' },
    { key: 'chart', label: 'Chart' },
    { key: 'depth', label: 'Depth' },
    { key: 'trades', label: 'Market Trades' },
  ]

  const loadOrderBookData = () => {
    emit('loadOrderBookData')
  }

  const fillFromOrderBook = (order: OrderBookOrder) => {
    emit('fillFromOrderBook', order)
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    emit('useAsTemplate', order)
  }
</script>
