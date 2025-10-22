<template>
  <div class="content-page">
    <div class="content-header">
      <div class="flex flex-col sm:flex-row gap-4">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Trading View</h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Trade multiple assets in a single offer
        </p>
      </div>
    </div>

    <div class="content-body">
      <!-- Navigation Tabs -->
      <div class="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          @click="activeView = 'trade'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeView === 'trade'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
          ]"
        >
          Trade
        </button>
        <button
          @click="activeView = 'history'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeView === 'history'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
          ]"
        >
          Order History
        </button>
      </div>

      <!-- Trading View -->
      <div v-if="activeView === 'trade'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Order Book Sidebar -->
        <div class="lg:col-span-1">
          <OrderBook
            :order-book-data="orderBookData"
            :loading="orderBookLoading"
            :has-more="orderBookHasMore"
            :filters="orderBookFilters"
            :search-value="orderBookSearchValue"
            :filtered-suggestions="orderBookFilteredSuggestions"
            @load-more="loadOrderBookData"
            @update-filters="updateOrderBookFilters"
            @update-search="updateOrderBookSearch"
            @add-filter="addOrderBookFilter"
            @remove-filter="removeOrderBookFilter"
            @clear-filters="clearOrderBookFilters"
            @fill-from-order-book="fillFromOrderBook"
            @use-as-template="useAsTemplate"
          />
        </div>

        <!-- Trading Interface -->
        <div class="lg:col-span-2">
          <!-- Maker/Taker Tabs -->
          <div class="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              @click="activeTab = 'maker'"
              :class="[
                'px-6 py-3 font-medium transition-colors',
                activeTab === 'maker'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Maker Order
            </button>
            <button
              @click="activeTab = 'taker'"
              :class="[
                'px-6 py-3 font-medium transition-colors',
                activeTab === 'taker'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Taker Order
            </button>
          </div>

          <!-- Price Adjustment for Maker Orders -->
          <div v-if="activeTab === 'maker'" class="card p-4 mb-6">
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Price Adjustment</label
              >
              <span
                :class="[
                  'text-sm font-mono',
                  priceAdjustment > 0
                    ? 'text-green-600 dark:text-green-400'
                    : priceAdjustment < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400',
                ]"
              >
                {{ priceAdjustment > 0 ? '+' : '' }}{{ priceAdjustment }}%
              </span>
            </div>
            <Slider v-model="priceAdjustment" :min="-50" :max="50" :step="1" class="w-full" />
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>

          <!-- Asset Selection Forms -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Sell Assets -->
            <div class="card p-6">
              <h2 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">You Sell</h2>

              <div v-for="(asset, index) in makerAssets" :key="`maker-${index}`" class="mb-4">
                <div class="flex gap-3">
                  <Dropdown
                    v-model="asset.asset"
                    :options="availableAssets"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Asset"
                    class="flex-1"
                    @change="updateMakerAsset(index, 'asset', $event)"
                  />
                  <InputNumber
                    v-model="asset.amount"
                    placeholder="Amount"
                    :min-fraction-digits="6"
                    :max-fraction-digits="6"
                    class="flex-1"
                    @update:model-value="updateMakerAsset(index, 'amount', $event)"
                  />
                  <Button
                    v-if="makerAssets.length > 1"
                    @click="removeMakerAsset(index)"
                    icon="pi pi-times"
                    severity="danger"
                    size="small"
                    text
                    rounded
                  />
                </div>
              </div>

              <Button
                @click="addMakerAsset"
                label="+ Add Asset"
                icon="pi pi-plus"
                severity="secondary"
                text
                class="w-full"
              />
            </div>

            <!-- Buy Assets -->
            <div class="card p-6">
              <h2 class="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">You Buy</h2>

              <div v-for="(asset, index) in takerAssets" :key="`taker-${index}`" class="mb-4">
                <div class="flex gap-3">
                  <Dropdown
                    v-model="asset.asset"
                    :options="availableAssets"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Asset"
                    class="flex-1"
                    @change="updateTakerAsset(index, 'asset', $event)"
                  />
                  <InputNumber
                    v-model="asset.amount"
                    placeholder="Amount"
                    :min-fraction-digits="6"
                    :max-fraction-digits="6"
                    class="flex-1"
                    @update:model-value="updateTakerAsset(index, 'amount', $event)"
                  />
                  <Button
                    v-if="takerAssets.length > 1"
                    @click="removeTakerAsset(index)"
                    icon="pi pi-times"
                    severity="danger"
                    size="small"
                    text
                    rounded
                  />
                </div>
              </div>

              <Button
                @click="addTakerAsset"
                label="+ Add Asset"
                icon="pi pi-plus"
                severity="secondary"
                text
                class="w-full"
              />
            </div>
          </div>

          <!-- Create Offer Button -->
          <div class="mt-6 flex justify-center">
            <Button
              @click="createOffer"
              :label="activeTab === 'maker' ? 'Create Maker Order' : 'Take Order'"
              icon="pi pi-shopping-cart"
              size="large"
              class="px-8 py-3"
            />
          </div>
        </div>
      </div>

      <!-- Order History View -->
      <div v-if="activeView === 'history'">
        <OrderHistory
          :trades="displayedTrades"
          :loading="loading"
          :has-more="hasMore"
          :filters="filters"
          :search-value="searchValue"
          :filtered-suggestions="filteredSuggestions"
          @load-more="loadData"
          @update-filters="updateFilters"
          @update-search="updateSearch"
          @add-filter="addFilter"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { useOfferStorage } from '@/shared/composables/useOfferStorage'
  import { useTickerData } from '@/shared/composables/useTickerData'
  import type { OfferDetails } from '@/types/offer.types'
  import Button from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
  import Slider from 'primevue/slider'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import OrderBook from './components/OrderBook.vue'
  import OrderHistory from './components/OrderHistory.vue'

  // Interfaces
  interface AssetItem {
    asset: string
    amount: string
  }

  interface OrderBookOrder {
    id: number
    offering: AssetItem[]
    receiving: AssetItem[]
    maker: string
    timestamp: string
    offeringUsdValue: number
    receivingUsdValue: number
    pricePerUnit: number
  }

  interface Trade {
    id: number
    sellAssets: AssetItem[]
    buyAssets: AssetItem[]
    status: string
    maker: string
    timestamp: string
  }

  interface FilterState {
    buyAsset: string[]
    sellAsset: string[]
    status?: string[]
  }

  interface SuggestionItem {
    value: string
    column: string
    label: string
  }

  interface AssetOption {
    label: string
    value: string
  }

  // Services
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()
  const { availableCatTokens } = useTickerData()

  // State
  const activeView = ref<'trade' | 'history'>('trade')
  const activeTab = ref<'maker' | 'taker'>('maker')
  const priceAdjustment = ref(0)

  // Asset management
  const makerAssets = ref<AssetItem[]>([{ asset: '', amount: '' }])
  const takerAssets = ref<AssetItem[]>([{ asset: '', amount: '' }])

  // Order book data
  const orderBookData = ref<OrderBookOrder[]>([])
  const orderBookLoading = ref(false)
  const orderBookHasMore = ref(true)
  const orderBookPage = ref(0)
  const orderBookSearchValue = ref('')
  const orderBookFilteredSuggestions = ref<SuggestionItem[]>([])
  const orderBookFilters = reactive<FilterState>({
    buyAsset: [],
    sellAsset: [],
  })

  // Order history data
  const displayedTrades = ref<Trade[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(0)
  const searchValue = ref('')
  const filteredSuggestions = ref<SuggestionItem[]>([])
  const filters = reactive<FilterState>({
    buyAsset: [],
    sellAsset: [],
    status: [],
  })

  // Constants
  const rowsPerPage = 20
  const availableAssets = computed((): AssetOption[] => [
    { label: 'XCH (Chia)', value: 'XCH' },
    { label: 'USDT', value: 'USDT' },
    { label: 'USDC', value: 'USDC' },
    ...availableCatTokens.value.map(token => ({
      label: `${token.ticker} (${token.name})`,
      value: token.ticker,
    })),
  ])

  const statusOptions = ['Open', 'Filled', 'Cancelled', 'Partial']

  // Mock USD prices for assets (in a real app, this would come from an API)
  const usdPrices = {
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

  // Methods
  const addMakerAsset = () => {
    makerAssets.value.push({ asset: '', amount: '' })
  }

  const removeMakerAsset = (index: number) => {
    if (makerAssets.value.length > 1) {
      makerAssets.value.splice(index, 1)
    }
  }

  const addTakerAsset = () => {
    takerAssets.value.push({ asset: '', amount: '' })
  }

  const removeTakerAsset = (index: number) => {
    if (takerAssets.value.length > 1) {
      takerAssets.value.splice(index, 1)
    }
  }

  const updateMakerAsset = (index: number, field: keyof AssetItem, value: string) => {
    makerAssets.value[index][field] = value
  }

  const updateTakerAsset = (index: number, field: keyof AssetItem, value: string) => {
    takerAssets.value[index][field] = value
  }

  const fillFromOrderBook = (order: OrderBookOrder) => {
    if (activeTab.value === 'maker') {
      makerAssets.value = order.offering.map((a: AssetItem) => ({ ...a }))
      takerAssets.value = order.receiving.map((a: AssetItem) => ({ ...a }))
    } else {
      takerAssets.value = order.offering.map((a: AssetItem) => ({ ...a }))
      makerAssets.value = order.receiving.map((a: AssetItem) => ({ ...a }))
    }
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    if (activeTab.value === 'maker') {
      makerAssets.value = order.offering.map((a: AssetItem) => ({ ...a }))
      takerAssets.value = order.receiving.map((a: AssetItem) => ({ ...a }))
    }
  }

  const createOffer = async () => {
    try {
      // Convert assets to the format expected by the wallet
      const offerAssets = makerAssets.value
        .filter(asset => asset.asset && asset.amount)
        .map(asset => ({
          assetId: asset.asset === 'XCH' ? '' : asset.asset,
          amount: parseFloat(asset.amount) * 1000000000000, // Convert to mojos
          type: asset.asset === 'XCH' ? 'xch' : 'cat',
        }))

      const requestAssets = takerAssets.value
        .filter(asset => asset.asset && asset.amount)
        .map(asset => ({
          assetId: asset.asset === 'XCH' ? '' : asset.asset,
          amount: parseFloat(asset.amount) * 1000000000000, // Convert to mojos
          type: asset.asset === 'XCH' ? 'xch' : 'cat',
        }))

      if (activeTab.value === 'maker') {
        // Create maker offer
        const result = await walletDataService.createOffer({
          walletId: 1,
          offerAssets,
          requestAssets,
          fee: 1000000, // 0.000001 XCH fee
        })

        if (result?.offer) {
          const newOffer: OfferDetails = {
            id: result.id || Date.now().toString(),
            tradeId: result.tradeId || result.id || 'unknown',
            offerString: result.offer,
            status: 'active',
            createdAt: new Date(),
            assetsOffered: makerAssets.value.map(asset => ({
              assetId: asset.asset || '',
              amount: parseFloat(asset.amount) || 0,
              type: asset.asset === 'XCH' ? 'xch' : 'cat',
              symbol: asset.asset || '',
            })),
            assetsRequested: takerAssets.value.map(asset => ({
              assetId: asset.asset || '',
              amount: parseFloat(asset.amount) || 0,
              type: asset.asset === 'XCH' ? 'xch' : 'cat',
              symbol: asset.asset || '',
            })),
            fee: 0.000001,
            creatorAddress: walletDataService.address.data.value?.address || 'unknown',
          }

          await offerStorage.saveOffer(newOffer, true)
          // Reset form
          makerAssets.value = [{ asset: '', amount: '' }]
          takerAssets.value = [{ asset: '', amount: '' }]
          priceAdjustment.value = 0
        }
      } else {
        // Take existing offer (would need offer string from order book)
        // This would be implemented based on the selected order
      }
    } catch (error) {
      // Handle error appropriately - could emit an event or show a toast notification
      void error // Suppress unused variable warning
    }
  }

  // Order book methods
  const loadOrderBookData = () => {
    if (orderBookLoading.value || !orderBookHasMore.value) return

    orderBookLoading.value = true
    setTimeout(() => {
      const newData = generateOrderBookData(orderBookPage.value * rowsPerPage, rowsPerPage)
      orderBookData.value.push(...newData)
      orderBookPage.value++
      orderBookLoading.value = false

      if (orderBookPage.value >= 5) {
        orderBookHasMore.value = false
      }
    }, 500)
  }

  const updateOrderBookFilters = (newFilters: Partial<FilterState>) => {
    Object.assign(orderBookFilters, newFilters)
  }

  const updateOrderBookSearch = (value: string) => {
    orderBookSearchValue.value = value
  }

  const addOrderBookFilter = (column: string, value: string) => {
    if (!orderBookFilters[column].includes(value)) {
      orderBookFilters[column].push(value)
    }
  }

  const removeOrderBookFilter = (column: string, value: string) => {
    const index = orderBookFilters[column].indexOf(value)
    if (index > -1) {
      orderBookFilters[column].splice(index, 1)
    }
  }

  const clearOrderBookFilters = (column: string) => {
    orderBookFilters[column] = []
  }

  // Order history methods
  const loadData = () => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    setTimeout(() => {
      const newData = generateTrades(page.value * rowsPerPage, rowsPerPage)
      displayedTrades.value.push(...newData)
      page.value++
      loading.value = false

      if (page.value >= 5) {
        hasMore.value = false
      }
    }, 500)
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    Object.assign(filters, newFilters)
  }

  const updateSearch = (value: string) => {
    searchValue.value = value
  }

  const addFilter = (column: string, value: string) => {
    if (!filters[column].includes(value)) {
      filters[column].push(value)
    }
  }

  const removeFilter = (column: string, value: string) => {
    const index = filters[column].indexOf(value)
    if (index > -1) {
      filters[column].splice(index, 1)
    }
  }

  const clearFilters = (column: string) => {
    filters[column] = []
  }

  // Mock data generators
  const generateTrades = (startIndex: number, count: number): Trade[] => {
    return Array.from({ length: count }, (_, i) => {
      const assets = ['XCH', 'BTC', 'ETH', 'SOL', 'MATIC', 'AVAX', 'LINK']
      const selectedAsset = assets[Math.floor(Math.random() * assets.length)]
      const isSellOrder = Math.random() > 0.5

      const basePrice = usdPrices[selectedAsset] || 1
      const priceVariation = (Math.random() - 0.5) * 0.04
      const assetPriceInUsdc = basePrice * (1 + priceVariation)

      const assetAmount =
        selectedAsset === 'BTC'
          ? (Math.random() * 2 + 0.01).toFixed(4)
          : selectedAsset === 'ETH'
            ? (Math.random() * 10 + 0.1).toFixed(4)
            : (Math.random() * 100 + 1).toFixed(4)

      const usdcAmount = (parseFloat(assetAmount) * assetPriceInUsdc).toFixed(2)

      const sellAssets = isSellOrder
        ? [{ asset: selectedAsset, amount: assetAmount }]
        : [{ asset: 'USDC', amount: usdcAmount }]

      const buyAssets = isSellOrder
        ? [{ asset: 'USDC', amount: usdcAmount }]
        : [{ asset: selectedAsset, amount: assetAmount }]

      return {
        id: startIndex + i,
        sellAssets,
        buyAssets,
        status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
        maker: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
      }
    })
  }

  const generateOrderBookData = (startIndex: number, count: number): OrderBookOrder[] => {
    return Array.from({ length: count }, (_, i) => {
      const assets = ['XCH', 'BTC', 'ETH', 'SOL', 'MATIC', 'AVAX', 'LINK']
      const selectedAsset = assets[Math.floor(Math.random() * assets.length)]
      const isSellOrder = Math.random() > 0.5

      const basePrice = usdPrices[selectedAsset] || 1
      const priceVariation = (Math.random() - 0.5) * 0.04
      const assetPriceInUsdc = basePrice * (1 + priceVariation)

      const assetAmount =
        selectedAsset === 'BTC'
          ? (Math.random() * 2 + 0.01).toFixed(4)
          : selectedAsset === 'ETH'
            ? (Math.random() * 10 + 0.1).toFixed(4)
            : (Math.random() * 100 + 1).toFixed(4)

      const usdcAmount = (parseFloat(assetAmount) * assetPriceInUsdc).toFixed(2)

      const offering = isSellOrder
        ? [{ asset: selectedAsset, amount: assetAmount }]
        : [{ asset: 'USDC', amount: usdcAmount }]

      const receiving = isSellOrder
        ? [{ asset: 'USDC', amount: usdcAmount }]
        : [{ asset: selectedAsset, amount: assetAmount }]

      const offeringUsdValue = offering.reduce(
        (sum, item) => sum + parseFloat(item.amount) * (usdPrices[item.asset] || 0),
        0
      )
      const receivingUsdValue = receiving.reduce(
        (sum, item) => sum + parseFloat(item.amount) * (usdPrices[item.asset] || 0),
        0
      )

      return {
        id: startIndex + i,
        offering,
        receiving,
        maker: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
        offeringUsdValue,
        receivingUsdValue,
        pricePerUnit: receivingUsdValue / offeringUsdValue,
        assetPriceInUsdc,
      }
    })
  }

  // Lifecycle
  onMounted(() => {
    if (activeView.value === 'trade' && orderBookData.value.length === 0) {
      loadOrderBookData()
    }
  })

  // Watchers
  watch(activeView, newView => {
    if (newView === 'history' && displayedTrades.value.length === 0) {
      loadData()
    } else if (newView === 'trade' && orderBookData.value.length === 0) {
      loadOrderBookData()
    }
  })
</script>

<style scoped>
  .content-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8;
  }

  .content-header {
    @apply mb-6;
  }

  .content-body {
    @apply space-y-6;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }

  /* Dark mode for PrimeVue components */
  :deep(.p-dropdown) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-dropdown-panel) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-dropdown-item) {
    @apply text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600;
  }

  :deep(.p-inputnumber) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-inputnumber-input) {
    @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100;
  }

  :deep(.p-inputnumber-input:focus) {
    @apply border-primary-500 dark:border-primary-400 ring-primary-500 dark:ring-primary-400;
  }

  :deep(.p-slider) {
    @apply bg-gray-200 dark:bg-gray-600;
  }

  :deep(.p-slider-range) {
    @apply bg-primary-500 dark:bg-primary-400;
  }

  :deep(.p-slider-handle) {
    @apply bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400;
  }

  :deep(.p-button) {
    @apply text-gray-900 dark:text-gray-100;
  }

  :deep(.p-button.p-button-secondary) {
    @apply bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300;
  }

  :deep(.p-button.p-button-secondary:hover) {
    @apply bg-gray-200 dark:bg-gray-600;
  }

  :deep(.p-button.p-button-danger) {
    @apply bg-red-500 dark:bg-red-600 border-red-500 dark:border-red-600;
  }

  :deep(.p-button.p-button-danger:hover) {
    @apply bg-red-600 dark:bg-red-700;
  }
</style>
