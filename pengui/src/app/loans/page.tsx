'use client'

import { getThemeClasses } from '@/lib/theme'
import type { LoanOffer, LoanAgreement, LoanFilters, AmountFilter } from '@/types/loan.types'
import { detectChipType, filterLoans } from '@/hooks/useLoanFilters'
import LoanCard from '@/components/loans/LoanCard'
import CreateLoanFormComponent from '@/components/loans/CreateLoanForm'
import MyCreatedLoans from '@/components/loans/MyCreatedLoans'
import LoanIncomeAnalytics from '@/components/loans/LoanIncomeAnalytics'
import { FileText, List, Briefcase, Plus, TrendingUp, X, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, useMemo } from 'react'

export default function LoansPage() {
  const [mounted, setMounted] = useState(false)
  const [isLender, setIsLender] = useState(false)
  const [activeTab, setActiveTab] = useState('available')
  const [amountFilter, setAmountFilter] = useState<AmountFilter>({ min: 0, max: 100000 })
  const [filters, setFilters] = useState<LoanFilters>({
    activeChips: [],
    searchQuery: '',
  })
  const { theme: currentTheme, systemTheme } = useTheme()

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)
  const userRole = isLender ? 'maker' : 'taker'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sample loan data
  const availableLoans: LoanOffer[] = [
    {
      id: 1,
      maker: '0x742d...4f2a',
      assetType: 'ERC20',
      amount: 10000,
      currency: 'USDC',
      interestRate: 8.5,
      duration: 12,
      collateralAssetType: 'ERC20',
      collateralType: 'ETH',
      collateralRatio: 150,
      optionType: 'Call',
      strikePrice: 2500,
      status: 'available',
    },
    {
      id: 2,
      maker: '0x891c...7e3b',
      assetType: 'ERC20',
      amount: 5000,
      currency: 'USDC',
      interestRate: 6.2,
      duration: 6,
      collateralAssetType: 'ERC20',
      collateralType: 'BTC',
      collateralRatio: 130,
      optionType: 'Put',
      strikePrice: 45000,
      status: 'available',
    },
    {
      id: 3,
      maker: '0x234a...9d1c',
      assetType: 'ERC20',
      amount: 25000,
      currency: 'DAI',
      interestRate: 10.0,
      duration: 24,
      collateralAssetType: 'ERC20',
      collateralType: 'ETH',
      collateralRatio: 175,
      optionType: 'Call',
      strikePrice: 3000,
      status: 'available',
    },
    {
      id: 4,
      maker: '0x567d...2e4f',
      assetType: 'ERC20',
      amount: 15000,
      currency: 'USDT',
      interestRate: 7.8,
      duration: 18,
      collateralAssetType: 'ERC20',
      collateralType: 'SOL',
      collateralRatio: 160,
      optionType: 'Call',
      strikePrice: 120,
      status: 'available',
    },
    {
      id: 5,
      maker: '0x9a8b...1c3d',
      assetType: 'ERC20',
      amount: 3000,
      currency: 'DAI',
      interestRate: 5.5,
      duration: 3,
      collateralAssetType: 'ERC20',
      collateralType: 'ETH',
      collateralRatio: 140,
      optionType: 'Put',
      strikePrice: 2400,
      status: 'available',
    },
    {
      id: 6,
      maker: '0x1f2e...8b7a',
      assetType: 'ERC20',
      amount: 50000,
      currency: 'USDC',
      interestRate: 11.5,
      duration: 36,
      collateralAssetType: 'ERC20',
      collateralType: 'BTC',
      collateralRatio: 180,
      optionType: 'Call',
      strikePrice: 50000,
      status: 'available',
    },
    {
      id: 7,
      maker: '0x3d4e...9f1a',
      assetType: 'NFT',
      nftCollection: 'BAYC',
      nftTokenId: '#2547',
      amount: 50,
      currency: 'ETH',
      interestRate: 12.0,
      duration: 6,
      collateralAssetType: 'NFT',
      collateralNftCollection: 'CryptoPunks',
      collateralType: 'NFT',
      collateralRatio: 120,
      status: 'available',
    },
    {
      id: 8,
      maker: '0x6c7d...2b8e',
      assetType: 'ERC20',
      amount: 8000,
      currency: 'USDC',
      interestRate: 9.5,
      duration: 12,
      collateralAssetType: 'NFT',
      collateralNftCollection: 'Azuki',
      collateralType: 'NFT',
      collateralRatio: 150,
      status: 'available',
    },
    {
      id: 9,
      maker: '0x8e9f...4c1d',
      assetType: 'Options',
      optionUnderlying: 'ETH',
      optionContractType: 'Call',
      optionStrike: 2800,
      optionQuantity: 5,
      amount: 3500,
      currency: 'USDC',
      interestRate: 15.0,
      duration: 3,
      collateralAssetType: 'ERC20',
      collateralType: 'ETH',
      collateralRatio: 200,
      status: 'available',
    },
  ]

  const myLoansTaken: LoanAgreement[] = [
    {
      id: 202,
      lender: '0x789e...4a1f',
      maker: '0x789e...4a1f',
      amount: 8000,
      currency: 'USDC',
      interestRate: 9.0,
      duration: 12,
      monthlyPayment: 702,
      totalRepayment: 8424,
      collateralProvided: 5.5,
      collateralType: 'ETH',
      optionType: 'Call',
      strikePrice: 2600,
      startDate: '2024-09-01',
      nextPayment: '2024-11-01',
      paymentsRemaining: 10,
      status: 'funded',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
      collateralRatio: 150,
    },
  ]

  const myCreatedLoans: LoanOffer[] = [
    {
      id: 301,
      maker: '0xCurrentUser',
      assetType: 'ERC20',
      amount: 15000,
      currency: 'USDC',
      interestRate: 8.0,
      duration: 12,
      collateralAssetType: 'ERC20',
      collateralType: 'ETH',
      collateralRatio: 160,
      status: 'funded',
      borrower: '0xabc1...2def',
      fundedDate: '2024-10-15',
    },
  ]

  const takerTabs = [
    { label: 'Available Loans', value: 'available', icon: List },
    { label: 'My Active Loans', value: 'myTaken', icon: Briefcase },
  ]

  const makerTabs = [
    { label: 'Create Offer', value: 'create', icon: Plus },
    { label: 'My Offers', value: 'myCreated', icon: Briefcase },
    { label: 'Income', value: 'income', icon: TrendingUp },
  ]

  const quickFilters = [
    { query: 'USDC', label: 'USDC' },
    { query: 'DAI', label: 'DAI' },
    { query: 'ETH', label: 'ETH Collateral' },
    { query: 'BTC', label: 'BTC Collateral' },
    { query: 'low rate', label: 'Low Rate' },
    { query: 'short term', label: 'Short Term' },
  ]

  const filteredAvailableLoans = useMemo(() => {
    return filterLoans(availableLoans, filters, amountFilter)
  }, [filters, amountFilter])

  const addFilterChip = () => {
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim()
      const chipInfo = detectChipType(query)
      if (chipInfo && !filters.activeChips.some((c) => c.value === chipInfo.value)) {
        setFilters({
          ...filters,
          activeChips: [...filters.activeChips, chipInfo],
          searchQuery: '',
        })
      }
    }
  }

  const addQuickFilter = (query: string) => {
    const chipInfo = detectChipType(query)
    if (chipInfo && !filters.activeChips.some((c) => c.value === chipInfo.value)) {
      setFilters({
        ...filters,
        activeChips: [...filters.activeChips, chipInfo],
      })
    }
  }

  const removeFilterChip = (index: number) => {
    setFilters({
      ...filters,
      activeChips: filters.activeChips.filter((_, i) => i !== index),
    })
  }

  const clearAllFilters = () => {
    setFilters({
      ...filters,
      activeChips: [],
    })
  }

  const handlePayment = (loanId: number, paymentAmount: number) => {
    // Handle payment logic
    // TODO: Implement payment functionality
    void loanId
    void paymentAmount
  }

  const handleTakeLoan = (loanId: number) => {
    // Handle take loan logic
    // TODO: Implement take loan functionality
    void loanId
  }

  const handleViewDetails = (loanId: number) => {
    // Handle view details logic
    // TODO: Implement view details functionality
    void loanId
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full relative z-10">
      {/* Header */}
      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-2xl p-3 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-600/15'} backdrop-blur-sm`}
            >
              <FileText
                className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
                size={18}
                strokeWidth={2}
              />
            </div>
            <div>
              <h1 className={`text-xl lg:text-2xl font-semibold ${t.text} mb-0.5`}>
                Loan Marketplace
              </h1>
              <p className={`${t.textSecondary} text-xs font-medium`}>
                Create and take loan offerings
              </p>
            </div>
          </div>
          {/* Role Toggle */}
          <div className="flex items-center gap-2">
            <span className={`${t.textSecondary} text-xs`}>Borrower</span>
            <button
              onClick={() => setIsLender(!isLender)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isLender
                  ? isDark
                    ? 'bg-cyan-500/30'
                    : 'bg-cyan-600'
                  : isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isLender ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`${t.textSecondary} text-xs`}>Lender</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-xl p-1 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex flex-wrap gap-1">
          {userRole === 'taker' &&
            takerTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
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
                  <span className="relative">{tab.label}</span>
                </button>
              )
            })}
          {userRole === 'maker' &&
            makerTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
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
                  <span className="relative">{tab.label}</span>
                </button>
              )
            })}
        </div>
      </div>

      {/* Filters for Available Loans */}
      {activeTab === 'available' && userRole === 'taker' && (
        <div
          className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-xl p-2 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
            isDark ? 'bg-white/[0.03]' : 'bg-white/30'
          }`}
        >
          {/* Search Bar */}
          <div className="mb-2">
            <div className="relative">
              <Search
                className={`absolute left-2 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
                size={14}
                strokeWidth={2}
              />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addFilterChip()
                  }
                }}
                placeholder="Search by currency, collateral, rate, or term... (press Enter)"
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder:text-slate-500'
                    : 'bg-white/40 border border-white/60 text-slate-800 placeholder:text-slate-500'
                } backdrop-blur-xl focus:outline-none focus:ring-2 ${
                  isDark ? 'focus:ring-cyan-400/30' : 'focus:ring-cyan-600/30'
                }`}
              />
            </div>
          </div>

          {/* Amount Filter */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`${t.textSecondary} text-[10px] whitespace-nowrap`}>Amount:</span>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={amountFilter.max}
              onChange={(e) => setAmountFilter({ min: 0, max: Number(e.target.value) })}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
            />
            <span className={`${t.text} text-[10px] font-medium min-w-[50px] text-right`}>
              {amountFilter.max === 100000 ? '100k+' : `${(amountFilter.max / 1000).toFixed(0)}k`}
            </span>
            <button
              onClick={() => setAmountFilter({ min: 0, max: 100000 })}
              className={`text-[10px] ${t.textSecondary} hover:${t.text} transition-colors`}
            >
              Reset
            </button>
          </div>

          {/* Active Filter Chips */}
          {filters.activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
              {filters.activeChips.map((chip, index) => (
                <div key={index} className="relative group">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-help transition-all ${chip.colorClass}`}
                  >
                    {chip.label}
                    <button
                      onClick={() => removeFilterChip(index)}
                      className="hover:opacity-100 opacity-70 ml-0.5"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </span>
                </div>
              ))}
              <button
                onClick={clearAllFilters}
                className={`text-[10px] ${t.textSecondary} hover:${t.text} transition-colors`}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Quick Filter Suggestions */}
          {filters.activeChips.length === 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${t.textSecondary} text-[10px]`}>Quick filters:</span>
                {quickFilters.map((suggestion) => (
                  <button
                    key={suggestion.query}
                    onClick={() => addQuickFilter(suggestion.query)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                        : 'bg-white/40 border border-white/60 text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        {/* Available Loans */}
        {activeTab === 'available' && userRole === 'taker' && (
          <div>
            <div className="mb-2">
              <p className={`${t.textSecondary} text-xs`}>
                {filteredAvailableLoans.length} loans available
              </p>
            </div>
            {filteredAvailableLoans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {filteredAvailableLoans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    type="available"
                    onTakeLoan={handleTakeLoan}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div
                className={`backdrop-blur-[40px] ${t.card} rounded-xl p-6 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
                  isDark ? 'bg-white/[0.03]' : 'bg-white/30'
                } flex items-center justify-center`}
              >
                <p className={`${t.textSecondary} text-sm`}>No loans match your filters.</p>
              </div>
            )}
          </div>
        )}

        {/* My Taken Loans */}
        {activeTab === 'myTaken' && userRole === 'taker' && (
          <div>
            {myLoansTaken.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {myLoansTaken.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    type="taken"
                    onPayment={handlePayment}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div
                className={`backdrop-blur-[40px] ${t.card} rounded-xl p-6 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
                  isDark ? 'bg-white/[0.03]' : 'bg-white/30'
                } flex items-center justify-center`}
              >
                <p className={`${t.textSecondary} text-sm`}>You don't have any active loans yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Create Loan */}
        {activeTab === 'create' && userRole === 'maker' && (
          <CreateLoanFormComponent
            onSubmit={(formData) => {
              // Handle loan creation
              // TODO: Implement loan creation functionality
              void formData
            }}
          />
        )}

        {/* My Created Loans */}
        {activeTab === 'myCreated' && userRole === 'maker' && (
          <MyCreatedLoans loans={myCreatedLoans} onViewDetails={handleViewDetails} />
        )}

        {/* Income */}
        {activeTab === 'income' && userRole === 'maker' && (
          <LoanIncomeAnalytics loans={myCreatedLoans} />
        )}
      </div>
    </div>
  )
}
