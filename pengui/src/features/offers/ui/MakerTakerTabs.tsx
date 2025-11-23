'use client'

import { useThemeClasses } from '@/shared/hooks'

interface MakerTakerTabsProps {
  activeMode: 'maker' | 'taker'
  onModeChange: (mode: 'maker' | 'taker') => void
}

export default function MakerTakerTabs({ activeMode, onModeChange }: MakerTakerTabsProps) {
  const { t, isDark } = useThemeClasses()

  return (
    <div
      className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-xl p-1 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
        isDark ? 'bg-white/[0.03]' : 'bg-white/30'
      }`}
    >
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onModeChange('maker')}
          className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative overflow-hidden ${
            activeMode === 'maker'
              ? isDark
                ? 'bg-white/10 text-white backdrop-blur-xl'
                : 'bg-white/50 text-slate-800 backdrop-blur-xl'
              : `${t.textSecondary} ${t.cardHover}`
          }`}
        >
          {activeMode === 'maker' && (
            <>
              <div
                className={`absolute inset-0 backdrop-blur-xl ${
                  isDark ? 'bg-white/10' : 'bg-white/30'
                } rounded-lg`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-b ${
                  isDark ? 'from-white/5' : 'from-white/20'
                } to-transparent rounded-lg`}
              />
            </>
          )}
          <span className="relative">Maker Order</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('taker')}
          className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm relative overflow-hidden ${
            activeMode === 'taker'
              ? isDark
                ? 'bg-white/10 text-white backdrop-blur-xl'
                : 'bg-white/50 text-slate-800 backdrop-blur-xl'
              : `${t.textSecondary} ${t.cardHover}`
          }`}
        >
          {activeMode === 'taker' && (
            <>
              <div
                className={`absolute inset-0 backdrop-blur-xl ${
                  isDark ? 'bg-white/10' : 'bg-white/30'
                } rounded-lg`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-b ${
                  isDark ? 'from-white/5' : 'from-white/20'
                } to-transparent rounded-lg`}
              />
            </>
          )}
          <span className="relative">Taker Order</span>
        </button>
      </div>
    </div>
  )
}
