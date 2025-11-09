<template>
  <div class="lg:col-span-1 flex flex-col h-full">
    <!-- Single Tab Menu -->
    <div class="flex gap-2 mb-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <button
        v-for="tab in offerTabs"
        :key="tab.key"
        @click="$emit('update:activeView', tab.key)"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors',
          activeView === tab.key
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Content based on active view -->
    <div class="flex-1 flex flex-col min-h-0">
      <OfferContent
        :active-view="activeView"
        :maker-assets="makerAssets"
        :taker-assets="takerAssets"
        :price-adjustment="priceAdjustment"
        :displayed-trades="displayedTrades"
        :loading="loading"
        :has-more="hasMore"
        :shared-filters="sharedFilters"
        :shared-search-value="sharedSearchValue"
        :shared-filtered-suggestions="sharedFilteredSuggestions"
        @submit="handleOfferSubmit"
        @load-more="loadData"
        @fill-from-order-book="fillFromOrderBook"
        @use-as-template="useAsTemplate"
        @update:active-view="updateActiveView"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    AssetItem,
    FilterState,
    OfferSubmitData,
    OrderBookOrder,
    SuggestionItem,
    Trade,
  } from '@/pages/Trading/types'
  import OfferContent from './OfferContent.vue'

  interface OfferTab {
    key: 'create' | 'take' | 'history'
    label: string
  }

  interface Props {
    activeView: 'create' | 'take' | 'history'
    makerAssets: AssetItem[]
    takerAssets: AssetItem[]
    priceAdjustment: number
    displayedTrades: Trade[]
    loading: boolean
    hasMore: boolean
    sharedFilters: FilterState
    sharedSearchValue: string
    sharedFilteredSuggestions: SuggestionItem[]
  }

  interface Emits {
    (e: 'update:activeView', value: 'create' | 'take' | 'history'): void
    (e: 'submit', data: OfferSubmitData): void
    (e: 'loadData'): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const offerTabs: OfferTab[] = [
    { key: 'take', label: 'Take Offer' },
    { key: 'create', label: 'Create Offer' },
    { key: 'history', label: 'My Offers' },
  ]

  const handleOfferSubmit = (data: OfferSubmitData) => {
    emit('submit', data)
  }

  const loadData = () => {
    emit('loadData')
  }

  const fillFromOrderBook = (order: OrderBookOrder) => {
    emit('fillFromOrderBook', order)
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    emit('useAsTemplate', order)
  }

  const updateActiveView = (value: 'create' | 'take' | 'history') => {
    emit('update:activeView', value)
  }
</script>
