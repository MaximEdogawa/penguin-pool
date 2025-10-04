<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Offer Details</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <div v-if="offer" class="space-y-6">
          <!-- Status and Trade ID -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center space-x-3">
              <span
                :class="getStatusClass(offer.status)"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ offer.status.toUpperCase() }}
              </span>
              <span
                v-if="
                  offer.uploadedToDexie &&
                  offer.dexieStatus !== undefined &&
                  offer.dexieStatus !== null
                "
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              >
                Dexie: {{ getDexieStatusDescription(offer.dexieStatus || 0) }}
              </span>
            </div>
            <div class="flex flex-col sm:items-end">
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Offer ID</p>
              <button
                @click="copyOfferId"
                class="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[200px] sm:max-w-[250px]"
                :title="isCopied ? 'Copied!' : 'Click to copy offer ID'"
                :class="{
                  'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300': isCopied,
                  'hover:scale-105': !isCopied,
                }"
              >
                <span
                  class="transition-all duration-300 truncate block"
                  :class="{
                    'animate-pulse': isCopied,
                  }"
                >
                  {{ offer.tradeId?.slice(0, 12) || 'Unknown' }}...
                </span>
                <!-- Animated background effect -->
                <div
                  v-if="isCopied"
                  class="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded"
                ></div>
              </button>
            </div>
          </div>

          <!-- Assets Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Assets Offered -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Assets Offered ({{ (offer.assetsOffered || []).length }})
              </h3>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="(asset, index) in offer.assetsOffered || []"
                  :key="`offered-${index}`"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900 dark:text-white text-lg">
                        {{ formatAssetAmount(asset.amount, asset.type) }}
                      </span>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {{
                          asset.assetId
                            ? getTickerSymbol(asset.assetId)
                            : asset.symbol || asset.type.toUpperCase()
                        }}
                      </span>
                    </div>
                    <div v-if="asset.assetId" class="mt-1">
                      <p class="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                        {{ getTickerSymbol(asset.assetId) }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                    >
                      {{ asset.type.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Assets Requested -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Assets Requested ({{ (offer.assetsRequested || []).length }})
              </h3>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="(asset, index) in offer.assetsRequested || []"
                  :key="`requested-${index}`"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900 dark:text-white text-lg">
                        {{ formatAssetAmount(asset.amount, asset.type) }}
                      </span>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {{
                          asset.assetId
                            ? getTickerSymbol(asset.assetId)
                            : asset.symbol || asset.type.toUpperCase()
                        }}
                      </span>
                    </div>
                    <div v-if="asset.assetId" class="mt-1">
                      <p class="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                        {{ getTickerSymbol(asset.assetId) }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    >
                      {{ asset.type.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Offer String -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Offer String</h3>
            <div class="relative">
              <textarea
                :value="offer.offerString"
                readonly
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono resize-none"
              ></textarea>
              <button
                @click="copyOfferString"
                class="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                :title="isCopied ? 'Copied!' : 'Copy offer string'"
              >
                <i :class="isCopied ? 'pi pi-check' : 'pi pi-copy'"></i>
              </button>
            </div>
          </div>

          <!-- Offer Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Fee
              </h4>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ offer.fee || 0 }} XCH
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</h4>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(offer.createdAt) }}
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Creator Address
              </h4>
              <p class="text-sm text-gray-900 dark:text-white font-mono break-all">
                {{ offer.creatorAddress || 'Unknown' }}
              </p>
            </div>
            <div v-if="offer.expiresAt">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expires</h4>
              <p class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(offer.expiresAt) }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              @click="$emit('close')"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
            >
              Close
            </button>
            <button
              @click="deleteOffer"
              :disabled="isDeleting"
              class="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
            >
              <i v-if="isDeleting" class="pi pi-spin pi-spinner mr-1.5 text-xs"></i>
              <i v-else class="pi pi-trash mr-1.5 text-xs"></i>
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
            <button
              v-if="offer.status === 'active'"
              @click="cancelOffer"
              :disabled="isCancelling"
              class="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
            >
              <i v-if="isCancelling" class="pi pi-spin pi-spinner mr-1.5 text-xs"></i>
              <i v-else class="pi pi-times mr-1.5 text-xs"></i>
              {{ isCancelling ? 'Cancelling...' : 'Cancel' }}
            </button>
            <!-- Show upload button if no Dexie ID -->
            <button
              v-if="!offer.dexieOfferId && offer.offerString"
              @click="uploadToDexie"
              :disabled="isUploading"
              class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
            >
              <i v-if="isUploading" class="pi pi-spin pi-spinner mr-1.5 text-xs"></i>
              <i v-else class="pi pi-upload mr-1.5 text-xs"></i>
              {{ isUploading ? 'Uploading...' : 'Upload to Dexie' }}
            </button>

            <!-- Show Dexie actions if ID exists -->
            <template v-if="offer.dexieOfferId">
              <button
                @click="handleValidateOfferState"
                :disabled="isValidating"
                class="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
              >
                <i v-if="isValidating" class="pi pi-spin pi-spinner mr-1.5 text-xs"></i>
                <i v-else class="pi pi-refresh mr-1.5 text-xs"></i>
                {{ isValidating ? 'Validating...' : 'Validate State' }}
              </button>
              <button
                @click="
                  isStateValidating ? handleStopStateValidation() : handleStartStateValidation()
                "
                :disabled="isValidating"
                class="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
              >
                <i v-if="isStateValidating" class="pi pi-spin pi-spinner mr-1.5 text-xs"></i>
                <i v-else class="pi pi-play mr-1.5 text-xs"></i>
                {{ isStateValidating ? 'Stop Monitoring' : 'Monitor State' }}
              </button>
              <a
                :href="`https://testnet.dexie.space/offers/${offer.dexieOfferId}`"
                target="_blank"
                class="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
              >
                <i class="pi pi-external-link mr-1.5 text-xs"></i>
                View on Dexie
              </a>
            </template>
          </div>

          <!-- Upload Success Display -->
          <div
            v-if="offer.dexieOfferId"
            class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
          >
            <div class="flex items-start">
              <i class="pi pi-check-circle text-green-500 mr-3 mt-0.5"></i>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  ✅ Successfully uploaded to Dexie!
                </h4>
                <p class="text-sm text-green-700 dark:text-green-300 mb-3">
                  Your offer is now live on the Dexie marketplace and can be discovered by other
                  traders.
                </p>
                <a
                  :href="`https://testnet.dexie.space/offers/${offer.dexieOfferId}`"
                  target="_blank"
                  class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <i class="pi pi-external-link mr-2"></i>
                  View on Dexie.space
                </a>
              </div>
            </div>
          </div>

          <!-- Upload Error Display -->
          <div
            v-if="uploadError"
            class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <div class="flex items-center">
              <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
              <span class="text-sm text-red-700 dark:text-red-300">{{ uploadError }}</span>
            </div>
          </div>

          <!-- Validation Error Display -->
          <div
            v-if="validationError"
            class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <div class="flex items-center">
              <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
              <span class="text-sm text-red-700 dark:text-red-300">{{ validationError }}</span>
            </div>
          </div>

          <!-- State Validation Error Display -->
          <div
            v-if="stateValidationError"
            class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <div class="flex items-center">
              <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
              <span class="text-sm text-red-700 dark:text-red-300">{{ stateValidationError }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialogs -->
    <ConfirmationDialog
      v-if="showCancelConfirmation"
      title="Cancel Offer"
      message="Are you sure you want to cancel this offer? This action cannot be undone."
      :details="`Offer ID: ${offer.tradeId}`"
      :error-message="cancelError"
      confirm-text="Cancel Offer"
      cancel-text="Keep Offer"
      :is-loading="isCancelling"
      @close="handleCancelDialogClose"
      @confirm="confirmCancelOffer"
    />

    <ConfirmationDialog
      v-if="showDeleteConfirmation"
      title="Delete Offer"
      message="Are you sure you want to permanently delete this offer? This action cannot be undone and the offer will be removed from your list."
      :details="`Offer ID: ${offer.tradeId}`"
      :error-message="deleteError"
      confirm-text="Delete Offer"
      cancel-text="Keep Offer"
      :is-loading="isDeleting"
      @close="handleDeleteDialogClose"
      @confirm="confirmDeleteOffer"
    />
  </div>
</template>

<script setup lang="ts">
  import ConfirmationDialog from '@/components/Shared/ConfirmationDialog.vue'
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { useOfferInspection } from '@/shared/composables/useOfferInspection'
  import { useOfferStateValidation } from '@/shared/composables/useOfferStateValidation'
  import { useOfferStorage } from '@/shared/composables/useOfferStorage'
  import { useOfferValidation } from '@/shared/composables/useOfferValidation'
  import { useTickerMapping } from '@/shared/composables/useTickerMapping'
  import { calculateOfferState } from '@/shared/repositories/DexieRepository'
  import { getDexieStatusDescription } from '@/shared/services/DexieDataService'
  import { formatAssetAmount } from '@/shared/utils/chia-units'
  import type { OfferDetails } from '@/types/offer.types'
  import { convertOfferStateToStatus } from '@/types/offer.types'
  import { ref } from 'vue'

  interface Props {
    offer: OfferDetails
  }

  interface Emits {
    (e: 'close'): void
    (e: 'offer-cancelled', offer: OfferDetails): void
    (e: 'offer-deleted', offer: OfferDetails): void
    (e: 'offer-updated', offer: OfferDetails): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Services
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()
  const { getTickerSymbol } = useTickerMapping()
  const { postOffer } = useOfferInspection()
  const { validateOfferState } = useOfferValidation()
  const { startValidation, stopValidation, shouldContinueValidation } = useOfferStateValidation()

  // State
  const isCancelling = ref(false)
  const isDeleting = ref(false)
  const isUploading = ref(false)
  const isValidating = ref(false)
  const isStateValidating = ref(false)
  const isCopied = ref(false)
  const showCancelConfirmation = ref(false)
  const showDeleteConfirmation = ref(false)
  const cancelError = ref('')
  const deleteError = ref('')
  const uploadError = ref('')
  const validationError = ref('')
  const stateValidationError = ref('')

  // Methods
  const getStatusClass = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'

    const classes = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    }
    return classes[status as keyof typeof classes] || classes.pending
  }

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'Unknown'
    try {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    } catch {
      return 'Invalid Date'
    }
  }

  const copyOfferString = async () => {
    try {
      await navigator.clipboard.writeText(props.offer.offerString)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    } catch {
      // Failed to copy offer string
    }
  }

  const copyOfferId = async () => {
    try {
      await navigator.clipboard.writeText(props.offer.tradeId)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    } catch {
      // Failed to copy offer ID
    }
  }

  const cancelOffer = () => {
    showCancelConfirmation.value = true
  }

  const confirmCancelOffer = async () => {
    isCancelling.value = true
    cancelError.value = '' // Clear any previous errors

    try {
      await walletDataService.cancelOffer({
        id: props.offer.tradeId,
        fee: props.offer.fee,
      })

      // Update the offer status in IndexedDB
      await offerStorage.updateOffer(props.offer.id, { status: 'cancelled' })

      const updatedOffer = { ...props.offer, status: 'cancelled' as const }
      emit('offer-cancelled', updatedOffer)
      showCancelConfirmation.value = false
    } catch (error) {
      // Failed to cancel offer
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      cancelError.value = `Failed to cancel offer: ${errorMsg}`
    } finally {
      isCancelling.value = false
    }
  }

  const deleteOffer = () => {
    showDeleteConfirmation.value = true
  }

  const handleCancelDialogClose = () => {
    showCancelConfirmation.value = false
    cancelError.value = '' // Clear error when closing dialog
  }

  const handleDeleteDialogClose = () => {
    showDeleteConfirmation.value = false
    deleteError.value = '' // Clear error when closing dialog
  }

  const confirmDeleteOffer = async () => {
    isDeleting.value = true
    deleteError.value = '' // Clear any previous errors

    try {
      // Delete from IndexedDB storage
      await offerStorage.deleteOffer(props.offer.id)

      // Emit the delete event to update the parent component
      emit('offer-deleted', props.offer)
      showDeleteConfirmation.value = false
    } catch (error) {
      // Failed to delete offer
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      deleteError.value = `Failed to delete offer: ${errorMsg}`
    } finally {
      isDeleting.value = false
    }
  }

  const uploadToDexie = async () => {
    if (!props.offer.offerString) {
      uploadError.value = 'No offer string available to upload'
      return
    }

    isUploading.value = true
    uploadError.value = ''

    try {
      // Step 1: Upload offer to Dexie
      const uploadResult = await postOffer({
        offer: props.offer.offerString,
        drop_only: false,
        claim_rewards: false,
      })

      if (!uploadResult || !uploadResult.success) {
        uploadError.value = 'Failed to upload offer to Dexie - no success response'
        return
      }

      // Step 2: Extract offer data from the response
      const dexieOfferId = uploadResult.id
      const dexieOfferData = uploadResult.offer

      if (!dexieOfferId || !dexieOfferData) {
        uploadError.value = 'Upload successful but no offer ID or data returned'
        return
      }

      // Step 3: Calculate state from the offer data
      const calculatedState = calculateOfferState(dexieOfferData)

      // Step 4: Update the offer in IndexedDB with Dexie information
      await offerStorage.updateOffer(props.offer.id, {
        dexieOfferId: dexieOfferId,
        dexieStatus: calculatedState,
        uploadedToDexie: true,
        // Store additional Dexie data for future reference
        dexieOfferData: dexieOfferData,
      })

      // Emit event to update parent component
      const updatedOffer = {
        ...props.offer,
        dexieOfferId: dexieOfferId,
        dexieStatus: calculatedState,
        uploadedToDexie: true,
        dexieOfferData: dexieOfferData,
      }
      emit('offer-updated', updatedOffer)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      uploadError.value = `Failed to upload to Dexie: ${errorMsg}`
    } finally {
      isUploading.value = false
    }
  }

  const handleValidateOfferState = async () => {
    if (!props.offer.dexieOfferId) {
      validationError.value = 'No Dexie offer ID available for validation'
      return
    }

    isValidating.value = true
    validationError.value = ''

    try {
      const result = await validateOfferState(props.offer.dexieOfferId)

      if (result && result.success && result.offer) {
        // Calculate state from date fields instead of using status field
        const calculatedState = calculateOfferState(result.offer)

        // Update the offer with the latest Dexie status
        await offerStorage.updateOffer(props.offer.id, {
          dexieStatus: calculatedState,
          status: convertOfferStateToAppStatus(calculatedState),
        })

        // Emit event to update parent component
        const updatedOffer = {
          ...props.offer,
          dexieStatus: calculatedState,
          status: convertOfferStateToAppStatus(calculatedState),
        }
        emit('offer-updated', updatedOffer)
      } else {
        validationError.value = 'Failed to validate offer state - no data returned'
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      validationError.value = `Failed to validate offer: ${errorMsg}`
    } finally {
      isValidating.value = false
    }
  }

  const handleStartStateValidation = async () => {
    if (!props.offer.dexieOfferId) {
      stateValidationError.value = 'No Dexie offer ID available for state validation'
      return
    }

    isStateValidating.value = true
    stateValidationError.value = ''

    try {
      // Start the continuous validation with callbacks
      await startValidation(
        props.offer.dexieOfferId,
        // onUpdate callback
        data => {
          if (data && data.success && data.offer) {
            // Calculate state from date fields instead of using status field
            const calculatedState = calculateOfferState(data.offer)

            // Update the offer with the latest status
            offerStorage.updateOffer(props.offer.id, {
              dexieStatus: calculatedState,
              status: convertOfferStateToAppStatus(calculatedState),
            })

            // Emit event to update parent component
            const updatedOffer = {
              ...props.offer,
              dexieStatus: calculatedState,
              status: convertOfferStateToAppStatus(calculatedState),
            }
            emit('offer-updated', updatedOffer)

            // Check if we should stop validation
            if (!shouldContinueValidation(calculatedState)) {
              stopValidation(props.offer.dexieOfferId)
              isStateValidating.value = false
            }
          }
        },
        // onError callback
        error => {
          stateValidationError.value = `State validation error: ${error.message}`
          isStateValidating.value = false
        }
      )
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      stateValidationError.value = `Failed to start state validation: ${errorMsg}`
      isStateValidating.value = false
    }
  }

  const handleStopStateValidation = () => {
    if (props.offer.dexieOfferId) {
      stopValidation(props.offer.dexieOfferId)
    }
    isStateValidating.value = false
    stateValidationError.value = ''
  }

  const convertOfferStateToAppStatus = convertOfferStateToStatus
</script>
