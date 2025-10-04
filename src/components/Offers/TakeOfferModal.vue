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
            <p v-if="parseError" class="mt-1 text-xs text-red-500 dark:text-red-400">
              {{ parseError }}
            </p>
            <div v-if="offerInspection.isInspecting.value" class="mt-2 flex items-center">
              <i class="pi pi-spinner pi-spin text-blue-600 dark:text-blue-400 mr-2 text-xs"></i>
              <p class="text-xs text-blue-600 dark:text-blue-400">
                Processing offer with Dexie marketplace...
              </p>
            </div>
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
              min="0"
              placeholder="0.000001"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Fee can be 0 for free transactions
            </p>
          </div>

          <!-- Offer Preview (if valid) -->
          <div v-if="offerPreview" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Offer Preview</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">You will receive:</span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    offerPreview.assetsOffered?.length
                      ? offerPreview.assetsOffered
                          .map(
                            a =>
                              `${formatAssetAmount(a.amount, a.type)} ${a.symbol || a.type.toUpperCase()}`
                          )
                          .join(', ')
                      : 'Assets from offer'
                  }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">You will pay:</span>
                <span class="text-gray-900 dark:text-white">
                  {{
                    offerPreview.assetsRequested?.length
                      ? offerPreview.assetsRequested
                          .map(
                            a =>
                              `${formatAssetAmount(a.amount, a.type)} ${a.symbol || a.type.toUpperCase()}`
                          )
                          .join(', ')
                      : 'Assets to offer creator'
                  }}
                </span>
              </div>
              <div class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                <span class="font-medium text-gray-700 dark:text-gray-300">Fee:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ offerPreview.fee !== undefined ? offerPreview.fee : form.fee }} XCH
                </span>
              </div>
              <div
                v-if="offerPreview.dexieStatus !== undefined"
                class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2"
              >
                <span class="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ getDexieStatusDescription(offerPreview.dexieStatus) }}
                </span>
              </div>
              <div
                v-if="offerPreview.creatorAddress"
                class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2"
              >
                <span class="font-medium text-gray-700 dark:text-gray-300">Creator:</span>
                <span class="font-medium text-gray-900 dark:text-white text-xs">
                  {{ offerPreview.creatorAddress.slice(0, 8) }}...{{
                    offerPreview.creatorAddress.slice(-8)
                  }}
                </span>
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
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { useOfferInspection } from '@/shared/composables/useOfferInspection'
  import {
    convertDexieOfferToAppOffer,
    getDexieStatusDescription,
  } from '@/shared/services/DexieDataService'
  import { formatAssetAmount } from '@/shared/utils/chia-units'
  import { isValidOfferString } from '@/shared/utils/offer-parser'
  import type { OfferAsset, OfferDetails } from '@/types/offer.types'
  import { computed, reactive, ref, watch } from 'vue'

  interface Emits {
    (e: 'close'): void
    (e: 'offer-taken', offer: OfferDetails): void
  }

  const emit = defineEmits<Emits>()

  // Services
  const walletDataService = useWalletDataService()
  const offerInspection = useOfferInspection()

  // Form state
  const form = reactive({
    offerString: '',
    fee: 0,
  })

  // UI state
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const offerPreview = ref<{
    assetsOffered?: OfferAsset[]
    assetsRequested?: OfferAsset[]
    creatorAddress?: string
    fee?: number
    status?: string
    dexieStatus?: number
  } | null>(null)
  const parseError = ref('')

  // Computed
  const isFormValid = computed(() => {
    return (
      form.offerString.trim().length > 0 &&
      form.fee >= 0 &&
      (!parseError.value || parseError.value.includes('validated'))
    )
  })

  // Methods
  const parseOffer = async (offerString: string) => {
    parseError.value = ''

    if (!offerString.trim()) {
      offerPreview.value = null
      return
    }

    if (!isValidOfferString(offerString)) {
      parseError.value = 'Invalid offer string format'
      offerPreview.value = null
      return
    }

    // Use Dexie to inspect the offer and get real asset details
    try {
      // First POST the offer to Dexie to get the Dexie ID
      const postResponse = await offerInspection.postOffer({
        offer: offerString.trim(),
        drop_only: false,
        claim_rewards: false,
      })

      if (postResponse && postResponse.success && postResponse.offer) {
        // The POST response contains the full offer data - use it directly
        const appOffer = convertDexieOfferToAppOffer(postResponse)

        offerPreview.value = {
          assetsOffered: appOffer.assetsOffered,
          assetsRequested: appOffer.assetsRequested,
          creatorAddress: appOffer.creatorAddress,
          fee: appOffer.fee,
          status: appOffer.status,
          dexieStatus: appOffer.dexieStatus,
        }
        parseError.value = ''
        return
      } else if (postResponse && postResponse.success && postResponse.id) {
        // Handle case where POST only returns ID (older API behavior)
        const dexieResponse = await offerInspection.inspectOffer(postResponse.id)

        if (dexieResponse && dexieResponse.success) {
          const appOffer = convertDexieOfferToAppOffer(dexieResponse)

          offerPreview.value = {
            assetsOffered: appOffer.assetsOffered,
            assetsRequested: appOffer.assetsRequested,
            creatorAddress: appOffer.creatorAddress,
            fee: appOffer.fee,
            status: appOffer.status,
            dexieStatus: appOffer.dexieStatus,
          }
          parseError.value = ''
          return
        }
      }
    } catch {
      parseError.value = 'Error inspecting offer on Dexie marketplace'
      offerPreview.value = null
      return
    }

    // If Dexie inspection failed, show basic validation
    parseError.value = 'Offer string validated - details will be confirmed by wallet'
    offerPreview.value = {
      assetsOffered: [],
      assetsRequested: [],
      creatorAddress: undefined,
      fee: undefined,
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
      const result = await walletDataService.takeOffer({
        offer: form.offerString.trim(),
        fee: form.fee,
      })

      if (result?.success && result?.tradeId) {
        const takenOffer: OfferDetails = {
          id: Date.now().toString(),
          tradeId: result!.tradeId,
          offerString: form.offerString.trim(),
          status: 'pending',
          createdAt: new Date(),
          assetsOffered: offerPreview.value?.assetsOffered || [],
          assetsRequested: offerPreview.value?.assetsRequested || [],
          fee: offerPreview.value?.fee || form.fee,
          creatorAddress: offerPreview.value?.creatorAddress || 'unknown',
        }

        successMessage.value = 'Offer taken successfully!'
        emit('offer-taken', takenOffer)

        // Reset form
        form.offerString = ''
        form.fee = 0
        offerPreview.value = null
      } else {
        throw new Error('Failed to take offer')
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
    async newValue => {
      await parseOffer(newValue)
    }
  )
</script>
