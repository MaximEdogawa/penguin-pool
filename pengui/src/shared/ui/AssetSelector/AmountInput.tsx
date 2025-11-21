'use client'

import { useThemeClasses } from '@/shared/hooks'
import {
  formatAssetAmount,
  getAmountPlaceholder,
  isValidAmountInput,
  parseAmountInput,
} from '@/shared/lib/utils/chia-units'
import type { AssetType } from '@/entities/offer'

interface AmountInputProps {
  value: number | undefined
  tempInput: string | undefined
  type: AssetType
  onChange: (amount: number, tempInput?: string) => void
  onBlur: () => void
}

export default function AmountInput({
  value,
  tempInput,
  type,
  onChange,
  onBlur,
}: AmountInputProps) {
  const { t, isDark } = useThemeClasses()

  const displayValue =
    tempInput !== undefined
      ? tempInput
      : value !== undefined && value !== 0
        ? formatAssetAmount(value, type)
        : ''

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*\.?[0-9]*"
      value={displayValue}
      onChange={(e) => {
        const inputValue = e.target.value
        if (isValidAmountInput(inputValue)) {
          onChange(parseAmountInput(inputValue), inputValue)
        }
      }}
      onBlur={onBlur}
      placeholder={getAmountPlaceholder(type)}
      className={`w-full px-3 py-2 text-xs font-medium rounded-lg border ${t.border} ${t.bg} transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDark
          ? 'text-white placeholder:text-gray-400'
          : 'text-slate-900 placeholder:text-slate-500'
      }`}
    />
  )
}
