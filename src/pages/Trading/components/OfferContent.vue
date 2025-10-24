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

  <!-- My Offers View -->
  <div v-if="activeView === 'history'">
    <MyOffers @create-offer="handleCreateOffer" />
  </div>
</template>

<script setup lang="ts">
  import CreateOffer from '@/components/Offers/CreateOffer.vue'
  import MyOffers from '@/components/Offers/MyOffers.vue'
  import type {
    AssetItem,
    FilterState,
    OfferSubmitData,
    OrderBookOrder,
    SuggestionItem,
    Trade,
  } from '@/pages/Trading/types'

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
    (e: 'update:activeView', value: 'create' | 'take' | 'history'): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const handleOfferSubmit = (data: OfferSubmitData) => {
    emit('submit', data)
  }

  const handleCreateOffer = () => {
    // Switch to create offer view
    emit('update:activeView', 'create')
  }
</script>
