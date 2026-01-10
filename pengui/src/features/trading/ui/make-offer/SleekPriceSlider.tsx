'use client'

import { useThemeClasses } from '@/shared/hooks'
import { useEffect, useRef } from 'react'

interface SleekPriceSliderProps {
  value: number // Current adjustment percentage (-100 to +100)
  onChange: (value: number) => void
  label: string
  snapInterval?: number // Default 10 (not used in simple version)
}

export default function SleekPriceSlider({
  value,
  onChange,
  label,
  snapInterval = 10,
}: SleekPriceSliderProps) {
  const { t } = useThemeClasses()
  const sliderIdRef = useRef(`sleek-slider-${Math.random().toString(36).substr(2, 9)}`)
  const styleIdRef = useRef(`sleek-slider-style-${Math.random().toString(36).substr(2, 9)}`)

  // Ensure value is always a valid number
  const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0
  const clampedValue = Math.max(-100, Math.min(100, safeValue))

  // Simple onChange handler - no complex logic, no callbacks, no dependencies
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const newValue = parseFloat(rawValue)

    // Validate and clamp
    if (!isNaN(newValue) && isFinite(newValue)) {
      const clamped = Math.max(-100, Math.min(100, newValue))
      onChange(clamped)
    }
  }

  // Format percentage for display
  const formatPercentage = (val: number): string => {
    if (val === 0) return '0%'
    if (val > 0) return `+${val.toFixed(1)}%`
    return `${val.toFixed(1)}%`
  }

  // Slider color based on value
  const sliderColor = clampedValue === 0 ? '#9ca3af' : clampedValue > 0 ? '#22c55e' : '#ef4444'

  // Inject slider styles
  useEffect(() => {
    const styleId = styleIdRef.current
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = `
      #${sliderIdRef.current}::-webkit-slider-thumb {
        appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${sliderColor};
        border: 1.5px solid rgba(255, 255, 255, 0.9);
        cursor: pointer;
        box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }
      #${sliderIdRef.current}::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.25);
      }
      #${sliderIdRef.current}::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${sliderColor};
        border: 1.5px solid rgba(255, 255, 255, 0.9);
        cursor: pointer;
        box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }
      #${sliderIdRef.current}::-moz-range-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.25);
      }
    `

    return () => {
      const element = document.getElementById(styleId)
      if (element) {
        element.remove()
      }
    }
  }, [sliderColor])

  return (
    <div className="flex flex-col gap-1 py-0">
      {/* Label above */}
      <label className={`text-[9px] ${t.textSecondary} font-normal`}>{label}</label>

      {/* Slider and controls row */}
      <div className="flex items-center gap-2">
        {/* Slider - full width */}
        <div className="flex-1 relative">
          <input
            id={sliderIdRef.current}
            type="range"
            min="-100"
            max="100"
            step="0.1"
            value={clampedValue}
            onChange={handleSliderChange}
            className="w-full h-0.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                ${sliderColor} 0%,
                ${sliderColor} ${50 + clampedValue / 2}%,
                rgba(156, 163, 175, 0.3) ${50 + clampedValue / 2}%,
                rgba(156, 163, 175, 0.3) 100%)`,
            }}
          />
        </div>

        {/* Percentage Display */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-[10px] font-semibold font-mono tabular-nums ${
              clampedValue === 0
                ? t.textSecondary
                : clampedValue > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatPercentage(clampedValue)}
          </span>
        </div>
      </div>
    </div>
  )
}
