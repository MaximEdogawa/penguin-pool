'use client'

import { useThemeClasses } from '@/hooks/useThemeClasses'
import type { AssetType } from '@/types/offer.types'

interface AssetIdInputProps {
  value: string
  onChange: (value: string) => void
  type: AssetType
  placeholder: string
}

export default function AssetIdInput({ value, onChange, type, placeholder }: AssetIdInputProps) {
  const { t, isDark } = useThemeClasses()

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-xs font-medium rounded-lg border ${t.border} ${t.bg} transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isDark
          ? 'text-white placeholder:text-gray-400'
          : 'text-slate-900 placeholder:text-slate-500'
      }`}
    />
  )
}
