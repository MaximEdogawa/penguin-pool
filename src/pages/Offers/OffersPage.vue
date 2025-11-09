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
      <!-- My Offers Component -->
      <MyOffers
        @view-offer="viewOffer"
        @cancel-offer="cancelOffer"
        @create-offer="showCreateOffer = true"
      />
    </div>

    <!-- Create Offer Modal -->
    <CreateOfferModal
      v-if="showCreateOffer"
      @close="showCreateOffer = false"
      @offer-created="handleOfferCreatedWrapper"
    />

    <!-- Take Offer Modal -->
    <TakeOfferModal
      v-if="showTakeOffer"
      @close="showTakeOffer = false"
      @offer-taken="handleOfferTakenWrapper"
    />

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

    <!-- Sticky Filter Panel -->
    <StickyFilterPanel
      v-show="showFilterPane"
      ref="stickyFilterPanelRef"
      :has-active-filters="hasActiveSharedFilters"
      :shared-filters="sharedFilters"
      @remove-shared-filter="removeFilter"
      @clear-all-shared-filters="clearAllFilters"
    />

    <!-- Offer Upload Notification -->
    <OfferUploadNotification />
  </div>
</template>

<script setup lang="ts">
  import CreateOfferModal from '@/components/Offers/CreateOfferModal.vue'
  import MyOffers from '@/components/Offers/MyOffers.vue'
  import OfferDetailsModal from '@/components/Offers/OfferDetailsModal.vue'
  import OfferUploadNotification from '@/components/Offers/OfferUploadNotification.vue'
  import TakeOfferModal from '@/components/Offers/TakeOfferModal.vue'
  import ConfirmationDialog from '@/components/Shared/ConfirmationDialog.vue'
  import { useGlobalFilters } from '@/shared/composables/useGlobalFilters'
  import { useMyOffers } from '@/shared/composables/useMyOffers'
  import type { OfferDetails } from '@/types/offer.types'
  import { ref } from 'vue'
  import StickyFilterPanel from '../Trading/components/StickyFilterPanel.vue'

  // Use My Offers composable
  const {
    selectedOffer,
    showCancelConfirmation,
    offerToCancel,
    isCancelling,
    cancelError,
    refreshOffers,
    viewOffer,
    cancelOffer,
    confirmCancelOffer,
    handleCancelDialogClose,
    handleOfferCreated,
    handleOfferTaken,
    handleOfferCancelled,
    handleOfferDeleted,
    handleOfferUpdated,
  } = useMyOffers()

  // Global filters
  const { sharedFilters, hasActiveSharedFilters, showFilterPane, removeFilter, clearAllFilters } =
    useGlobalFilters()

  // Local state for modals
  const showCreateOffer = ref(false)
  const showTakeOffer = ref(false)

  // Event handlers for MyOffers component
  const handleOfferCreatedWrapper = (offer: OfferDetails) => {
    handleOfferCreated(offer) // Call the composable method
    showCreateOffer.value = false
  }

  const handleOfferTakenWrapper = (offer: OfferDetails) => {
    handleOfferTaken(offer) // Call the composable method
    showTakeOffer.value = false
  }

  // Lifecycle - offers are loaded by MyOffers component
</script>

<style scoped>
  .content-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 px-0 sm:px-1 lg:px-1 py-0;
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
