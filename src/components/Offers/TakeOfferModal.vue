<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Take Offer</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Offer String Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Offer String
            </label>
            <textarea
              v-model="form.offerString"
              rows="4"
              placeholder="Paste the offer string here..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              required
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Paste the complete offer string from the offer creator
            </p>
          </div>

          <!-- Transaction Fee -->
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
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum fee: 0.000001 XCH</p>
          </div>

          <!-- Offer Preview (if valid) -->
          <div v-if="offerPreview" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Offer Preview</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">You will receive:</span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    offerPreview.assetsOffered
                      ?.map(a => `${a.amount} ${a.symbol || a.type.toUpperCase()}`)
                      .join(', ') || 'Unknown'
                  }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">You will pay:</span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    offerPreview.assetsRequested
                      ?.map(a => `${a.amount} ${a.symbol || a.type.toUpperCase()}`)
                      .join(', ') || 'Unknown'
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
              <i v-else class="pi pi-shopping-cart mr-2"></i>
              {{ isSubmitting ? 'Taking...' : 'Take Offer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { takeOffer } from '@/features/walletConnect/queries/walletQueries'
  import type { OfferAsset, OfferDetails } from '@/types/offer.types'
  import { computed, reactive, ref, watch } from 'vue'

  interface Emits {
    (e: 'close'): void
    (e: 'offer-taken', offer: OfferDetails): void
  }

  const emit = defineEmits<Emits>()

  // Form state
  const form = reactive({
    offerString: '',
    fee: 0.000001,
  })

  // UI state
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const offerPreview = ref<{
    assetsOffered?: OfferAsset[]
    assetsRequested?: OfferAsset[]
  } | null>(null)

  // Computed
  const isFormValid = computed(() => {
    return form.offerString.trim().length > 0 && form.fee > 0
  })

  // Methods
  const parseOfferString = (offerString: string) => {
    // This is a simplified parser - in a real implementation, you'd parse the actual offer format
    // For now, we'll just return a mock preview
    try {
      if (offerString.length > 10) {
        return {
          assetsOffered: [{ assetId: 'xch', amount: 1.0, type: 'xch' as const, symbol: 'XCH' }],
          assetsRequested: [
            { assetId: 'cat123', amount: 100, type: 'cat' as const, symbol: 'TOKEN' },
          ],
        }
      }
      return null
    } catch (error) {
      console.error('Failed to parse offer string:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    errorMessage.value = ''
    successMessage.value = ''

    if (!isFormValid.value) {
      errorMessage.value = 'Please enter a valid offer string and fee'
      return
    }

    isSubmitting.value = true

    try {
      const result = await takeOffer({
        offer: form.offerString.trim(),
        fee: form.fee,
      })

      if (result.success && result.data) {
        const takenOffer: OfferDetails = {
          id: Date.now().toString(),
          tradeId: result.data.tradeId,
          offerString: form.offerString.trim(),
          status: result.data.success ? 'completed' : 'pending',
          createdAt: new Date(),
          assetsOffered: offerPreview.value?.assetsOffered || [],
          assetsRequested: offerPreview.value?.assetsRequested || [],
          fee: form.fee,
          creatorAddress: 'xch1offer_creator', // This would come from the offer
        }

        successMessage.value = 'Offer taken successfully!'
        emit('offer-taken', takenOffer)

        // Reset form
        form.offerString = ''
        form.fee = 0.000001
        offerPreview.value = null
      } else {
        throw new Error(result.error || 'Failed to take offer')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      errorMessage.value = `Failed to take offer: ${errorMsg}`
    } finally {
      isSubmitting.value = false
    }
  }

  // Watch for offer string changes to update preview
  watch(
    () => form.offerString,
    newValue => {
      if (newValue.trim().length > 10) {
        offerPreview.value = parseOfferString(newValue)
      } else {
        offerPreview.value = null
      }
    }
  )
</script>
