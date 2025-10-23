<template>
  <!-- Create Offer View -->
  <div v-if="activeView === 'create'">
    <CreateOffer
      mode="maker"
      :initial-offering-assets="makerAssets"
      :initial-requested-assets="takerAssets"
      :initial-price-adjustment="priceAdjustment"
      @submit="handleOfferSubmit"
    />
  </div>

  <!-- Take Offer View -->
  <div v-if="activeView === 'take'">
    <CreateOffer
      mode="taker"
      :initial-offering-assets="makerAssets"
      :initial-requested-assets="takerAssets"
      :initial-price-adjustment="priceAdjustment"
      @submit="handleOfferSubmit"
    />
  </div>

  <!-- Offer History View -->
  <div v-if="activeView === 'history'">
    <OrderHistory
      :trades="displayedTrades"
      :loading="loading"
      :has-more="hasMore"
      :filters="sharedFilters"
      :search-value="sharedSearchValue"
      :filtered-suggestions="sharedFilteredSuggestions"
      @load-more="loadData"
      @fill-from-order-book="fillFromOrderBook"
      @use-as-template="useAsTemplate"
    />
  </div>
</template>

<script setup lang="ts">
  import CreateOffer from '@/components/Offers/CreateOffer.vue'
  import type {
    AssetItem,
    FilterState,
    OfferSubmitData,
    OrderBookOrder,
    SuggestionItem,
    Trade,
  } from '@/pages/Trading/types'
  import OrderHistory from './OrderHistory.vue'

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
    (e: 'submit', data: OfferSubmitData): void
    (e: 'loadData'): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

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
</script>
