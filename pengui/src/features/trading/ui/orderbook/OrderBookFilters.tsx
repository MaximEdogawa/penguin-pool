'use client'

import { useThemeClasses } from '@/shared/hooks'
import { useCatTokens } from '@/shared/hooks/useTickers'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'
import { X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SuggestionItem } from '../../lib/orderBookTypes'
import { useOrderBookFilters } from '../../model/useOrderBookFilters'
import AssetSwapToggle from './AssetSwapToggle'

interface OrderBookFiltersProps {
  onFiltersChange?: () => void
}

export default function OrderBookFilters({ onFiltersChange }: OrderBookFiltersProps) {
  const { t } = useThemeClasses()
  const {
    filters,
    searchValue,
    filteredSuggestions,
    setSearchValue,
    setFilteredSuggestions,
    addFilter,
    removeFilter,
  } = useOrderBookFilters()

  const { availableCatTokens } = useCatTokens()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Generate suggestions based on search value
  useEffect(() => {
    if (!searchValue || searchValue.trim().length === 0) {
      setFilteredSuggestions([])
      setShowSuggestions(false)
      return
    }

    const lowerSearch = searchValue.toLowerCase()
    const suggestions: SuggestionItem[] = []

    // Normalize XCH searches to native token ticker based on network
    const nativeTicker = getNativeTokenTicker().toLowerCase()
    const normalizedSearch =
      lowerSearch === 'xch' || lowerSearch === 'txch' ? nativeTicker : lowerSearch

    // Track added tickers to prevent duplicates
    const addedTickers = new Set<string>()

    // Add all available CAT tokens to suggestions
    availableCatTokens.forEach((token) => {
      const tokenTicker = token.ticker.toLowerCase()

      // Skip if already added or doesn't match search
      if (
        addedTickers.has(tokenTicker) ||
        (!tokenTicker.includes(normalizedSearch) &&
          !token.name.toLowerCase().includes(normalizedSearch))
      ) {
        return
      }

      // Mark as added
      addedTickers.add(tokenTicker)

      // Add buy suggestion if not already filtered
      if (
        !filters.buyAsset?.some((filter) => filter.toLowerCase() === token.ticker.toLowerCase())
      ) {
        suggestions.push({
          value: token.ticker,
          column: 'buyAsset',
          label: token.ticker,
        })
      }

      // Add sell suggestion if not already filtered
      if (
        !filters.sellAsset?.some((filter) => filter.toLowerCase() === token.ticker.toLowerCase())
      ) {
        suggestions.push({
          value: token.ticker,
          column: 'sellAsset',
          label: token.ticker,
        })
      }
    })

    setFilteredSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
  }, [searchValue, availableCatTokens, filters, setFilteredSuggestions])

  const handleSuggestionClick = useCallback(
    (suggestion: SuggestionItem) => {
      addFilter(suggestion.column as keyof typeof filters, suggestion.value)
      setSearchValue('')
      setShowSuggestions(false)
      // Trigger callback after state update
      setTimeout(() => {
        onFiltersChange?.()
      }, 0)
    },
    [addFilter, setSearchValue, filters, onFiltersChange]
  )

  const handleRemoveFilter = useCallback(
    (column: keyof typeof filters, value: string) => {
      removeFilter(column, value)
      // Trigger callback after state update
      setTimeout(() => {
        onFiltersChange?.()
      }, 0)
    },
    [removeFilter, onFiltersChange]
  )

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="space-y-3">
      {/* Search Input with Swap Toggle */}
      <div className="relative flex items-center gap-2">
        {/* Asset Swap Toggle - on the left side */}
        <AssetSwapToggle />

        {/* Search Input */}
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => {
              if (filteredSuggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder={`Search assets (e.g., ${getNativeTokenTicker()}, TBYC)...`}
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 ${t.border} ${t.bg} ${t.text} focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm`}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className={`absolute z-[100] w-full mt-1 backdrop-blur-[40px] ${t.card} border-2 ${t.border} rounded-lg shadow-2xl max-h-60 overflow-y-auto`}
              style={{
                boxShadow:
                  '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.column}-${suggestion.value}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-3 py-2 text-sm ${t.cardHover} ${t.text} transition-colors border-b ${t.border} last:border-b-0`}
                >
                  <div className="font-medium">{suggestion.label}</div>
                  <div className={`text-xs ${t.textSecondary}`}>
                    {suggestion.column === 'buyAsset' ? 'Buy Asset' : 'Sell Asset'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Buy Asset Filters */}
        {filters.buyAsset?.map((asset) => (
          <div
            key={`buy-${asset}`}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${t.card} border ${t.border} text-xs`}
          >
            <span className={t.text}>Buy: {asset}</span>
            <button
              type="button"
              onClick={() => handleRemoveFilter('buyAsset', asset)}
              className={`${t.textSecondary} hover:${t.text} transition-colors`}
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Sell Asset Filters */}
        {filters.sellAsset?.map((asset) => (
          <div
            key={`sell-${asset}`}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${t.card} border ${t.border} text-xs`}
          >
            <span className={t.text}>Sell: {asset}</span>
            <button
              type="button"
              onClick={() => handleRemoveFilter('sellAsset', asset)}
              className={`${t.textSecondary} hover:${t.text} transition-colors`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
