'use client'

import { useWalletConnection } from '@/hooks/useWalletConnection'
import { getThemeClasses } from '@/lib/theme'
import { ConnectButton } from '@chia/wallet-connect'
import {
  BarChart,
  Bell,
  ChevronRight,
  Fingerprint,
  Home,
  Layers,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import PenguinLogo from './PenguinLogo'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const [mounted, setMounted] = useState(false)
  const { theme: currentTheme, systemTheme, setTheme } = useTheme()
  const { isConnected } = useWalletConnection()

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'projects', icon: Layers, label: 'Projects' },
    { id: 'automation', icon: Zap, label: 'Automation' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className={`flex h-screen ${t.bg} overflow-hidden transition-colors duration-300`}>
      {/* Subtle static background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br ${t.gradientBg}`}></div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        } w-64 transition-all duration-300 ease-in-out backdrop-blur-3xl ${t.sidebar} border-r ${t.sidebarBorder} flex flex-col`}
      >
        {/* Logo */}
        <div
          className={`h-16 flex items-center justify-center border-b ${t.border} transition-all duration-300 ${
            sidebarCollapsed ? 'lg:px-0' : 'px-6'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-lg">
              <PenguinLogo size={24} className="text-white" />
            </div>
            <span
              className={`font-bold ${t.text} text-xl transition-all duration-300 whitespace-nowrap ${
                sidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
              }`}
            >
              Pengui
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav
          className={`flex-1 space-y-1 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:p-2' : 'p-4'
          }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center ${
                  sidebarCollapsed
                    ? 'lg:justify-center lg:px-0 lg:py-2.5'
                    : 'lg:justify-start lg:px-4'
                } justify-start gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive ? `${t.card} ${t.text} shadow-lg` : `${t.textSecondary} ${t.cardHover}`
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                />
                <span
                  className={`font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                    sidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && !sidebarCollapsed && (
                  <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div
          className={`border-t ${t.border} transition-all duration-300 ${
            sidebarCollapsed ? 'lg:p-2' : 'p-3'
          }`}
        >
          <div
            className={`flex items-center ${
              sidebarCollapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-start lg:px-3'
            } justify-between gap-2 px-3 py-1.5 rounded-xl ${t.card} ${t.cardHover} transition-all cursor-pointer group`}
            title={sidebarCollapsed ? 'User' : undefined}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/20 group-hover:ring-white/30 transition-all">
                <User className="w-4 h-4 text-white" />
              </div>
              <div
                className={`transition-all duration-300 whitespace-nowrap ${
                  sidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
                }`}
              >
                <p className={`text-xs font-medium ${t.text}`}>User</p>
                <p className={`text-[10px] ${t.textSecondary}`}>Premium</p>
              </div>
            </div>
            {/* Theme Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleTheme()
              }}
              className={`relative inline-flex h-4 w-7 items-center rounded-full backdrop-blur-3xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 overflow-hidden flex-shrink-0 ${
                sidebarCollapsed
                  ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:pointer-events-none'
                  : ''
              } ${
                isDark
                  ? 'bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/10 shadow-lg shadow-amber-500/20'
                  : 'bg-gradient-to-r from-white/20 via-white/30 to-white/20 border border-white/30 shadow-lg shadow-slate-900/20'
              }`}
              title={isDark ? 'Switch to Light' : 'Switch to Dark'}
              aria-label="Toggle theme"
            >
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 rounded-full pointer-events-none" />
              <span
                className={`relative inline-block h-2.5 w-2.5 transform rounded-full backdrop-blur-3xl transition-all duration-300 shadow-lg ${
                  isDark
                    ? 'translate-x-[16px] bg-gradient-to-br from-white/30 via-white/20 to-white/10 border border-white/40'
                    : 'translate-x-0.5 bg-gradient-to-br from-white/50 via-white/40 to-white/30 border border-white/60'
                } flex items-center justify-center`}
              >
                {/* Inner glass highlight */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full opacity-60" />
                {isDark ? (
                  <Sun
                    className="relative h-2 w-2 text-amber-300 drop-shadow-sm"
                    strokeWidth={2.5}
                  />
                ) : (
                  <Moon
                    className="relative h-2 w-2 text-slate-700 drop-shadow-sm"
                    strokeWidth={2.5}
                  />
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <header
          className={`h-16 backdrop-blur-3xl ${t.card} border-b ${t.border} flex items-center justify-between px-2 sm:px-4 lg:px-6 gap-1.5 sm:gap-2 lg:gap-3 transition-all duration-300`}
        >
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-1 min-w-0">
            <button
              onClick={() => {
                // On mobile: toggle sidebar open/closed
                // On desktop: toggle sidebar collapsed/expanded
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setSidebarCollapsed(!sidebarCollapsed)
                } else {
                  setSidebarOpen(!sidebarOpen)
                }
              }}
              className={`p-1.5 sm:p-2 rounded-xl ${t.cardHover} transition-colors ${t.textSecondary} ${t.textHover} flex-shrink-0`}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar - Responsive design */}
            <div className="relative flex-1 max-w-full min-w-0 mr-1 sm:mr-0">
              <Search
                className={`w-4 h-4 sm:w-5 sm:h-5 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 ${t.textSecondary} pointer-events-none z-10`}
              />
              <input
                type="text"
                placeholder="Search..."
                className={`w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3 flex-shrink-0">
            <button
              className={`p-1.5 sm:p-2 rounded-xl ${t.cardHover} transition-colors ${t.textSecondary} ${t.textHover} relative flex-shrink-0`}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full"></span>
            </button>
            {/* Wallet Connect Component */}
            <div className="relative flex items-center flex-shrink-0">
              <ConnectButton
                connectText={isConnected ? '' : 'Connect Wallet'}
                walletConnectIcon={
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/penguin-pool.svg`
                    : '/penguin-pool.svg'
                }
                walletConnectMetadata={{
                  name: 'Pengui',
                  description: 'Penguin Pool - Decentralized lending platform on Chia Network',
                  url:
                    typeof window !== 'undefined' ? window.location.origin : 'https://penguin.pool',
                  icons: [
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/penguin-pool.svg`
                      : '/penguin-pool.svg',
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/icons/icon-192x192.png`
                      : '/icons/icon-192x192.png',
                  ],
                }}
                className="shadow-lg"
              />
              {isConnected && (
                <Fingerprint className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-green-400 pointer-events-none" />
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
