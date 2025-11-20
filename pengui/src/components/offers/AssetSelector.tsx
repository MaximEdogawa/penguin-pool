'use client'

import { useThemeClasses } from '@/hooks/useThemeClasses'
import { useCatTokens } from '@/hooks/useTickers'
import type { OfferAsset } from '@/types/offer.types'
import {
  formatAssetAmount,
  getAmountPlaceholder,
  isValidAmountInput,
  parseAmountInput,
} from '@/lib/utils/chia-units'
import { X } from 'lucide-react'
import { useCallback, useState } from 'react'

export interface ExtendedOfferAsset extends OfferAsset {
  searchQuery?: string
  showDropdown?: boolean
  _amountInput?: string // Temporary string for input while typing (like wallet form)
}

interface AssetSelectorProps {
  asset: ExtendedOfferAsset
  onUpdate: (asset: ExtendedOfferAsset) => void
  onRemove: () => void
  placeholder?: string
}

export default function AssetSelector({
  asset,
  onUpdate,
  onRemove,
  placeholder = 'Select asset',
}: AssetSelectorProps) {
  const { t } = useThemeClasses()
  const { availableCatTokens, isLoading: isLoadingTickers } = useCatTokens()
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredTokens = useCallback(
    (searchQuery: string) => {
      if (!searchQuery) return availableCatTokens
      const query = searchQuery.toLowerCase()
      return availableCatTokens.filter(
        (token) =>
          token.ticker.toLowerCase().includes(query) || token.name.toLowerCase().includes(query)
      )
    },
    [availableCatTokens]
  )

  const selectCatToken = useCallback(
    (token: { assetId: string; ticker: string; symbol?: string }) => {
      onUpdate({
        ...asset,
        assetId: token.assetId,
        // Set symbol from token to ensure correct mapping
        symbol: token.symbol || token.ticker,
        searchQuery: token.ticker,
        showDropdown: false,
      })
      setShowDropdown(false)
    },
    [asset, onUpdate]
  )

  const clearAssetSelection = useCallback(() => {
    onUpdate({
      ...asset,
      assetId: '',
      symbol: '',
      searchQuery: '',
      showDropdown: false,
    })
  }, [asset, onUpdate])

  const handleTypeChange = useCallback(
    (newType: 'xch' | 'cat' | 'nft') => {
      clearAssetSelection()
      onUpdate({
        ...asset,
        type: newType,
      })
    },
    [asset, onUpdate, clearAssetSelection]
  )

  return (
    <div className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
      {/* Asset Type Selector */}
      <div className="flex-1">
        <select
          value={asset.type}
          onChange={(e) => handleTypeChange(e.target.value as 'xch' | 'cat' | 'nft')}
          className={`w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${t.text}`}
        >
          <option value="xch">XCH (Chia)</option>
          <option value="cat">CAT Token</option>
          <option value="nft">NFT</option>
        </select>
      </div>

      {/* Asset Selection */}
      <div className="flex-1 relative">
        {asset.type === 'xch' ? (
          <div
            className={`w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400`}
          >
            XCH (Chia)
          </div>
        ) : asset.type === 'cat' ? (
          <div className="relative">
            <input
              type="text"
              value={asset.searchQuery || ''}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onChange={(e) =>
                onUpdate({
                  ...asset,
                  searchQuery: e.target.value,
                })
              }
              placeholder={isLoadingTickers ? 'Loading tokens...' : 'Search CAT tokens...'}
              className={`w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${t.text}`}
              disabled={isLoadingTickers}
            />

            {/* Dropdown */}
            {showDropdown && filteredTokens(asset.searchQuery || '').length > 0 && (
              <div
                className={`absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto`}
              >
                {filteredTokens(asset.searchQuery || '').map((token) => (
                  <div
                    key={token.assetId}
                    onClick={() => selectCatToken(token)}
                    className={`px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-xs ${t.text}`}
                  >
                    <div className="font-medium">{token.ticker}</div>
                    {token.name && token.name !== token.ticker && (
                      <div className={`text-xs ${t.textSecondary} mt-0.5`}>{token.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={asset.assetId}
            onChange={(e) =>
              onUpdate({
                ...asset,
                assetId: e.target.value,
              })
            }
            placeholder="NFT Asset ID"
            className={`w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${t.text}`}
          />
        )}
      </div>

      {/* Amount Input */}
      <div className="flex-1">
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          value={
            asset._amountInput !== undefined
              ? asset._amountInput
              : asset.amount !== undefined && asset.amount !== 0
                ? formatAssetAmount(asset.amount, asset.type)
                : ''
          }
          onChange={(e) => {
            const inputValue = e.target.value
            // Validate input format using utility
            if (isValidAmountInput(inputValue)) {
              // Store as string while typing
              onUpdate({
                ...asset,
                _amountInput: inputValue,
                // Convert to number for storage
                amount: parseAmountInput(inputValue),
              })
            }
          }}
          onBlur={() => {
            // On blur, ensure we have a valid number and clear the temporary string
            const finalAmount = parseAmountInput(asset._amountInput || '')
            onUpdate({
              ...asset,
              amount: finalAmount,
              _amountInput: undefined,
            })
          }}
          placeholder={getAmountPlaceholder(asset.type)}
          className={`w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${t.text}`}
        />
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      >
        <X size={14} />
      </button>
    </div>
  )
}
