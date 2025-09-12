<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Create Offer</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Assets Offered Section -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Assets I'm Offering
            </h3>
            <div class="space-y-3">
              <div
                v-for="(asset, index) in form.assetsOffered"
                :key="`offered-${index}`"
                class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div class="flex-1">
                  <select
                    v-model="asset.type"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="xch">XCH (Chia)</option>
                    <option value="cat">CAT Token</option>
                    <option value="nft">NFT</option>
                  </select>
                </div>
                <div class="flex-1">
                  <input
                    v-model="asset.assetId"
                    type="text"
                    :placeholder="asset.type === 'xch' ? 'XCH (leave empty)' : 'Asset ID'"
                    :disabled="asset.type === 'xch'"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                <div class="flex-1">
                  <input
                    v-model.number="asset.amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="Amount"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div class="flex-1">
                  <input
                    v-model="asset.symbol"
                    type="text"
                    placeholder="Symbol (optional)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <button
                  @click="removeOfferedAsset(index)"
                  type="button"
                  class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
              <button
                @click="addOfferedAsset"
                type="button"
                class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <i class="pi pi-plus mr-2"></i>
                Add Asset
              </button>
            </div>
          </div>

          <!-- Assets Requested Section -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Assets I Want</h3>
            <div class="space-y-3">
              <div
                v-for="(asset, index) in form.assetsRequested"
                :key="`requested-${index}`"
                class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div class="flex-1">
                  <select
                    v-model="asset.type"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="xch">XCH (Chia)</option>
                    <option value="cat">CAT Token</option>
                    <option value="nft">NFT</option>
                  </select>
                </div>
                <div class="flex-1">
                  <input
                    v-model="asset.assetId"
                    type="text"
                    :placeholder="asset.type === 'xch' ? 'XCH (leave empty)' : 'Asset ID'"
                    :disabled="asset.type === 'xch'"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                <div class="flex-1">
                  <input
                    v-model.number="asset.amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="Amount"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div class="flex-1">
                  <input
                    v-model="asset.symbol"
                    type="text"
                    placeholder="Symbol (optional)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <button
                  @click="removeRequestedAsset(index)"
                  type="button"
                  class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
              <button
                @click="addRequestedAsset"
                type="button"
                class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <i class="pi pi-plus mr-2"></i>
                Add Asset
              </button>
            </div>
          </div>

          <!-- Offer Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Fee
              </label>
              <input
                v-model.number="form.fee"
                type="number"
                step="0.000001"
                min="0.000001"
                placeholder="0.000001"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiration (hours)
              </label>
              <input
                v-model.number="form.expirationHours"
                type="number"
                min="1"
                max="168"
                placeholder="24"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Memo (optional)
            </label>
            <textarea
              v-model="form.memo"
              rows="3"
              placeholder="Add a description for this offer..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            ></textarea>
          </div>

          <!-- Offer Summary -->
          <div
            v-if="form.assetsOffered.length > 0 && form.assetsRequested.length > 0"
            class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
          >
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offer Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Offering:</span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    form.assetsOffered
                      .map(a => `${a.amount} ${a.symbol || a.type.toUpperCase()}`)
                      .join(', ')
                  }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Requesting:</span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    form.assetsRequested
                      .map(a => `${a.amount} ${a.symbol || a.type.toUpperCase()}`)
                      .join(', ')
                  }}
                </span>
              </div>
              <div class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                <span class="font-medium text-gray-700 dark:text-gray-300">Fee:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ form.fee }} XCH</span>
              </div>
            </div>
          </div>

          <!-- Error/Success Messages -->
          <div
            v-if="errorMessage"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-center">
              <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2"></i>
              <p class="text-red-800 dark:text-red-200">{{ errorMessage }}</p>
            </div>
          </div>

          <div
            v-if="successMessage"
            class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div class="flex items-center">
              <i class="pi pi-check-circle text-green-600 dark:text-green-400 mr-2"></i>
              <p class="text-green-800 dark:text-green-200">{{ successMessage }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center"
            >
              <i v-if="isSubmitting" class="pi pi-spin pi-spinner mr-2"></i>
              <i v-else class="pi pi-plus mr-2"></i>
              {{ isSubmitting ? 'Creating...' : 'Create Offer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { createOffer } from '@/features/walletConnect/queries/walletQueries'
  import type { CreateOfferForm, OfferDetails } from '@/types/offer.types'
  import { computed, reactive, ref } from 'vue'

  interface Emits {
    (e: 'close'): void
    (e: 'offer-created', offer: OfferDetails): void
  }

  const emit = defineEmits<Emits>()

  // Form state
  const form = reactive<CreateOfferForm>({
    assetsOffered: [],
    assetsRequested: [],
    fee: 0.000001,
    memo: '',
    expirationHours: 24,
  })

  // UI state
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // Computed
  const isFormValid = computed(() => {
    return (
      form.assetsOffered.length > 0 &&
      form.assetsRequested.length > 0 &&
      form.assetsOffered.every(
        asset => asset.amount > 0 && (asset.type === 'xch' || asset.assetId)
      ) &&
      form.assetsRequested.every(
        asset => asset.amount > 0 && (asset.type === 'xch' || asset.assetId)
      ) &&
      form.fee > 0
    )
  })

  // Methods
  const addOfferedAsset = () => {
    form.assetsOffered.push({
      assetId: '',
      amount: 0,
      type: 'xch',
      symbol: '',
    })
  }

  const removeOfferedAsset = (index: number) => {
    form.assetsOffered.splice(index, 1)
  }

  const addRequestedAsset = () => {
    form.assetsRequested.push({
      assetId: '',
      amount: 0,
      type: 'xch',
      symbol: '',
    })
  }

  const removeRequestedAsset = (index: number) => {
    form.assetsRequested.splice(index, 1)
  }

  const handleSubmit = async () => {
    errorMessage.value = ''
    successMessage.value = ''

    if (!isFormValid.value) {
      errorMessage.value = 'Please fill in all required fields'
      return
    }

    isSubmitting.value = true

    try {
      // Convert form assets to the format expected by the wallet
      const offerAssets = form.assetsOffered.map(asset => ({
        assetId: asset.type === 'xch' ? '' : asset.assetId,
        amount: Math.floor(asset.amount * 1000000000000), // Convert to mojos
      }))

      const requestAssets = form.assetsRequested.map(asset => ({
        assetId: asset.type === 'xch' ? '' : asset.assetId,
        amount: Math.floor(asset.amount * 1000000000000), // Convert to mojos
      }))

      const result = await createOffer({
        walletId: 1,
        offerAssets,
        requestAssets,
        fee: Math.floor(form.fee * 1000000000000), // Convert to mojos
      })

      if (result.success && result.data) {
        const newOffer: OfferDetails = {
          id: result.data.id || Date.now().toString(),
          tradeId: result.data.id || 'unknown', // Use the id from wallet response as tradeId
          offerString: result.data.offer || '',
          status: 'active',
          createdAt: new Date(),
          assetsOffered: form.assetsOffered.map(asset => ({
            assetId: asset.assetId || '',
            amount: asset.amount,
            type: asset.type,
            symbol: asset.symbol || asset.type.toUpperCase(),
          })),
          assetsRequested: form.assetsRequested.map(asset => ({
            assetId: asset.assetId || '',
            amount: asset.amount,
            type: asset.type,
            symbol: asset.symbol || asset.type.toUpperCase(),
          })),
          fee: form.fee,
          creatorAddress: 'xch1current_user_address', // This would come from wallet
        }

        successMessage.value = 'Offer created successfully!'
        emit('offer-created', newOffer)

        // Reset form
        form.assetsOffered = []
        form.assetsRequested = []
        form.fee = 0.000001
        form.memo = ''
        form.expirationHours = 24
      } else {
        throw new Error(result.error || 'Failed to create offer')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      errorMessage.value = `Failed to create offer: ${errorMsg}`
    } finally {
      isSubmitting.value = false
    }
  }

  // Initialize with one asset in each section
  addOfferedAsset()
  addRequestedAsset()
</script>

<style scoped>
  /* Custom scrollbar for modal */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-600 rounded;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-500 rounded;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-400;
  }
</style>
