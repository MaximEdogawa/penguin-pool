import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
import { useOfferStorage } from '@/shared/composables/useOfferStorage'
import { useTickerMapping } from '@/shared/composables/useTickerMapping'
import { formatAssetAmount } from '@/shared/utils/chia-units'
import type { OfferDetails, OfferFilters } from '@/types/offer.types'
import { computed, ref } from 'vue'

/**
 * Composable for managing user's offers
 * Provides offer loading, filtering, and management functionality
 */
export function useMyOffers() {
  // Services
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()
  const { getTickerSymbol } = useTickerMapping()

  // State
  const offers = ref<OfferDetails[]>([])
  const isLoading = ref(false)
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
        dexieOfferId: storedOffer.dexieOfferId,
        dexieStatus: storedOffer.dexieStatus,
        uploadedToDexie: storedOffer.uploadedToDexie,
        dexieOfferData: storedOffer.dexieOfferData,
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
    cancelError.value = ''

    try {
      await walletDataService.cancelOffer({
        id: offerToCancel.value.tradeId,
        fee: offerToCancel.value.fee,
      })

      await offerStorage.updateOffer(offerToCancel.value.id, { status: 'cancelled' })
      showCancelConfirmation.value = false
      offerToCancel.value = null
    } catch (error) {
      cancelError.value = `Failed to cancel offer: ${error}`
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

    // Trigger upload notification
    window.dispatchEvent(
      new CustomEvent('offer-created', {
        detail: {
          offer: offer,
          offerString: offer.offerString,
          source: 'offer-page',
        },
      })
    )
  }

  const handleOfferTaken = (offer: OfferDetails) => {
    // Update the offer status if it was taken
    const existingOffer = offers.value.find(o => o.id === offer.id)
    if (existingOffer) {
      existingOffer.status = 'completed'
    }
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

  const handleOfferUpdated = (offer: OfferDetails) => {
    const existingOffer = offers.value.find(o => o.id === offer.id)
    if (existingOffer) {
      // Update the existing offer with new data
      Object.assign(existingOffer, offer)
    }
    // Update the selected offer to reflect changes in the modal
    if (selectedOffer.value && selectedOffer.value.id === offer.id) {
      Object.assign(selectedOffer.value, offer)
    }
    // Don't close the modal - let user see the success message
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

  return {
    // State
    offers,
    isLoading,
    selectedOffer,
    isCopied,
    showCancelConfirmation,
    offerToCancel,
    isCancelling,
    cancelError,
    filters,

    // Computed
    filteredOffers,

    // Methods
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
    getStatusClass,
    formatDate,
    copyOfferString,

    // Utilities
    getTickerSymbol,
    formatAssetAmount,
  }
}
