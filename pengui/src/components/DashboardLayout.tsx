'use client'

import { useWalletConnection } from '@/hooks/useWalletConnection'
import { ConnectButton } from '@chia/wallet-connect'
import {
  BarChart,
  Bell,
  ChevronRight,
  Fingerprint,
  Home,
  Layers,
  Menu,
  Search,
  Settings,
  User,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import PenguinLogo from './PenguinLogo'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const { isConnected } = useWalletConnection()

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'projects', icon: Layers, label: 'Projects' },
    { id: 'automation', icon: Zap, label: 'Automation' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
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
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-64 transition-all duration-300 ease-in-out bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden">
              <PenguinLogo size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl">Pengui</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-10" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">User</p>
              <p className="text-xs text-gray-400">Premium</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-2 sm:px-4 lg:px-6 gap-1.5 sm:gap-2 lg:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar - Responsive design */}
            <div className="relative flex-1 max-w-full min-w-0 mr-1 sm:mr-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3 flex-shrink-0">
            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white relative flex-shrink-0">
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
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
