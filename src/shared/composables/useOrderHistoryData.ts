import type { DexieOffer } from '@/shared/services/DexieDataService'
import { useDexieDataService } from '@/shared/services/DexieDataService'
import { ref } from 'vue'

export interface DexieAssetItem {
  id: string
  code: string
  name: string
  amount: number
}

export interface Trade {
  id: string
  sellAssets: DexieAssetItem[]
  buyAssets: DexieAssetItem[]
  status: string
  maker: string
  timestamp: string
  date_found: string
  date_completed?: string | null
  date_pending?: string | null
  date_expiry?: string | null
  known_taker?: unknown | null
}

export function useOrderHistoryData() {
  const dexieDataService = useDexieDataService()

  // State
  const displayedTrades = ref<Trade[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(0)

  // Constants
  const rowsPerPage = 20

  // Helper function to convert Dexie offer to Trade format
  const convertDexieOfferToTrade = (dexieOffer: DexieOffer): Trade => {
    // Ensure amounts are numbers and handle undefined/null values
    const safeOffered = dexieOffer.offered.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))
    const safeRequested = dexieOffer.requested.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))

    return {
      id: dexieOffer.id,
      sellAssets: safeOffered,
      buyAssets: safeRequested,
      status: calculateOfferState(dexieOffer),
      maker: `0x${dexieOffer.id.substring(0, 8)}...${dexieOffer.id.substring(-8)}`,
      timestamp: new Date(dexieOffer.date_found).toLocaleString(),
      date_found: dexieOffer.date_found,
      date_completed: dexieOffer.date_completed,
      date_pending: dexieOffer.date_pending,
      date_expiry: dexieOffer.date_expiry,
      known_taker: dexieOffer.known_taker,
    }
  }

  // Helper function to calculate offer state
  const calculateOfferState = (offer: DexieOffer): string => {
    const dateFound = offer.date_found ? new Date(offer.date_found) : null
    const dateCompleted = offer.date_completed ? new Date(offer.date_completed) : null
    const datePending = offer.date_pending ? new Date(offer.date_pending) : null
    const dateExpiry = offer.date_expiry ? new Date(offer.date_expiry) : null
    const knownTaker = offer.known_taker

    if (dateCompleted && knownTaker !== null && knownTaker !== undefined) return 'Completed'
    if (offer.spent_block_index !== null && offer.spent_block_index !== undefined)
      return 'Cancelled'
    if (datePending && !dateFound) return 'Pending'
    if (dateExpiry && dateFound && dateExpiry < dateFound) return 'Expired'
    if (offer.block_expiry !== null && offer.block_expiry !== undefined) return 'Expired'
    if (dateFound && !dateCompleted) {
      const isWithinExpiry = !dateExpiry || dateFound < dateExpiry
      if (isWithinExpiry) return 'Open'
    }

    return 'Unknown'
  }

  // Methods
  const loadData = async () => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    try {
      const response = await dexieDataService.searchOffers({
        page: page.value,
        page_size: rowsPerPage,
        // No status filter to get all offers for history
      })

      if (response.success && Array.isArray(response.data)) {
        const newTrades = (response.data as DexieOffer[])
          .filter((offer: DexieOffer) => offer && offer.offered && offer.requested) // Filter out invalid offers
          .map(convertDexieOfferToTrade)
        displayedTrades.value.push(...newTrades)
        page.value++

        // Check if we have more data
        if (newTrades.length < rowsPerPage) {
          hasMore.value = false
        }
      }
    } catch (error) {
      // Handle error appropriately - could emit an event or show a toast notification
      void error // Suppress unused variable warning
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    displayedTrades,
    loading,
    hasMore,

    // Methods
    loadData,
  }
}
