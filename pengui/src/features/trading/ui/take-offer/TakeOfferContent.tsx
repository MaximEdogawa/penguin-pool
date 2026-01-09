'use client'

import { useOfferInspection } from '@/features/offers/model/useOfferInspection'
import { useThemeClasses, useCatTokens } from '@/shared/hooks'
import { useTakeOffer } from '@/features/wallet'
import type { DexiePostOfferResponse } from '@/features/offers/lib/dexieTypes'
import { calculateOfferState } from '@/features/offers/lib/dexieUtils'
import {
  formatAssetAmount,
  formatXchAmount,
  getMinimumFeeInXch,
} from '@/shared/lib/utils/chia-units'
import { getDexieStatusDescription, validateOfferString } from '@/shared/lib/utils/offerUtils'
import type { OfferAsset, OfferDetails } from '@/entities/offer'
import { convertOfferStateToStatus } from '@/entities/offer'
import { useDexieDataService } from '@/features/offers/api/useDexieDataService'
import { logger } from '@/shared/lib/logger'
import { Loader2, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { OrderBookOrder } from '../../lib/orderBookTypes'
import OrderDetailsSection from './OrderDetailsSection'
import Button from '@/shared/ui/Button'

interface TakeOfferContentProps {
  order?: OrderBookOrder
  onOfferTaken?: (offer: OfferDetails) => void
  onClose?: () => void // Only used in modal mode
  mode?: 'modal' | 'inline' // Determines styling and layout
}

/**
 * Convert Dexie offer to app offer format
 */
function convertDexieOfferToAppOffer(dexieResponse: DexiePostOfferResponse): {
  assetsOffered: OfferAsset[]
  assetsRequested: OfferAsset[]
  creatorAddress?: string
  fee: number
  status: string
  dexieStatus: string
} {
  if (!dexieResponse.offer) {
    return {
      assetsOffered: [],
      assetsRequested: [],
      fee: 0,
      status: 'unknown',
      dexieStatus: 'Unknown',
    }
  }

  const offer = dexieResponse.offer
  const calculatedState = calculateOfferState(offer)

  // Convert Dexie assets to app assets
  const assetsOffered: OfferAsset[] = (offer.offered || []).map((asset) => {
    const isXch = !asset.id || asset.id === 'XCH'
    return {
      amount: asset.amount,
      assetId: isXch ? '' : asset.id,
      type: (isXch ? 'xch' : 'cat') as 'xch' | 'cat',
      symbol: asset.code || undefined,
    }
  })

  const assetsRequested: OfferAsset[] = (offer.requested || []).map((asset) => {
    const isXch = !asset.id || asset.id === 'XCH'
    return {
      amount: asset.amount,
      assetId: isXch ? '' : asset.id,
      type: (isXch ? 'xch' : 'cat') as 'xch' | 'cat',
      symbol: asset.code || undefined,
    }
  })

  return {
    assetsOffered,
    assetsRequested,
    creatorAddress: undefined,
    fee: offer.fees ? offer.fees / 1_000_000_000_000 : 0,
    status: convertOfferStateToStatus(calculatedState),
    dexieStatus: calculatedState,
  }
}

export default function TakeOfferContent({
  order,
  onOfferTaken,
  onClose,
  mode = 'inline',
}: TakeOfferContentProps) {
  const { t } = useThemeClasses()
  const { postOffer, isPosting } = useOfferInspection()
  const takeOfferMutation = useTakeOffer()
  const { getCatTokenInfo } = useCatTokens()
  const dexieDataService = useDexieDataService()

  // Form state
  const [offerString, setOfferString] = useState('')
  const [fee, setFee] = useState(getMinimumFeeInXch())
  const [feeInput, setFeeInput] = useState(getMinimumFeeInXch().toString())

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [parseError, setParseError] = useState('')
  const [offerPreview, setOfferPreview] = useState<{
    assetsOffered?: OfferAsset[]
    assetsRequested?: OfferAsset[]
    creatorAddress?: string
    fee?: number
    status?: string
    dexieStatus?: string
  } | null>(null)
  const [isLoadingOfferString, setIsLoadingOfferString] = useState(false)

  // Refs to prevent infinite loops
  const isParsingRef = useRef(false)
  const lastParsedOfferRef = useRef<string>('')
  const lastFetchedOrderIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)
  const postOfferRef = useRef(postOffer)
  const getCatTokenInfoRef = useRef(getCatTokenInfo)

  // Update refs when functions change
  useEffect(() => {
    postOfferRef.current = postOffer
    getCatTokenInfoRef.current = getCatTokenInfo
  }, [postOffer, getCatTokenInfo])

  // Fetch offer string when order changes - ONLY ONCE per order
  useEffect(() => {
    if (!order?.id) {
      // Reset everything if no order
      setOfferString('')
      setOfferPreview(null)
      setParseError('')
      setErrorMessage('')
      setSuccessMessage('')
      lastParsedOfferRef.current = ''
      lastFetchedOrderIdRef.current = null
      isFetchingRef.current = false
      setIsLoadingOfferString(false)
      return
    }

    // Skip if we've already fetched for this order ID
    if (lastFetchedOrderIdRef.current === order.id || isFetchingRef.current) {
      return
    }

    // Reset form state when order changes
    setOfferString('')
    setOfferPreview(null)
    setParseError('')
    setErrorMessage('')
    setSuccessMessage('')
    lastParsedOfferRef.current = ''

    // Mark that we're fetching for this order
    lastFetchedOrderIdRef.current = order.id
    isFetchingRef.current = true

    // Fetch new offer string
    setIsLoadingOfferString(true)

    const fetchOffer = async () => {
      try {
        const response = await dexieDataService.inspectOffer(order.id)

        // Check if order ID still matches (user might have clicked another order)
        if (lastFetchedOrderIdRef.current !== order.id) {
          return
        }

        if (response && response.success && response.offer?.offer) {
          setOfferString(response.offer.offer)
        } else {
          const errorMsg = response?.error_message || 'Could not fetch offer string for this order'
          setErrorMessage(errorMsg)
          logger.warn('Failed to fetch offer string:', { orderId: order.id, response })
        }
      } catch (error) {
        // Check if order ID still matches
        if (lastFetchedOrderIdRef.current !== order.id) {
          return
        }
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
        setErrorMessage(`Failed to fetch offer string: ${errorMsg}`)
        logger.error('Error fetching offer string:', error)
      } finally {
        // Only update loading state if we're still on the same order
        if (lastFetchedOrderIdRef.current === order.id) {
          setIsLoadingOfferString(false)
          isFetchingRef.current = false
        }
      }
    }

    fetchOffer()
  }, [order?.id]) // Only depend on order.id

  // Parse offer when string changes
  useEffect(() => {
    const parseOffer = async () => {
      const trimmedOffer = offerString.trim()

      // Skip if empty, already parsing, or same as last parsed
      if (!trimmedOffer || isParsingRef.current || lastParsedOfferRef.current === trimmedOffer) {
        return
      }

      if (!validateOfferString(trimmedOffer)) {
        setParseError('Invalid offer string format')
        setOfferPreview(null)
        return
      }

      // Mark as parsing and update last parsed
      isParsingRef.current = true
      lastParsedOfferRef.current = trimmedOffer
      setParseError('')
      setOfferPreview(null)

      // Use Dexie to inspect the offer and get real asset details
      try {
        const postResponse = await postOfferRef.current({
          offer: trimmedOffer,
          drop_only: false,
          claim_rewards: false,
        })

        if (postResponse && postResponse.success && postResponse.offer) {
          // The POST response contains the full offer data - use it directly
          const appOffer = convertDexieOfferToAppOffer(postResponse)

          // Enrich assets with ticker symbols
          const enrichedAssetsOffered = await Promise.all(
            appOffer.assetsOffered.map(async (asset) => {
              if (asset.assetId) {
                const tickerInfo = await getCatTokenInfoRef.current(asset.assetId)
                return {
                  ...asset,
                  symbol: tickerInfo?.ticker || undefined,
                }
              }
              return asset
            })
          )

          const enrichedAssetsRequested = await Promise.all(
            appOffer.assetsRequested.map(async (asset) => {
              if (asset.assetId) {
                const tickerInfo = await getCatTokenInfoRef.current(asset.assetId)
                return {
                  ...asset,
                  symbol: tickerInfo?.ticker || undefined,
                }
              }
              return asset
            })
          )

          setOfferPreview({
            assetsOffered: enrichedAssetsOffered,
            assetsRequested: enrichedAssetsRequested,
            creatorAddress: appOffer.creatorAddress,
            fee: appOffer.fee,
            status: appOffer.status,
            dexieStatus: appOffer.dexieStatus,
          })
          setParseError('')
        } else if (postResponse && postResponse.success && postResponse.id) {
          // Handle case where POST only returns ID (older API behavior)
          setParseError('Offer string validated - details will be confirmed by wallet')
          setOfferPreview({
            assetsOffered: [],
            assetsRequested: [],
            creatorAddress: undefined,
            fee: undefined,
          })
        }
      } catch {
        setParseError('Error inspecting offer on Dexie marketplace')
        setOfferPreview(null)
        // Reset last parsed on error so we can retry
        lastParsedOfferRef.current = ''
      } finally {
        isParsingRef.current = false
      }
    }

    // Debounce parsing
    const timeoutId = setTimeout(() => {
      parseOffer()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      // Reset parsing flag if component unmounts or effect re-runs
      isParsingRef.current = false
    }
  }, [offerString, isLoadingOfferString]) // Depend on offerString and loading state

  // Handle fee input
  const handleFeeChange = useCallback((value: string) => {
    setFeeInput(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setFee(numValue)
    }
  }, [])

  const isFormValid =
    offerString.trim().length > 0 && fee >= 0 && (!parseError || parseError.includes('validated'))

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrorMessage('')
      setSuccessMessage('')

      if (!isFormValid) {
        setErrorMessage('Please enter a valid offer string and fee')
        return
      }

      setIsSubmitting(true)

      try {
        const result = await takeOfferMutation.mutateAsync({
          offer: offerString.trim(),
          fee: fee,
        })

        if (result && result.success && result.tradeId) {
          const takenOffer: OfferDetails = {
            id: Date.now().toString(),
            tradeId: result.tradeId,
            offerString: offerString.trim(),
            status: 'pending',
            createdAt: new Date(),
            assetsOffered: offerPreview?.assetsOffered || [],
            assetsRequested: offerPreview?.assetsRequested || [],
            fee: offerPreview?.fee || fee,
            creatorAddress: offerPreview?.creatorAddress || 'unknown',
          }

          setSuccessMessage('Offer taken successfully!')
          onOfferTaken?.(takenOffer)

          // Reset form after a short delay
          setTimeout(() => {
            setOfferString('')
            setFee(getMinimumFeeInXch())
            setFeeInput(getMinimumFeeInXch().toString())
            setOfferPreview(null)
            setSuccessMessage('')
            if (mode === 'modal' && onClose) {
              onClose()
            }
          }, 1500)
        } else {
          throw new Error('Failed to take offer')
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
        setErrorMessage(`Failed to take offer: ${errorMsg}`)
      } finally {
        setIsSubmitting(false)
      }
    },
    [offerString, fee, isFormValid, takeOfferMutation, offerPreview, onOfferTaken, onClose, mode]
  )

  const getTickerSymbol = useCallback(
    (assetId: string | undefined, symbol?: string) => {
      if (symbol) return symbol
      if (!assetId) return 'XCH'
      const tickerInfo = getCatTokenInfo(assetId)
      return tickerInfo?.ticker || assetId.slice(0, 8)
    },
    [getCatTokenInfo]
  )

  const [isOrderDetailsExpanded, setIsOrderDetailsExpanded] = useState(false)
  const containerClass = mode === 'modal' ? 'space-y-4' : 'space-y-3'

  // Reset order details expanded state when order changes
  useEffect(() => {
    setIsOrderDetailsExpanded(false)
  }, [order?.id])

  return (
    <div className={containerClass}>
      {/* Form */}
      <form onSubmit={handleSubmit} className={containerClass}>
        {/* Offer Preview - Moved to top */}
        {offerPreview && (
          <div className={`p-3 rounded-lg ${t.cardHover} backdrop-blur-xl border ${t.border}`}>
            <h4 className={`text-xs font-medium ${t.text} mb-2`}>Offer Preview</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className={t.textSecondary}>You will receive:</span>
                <span className={t.text}>
                  {offerPreview.assetsOffered && offerPreview.assetsOffered.length > 0
                    ? offerPreview.assetsOffered
                        .map(
                          (a) =>
                            `${formatAssetAmount(a.amount, a.type)} ${getTickerSymbol(a.assetId, a.symbol)}`
                        )
                        .join(', ')
                    : 'Assets from offer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={t.textSecondary}>You will pay:</span>
                <span className={t.text}>
                  {offerPreview.assetsRequested && offerPreview.assetsRequested.length > 0
                    ? offerPreview.assetsRequested
                        .map(
                          (a) =>
                            `${formatAssetAmount(a.amount, a.type)} ${getTickerSymbol(a.assetId, a.symbol)}`
                        )
                        .join(', ')
                    : 'Assets to offer creator'}
                </span>
              </div>
              <div className={`flex justify-between border-t ${t.border} pt-1.5 mt-1.5`}>
                <span className={`font-medium ${t.text}`}>Fee:</span>
                <span className={`font-medium ${t.text}`}>
                  {formatXchAmount(offerPreview.fee !== undefined ? offerPreview.fee : fee)} XCH
                </span>
              </div>
              {offerPreview.dexieStatus && (
                <div className={`flex justify-between border-t ${t.border} pt-1.5 mt-1.5`}>
                  <span className={`font-medium ${t.text}`}>Status:</span>
                  <span className={`font-medium ${t.text}`}>
                    {getDexieStatusDescription(offerPreview.dexieStatus)}
                  </span>
                </div>
              )}
              {offerPreview.creatorAddress && (
                <div className={`flex justify-between border-t ${t.border} pt-1.5 mt-1.5`}>
                  <span className={`font-medium ${t.text}`}>Creator:</span>
                  <span className={`font-medium ${t.text} text-xs font-mono`}>
                    {offerPreview.creatorAddress.slice(0, 8)}...
                    {offerPreview.creatorAddress.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction Fee - Moved to top */}
        <div>
          <label className={`block text-xs font-medium ${t.text} mb-1.5`}>
            Transaction Fee (XCH)
          </label>
          <input
            type="number"
            value={feeInput}
            onChange={(e) => handleFeeChange(e.target.value)}
            step="0.000001"
            min="0"
            placeholder={getMinimumFeeInXch().toString()}
            className={`w-full px-2 py-1.5 border rounded-lg text-xs ${t.input} ${t.border} backdrop-blur-xl`}
            disabled={isSubmitting}
          />
          <p className={`mt-1 text-xs ${t.textSecondary}`}>
            Fee can be 0 for free transactions (minimum: {formatXchAmount(getMinimumFeeInXch())}{' '}
            XCH)
          </p>
        </div>

        {/* Take Offer Button - Moved to top */}
        <div className="flex flex-wrap justify-end gap-2">
          {mode === 'modal' && onClose && (
            <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            variant="success"
            icon={isSubmitting ? undefined : ShoppingCart}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Taking...
              </>
            ) : (
              'Take Offer'
            )}
          </Button>
        </div>

        {/* Loading indicator when fetching offer string */}
        {isLoadingOfferString && (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400 mr-2" />
            <span className={`text-xs ${t.textSecondary}`}>Loading offer string...</span>
          </div>
        )}

        {/* Parse error display */}
        {parseError && (
          <div
            className={`p-2 rounded-lg border ${t.border} backdrop-blur-xl ${
              parseError.includes('validated')
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <p
              className={`text-xs ${
                parseError.includes('validated')
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {parseError}
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isPosting && (
          <div className="flex items-center py-2">
            <Loader2 size={12} className="animate-spin text-blue-600 dark:text-blue-400 mr-2" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Processing offer with Dexie marketplace...
            </p>
          </div>
        )}

        {/* Error/Success Messages */}
        {errorMessage && (
          <div
            className={`p-2 rounded-lg border ${t.border} backdrop-blur-xl bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`}
          >
            <p className="text-xs text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div
            className={`p-2 rounded-lg border ${t.border} backdrop-blur-xl bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800`}
          >
            <p className="text-xs text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        )}
      </form>

      {/* Order Details Section - Collapsible, only show if order is provided */}
      {order && (
        <div
          className={`rounded-lg ${t.cardHover} backdrop-blur-xl border ${t.border} overflow-hidden`}
        >
          <button
            type="button"
            onClick={() => setIsOrderDetailsExpanded(!isOrderDetailsExpanded)}
            className={`w-full p-3 flex items-center justify-between ${t.cardHover} transition-colors`}
          >
            <span className={`text-sm font-medium ${t.text}`}>Order Details</span>
            <svg
              className={`w-4 h-4 ${t.textSecondary} transition-transform ${
                isOrderDetailsExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isOrderDetailsExpanded && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <OrderDetailsSection order={order} offerString={offerString} mode={mode} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
