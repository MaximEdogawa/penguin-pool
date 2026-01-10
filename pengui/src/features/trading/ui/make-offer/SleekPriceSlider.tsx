'use client'

import { useThemeClasses } from '@/shared/hooks'
import { useEffect, useRef, useState } from 'react'

interface SleekPriceSliderProps {
  value: number // Current adjustment percentage (-100 to +100)
  onChange: (value: number) => void
  label: string
  snapInterval?: number // Default 10
}

export default function SleekPriceSlider({
  value,
  onChange,
  label,
  snapInterval = 5,
}: SleekPriceSliderProps) {
  const { t } = useThemeClasses()
  const sliderIdRef = useRef(`sleek-slider-${Math.random().toString(36).substr(2, 9)}`)
  const styleIdRef = useRef(`sleek-slider-style-${Math.random().toString(36).substr(2, 9)}`)
  const [isFineTune, setIsFineTune] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  // Handle Shift key for fine-tuning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Effective fine-tune mode: either toggle is on OR Shift is pressed
  const effectiveFineTune = isFineTune || isShiftPressed

  // Ensure value is always a valid number
  const safeValue = typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : 0
  const clampedValue = Math.max(-100, Math.min(100, safeValue))

  // Handle slider change with snapping
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    let newValue = parseFloat(rawValue)

    // Validate
    if (isNaN(newValue) || !isFinite(newValue)) {
      return
    }

    // Apply snapping if not in fine-tune mode
    if (!effectiveFineTune) {
      // Snap to nearest interval
      newValue = Math.round(newValue / snapInterval) * snapInterval
    }

    // Clamp to -100 to +100
    newValue = Math.max(-100, Math.min(100, newValue))
    onChange(newValue)
  }

  // Format percentage for display
  const formatPercentage = (val: number): string => {
    if (val === 0) return '0%'
    const decimals = effectiveFineTune ? 2 : 1
    if (val > 0) return `+${val.toFixed(decimals)}%`
    return `${val.toFixed(decimals)}%`
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
      {/* Label and Toggle on same row */}
      <div className="flex items-center justify-between">
        <label className={`text-[9px] ${t.textSecondary} font-normal`}>{label}</label>
        <button
          type="button"
          onClick={() => setIsFineTune(!isFineTune)}
          className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
            effectiveFineTune
              ? 'bg-blue-500/10 border-blue-400/30 text-blue-600 dark:text-blue-400'
              : `${t.border} ${t.textSecondary}`
          }`}
          title={
            effectiveFineTune
              ? 'Fine-tune mode (or hold Shift)'
              : 'Click for fine-tune (or hold Shift)'
          }
        >
          {effectiveFineTune ? 'Fine' : 'Snap'}
        </button>
      </div>

      {/* Slider and Percentage Display row */}
      <div className="flex items-center gap-2">
        {/* Slider - full width */}
        <div className="flex-1 relative">
          <input
            id={sliderIdRef.current}
            type="range"
            min="-100"
            max="100"
            step={effectiveFineTune ? 0.1 : snapInterval}
            value={clampedValue}
            onChange={handleSliderChange}
            className="w-full h-0.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                rgba(156, 163, 175, 0.3) 0%,
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
