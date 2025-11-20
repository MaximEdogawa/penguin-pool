'use client'

import { useCancelOffer } from '@/hooks/useWalletQueries'
import { useOfferStorage } from '@/hooks/useOfferStorage'
import { useCatTokens } from '@/hooks/useTickers'
import { logger } from '@/lib/logger'
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
  const { getCatTokenInfo } = useCatTokens()

  // State
  const [offers, setOffers] = useState<OfferDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<OfferDetails | null>(null)
  const [isCopied, setIsCopied] = useState<string | null>(null)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [offerToCancel, setOfferToCancel] = useState<OfferDetails | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showCancelAllConfirmation, setShowCancelAllConfirmation] = useState(false)
  const [isCancellingAll, setIsCancellingAll] = useState(false)
  const [cancelAllError, setCancelAllError] = useState('')
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [deleteAllError, setDeleteAllError] = useState('')
  const [filters, setFilters] = useState<OfferFilters>({
    status: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalOffers, setTotalOffers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Computed - offers are already filtered by status in the query
  const filteredOffers = useMemo(() => offers, [offers])

  // Extract stable references - these are stable because they're from useCallback/useState
  const loadOffersFromStorage = offerStorage.loadOffers
  const storageOffers = offerStorage.offers
  const pagination = offerStorage.pagination

  // Methods
  const refreshOffers = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load offers from IndexedDB with pagination and status filter
      await loadOffersFromStorage({
        page: currentPage,
        pageSize,
        status: filters.status || undefined,
      })
    } catch {
      // Failed to refresh offers
    } finally {
      setIsLoading(false)
    }
  }, [loadOffersFromStorage, currentPage, pageSize, filters.status])

  // Update pagination state when storage pagination changes
  useEffect(() => {
    if (pagination) {
      setTotalOffers(pagination.total)
      setTotalPages(pagination.totalPages)
    }
  }, [pagination])

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

  const handleOfferTaken = useCallback(
    async (offer: OfferDetails) => {
      // Update local state immediately for UI responsiveness
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: 'completed' as const } : o))
      )
      // Refresh from storage to ensure all components see the updated state
      await refreshOffers()
    },
    [refreshOffers]
  )

  const handleOfferCancelled = useCallback(
    async (offer: OfferDetails) => {
      // Update local state immediately for UI responsiveness
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: 'cancelled' as const } : o))
      )
      setSelectedOffer(null)
      // Refresh from storage to ensure all components see the updated state
      await refreshOffers()
    },
    [refreshOffers]
  )

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

  // Pagination handlers
  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)))
    },
    [totalPages]
  )

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Update page when filters change and refresh
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters.status])

  // Refresh offers when page, pageSize, or filters change
  useEffect(() => {
    refreshOffers()
  }, [currentPage, pageSize, filters.status, refreshOffers])

  // Cancel all active offers
  const cancelAllOffers = useCallback(() => {
    setShowCancelAllConfirmation(true)
    setCancelAllError('')
  }, [])

  const confirmCancelAllOffers = useCallback(async () => {
    setIsCancellingAll(true)
    setCancelAllError('')

    try {
      // Get all active offers
      const activeOffers = await offerStorage.getOffersByStatus('active')

      if (activeOffers.length === 0) {
        setCancelAllError('No active offers to cancel')
        setIsCancellingAll(false)
        return
      }

      // Cancel each offer
      const cancelPromises = activeOffers.map(async (offer) => {
        try {
          await cancelOfferMutation.mutateAsync({
            id: offer.tradeId,
            fee: offer.fee,
          })
          await offerStorage.updateOffer(offer.id, { status: 'cancelled' })
        } catch (error) {
          // Continue with other offers even if one fails
          logger.error(`Failed to cancel offer ${offer.id}:`, error)
        }
      })

      await Promise.allSettled(cancelPromises)
      setShowCancelAllConfirmation(false)
      await refreshOffers()
    } catch (error) {
      setCancelAllError(
        `Failed to cancel all offers: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsCancellingAll(false)
    }
  }, [cancelOfferMutation, offerStorage, refreshOffers])

  const handleCancelAllDialogClose = useCallback(() => {
    setShowCancelAllConfirmation(false)
    setCancelAllError('')
  }, [])

  // Delete all offers
  const deleteAllOffers = useCallback(() => {
    setShowDeleteAllConfirmation(true)
    setDeleteAllError('')
  }, [])

  const confirmDeleteAllOffers = useCallback(async () => {
    setIsDeletingAll(true)
    setDeleteAllError('')

    try {
      // Clear all offers from database
      await offerStorage.clearAllOffers()

      // Clear local state immediately
      setOffers([])
      setTotalOffers(0)
      setTotalPages(0)
      setCurrentPage(1)

      // Close modal
      setShowDeleteAllConfirmation(false)

      // Refresh to ensure everything is synced
      await refreshOffers()
    } catch (error) {
      setDeleteAllError(
        `Failed to delete all offers: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsDeletingAll(false)
    }
  }, [offerStorage, refreshOffers])

  const handleDeleteAllDialogClose = useCallback(() => {
    setShowDeleteAllConfirmation(false)
    setDeleteAllError('')
  }, [])

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
    showCancelAllConfirmation,
    isCancellingAll,
    cancelAllError,
    showDeleteAllConfirmation,
    isDeletingAll,
    deleteAllError,
    filters,
    setFilters,

    // Pagination
    currentPage,
    pageSize,
    totalOffers,
    totalPages,
    goToPage,
    changePageSize,

    // Computed
    filteredOffers,

    // Methods
    refreshOffers,
    viewOffer,
    cancelOffer,
    confirmCancelOffer,
    handleCancelDialogClose,
    cancelAllOffers,
    confirmCancelAllOffers,
    handleCancelAllDialogClose,
    deleteAllOffers,
    confirmDeleteAllOffers,
    handleDeleteAllDialogClose,
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
