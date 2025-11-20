'use client'

import EmptyState from '@/components/wallet/shared/EmptyState'
import { useMyOffers } from '@/hooks/useMyOffers'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { formatAssetAmount } from '@/lib/utils/chia-units'
import { Eye, Handshake, X as XIcon } from 'lucide-react'
import { useEffect } from 'react'

import type { OfferDetails } from '@/types/offer.types'

interface OfferHistoryProps {
  onCreateOffer: () => void
  onViewOffer: (offer: OfferDetails) => void
  onCancelOffer?: (offer: OfferDetails) => void
  // Optional props to share state from parent
  offers?: OfferDetails[]
  isLoading?: boolean
  filters?: { status?: string }
  setFilters?: (filters: { status?: string }) => void
  getStatusClass?: (status: string) => string
  formatDate?: (date: Date) => string
  copyOfferString?: (offerString: string) => Promise<void>
  getTickerSymbol?: (assetId: string) => string
  isCopied?: string | null
  refreshOffers?: () => Promise<void>
}

export default function OfferHistory({
  onCreateOffer,
  onViewOffer,
  onCancelOffer,
  offers: parentOffers,
  isLoading: parentIsLoading,
  filters: parentFilters,
  setFilters: parentSetFilters,
  getStatusClass: parentGetStatusClass,
  formatDate: parentFormatDate,
  copyOfferString: parentCopyOfferString,
  getTickerSymbol: parentGetTickerSymbol,
  isCopied: parentIsCopied,
  refreshOffers: parentRefreshOffers,
}: OfferHistoryProps) {
  const { t } = useThemeClasses()

  // Use parent state if provided, otherwise use hook
  const hookData = useMyOffers()
  const {
    isLoading: hookIsLoading,
    filteredOffers: hookFilteredOffers,
    filters: hookFilters,
    setFilters: hookSetFilters,
    refreshOffers: hookRefreshOffers,
    viewOffer,
    cancelOffer: defaultCancelOffer,
    getStatusClass: hookGetStatusClass,
    formatDate: hookFormatDate,
    copyOfferString: hookCopyOfferString,
    getTickerSymbol: hookGetTickerSymbol,
    isCopied: hookIsCopied,
  } = hookData

  // Use parent props if provided, otherwise use hook values
  const isLoading = parentIsLoading ?? hookIsLoading
  // If parent provides offers, use them directly (they're already filtered by parent)
  // Otherwise use the hook's filtered offers
  const filteredOffers = parentOffers ?? hookFilteredOffers
  const filters = parentFilters ?? hookFilters
  const setFilters = parentSetFilters ?? hookSetFilters
  const getStatusClass = parentGetStatusClass ?? hookGetStatusClass
  const formatDate = parentFormatDate ?? hookFormatDate
  const copyOfferString = parentCopyOfferString ?? hookCopyOfferString
  const getTickerSymbol = parentGetTickerSymbol ?? hookGetTickerSymbol
  const isCopied = parentIsCopied ?? hookIsCopied
  const refreshOffers = parentRefreshOffers ?? hookRefreshOffers

  // Use the passed cancel handler if provided, otherwise use the default from hook
  const cancelOffer = onCancelOffer || defaultCancelOffer

  // Load offers on mount only if using hook (not parent state)
  useEffect(() => {
    if (!parentOffers && refreshOffers) {
      refreshOffers()
    }
  }, [parentOffers, refreshOffers])

  const handleViewOffer = (offer: OfferDetails) => {
    viewOffer(offer)
    onViewOffer(offer)
  }

  return (
    <div className={`${t.card} p-4 sm:p-6 pb-8`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg sm:text-xl font-semibold ${t.text}`}>My Offers</h2>
        <div className="flex items-center space-x-2">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${t.text} text-base sm:text-sm`}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredOffers.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b border-gray-200 dark:border-gray-700`}>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${t.textSecondary}`}>
                    Offer String
                  </th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${t.textSecondary}`}>
                    Status
                  </th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${t.textSecondary}`}>
                    Assets
                  </th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${t.textSecondary}`}>
                    Created
                  </th>
                  <th className={`text-left py-3 px-4 text-sm font-medium ${t.textSecondary}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => (
                  <tr
                    key={offer.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                  >
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => copyOfferString(offer.offerString)}
                        className={`bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[200px] sm:max-w-[250px] ${
                          isCopied === offer.offerString
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            : ''
                        }`}
                        title={
                          isCopied === offer.offerString ? 'Copied!' : 'Click to copy offer string'
                        }
                      >
                        <span className="transition-all duration-300 truncate block">
                          {offer.offerString?.slice(0, 12) || 'Unknown'}...
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                          offer.status
                        )}`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${t.text}`}>
                      <div className="space-y-1">
                        {(offer.assetsOffered || []).slice(0, 2).map((asset, idx) => (
                          <div
                            key={`offered-${asset.assetId}-${idx}`}
                            className="text-xs flex items-center justify-between"
                          >
                            <span className="font-medium">
                              {formatAssetAmount(asset.amount, asset.type)}
                            </span>
                            <span className={`${t.textSecondary} ml-2`}>
                              {getTickerSymbol(asset.assetId)}
                            </span>
                          </div>
                        ))}
                        {(offer.assetsOffered || []).length > 2 && (
                          <div className={`text-xs ${t.textSecondary} font-medium`}>
                            +{(offer.assetsOffered || []).length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-sm ${t.textSecondary}`}>
                      {formatDate(offer.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOffer(offer)}
                          className={`text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm flex items-center`}
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </button>
                        {offer.status === 'active' && (
                          <button
                            onClick={() => cancelOffer(offer)}
                            className={`text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center`}
                          >
                            <XIcon size={14} className="mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 pb-8">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4`}
              >
                {/* Header with Offer String and Status */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => copyOfferString(offer.offerString)}
                    className={`bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[200px] sm:max-w-[250px] ${
                      isCopied === offer.offerString
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : ''
                    }`}
                    title={
                      isCopied === offer.offerString ? 'Copied!' : 'Click to copy offer string'
                    }
                  >
                    <span className="transition-all duration-300 truncate block">
                      {offer.offerString?.slice(0, 12) || 'Unknown'}...
                    </span>
                  </button>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusClass(
                      offer.status
                    )}`}
                  >
                    {offer.status}
                  </span>
                </div>

                {/* Assets Section */}
                <div className="mb-3">
                  <div className={`text-xs font-medium ${t.textSecondary} mb-2`}>
                    Assets Offered ({(offer.assetsOffered || []).length})
                  </div>
                  <div className="space-y-1">
                    {(offer.assetsOffered || []).slice(0, 3).map((asset, idx) => (
                      <div
                        key={`mobile-offered-${asset.assetId}-${idx}`}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <span className="font-medium">
                          {formatAssetAmount(asset.amount, asset.type)}
                        </span>
                        <span className={t.textSecondary}>{getTickerSymbol(asset.assetId)}</span>
                      </div>
                    ))}
                    {(offer.assetsOffered || []).length > 3 && (
                      <div className={`text-xs ${t.textSecondary} font-medium`}>
                        +{(offer.assetsOffered || []).length - 3} more assets
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Date and Actions */}
                <div
                  className={`flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700`}
                >
                  <span className={`text-xs ${t.textSecondary}`}>
                    {formatDate(offer.createdAt)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewOffer(offer)}
                      className={`text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs flex items-center`}
                    >
                      <Eye size={12} className="mr-1" />
                      View
                    </button>
                    {offer.status === 'active' && (
                      <button
                        onClick={() => cancelOffer(offer)}
                        className={`text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center`}
                      >
                        <XIcon size={12} className="mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Handshake}
          message="No offers found. Create your first offer to start trading."
        />
      )}
    </div>
  )
}
