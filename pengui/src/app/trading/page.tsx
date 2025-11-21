'use client'

import { getThemeClasses } from '@/shared/lib/theme'
import { TrendingUp, BookOpen, BarChart3, Activity } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function TradingPage() {
  const [mounted, setMounted] = useState(false)
  const [activeView, setActiveView] = useState<'orderbook' | 'chart' | 'depth' | 'trades'>(
    'orderbook'
  )
  const { theme: currentTheme, systemTheme } = useTheme()

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const views = [
    { id: 'orderbook' as const, icon: BookOpen, label: 'Order Book' },
    { id: 'chart' as const, icon: BarChart3, label: 'Chart' },
    { id: 'depth' as const, icon: Activity, label: 'Depth' },
    { id: 'trades' as const, icon: TrendingUp, label: 'Trades' },
  ]

  return (
    <div className="w-full relative z-10">
      {/* View Tabs */}
      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-xl p-1 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex flex-wrap gap-1">
          {views.map((view) => {
            const Icon = view.icon
            const isActive = activeView === view.id
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-200 font-medium text-[11px] relative overflow-hidden ${
                  isActive
                    ? isDark
                      ? 'bg-white/10 text-white backdrop-blur-xl'
                      : 'bg-white/50 text-slate-800 backdrop-blur-xl'
                    : `${t.textSecondary} ${t.cardHover}`
                }`}
              >
                {isActive && (
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
                <Icon
                  size={12}
                  strokeWidth={2.5}
                  className={`relative ${isActive ? 'opacity-100' : 'opacity-70'}`}
                />
                <span className="relative">{view.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Trading Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Main Trading Panel */}
        <div
          className={`backdrop-blur-[40px] ${t.card} rounded-2xl p-4 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
            isDark ? 'bg-white/[0.03]' : 'bg-white/30'
          }`}
        >
          <h3 className={`${t.text} text-sm font-semibold mb-2`}>
            {views.find((v) => v.id === activeView)?.label}
          </h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div
              className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/30'} backdrop-blur-xl mb-3`}
            >
              {(() => {
                const activeViewData = views.find((v) => v.id === activeView)
                if (!activeViewData) return null
                const Icon = activeViewData.icon
                return (
                  <Icon
                    className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                    size={32}
                    strokeWidth={1.5}
                  />
                )
              })()}
            </div>
            <p className={`${t.textSecondary} text-center text-sm max-w-md`}>
              {activeView === 'orderbook' && 'Order book data will be displayed here'}
              {activeView === 'chart' && 'Trading charts will be displayed here'}
              {activeView === 'depth' && 'Market depth visualization will be displayed here'}
              {activeView === 'trades' && 'Recent trades will be displayed here'}
            </p>
          </div>
        </div>

        {/* Side Panel */}
        <div
          className={`backdrop-blur-[40px] ${t.card} rounded-2xl p-4 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
            isDark ? 'bg-white/[0.03]' : 'bg-white/30'
          }`}
        >
          <h3 className={`${t.text} text-sm font-semibold mb-2`}>Trading Tools</h3>
          <div className="space-y-2">
            <div
              className={`backdrop-blur-xl ${
                isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white/50 border-cyan-200/30'
              } rounded-xl p-3 border transition-all duration-200`}
            >
              <p className={`${t.text} font-medium text-xs mb-1`}>Create Offer</p>
              <p className={`${t.textSecondary} text-[10px]`}>
                Create a new trading offer from this panel
              </p>
            </div>
            <div
              className={`backdrop-blur-xl ${
                isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white/50 border-cyan-200/30'
              } rounded-xl p-3 border transition-all duration-200`}
            >
              <p className={`${t.text} font-medium text-xs mb-1`}>Take Offer</p>
              <p className={`${t.textSecondary} text-[10px]`}>
                Browse and take available offers from the order book
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
