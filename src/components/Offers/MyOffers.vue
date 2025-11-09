<template>
  <div class="card p-4 sm:p-6 pb-8">
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
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Offer String
            </th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Assets
            </th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Created
            </th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      {{ getTickerSymbol(asset.assetId) }}
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
                        {{ getTickerSymbol(asset.assetId) }}
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
    <div v-if="offers.length > 0" class="md:hidden space-y-4 pb-8">
      <div
        v-for="offer in filteredOffers"
        :key="offer.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4"
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
                {{ getTickerSymbol(asset.assetId) }}
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
      <p class="text-gray-600 dark:text-gray-400 mb-4">Create your first offer to start trading</p>
      <button
        @click="$emit('create-offer')"
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
      >
        Create Offer
      </button>
    </div>
  </div>

  <!-- Offer Details Modal -->
  <OfferDetailsModal
    v-if="selectedOffer"
    :offer="selectedOffer"
    @close="selectedOffer = null"
    @offer-cancelled="handleOfferCancelled"
    @offer-deleted="handleOfferDeleted"
    @offer-updated="handleOfferUpdated"
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
</template>

<script setup lang="ts">
  import OfferDetailsModal from '@/components/Offers/OfferDetailsModal.vue'
  import ConfirmationDialog from '@/components/Shared/ConfirmationDialog.vue'
  import { useMyOffers } from '@/shared/composables/useMyOffers'
  import { onMounted } from 'vue'

  // Define emits - only create-offer is needed now
  defineEmits<{
    'create-offer': []
  }>()

  // Use My Offers composable
  const {
    offers,
    filters,
    filteredOffers,
    selectedOffer,
    showCancelConfirmation,
    offerToCancel,
    isCancelling,
    cancelError,
    isCopied,
    getStatusClass,
    formatDate,
    copyOfferString,
    getTickerSymbol,
    formatAssetAmount,
    refreshOffers,
    viewOffer,
    cancelOffer,
    confirmCancelOffer,
    handleCancelDialogClose,
    handleOfferCancelled,
    handleOfferDeleted,
    handleOfferUpdated,
  } = useMyOffers()

  // Load offers when component mounts
  onMounted(() => {
    refreshOffers()
  })
</script>

<style scoped>
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
