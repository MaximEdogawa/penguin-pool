'use client'

import {
  formatAssetAmount,
  formatXchAmount,
  getAmountPlaceholder,
  isValidAmountInput,
  parseAmountInput,
} from '@/lib/utils/chia-units'
import type { AssetAmount, AssetType } from '@/types/offer.types'
import { useCallback, useEffect, useState } from 'react'

interface UseAmountInputOptions {
  initialValue?: AssetAmount
  value?: AssetAmount
  assetType?: AssetType
  onBlur?: (value: AssetAmount) => void
  onChange?: (value: AssetAmount) => void
}

/**
 * Composable for managing amount input fields (XCH, CAT, NFT)
 * Handles input validation, formatting, and state management
 */
export function useAmountInput({
  initialValue = 0,
  value,
  assetType = 'xch',
  onBlur,
  onChange,
}: UseAmountInputOptions = {}) {
  const [inputValue, setInputValue] = useState<string | undefined>(undefined)
  const [numericValue, setNumericValue] = useState<AssetAmount>(value ?? initialValue)

  // Sync with external value changes (controlled mode)
  useEffect(() => {
    if (value !== undefined && value !== numericValue && inputValue === undefined) {
      setNumericValue(value)
    }
  }, [value, numericValue, inputValue])

  // Get formatted display value
  const getDisplayValue = useCallback((): string => {
    if (inputValue !== undefined) {
      return inputValue
    }
    if (numericValue !== undefined && numericValue !== 0) {
      return assetType === 'xch'
        ? formatXchAmount(numericValue)
        : formatAssetAmount(numericValue, assetType)
    }
    return ''
  }, [inputValue, numericValue, assetType])

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      if (isValidAmountInput(inputVal)) {
        setInputValue(inputVal)
        const parsed = parseAmountInput(inputVal)
        setNumericValue(parsed)
        onChange?.(parsed)
      }
    },
    [onChange]
  )

  // Handle input blur
  const handleBlur = useCallback(() => {
    const finalValue = parseAmountInput(inputValue !== undefined ? inputValue : '')
    setNumericValue(finalValue)
    setInputValue(undefined)
    onBlur?.(finalValue)
  }, [inputValue, onBlur])

  // Set value programmatically
  const setValue = useCallback((value: AssetAmount) => {
    setNumericValue(value)
    setInputValue(undefined)
  }, [])

  // Reset to initial value
  const reset = useCallback(() => {
    setNumericValue(initialValue)
    setInputValue(undefined)
  }, [initialValue])

  return {
    value: getDisplayValue(),
    numericValue,
    placeholder: getAmountPlaceholder(assetType),
    onChange: handleChange,
    onBlur: handleBlur,
    setValue,
    reset,
  }
}
