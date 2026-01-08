import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
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
import { Loader2, ShoppingCart, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface TakeOfferModalProps {
  onClose: () => void
  onOfferTaken?: (offer: OfferDetails) => void
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
  // DexieAsset has: id (asset ID), code, name, amount
  // If id is empty or "XCH", it's XCH, otherwise it's a CAT token
  // For XCH assets, assetId should be empty string (as per BaseAsset interface requirement)
  const assetsOffered: OfferAsset[] = (offer.offered || []).map((asset) => {
    const isXch = !asset.id || asset.id === 'XCH'
    return {
      amount: asset.amount,
      assetId: isXch ? '' : asset.id, // Empty string for XCH, asset ID for CAT
      type: (isXch ? 'xch' : 'cat') as 'xch' | 'cat',
      symbol: asset.code || undefined, // Use code as symbol
    }
  })

  const assetsRequested: OfferAsset[] = (offer.requested || []).map((asset) => {
    const isXch = !asset.id || asset.id === 'XCH'
    return {
      amount: asset.amount,
      assetId: isXch ? '' : asset.id, // Empty string for XCH, asset ID for CAT
      type: (isXch ? 'xch' : 'cat') as 'xch' | 'cat',
      symbol: asset.code || undefined, // Use code as symbol
    }
  })

  return {
    assetsOffered,
    assetsRequested,
    creatorAddress: undefined, // Dexie doesn't provide this directly
    fee: offer.fees ? offer.fees / 1_000_000_000_000 : 0, // Convert mojos to XCH
    status: convertOfferStateToStatus(calculatedState),
    dexieStatus: calculatedState,
  }
}

export default function TakeOfferModal({ onClose, onOfferTaken }: TakeOfferModalProps) {
  const { t } = useThemeClasses()
  const { postOffer, isPosting } = useOfferInspection()
  const takeOfferMutation = useTakeOffer()
  const { getCatTokenInfo } = useCatTokens()

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

  // Refs to prevent infinite loops
  const isParsingRef = useRef(false)
  const lastParsedOfferRef = useRef<string>('')
  const postOfferRef = useRef(postOffer)
  const getCatTokenInfoRef = useRef(getCatTokenInfo)

  // Update refs when functions change
  useEffect(() => {
    postOfferRef.current = postOffer
    getCatTokenInfoRef.current = getCatTokenInfo
  }, [postOffer, getCatTokenInfo])

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
          // For now, just show basic validation
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
  }, [offerString]) // Only depend on offerString, functions are accessed via refs

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
            onClose()
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
    [offerString, fee, isFormValid, takeOfferMutation, offerPreview, onOfferTaken, onClose]
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

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg" closeOnOverlayClick={!isSubmitting}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${t.text}`}>Take Offer</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`${t.textSecondary} hover:${t.text} transition-colors disabled:opacity-50`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Offer String Input */}
          <div>
            <label className={`block text-xs font-medium ${t.text} mb-1.5`}>Offer String</label>
            <textarea
              value={offerString}
              onChange={(e) => setOfferString(e.target.value)}
              rows={4}
              placeholder="Paste the offer string here..."
              className={`w-full px-2 py-1.5 border rounded-lg resize-none text-xs font-mono ${t.input} ${t.border} backdrop-blur-xl`}
              required
              disabled={isSubmitting}
            />
            <p className={`mt-1 text-xs ${t.textSecondary}`}>
              Paste the complete offer string from the offer creator
            </p>
            {parseError && (
              <p
                className={`mt-1 text-xs ${
                  parseError.includes('validated')
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {parseError}
              </p>
            )}
            {isPosting && (
              <div className="mt-2 flex items-center">
                <Loader2 size={12} className="animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Processing offer with Dexie marketplace...
                </p>
              </div>
            )}
          </div>

          {/* Transaction Fee */}
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

          {/* Offer Preview */}
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

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-white/20 dark:border-white/10">
            <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
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
        </form>
      </div>
    </Modal>
  )
}
