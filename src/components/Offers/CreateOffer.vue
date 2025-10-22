<template>
  <div class="space-y-6">
    <!-- Price Adjustment for Maker Orders -->
    <div v-if="mode === 'maker'" class="card p-4 mb-6">
      <div class="flex justify-between items-center mb-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Price Adjustment</label>
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
    <div class="space-y-6">
      <!-- Sell Assets Section -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {{ mode === 'maker' ? "Assets I'm Offering" : 'Offering Assets' }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="(asset, index) in offeringAssets"
            :key="`offering-${index}`"
            class="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <div class="flex-1">
              <select
                v-model="asset.type"
                @change="clearAssetSelection(asset)"
                :disabled="mode === 'taker'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              >
                <option value="xch">XCH</option>
                <option value="cat">CAT</option>
                <option value="nft">NFT</option>
              </select>
            </div>
            <div class="flex-1">
              <!-- XCH Asset (no selection needed) -->
              <div
                v-if="asset.type === 'xch'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs"
              >
                XCH
              </div>

              <!-- CAT Token Searchable Dropdown -->
              <div v-else-if="asset.type === 'cat'" class="relative flex-2">
                <input
                  v-model="asset.searchQuery"
                  @focus="asset.showDropdown = true"
                  @blur="handleBlur(asset)"
                  type="text"
                  placeholder="Search CAT..."
                  :disabled="mode === 'taker'"
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                />

                <!-- Dropdown -->
                <div
                  v-if="asset.showDropdown && filteredCatTokens(asset.searchQuery).length > 0"
                  class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto"
                >
                  <div
                    v-for="token in filteredCatTokens(asset.searchQuery)"
                    :key="token.assetId"
                    @click="selectCatToken(asset, token)"
                    class="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-xs"
                  >
                    <div class="font-medium">{{ token.ticker }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ token.name }}</div>
                  </div>
                </div>
              </div>

              <!-- Manual symbol input for other types -->
              <input
                v-else
                v-model="asset.symbol"
                type="text"
                placeholder="Symbol"
                :disabled="mode === 'taker'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              />
            </div>
            <div class="flex-1">
              <input
                v-model.number="asset.amount"
                type="number"
                step="0.000001"
                min="0"
                placeholder="Amount"
                :disabled="mode === 'taker'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                @input="
                  updateOfferingAsset(
                    index,
                    'amount',
                    ($event.target as HTMLInputElement)?.value || ''
                  )
                "
              />
            </div>
            <button
              v-if="offeringAssets.length > 1"
              @click="removeOfferingAsset(index)"
              type="button"
              :disabled="mode === 'taker'"
              class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
          <button
            @click="addOfferingAsset"
            type="button"
            :disabled="mode === 'taker'"
            class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-plus mr-2"></i>
            Add Asset
          </button>
        </div>
      </div>

      <!-- Buy Assets Section -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {{ mode === 'maker' ? 'Assets I Want' : 'Requested Assets' }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="(asset, index) in requestedAssets"
            :key="`requested-${index}`"
            class="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <div class="flex-1">
              <select
                v-model="asset.type"
                @change="clearAssetSelection(asset)"
                :disabled="mode === 'taker'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              >
                <option value="xch">XCH</option>
                <option value="cat">CAT</option>
                <option value="nft">NFT</option>
              </select>
            </div>
            <div class="flex-1">
              <!-- XCH Asset (no selection needed) -->
              <div
                v-if="asset.type === 'xch'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs"
              >
                XCH
              </div>

              <!-- CAT Token Searchable Dropdown -->
              <div v-else-if="asset.type === 'cat'" class="relative flex-2">
                <input
                  v-model="asset.searchQuery"
                  @focus="asset.showDropdown = true"
                  @blur="handleBlur(asset)"
                  type="text"
                  placeholder="Search CAT..."
                  :disabled="mode === 'taker'"
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                />

                <!-- Dropdown -->
                <div
                  v-if="asset.showDropdown && filteredCatTokens(asset.searchQuery).length > 0"
                  class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto"
                >
                  <div
                    v-for="token in filteredCatTokens(asset.searchQuery)"
                    :key="token.assetId"
                    @click="selectCatToken(asset, token)"
                    class="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-xs"
                  >
                    <div class="font-medium">{{ token.ticker }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ token.name }}</div>
                  </div>
                </div>
              </div>

              <!-- Manual symbol input for other types -->
              <input
                v-else
                v-model="asset.symbol"
                type="text"
                placeholder="Symbol"
                :disabled="mode === 'taker'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              />
            </div>
            <div class="flex-1">
              <input
                v-model.number="asset.amount"
                type="number"
                step="0.000001"
                min="0"
                placeholder="Amount"
                :disabled="mode === 'taker'"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                @input="
                  updateRequestedAsset(
                    index,
                    'amount',
                    ($event.target as HTMLInputElement)?.value || ''
                  )
                "
              />
            </div>
            <button
              v-if="requestedAssets.length > 1 && mode === 'maker'"
              @click="removeRequestedAsset(index)"
              type="button"
              class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
          <button
            v-if="mode === 'maker'"
            @click="addRequestedAsset"
            type="button"
            class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <i class="pi pi-plus mr-2"></i>
            Add Asset
          </button>
        </div>
      </div>
    </div>

    <!-- Offer Summary -->
    <div
      class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Offer Summary</h3>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Offer Type:</span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ mode === 'maker' ? 'Create Offer' : 'Take Offer' }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Total Assets:</span>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ offeringAssets.length + requestedAssets.length }}
          </span>
        </div>
        <div v-if="mode === 'maker'" class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Price Adjustment:</span>
          <span
            :class="[
              'text-sm font-medium',
              priceAdjustment > 0
                ? 'text-green-600 dark:text-green-400'
                : priceAdjustment < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white',
            ]"
          >
            {{ priceAdjustment > 0 ? '+' : '' }}{{ priceAdjustment }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="mt-6 flex justify-center">
      <Button
        @click="handleSubmit"
        :label="mode === 'maker' ? 'Create Offer' : 'Take Offer'"
        icon="pi pi-shopping-cart"
        size="large"
        class="px-8 py-3"
        :loading="isSubmitting"
        :disabled="!isFormValid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTickerData } from '@/shared/composables/useTickerData'
  import Button from 'primevue/button'
  import Slider from 'primevue/slider'
  import { computed, reactive, ref, watch } from 'vue'

  interface AssetItem {
    assetId: string
    amount: number
    type: 'xch' | 'cat' | 'nft'
    symbol: string
    searchQuery: string
    showDropdown: boolean
  }

  interface Props {
    mode: 'maker' | 'taker'
    initialOfferingAssets?: AssetItem[]
    initialRequestedAssets?: AssetItem[]
    initialPriceAdjustment?: number
  }

  interface Emits {
    (
      e: 'submit',
      data: {
        offeringAssets: AssetItem[]
        requestedAssets: AssetItem[]
        priceAdjustment: number
        mode: 'maker' | 'taker'
      }
    ): void
  }

  const props = withDefaults(defineProps<Props>(), {
    initialOfferingAssets: () => [
      { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
    ],
    initialRequestedAssets: () => [
      { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
    ],
    initialPriceAdjustment: 0,
  })

  const emit = defineEmits<Emits>()

  // Services
  const { availableCatTokens } = useTickerData()

  // State
  const isSubmitting = ref(false)
  const priceAdjustment = ref(props.initialPriceAdjustment)

  // Asset arrays
  const offeringAssets = reactive<AssetItem[]>([...props.initialOfferingAssets])
  const requestedAssets = reactive<AssetItem[]>([...props.initialRequestedAssets])

  // Computed
  const filteredCatTokens = (query: string) => {
    if (!query) return availableCatTokens.value.slice(0, 10)
    return availableCatTokens.value.filter(
      token =>
        token.ticker.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
    )
  }

  const isFormValid = computed(() => {
    return (
      offeringAssets.length > 0 &&
      requestedAssets.length > 0 &&
      offeringAssets.every(asset => asset.amount > 0 && (asset.type === 'xch' || asset.assetId)) &&
      requestedAssets.every(asset => asset.amount > 0 && (asset.type === 'xch' || asset.assetId))
    )
  })

  // Methods for offering assets
  const addOfferingAsset = () => {
    offeringAssets.push({
      assetId: '',
      amount: 0,
      type: 'xch',
      symbol: '',
      searchQuery: '',
      showDropdown: false,
    })
  }

  const removeOfferingAsset = (index: number) => {
    offeringAssets.splice(index, 1)
  }

  const updateOfferingAsset = (index: number, field: keyof AssetItem, value: string | number) => {
    offeringAssets[index][field] = value as never
  }

  // Methods for requested assets
  const addRequestedAsset = () => {
    requestedAssets.push({
      assetId: '',
      amount: 0,
      type: 'xch',
      symbol: '',
      searchQuery: '',
      showDropdown: false,
    })
  }

  const removeRequestedAsset = (index: number) => {
    requestedAssets.splice(index, 1)
  }

  const updateRequestedAsset = (index: number, field: keyof AssetItem, value: string | number) => {
    requestedAssets[index][field] = value as never
  }

  // Asset selection methods
  const clearAssetSelection = (asset: AssetItem) => {
    asset.assetId = ''
    asset.symbol = ''
    asset.searchQuery = ''
    asset.showDropdown = false
  }

  const selectCatToken = (
    asset: AssetItem,
    token: { assetId: string; ticker: string; name: string }
  ) => {
    asset.assetId = token.assetId
    asset.symbol = token.ticker
    asset.searchQuery = token.ticker
    asset.showDropdown = false
  }

  const handleBlur = (asset: AssetItem) => {
    setTimeout(() => {
      asset.showDropdown = false
    }, 200)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid.value) return

    isSubmitting.value = true
    try {
      emit('submit', {
        offeringAssets: [...offeringAssets],
        requestedAssets: [...requestedAssets],
        priceAdjustment: priceAdjustment.value,
        mode: props.mode,
      })
    } finally {
      isSubmitting.value = false
    }
  }

  // Watch for prop changes to update local state
  watch(
    () => props.initialOfferingAssets,
    newAssets => {
      offeringAssets.splice(0, offeringAssets.length, ...newAssets)
    },
    { deep: true }
  )

  watch(
    () => props.initialRequestedAssets,
    newAssets => {
      requestedAssets.splice(0, requestedAssets.length, ...newAssets)
    },
    { deep: true }
  )

  watch(
    () => props.initialPriceAdjustment,
    newAdjustment => {
      priceAdjustment.value = newAdjustment
    }
  )
</script>
