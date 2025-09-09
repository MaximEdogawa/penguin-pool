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
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span
                :class="getStatusClass(offer.status)"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ offer.status.toUpperCase() }}
              </span>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500 dark:text-gray-400">Offer ID</p>
              <button
                @click="copyOfferId"
                class="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden"
                :title="isCopied ? 'Copied!' : 'Click to copy offer ID'"
                :class="{
                  'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300': isCopied,
                  'hover:scale-105': !isCopied,
                }"
              >
                <span
                  class="transition-all duration-300"
                  :class="{
                    'animate-pulse': isCopied,
                  }"
                >
                  {{ offer.tradeId }}
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
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Assets Offered</h3>
              <div class="space-y-2">
                <div
                  v-for="(asset, index) in offer.assetsOffered"
                  :key="`offered-${index}`"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ asset.amount }} {{ asset.symbol || asset.type.toUpperCase() }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ asset.assetId }}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {{ asset.type.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Assets Requested -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Assets Requested
              </h3>
              <div class="space-y-2">
                <div
                  v-for="(asset, index) in offer.assetsRequested"
                  :key="`requested-${index}`"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ asset.amount }} {{ asset.symbol || asset.type.toUpperCase() }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ asset.assetId }}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="text-sm text-gray-500 dark:text-gray-400">
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
              <p class="text-sm text-gray-900 dark:text-white font-mono">
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
            class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
            <button
              v-if="offer.status === 'active'"
              @click="cancelOffer"
              :disabled="isCancelling"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center"
            >
              <i v-if="isCancelling" class="pi pi-spin pi-spinner mr-2"></i>
              <i v-else class="pi pi-times mr-2"></i>
              {{ isCancelling ? 'Cancelling...' : 'Cancel Offer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { cancelOffer as cancelOfferRequest } from '@/features/walletConnect/queries/walletQueries'
  import type { OfferDetails } from '@/types/offer.types'
  import { ref } from 'vue'

  interface Props {
    offer: OfferDetails
  }

  interface Emits {
    (e: 'close'): void
    (e: 'offer-cancelled', offer: OfferDetails): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // State
  const isCancelling = ref(false)
  const isCopied = ref(false)

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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const copyOfferString = async () => {
    try {
      await navigator.clipboard.writeText(props.offer.offerString)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    } catch (error) {
      console.error('Failed to copy offer string:', error)
    }
  }

  const copyOfferId = async () => {
    try {
      await navigator.clipboard.writeText(props.offer.tradeId)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, 2000)
    } catch (error) {
      console.error('Failed to copy offer ID:', error)
    }
  }

  const cancelOffer = async () => {
    if (!confirm('Are you sure you want to cancel this offer?')) {
      return
    }

    isCancelling.value = true

    try {
      const result = await cancelOfferRequest({
        tradeId: props.offer.tradeId,
        fee: props.offer.fee,
      })

      if (result.success) {
        const updatedOffer = { ...props.offer, status: 'cancelled' as const }
        emit('offer-cancelled', updatedOffer)
      } else {
        throw new Error(result.error || 'Failed to cancel offer')
      }
    } catch (error) {
      console.error('Failed to cancel offer:', error)
      alert('Failed to cancel offer. Please try again.')
    } finally {
      isCancelling.value = false
    }
  }
</script>
