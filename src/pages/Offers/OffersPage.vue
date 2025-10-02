<template>
  <div class="content-page">
    <div class="content-header">
      <div class="flex flex-col sm:flex-row gap-4">
        <button
          @click="showCreateOffer = true"
          class="flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <i class="pi pi-plus mr-2"></i>
          Create Offer
        </button>
        <button
          @click="showTakeOffer = true"
          class="flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium rounded-lg transition-colors duration-200"
        >
          <i class="pi pi-shopping-cart mr-2"></i>
          Take Offer
        </button>
        <button
          @click="refreshOffers"
          :disabled="isLoading"
          class="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors duration-200"
        >
          <i class="pi pi-refresh mr-2" :class="{ 'pi-spin': isLoading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <div class="content-body">
      <!-- Offers List -->
      <div class="card p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">My Offers</h2>
          <div class="flex items-center space-x-2">
            <select
              v-model="filters.status"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div v-if="offers.length > 0" class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Offer String
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Status
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Assets
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Created
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="offer in filteredOffers"
                :key="offer.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <button
                    @click="copyOfferString(offer.offerString)"
                    class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[200px] sm:max-w-[250px]"
                    :title="
                      isCopied === offer.offerString ? 'Copied!' : 'Click to copy offer string'
                    "
                    :class="{
                      'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300':
                        isCopied === offer.offerString,
                      'hover:scale-105': isCopied !== offer.offerString,
                    }"
                  >
                    <span
                      class="transition-all duration-300 truncate block"
                      :class="{
                        'animate-pulse': isCopied === offer.offerString,
                      }"
                    >
                      {{ offer.offerString?.slice(0, 12) || 'Unknown' }}...
                    </span>
                    <!-- Animated background effect -->
                    <div
                      v-if="isCopied === offer.offerString"
                      class="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded"
                    ></div>
                  </button>
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="getStatusClass(offer.status)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ offer.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <div class="relative group">
                    <!-- Main display - show first 2 assets -->
                    <div class="space-y-1">
                      <div
                        v-for="asset in (offer.assetsOffered || []).slice(0, 2)"
                        :key="`offered-${asset.assetId}-${asset.amount}`"
                        class="text-xs flex items-center justify-between"
                      >
                        <span class="font-medium">{{
                          formatAssetAmount(asset.amount, asset.type)
                        }}</span>
                        <span class="text-gray-500 dark:text-gray-400 ml-2">
                          {{ asset.symbol || asset.type.toUpperCase() }}
                        </span>
                      </div>
                      <div
                        v-if="(offer.assetsOffered || []).length > 2"
                        class="text-xs text-primary-600 dark:text-primary-400 font-medium cursor-pointer hover:underline"
                      >
                        +{{ (offer.assetsOffered || []).length - 2 }} more
                      </div>
                    </div>

                    <!-- Hover tooltip for all assets -->
                    <div
                      v-if="(offer.assetsOffered || []).length > 0"
                      class="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-3"
                    >
                      <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assets Offered ({{ (offer.assetsOffered || []).length }})
                      </div>
                      <div class="space-y-1 max-h-32 overflow-y-auto">
                        <div
                          v-for="asset in offer.assetsOffered || []"
                          :key="`tooltip-offered-${asset.assetId}-${asset.amount}`"
                          class="flex items-center justify-between py-1"
                        >
                          <span class="font-medium">{{
                            formatAssetAmount(asset.amount, asset.type)
                          }}</span>
                          <span class="text-gray-500 dark:text-gray-400 ml-2">
                            {{ asset.symbol || asset.type.toUpperCase() }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(offer.createdAt) }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewOffer(offer)"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                    >
                      View
                    </button>
                    <button
                      v-if="offer.status === 'active'"
                      @click="cancelOffer(offer)"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div v-if="offers.length > 0" class="md:hidden space-y-4">
          <div
            v-for="offer in filteredOffers"
            :key="offer.id"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <!-- Header with Offer String and Status -->
            <div class="flex items-center justify-between mb-3">
              <button
                @click="copyOfferString(offer.offerString)"
                class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[200px] sm:max-w-[250px]"
                :title="isCopied === offer.offerString ? 'Copied!' : 'Click to copy offer string'"
                :class="{
                  'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300':
                    isCopied === offer.offerString,
                  'hover:scale-105': isCopied !== offer.offerString,
                }"
              >
                <span
                  class="transition-all duration-300 truncate block"
                  :class="{
                    'animate-pulse': isCopied === offer.offerString,
                  }"
                >
                  {{ offer.offerString?.slice(0, 12) || 'Unknown' }}...
                </span>
                <div
                  v-if="isCopied === offer.offerString"
                  class="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded"
                ></div>
              </button>
              <span
                :class="getStatusClass(offer.status)"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0"
              >
                {{ offer.status }}
              </span>
            </div>

            <!-- Assets Section -->
            <div class="mb-3">
              <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assets Offered ({{ (offer.assetsOffered || []).length }})
              </div>
              <div class="space-y-1">
                <div
                  v-for="asset in (offer.assetsOffered || []).slice(0, 3)"
                  :key="`mobile-offered-${asset.assetId}-${asset.amount}`"
                  class="flex items-center justify-between text-xs py-1"
                >
                  <span class="font-medium">{{ formatAssetAmount(asset.amount, asset.type) }}</span>
                  <span class="text-gray-500 dark:text-gray-400">
                    {{ asset.symbol || asset.type.toUpperCase() }}
                  </span>
                </div>
                <div
                  v-if="(offer.assetsOffered || []).length > 3"
                  class="text-xs text-primary-600 dark:text-primary-400 font-medium"
                >
                  +{{ (offer.assetsOffered || []).length - 3 }} more assets
                </div>
              </div>
            </div>

            <!-- Footer with Date and Actions -->
            <div
              class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700"
            >
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(offer.createdAt) }}
              </span>
              <div class="flex items-center space-x-2">
                <button
                  @click="viewOffer(offer)"
                  class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs"
                >
                  View
                </button>
                <button
                  v-if="offer.status === 'active'"
                  @click="cancelOffer(offer)"
                  class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <i class="pi pi-shopping-bag text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No offers found</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Create your first offer to start trading
          </p>
          <button
            @click="showCreateOffer = true"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Create Offer
          </button>
        </div>
      </div>
    </div>

    <!-- Create Offer Modal -->
    <CreateOfferModal
      v-if="showCreateOffer"
      @close="showCreateOffer = false"
      @offer-created="handleOfferCreated"
    />

    <!-- Take Offer Modal -->
    <TakeOfferModal
      v-if="showTakeOffer"
      @close="showTakeOffer = false"
      @offer-taken="handleOfferTaken"
    />

    <!-- Offer Details Modal -->
    <OfferDetailsModal
      v-if="selectedOffer"
      :offer="selectedOffer"
      @close="selectedOffer = null"
      @offer-cancelled="handleOfferCancelled"
      @offer-deleted="handleOfferDeleted"
    />

    <!-- Cancel Confirmation Dialog -->
    <ConfirmationDialog
      v-if="showCancelConfirmation && offerToCancel"
      title="Cancel Offer"
      message="Are you sure you want to cancel this offer? This action cannot be undone."
      :details="`Offer ID: ${offerToCancel.tradeId}`"
      :error-message="cancelError"
      confirm-text="Cancel Offer"
      cancel-text="Keep Offer"
      :is-loading="isCancelling"
      @close="handleCancelDialogClose"
      @confirm="confirmCancelOffer"
    />
  </div>
</template>

<script setup lang="ts">
  import CreateOfferModal from '@/components/Offers/CreateOfferModal.vue'
  import OfferDetailsModal from '@/components/Offers/OfferDetailsModal.vue'
  import TakeOfferModal from '@/components/Offers/TakeOfferModal.vue'
  import ConfirmationDialog from '@/components/Shared/ConfirmationDialog.vue'
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { useOfferStorage } from '@/shared/composables/useOfferStorage'
  import { formatAssetAmount } from '@/shared/utils/chia-units'
  import type { OfferDetails, OfferFilters } from '@/types/offer.types'
  import { computed, onMounted, ref } from 'vue'

  // Services
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()

  // State
  const offers = ref<OfferDetails[]>([])
  const isLoading = ref(false)
  const showCreateOffer = ref(false)
  const showTakeOffer = ref(false)
  const selectedOffer = ref<OfferDetails | null>(null)
  const isCopied = ref<string | null>(null)
  const showCancelConfirmation = ref(false)
  const offerToCancel = ref<OfferDetails | null>(null)
  const isCancelling = ref(false)
  const cancelError = ref('')
  const filters = ref<OfferFilters>({
    status: '',
  })

  // Computed
  const filteredOffers = computed(() => {
    let filtered = offers.value

    if (filters.value.status) {
      filtered = filtered.filter(offer => offer.status === filters.value.status)
    }

    return filtered
  })

  // Methods
  const refreshOffers = async () => {
    isLoading.value = true
    try {
      // Load offers from IndexedDB
      await offerStorage.loadOffers()
      offers.value = offerStorage.offers.value.map(storedOffer => ({
        id: storedOffer.id,
        tradeId: storedOffer.tradeId,
        offerString: storedOffer.offerString,
        status: storedOffer.status,
        createdAt: storedOffer.createdAt,
        assetsOffered: storedOffer.assetsOffered,
        assetsRequested: storedOffer.assetsRequested,
        fee: storedOffer.fee,
        creatorAddress: storedOffer.creatorAddress,
      }))
    } catch {
      // Failed to refresh offers
    } finally {
      isLoading.value = false
    }
  }

  const viewOffer = (offer: OfferDetails) => {
    selectedOffer.value = offer
  }

  const cancelOffer = (offer: OfferDetails) => {
    offerToCancel.value = offer
    cancelError.value = '' // Clear any previous errors
    showCancelConfirmation.value = true
  }

  const confirmCancelOffer = async () => {
    if (!offerToCancel.value) return

    isCancelling.value = true
    cancelError.value = '' // Clear any previous errors

    try {
      await walletDataService.cancelOffer({
        id: offerToCancel.value.tradeId,
        fee: offerToCancel.value.fee,
      })

      // Update the offer status locally
      offerToCancel.value.status = 'cancelled'

      // Update in IndexedDB
      await offerStorage.updateOffer(offerToCancel.value.id, { status: 'cancelled' })

      showCancelConfirmation.value = false
      offerToCancel.value = null
    } catch {
      // Failed to cancel offer
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      cancelError.value = `Failed to cancel offer: ${errorMsg}`
    } finally {
      isCancelling.value = false
    }
  }

  const handleCancelDialogClose = () => {
    showCancelConfirmation.value = false
    offerToCancel.value = null
    cancelError.value = '' // Clear error when closing dialog
  }

  const handleOfferCreated = (offer: OfferDetails) => {
    offers.value.unshift(offer)
    showCreateOffer.value = false
  }

  const handleOfferTaken = (offer: OfferDetails) => {
    // Update the offer status if it was taken
    const existingOffer = offers.value.find(o => o.id === offer.id)
    if (existingOffer) {
      existingOffer.status = 'completed'
    }
    showTakeOffer.value = false
  }

  const handleOfferCancelled = (offer: OfferDetails) => {
    const existingOffer = offers.value.find(o => o.id === offer.id)
    if (existingOffer) {
      existingOffer.status = 'cancelled'
    }
    selectedOffer.value = null
  }

  const handleOfferDeleted = (offer: OfferDetails) => {
    const index = offers.value.findIndex(o => o.id === offer.id)
    if (index !== -1) {
      offers.value.splice(index, 1)
    }
    selectedOffer.value = null
  }

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

  const copyOfferString = async (offerString: string) => {
    if (!offerString) return

    try {
      await navigator.clipboard.writeText(offerString)
      isCopied.value = offerString
      setTimeout(() => {
        isCopied.value = null
      }, 2000)
    } catch {
      // Failed to copy offer string
    }
  }

  // Lifecycle
  onMounted(() => {
    refreshOffers()
  })
</script>

<style scoped>
  .content-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8;
  }

  .content-header {
    @apply mb-1;
  }

  .content-body {
    @apply space-y-1;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
