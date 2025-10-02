import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { logger } from './logger'

// Dexie API types based on documentation
export interface DexieOfferResponse {
  success: boolean
  id: string
  known: boolean
  offer: DexieOffer
}

export interface DexieOffer {
  id: string
  status: number // 0=Open, 1=Pending, 2=Cancelling, 3=Cancelled, 4=Completed, 5=Unknown, 6=Expired
  date_found: string
  date_completed?: string
  date_pending?: string
  date_expiry?: string
  block_expiry?: number | null
  spent_block_index?: number
  price: number
  offered: DexieAsset[]
  requested: DexieAsset[]
  fees: number
}

export interface DexieAsset {
  id: string
  code: string
  name: string
  amount: number
}

export interface DexieSearchParams {
  maker_address?: string
  taker_address?: string
  asset_id?: string
  status?: number
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'updated_at' | 'amount'
  sort_order?: 'asc' | 'desc'
}

export interface DexiePostOfferParams {
  offer: string
  drop_only?: boolean
  claim_rewards?: boolean
}

export interface DexiePostOfferResponse {
  id: string
  offer: string
  status: number
  created_at: string
  maker_address: string
  maker_assets: DexieAsset[]
  taker_assets: DexieAsset[]
  fee: number
}

// Environment configuration
const DEXIE_API_BASE_URL =
  import.meta.env.VITE_DEXIE_API_URL || 'https://api-testnet.dexie.space/v1'

export function useDexieDataService() {
  const queryClient = useQueryClient()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Search offers query - using queryClient.fetchQuery for dynamic search params
  // No static query needed since we pass search params dynamically

  // Inspect offer query - using queryClient.fetchQuery for dynamic offer strings
  // No static query needed since we pass offerString dynamically

  // Post offer mutation
  const postOfferMutation = useMutation({
    mutationFn: async (params: DexiePostOfferParams) => {
      isLoading.value = true
      error.value = null

      try {
        const url = `${DEXIE_API_BASE_URL}/offers`

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          throw new Error(`Dexie API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data as DexiePostOfferResponse
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to post offer'
        error.value = errorMessage
        logger.error('❌ Dexie offer posting failed:', err)
        throw err
      } finally {
        isLoading.value = false
      }
    },
  })

  // Helper methods
  const searchOffers = async (params: DexieSearchParams = {}) => {
    return await queryClient.fetchQuery({
      queryKey: ['dexie', 'offers', 'search', params],
      queryFn: async ({ queryKey }) => {
        const params = (queryKey[3] as DexieSearchParams) || {}
        isLoading.value = true
        error.value = null

        try {
          const searchParams = new URLSearchParams()

          if (params.maker_address) searchParams.append('maker_address', params.maker_address)
          if (params.taker_address) searchParams.append('taker_address', params.taker_address)
          if (params.asset_id) searchParams.append('asset_id', params.asset_id)
          if (params.status !== undefined) searchParams.append('status', params.status.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.offset) searchParams.append('offset', params.offset.toString())
          if (params.sort_by) searchParams.append('sort_by', params.sort_by)
          if (params.sort_order) searchParams.append('sort_order', params.sort_order)

          const url = `${DEXIE_API_BASE_URL}/offers?${searchParams.toString()}`

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error(`Dexie API error: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          return data as DexieOffer[]
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to search offers'
          error.value = errorMessage
          logger.error('❌ Dexie search failed:', err)
          throw err
        } finally {
          isLoading.value = false
        }
      },
      staleTime: 30000, // 30 seconds
    })
  }

  const inspectOffer = async (offerString: string) => {
    return await queryClient.fetchQuery({
      queryKey: ['dexie', 'offers', 'inspect', offerString],
      queryFn: async ({ queryKey }) => {
        const offerString = queryKey[3] as string
        isLoading.value = true
        error.value = null

        try {
          if (!offerString || offerString.trim().length === 0) {
            throw new Error('Offer string is empty')
          }

          const trimmedOffer = offerString.trim()
          if (trimmedOffer.length < 50) {
            throw new Error(
              'Offer string appears to be incomplete - too short for a valid Chia offer'
            )
          }

          if (!trimmedOffer.startsWith('offer') && !trimmedOffer.match(/^[A-Za-z0-9+/=]+$/)) {
            throw new Error('Offer string does not appear to be a valid Chia offer format')
          }

          const url = `${DEXIE_API_BASE_URL}/offers`

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ offer: offerString }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            logger.error('Dexie API error:', {
              status: response.status,
              statusText: response.statusText,
              errorText,
            })
            throw new Error(
              `Dexie API error: ${response.status} ${response.statusText} - ${errorText}`
            )
          }

          const data = await response.json()

          if (!data.success) {
            throw new Error('Dexie API returned unsuccessful response')
          }

          return data as DexieOfferResponse
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to inspect offer'
          error.value = errorMessage
          logger.error('❌ Dexie offer inspection failed:', err)
          throw err
        } finally {
          isLoading.value = false
        }
      },
      staleTime: 60000, // 1 minute
    })
  }

  const postOffer = async (params: DexiePostOfferParams) => {
    return await postOfferMutation.mutateAsync(params)
  }

  // Computed properties
  const offers = computed(() => []) // No static offers since we use dynamic queries
  const currentOffer = computed(() => null) // No static current offer since we use dynamic queries
  const isSearching = computed(() => isLoading.value) // Use our local loading state
  const isInspecting = computed(() => isLoading.value) // Use our local loading state
  const isPosting = computed(() => postOfferMutation.isPending.value)

  return {
    // Data
    offers,
    currentOffer,

    // Loading states
    isLoading: computed(() => isLoading.value),
    isSearching,
    isInspecting,
    isPosting,

    // Error state
    error: computed(() => error.value),

    // Methods
    searchOffers,
    inspectOffer,
    postOffer,

    // Raw queries for advanced usage
    postOfferMutation,
  }
}

// Utility functions for converting between Dexie and app formats
export function convertDexieOfferToAppOffer(dexieResponse: DexieOfferResponse) {
  const dexieOffer = dexieResponse.offer

  return {
    id: dexieOffer.id,
    tradeId: dexieOffer.id,
    offerString: '', // Not provided in response
    status: convertDexieStatus(dexieOffer.status),
    dexieStatus: dexieOffer.status, // Include raw Dexie status number
    createdAt: new Date(dexieOffer.date_found),
    assetsOffered: dexieOffer.offered.map(convertDexieAsset),
    assetsRequested: dexieOffer.requested.map(convertDexieAsset),
    fee: dexieOffer.fees,
  }
}

export function convertDexieAsset(dexieAsset: DexieAsset) {
  // Determine asset type based on ID
  const assetType = dexieAsset.id === 'xch' ? 'xch' : 'cat'

  return {
    assetId: dexieAsset.id,
    amount: dexieAsset.amount,
    type: assetType,
    symbol: dexieAsset.code,
    name: dexieAsset.name,
  }
}

export function convertDexieStatus(
  status: number
): 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'failed' {
  switch (status) {
    case 0:
      return 'active' // Open
    case 1:
      return 'pending' // Pending
    case 2:
      return 'pending' // Cancelling
    case 3:
      return 'cancelled' // Cancelled
    case 4:
      return 'completed' // Completed
    case 5:
      return 'failed' // Unknown
    case 6:
      return 'expired' // Expired
    default:
      return 'failed'
  }
}

export function getDexieStatusDescription(status: number): string {
  switch (status) {
    case 0:
      return 'Open'
    case 1:
      return 'Pending'
    case 2:
      return 'Cancelling'
    case 3:
      return 'Cancelled'
    case 4:
      return 'Completed'
    case 5:
      return 'Unknown'
    case 6:
      return 'Expired'
    default:
      return 'Unknown'
  }
}
