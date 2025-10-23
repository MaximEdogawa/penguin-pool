<template>
  <!-- Order Book View -->
  <div v-if="activeTradingView === 'orderbook'" class="h-full flex flex-col">
    <OfferBook
      :order-book-data="orderBookData"
      :loading="orderBookLoading"
      :has-more="orderBookHasMore"
      :filters="sharedFilters"
      :search-value="sharedSearchValue"
      :filtered-suggestions="sharedFilteredSuggestions"
      @load-more="loadOrderBookData"
      @fill-from-order-book="fillFromOrderBook"
      @use-as-template="useAsTemplate"
    />
  </div>

  <!-- Chart View -->
  <div v-if="activeTradingView === 'chart'" class="card p-4 h-full flex flex-col">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Price Chart</h3>
    <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">Chart component will be implemented here</p>
    </div>
  </div>

  <!-- Depth View -->
  <div v-if="activeTradingView === 'depth'" class="card p-4 h-full flex flex-col">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Depth</h3>
    <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">Depth chart component will be implemented here</p>
    </div>
  </div>

  <!-- Market Trades View -->
  <div v-if="activeTradingView === 'trades'" class="card p-4 h-full flex flex-col">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Trades</h3>
    <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">
        Market trades component will be implemented here
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FilterState, OrderBookOrder, SuggestionItem } from '@/pages/Trading/types'
  import OfferBook from './OfferBook.vue'

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
    (e: 'loadOrderBookData'): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

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

<style scoped>
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
