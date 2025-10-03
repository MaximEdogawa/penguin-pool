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
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ offer.fee }} XCH</p>
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
                {{ offer.creatorAddress }}
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
  import { useOfferStorage } from '@/shared/composables/useOfferStorage'
  import { useTickerMapping } from '@/shared/composables/useTickerMapping'
  import { formatAssetAmount } from '@/shared/utils/chia-units'
  import type { OfferDetails } from '@/types/offer.types'
  import { ref } from 'vue'

  interface Props {
    offer: OfferDetails
  }

  interface Emits {
    (e: 'close'): void
    (e: 'offer-cancelled', offer: OfferDetails): void
    (e: 'offer-deleted', offer: OfferDetails): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Services
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()
  const { getTickerSymbol } = useTickerMapping()

  // State
  const isCancelling = ref(false)
  const isDeleting = ref(false)
  const isCopied = ref(false)
  const showCancelConfirmation = ref(false)
  const showDeleteConfirmation = ref(false)
  const cancelError = ref('')
  const deleteError = ref('')

  // Methods
  const getStatusClass = (status: string) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    }
    return classes[status as keyof typeof classes] || classes.pending
  }

  const formatDate = (date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
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
</script>
