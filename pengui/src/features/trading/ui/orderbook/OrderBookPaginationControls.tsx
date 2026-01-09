'use client'

import { useThemeClasses } from '@/shared/hooks'
import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { OrderBookPagination } from '../../lib/orderBookTypes'

const PAGINATION_STORAGE_KEY = 'orderBookPagination'

const PAGINATION_OPTIONS: { value: OrderBookPagination; label: string }[] = [
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 'all', label: 'All' },
]

interface OrderBookPaginationControlsProps {
  value: OrderBookPagination
  onChange: (value: OrderBookPagination) => void
}

export default function OrderBookPaginationControls({
  value,
  onChange,
}: OrderBookPaginationControlsProps) {
  const { t } = useThemeClasses()
  const [isOpen, setIsOpen] = useState(false)

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(PAGINATION_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (PAGINATION_OPTIONS.some((opt) => opt.value === parsed)) {
        onChange(parsed as OrderBookPagination)
      }
    }
  }, [onChange])

  // Save preference when value changes
  useEffect(() => {
    localStorage.setItem(PAGINATION_STORAGE_KEY, JSON.stringify(value))
  }, [value])

  const handleSelect = useCallback(
    (newValue: OrderBookPagination) => {
      onChange(newValue)
      setIsOpen(false)
    },
    [onChange]
  )

  const currentLabel = PAGINATION_OPTIONS.find((opt) => opt.value === value)?.label || '50'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${t.card} border ${t.border} ${t.cardHover} transition-colors`}
        title="Select how many orders to fetch"
        aria-label={`Current: ${currentLabel} orders. Click to change.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={t.text}>{currentLabel}</span>
        <ChevronDown
          className={`w-3 h-3 ${t.textSecondary} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-full mt-1 z-20 min-w-[80px] ${t.card} border ${t.border} rounded-lg shadow-lg backdrop-blur-xl`}
            role="listbox"
          >
            {PAGINATION_OPTIONS.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  value === option.value
                    ? `${t.cardHover} font-medium ${t.text}`
                    : `${t.textSecondary} ${t.cardHover}`
                }`}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
