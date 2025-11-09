import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
import { useOfferStorage } from '@/shared/composables/useOfferStorage'
import { useTickerMapping } from '@/shared/composables/useTickerMapping'
import { useDexieDataService } from '@/shared/services/DexieDataService'
import { logger } from '@/shared/services/logger'
import { xchToMojos } from '@/shared/utils/chia-units'
import type { OfferDetails } from '@/types/offer.types'
import { ref } from 'vue'
import type { OrderBookOrder } from './useOrderBookData'

export interface AssetItem {
  assetId: string
  amount: number
  type: 'xch' | 'cat' | 'nft'
  symbol: string
  searchQuery: string
  showDropdown: boolean
}

export function useOfferSubmission() {
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()
  const dexieDataService = useDexieDataService()
  const { isXchAsset, getTickerSymbol } = useTickerMapping()

  // State
  const selectedOrderForTaking = ref<OrderBookOrder | null>(null)
  const fetchedOfferString = ref<string>('')
  const priceAdjustment = ref(0)

  // Asset management
  const makerAssets = ref<AssetItem[]>([
    { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
  ])
  const takerAssets = ref<AssetItem[]>([
    { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
  ])

  // Methods
  const fillFromOrderBook = async (order: OrderBookOrder) => {
    // Store the selected order for taking
    selectedOrderForTaking.value = order

    // Fetch the offer string using the order ID
    try {
      const response = await dexieDataService.inspectOffer(order.id)
      if (response.success && response.offer?.offer) {
        fetchedOfferString.value = response.offer.offer
      } else {
        fetchedOfferString.value = ''
        logger.warn('Could not fetch offer string for order:', order.id)
      }
    } catch (error) {
      logger.error('Failed to fetch offer string:', error)
      fetchedOfferString.value = ''
    }

    // Convert order data to the format expected by the component
    makerAssets.value = order.offering.map(asset => {
      const ticker = asset.code || getTickerSymbol(asset.id)
      return {
        assetId: asset.id,
        amount: asset.amount,
        type: isXchAsset(asset.id) ? 'xch' : 'cat',
        symbol: ticker,
        searchQuery: ticker, // Pre-fill search with ticker symbol
        showDropdown: false,
      }
    })

    takerAssets.value = order.receiving.map(asset => {
      const ticker = asset.code || getTickerSymbol(asset.id)
      return {
        assetId: asset.id,
        amount: asset.amount,
        type: isXchAsset(asset.id) ? 'xch' : 'cat',
        symbol: ticker,
        searchQuery: ticker, // Pre-fill search with ticker symbol
        showDropdown: false,
      }
    })

    takerAssets.value = order.receiving.map(asset => {
      const ticker = asset.code || getTickerSymbol(asset.id)

      return {
        assetId: asset.id,
        amount: asset.amount,
        type: isXchAsset(asset.id) ? 'xch' : 'cat',
        symbol: ticker,
        searchQuery: ticker, // Pre-fill search with ticker symbol
        showDropdown: false,
      }
    })
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    makerAssets.value = order.offering.map(asset => {
      const ticker = asset.code || getTickerSymbol(asset.id)
      return {
        assetId: asset.id,
        amount: asset.amount,
        type: isXchAsset(asset.id) ? 'xch' : 'cat',
        symbol: ticker,
        searchQuery: ticker, // Pre-fill search with ticker symbol
        showDropdown: false,
      }
    })
    takerAssets.value = order.receiving.map(asset => {
      const ticker = asset.code || getTickerSymbol(asset.id)
      return {
        assetId: asset.id,
        amount: asset.amount,
        type: isXchAsset(asset.id) ? 'xch' : 'cat',
        symbol: ticker,
        searchQuery: ticker, // Pre-fill search with ticker symbol
        showDropdown: false,
      }
    })
  }

  const handleOfferSubmit = async (
    data: {
      offeringAssets: Array<{ assetId: string; amount: number; type: string; symbol: string }>
      requestedAssets: Array<{ assetId: string; amount: number; type: string; symbol: string }>
      priceAdjustment: number
      mode: 'maker' | 'taker'
    },
    activeView: string
  ) => {
    try {
      // Helper function to convert amounts to the smallest unit based on asset type
      const convertToSmallestUnit = (amount: number, assetType: string): number => {
        switch (assetType) {
          case 'xch':
            return xchToMojos(amount) // XCH to mojos using shared utility
          case 'cat':
            // CAT tokens might need conversion to smallest unit
            return Math.round(amount * 1000)
          case 'nft':
            return Math.floor(amount) // NFTs are whole numbers
          default:
            return amount // Default to exact amount for unknown tokens
        }
      }

      // Convert assets to the format expected by the wallet
      const offerAssets = data.offeringAssets
        .filter(asset => asset.amount > 0)
        .map(asset => ({
          assetId: asset.type === 'xch' ? '' : asset.assetId,
          amount: convertToSmallestUnit(asset.amount, asset.type),
          type: asset.type,
        }))

      const requestAssets = data.requestedAssets
        .filter(asset => asset.amount > 0)
        .map(asset => ({
          assetId: asset.type === 'xch' ? '' : asset.assetId,
          amount: convertToSmallestUnit(asset.amount, asset.type),
          type: asset.type,
        }))

      if (data.mode === 'maker' || activeView === 'create') {
        // Create maker offer - use same logic as CreateOfferModal
        const result = await walletDataService.createOffer({
          walletId: 1,
          offerAssets,
          requestAssets,
          fee: xchToMojos(0.000001), // Use same fee conversion as CreateOfferModal
        })

        if (!result || !result.offer) {
          throw new Error('Wallet did not return a valid offer string')
        }

        const newOffer: OfferDetails = {
          id: result?.id || Date.now().toString(),
          tradeId: result?.tradeId || result?.id || 'unknown',
          offerString: result?.offer || '',
          status: 'active',
          createdAt: new Date(),
          assetsOffered: data.offeringAssets.map(asset => ({
            assetId: asset.type === 'xch' ? '' : asset.assetId,
            amount: asset.amount || 0,
            type: asset.type as 'xch' | 'cat' | 'nft',
            symbol: asset.symbol || '',
          })),
          assetsRequested: data.requestedAssets.map(asset => ({
            assetId: asset.type === 'xch' ? '' : asset.assetId,
            amount: asset.amount || 0,
            type: asset.type as 'xch' | 'cat' | 'nft',
            symbol: asset.symbol || '',
          })),
          fee: 0.000001,
          creatorAddress: walletDataService.address.data.value?.address || 'unknown',
        }

        await offerStorage.saveOffer(newOffer, true)

        // Return the created offer for potential Dexie upload
        return { success: true, offer: newOffer, offerString: result.offer }
      } else {
        // Take existing offer - use the fetched offer string
        if (!fetchedOfferString.value || fetchedOfferString.value.trim() === '') {
          throw new Error(
            'No offer string available. Please select an order from the order book first.'
          )
        }

        const result = await walletDataService.takeOffer({
          offer: fetchedOfferString.value.trim(),
          fee: 0.000001, // Use same fee as TakeOfferModal
        })

        if (result?.success && result?.tradeId) {
          const takenOffer: OfferDetails = {
            id: Date.now().toString(),
            tradeId: result.tradeId,
            offerString: fetchedOfferString.value.trim(),
            status: 'pending',
            createdAt: new Date(),
            assetsOffered: data.offeringAssets.map(asset => ({
              assetId: asset.type === 'xch' ? '' : asset.assetId,
              amount: asset.amount || 0,
              type: asset.type as 'xch' | 'cat' | 'nft',
              symbol: asset.symbol || '',
            })),
            assetsRequested: data.requestedAssets.map(asset => ({
              assetId: asset.type === 'xch' ? '' : asset.assetId,
              amount: asset.amount || 0,
              type: asset.type as 'xch' | 'cat' | 'nft',
              symbol: asset.symbol || '',
            })),
            fee: 0.000001,
            creatorAddress: selectedOrderForTaking.value?.creatorAddress || 'unknown',
          }

          await offerStorage.saveOffer(takenOffer, true)

          // Return the taken offer
          return { success: true, offer: takenOffer, offerString: fetchedOfferString.value.trim() }
        } else {
          throw new Error('Failed to take offer')
        }
      }
    } catch (error) {
      // Handle error appropriately - could emit an event or show a toast notification
      logger.error('Error in handleOfferSubmit:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        offer: null,
        offerString: null,
      }
    }
  }

  /**
   * Upload an offer to Dexie
   */
  const uploadOfferToDexie = async (offerString: string) => {
    try {
      const result = await dexieDataService.postOfferMutation.mutateAsync({
        offer: offerString,
        drop_only: false,
        claim_rewards: false,
      })

      logger.info('Offer uploaded to Dexie successfully:', result)
      return { success: true, dexieId: result.id }
    } catch (error) {
      logger.error('Failed to upload offer to Dexie:', error)
      throw error
    }
  }

  const resetForm = () => {
    makerAssets.value = [
      {
        assetId: '',
        amount: 0,
        type: 'xch',
        symbol: '',
        searchQuery: '',
        showDropdown: false,
      },
    ]
    takerAssets.value = [
      {
        assetId: '',
        amount: 0,
        type: 'xch',
        symbol: '',
        searchQuery: '',
        showDropdown: false,
      },
    ]
    priceAdjustment.value = 0
  }

  return {
    // State
    selectedOrderForTaking,
    fetchedOfferString,
    priceAdjustment,
    makerAssets,
    takerAssets,

    // Methods
    fillFromOrderBook,
    useAsTemplate,
    handleOfferSubmit,
    uploadOfferToDexie,
    resetForm,
  }
}
