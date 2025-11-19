'use client'

import { useCancelOffer } from '@/hooks/useWalletQueries'
import { useOfferStorage } from '@/hooks/useOfferStorage'
import { useTickerData } from '@/hooks/useTickerData'
import { formatAssetAmount } from '@/lib/utils/chia-units'
import type { OfferDetails, OfferFilters } from '@/types/offer.types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Hook for managing user's offers
 * Provides offer loading, filtering, and management functionality
 */
export function useMyOffers() {
  // Services
  const cancelOfferMutation = useCancelOffer()
  const offerStorage = useOfferStorage()
  const { getCatTokenInfo } = useTickerData()

  // State
  const [offers, setOffers] = useState<OfferDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<OfferDetails | null>(null)
  const [isCopied, setIsCopied] = useState<string | null>(null)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [offerToCancel, setOfferToCancel] = useState<OfferDetails | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [filters, setFilters] = useState<OfferFilters>({
    status: '',
  })

  // Computed
  const filteredOffers = useMemo(() => {
    let filtered = offers

    if (filters.status) {
      filtered = filtered.filter((offer) => offer.status === filters.status)
    }

    return filtered
  }, [offers, filters.status])

  // Extract stable references - these are stable because they're from useCallback/useState
  const loadOffersFromStorage = offerStorage.loadOffers
  const storageOffers = offerStorage.offers

  // Methods
  const refreshOffers = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load offers from IndexedDB
      await loadOffersFromStorage()
    } catch {
      // Failed to refresh offers
    } finally {
      setIsLoading(false)
    }
  }, [loadOffersFromStorage])

  // Sync offers from storage to local state when storage offers change
  // Use a ref to track previous offers to detect changes in properties (not just IDs)
  const prevOffersRef = useRef<string>('')

  useEffect(() => {
    // Create a hash of all offer data to detect any changes (including status, dexieStatus, etc.)
    const currentOffersHash = storageOffers
      .map((o) => `${o.id}:${o.status}:${o.dexieStatus || ''}:${o.dexieOfferId || ''}`)
      .sort()
      .join('|')

    // Update if offers changed (different length, IDs, or properties)
    if (prevOffersRef.current !== currentOffersHash) {
      const loadedOffers = storageOffers.map((storedOffer) => ({
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
        expiresAt: storedOffer.expiresAt,
      }))
      setOffers(loadedOffers)
      prevOffersRef.current = currentOffersHash
    }
  }, [storageOffers])

  const viewOffer = useCallback((offer: OfferDetails | null) => {
    setSelectedOffer(offer)
  }, [])

  const cancelOffer = useCallback((offer: OfferDetails) => {
    setOfferToCancel(offer)
    setCancelError('') // Clear any previous errors
    setShowCancelConfirmation(true)
  }, [])

  const confirmCancelOffer = useCallback(async () => {
    if (!offerToCancel) return

    setIsCancelling(true)
    setCancelError('')

    try {
      await cancelOfferMutation.mutateAsync({
        id: offerToCancel.tradeId,
        fee: offerToCancel.fee,
      })

      await offerStorage.updateOffer(offerToCancel.id, { status: 'cancelled' })
      setShowCancelConfirmation(false)
      setOfferToCancel(null)
      // Refresh offers to update the list
      await refreshOffers()
    } catch (error) {
      setCancelError(
        `Failed to cancel offer: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsCancelling(false)
    }
  }, [offerToCancel, cancelOfferMutation, offerStorage, refreshOffers])

  const handleCancelDialogClose = useCallback(() => {
    setShowCancelConfirmation(false)
    setOfferToCancel(null)
    setCancelError('') // Clear error when closing dialog
  }, [])

  const handleOfferCreated = useCallback(
    async (offer: OfferDetails) => {
      // Refresh offers from storage to ensure we have the latest data
      await refreshOffers()

      // Trigger upload notification
      if (typeof window !== 'undefined') {
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
    },
    [refreshOffers]
  )

  const handleOfferTaken = useCallback((offer: OfferDetails) => {
    // Update the offer status if it was taken
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, status: 'completed' as const } : o))
    )
  }, [])

  const handleOfferCancelled = useCallback((offer: OfferDetails) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, status: 'cancelled' as const } : o))
    )
    setSelectedOffer(null)
  }, [])

  const handleOfferDeleted = useCallback(
    async (offer: OfferDetails) => {
      // Update local state immediately for UI responsiveness
      setOffers((prev) => prev.filter((o) => o.id !== offer.id))
      setSelectedOffer(null)
      // Refresh from storage to ensure all components see the updated state
      await refreshOffers()
    },
    [refreshOffers]
  )

  const handleOfferUpdated = useCallback(
    async (offer: OfferDetails) => {
      // Update local state immediately for UI responsiveness
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, ...offer } : o)))
      // Update the selected offer to reflect changes in the modal
      setSelectedOffer((prev) => (prev && prev.id === offer.id ? { ...prev, ...offer } : prev))
      // Refresh from storage to ensure all components see the updated state
      await refreshOffers()
    },
    [refreshOffers]
  )

  const getStatusClass = useCallback((status: string) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    }
    return classes[status as keyof typeof classes] || classes.pending
  }, [])

  const formatDate = useCallback((date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }, [])

  const copyOfferString = useCallback(async (offerString: string) => {
    if (!offerString) return

    try {
      await navigator.clipboard.writeText(offerString)
      setIsCopied(offerString)
      setTimeout(() => {
        setIsCopied(null)
      }, 2000)
    } catch {
      // Failed to copy offer string
    }
  }, [])

  const getTickerSymbol = useCallback(
    (assetId: string): string => {
      const tokenInfo = getCatTokenInfo(assetId)
      return tokenInfo.ticker
    },
    [getCatTokenInfo]
  )

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
    setFilters,

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
