<template>
  <div
    class="h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden flex flex-col"
  >
    <div class="w-full h-full p-4 md:p-6 flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-4 mt-0">
        <div class="flex items-center justify-between">
          <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Loan Marketplace</h1>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Borrower</span>
            <InputSwitch v-model="isLender" />
            <span class="text-sm text-gray-600 dark:text-gray-400">Lender</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <template v-if="userRole === 'taker'">
            <button
              v-for="tab in takerTabs"
              :key="tab.value"
              :class="[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.value
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
              ]"
              @click="activeTab = tab.value"
            >
              <i :class="tab.icon"></i>
              {{ tab.label }}
            </button>
          </template>
          <template v-if="userRole === 'maker'">
            <button
              v-for="tab in makerTabs"
              :key="tab.value"
              :class="[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.value
                  ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
              ]"
              @click="activeTab = tab.value"
            >
              <i :class="tab.icon"></i>
              {{ tab.label }}
            </button>
          </template>
        </div>
      </div>

      <!-- Combined Filters -->
      <div
        v-if="activeTab === 'available' && userRole === 'taker'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-4"
      >
        <!-- Search Bar -->
        <div class="mb-3">
          <div class="relative">
            <InputText
              v-model="filters.searchQuery"
              placeholder="Search by currency, collateral, rate, or term... (press Enter to add)"
              class="w-full pl-10"
              @keydown.enter="addFilterChip"
            />
            <i class="pi pi-filter text-gray-400 dark:text-gray-500 absolute left-3 top-3"></i>
          </div>
        </div>

        <!-- Amount Filter -->
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Amount:</span>
          <Slider v-model="amountFilterMax" :min="0" :max="100000" :step="1000" class="flex-1" />
          <span
            class="text-xs font-medium text-gray-800 dark:text-gray-200 min-w-[60px] text-right"
          >
            ${{
              amountFilter.max === 100000 ? '100k+' : (amountFilter.max / 1000).toFixed(0) + 'k'
            }}
          </span>
          <Button
            label="Reset"
            severity="secondary"
            text
            size="small"
            @click="amountFilter = { min: 0, max: 100000 }"
          />
        </div>

        <!-- Active Filter Chips -->
        <div
          v-if="filters.activeChips.length > 0"
          class="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <div v-for="(chip, index) in filters.activeChips" :key="index" class="relative group">
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-help transition-all',
                chip.colorClass,
              ]"
            >
              {{ chip.label }}
              <button @click="removeFilterChip(index)" class="hover:opacity-100 opacity-70 ml-1">
                <i class="pi pi-times"></i>
              </button>
            </span>
            <!-- Tooltip on hover -->
            <div
              class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20"
            >
              <div class="font-semibold mb-1">{{ chip.type }}</div>
              <div>{{ chip.description }}</div>
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div class="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <Button
            label="Clear all"
            severity="secondary"
            text
            size="small"
            @click="clearAllFilters"
          />
        </div>

        <!-- Quick Filter Suggestions -->
        <div
          v-if="filters.activeChips.length === 0"
          class="pt-2 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">Quick filters:</span>
            <div class="flex flex-wrap gap-1">
              <Button
                v-for="suggestion in quickFilters"
                :key="suggestion.query"
                :label="suggestion.label"
                severity="secondary"
                size="small"
                @click="addQuickFilter(suggestion.query)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4 flex-1 overflow-y-auto">
        <!-- Available Loans -->
        <div v-if="activeTab === 'available' && userRole === 'taker'">
          <div class="mb-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ filteredAvailableLoans.length }} loans available
            </p>
          </div>

          <div class="max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              <LoanCard
                v-for="loan in filteredAvailableLoans"
                :key="loan.id"
                :loan="loan"
                type="available"
              />
            </div>
          </div>
          <div
            v-if="filteredAvailableLoans.length === 0"
            class="max-h-[60vh] overflow-y-auto flex items-center justify-center"
          >
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p class="text-gray-500 dark:text-gray-400 text-sm">No loans match your filters.</p>
            </div>
          </div>
        </div>

        <!-- My Taken Loans -->
        <div v-if="activeTab === 'myTaken' && userRole === 'taker'">
          <div v-if="myLoansTaken.length > 0" class="max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              <LoanCard
                v-for="loan in myLoansTaken"
                :key="loan.id"
                :loan="loan"
                type="taken"
                :on-payment="handlePayment"
              />
            </div>
          </div>
          <div v-else class="max-h-[60vh] overflow-y-auto flex items-center justify-center">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                You don't have any active loans yet.
              </p>
            </div>
          </div>
        </div>

        <!-- Create Loan -->
        <div v-if="activeTab === 'create' && userRole === 'maker'">
          <CreateLoanForm />
        </div>

        <!-- My Created Loans -->
        <div v-if="activeTab === 'myCreated' && userRole === 'maker'">
          <MyCreatedLoans />
        </div>

        <!-- Income Page -->
        <div v-if="activeTab === 'income' && userRole === 'maker'">
          <LoanIncomeAnalytics />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    AmountFilter,
    FilterChip,
    LoanAgreement,
    LoanFilters,
    LoanOffer,
  } from '@/types/loan.types'
  import Button from 'primevue/button'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import Slider from 'primevue/slider'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref } from 'vue'
  import CreateLoanForm from './components/CreateLoanForm.vue'
  import LoanCard from './components/LoanCard.vue'
  import LoanIncomeAnalytics from './components/LoanIncomeAnalytics.vue'
  import MyCreatedLoans from './components/MyCreatedLoans.vue'

  const toast = useToast()

  // State
  const isLender = ref(false)
  const userRole = computed(() => (isLender.value ? 'maker' : 'taker'))
  const activeTab = ref('available')
  const amountFilter = ref<AmountFilter>({ min: 0, max: 100000 })
  const filters = ref<LoanFilters>({
    activeChips: [],
    searchQuery: '',
  })

  // Computed values for slider
  const amountFilterMax = computed({
    get: () => amountFilter.value.max,
    set: (value: number) => {
      amountFilter.value = { min: 0, max: value }
    },
  })

  // Tab configurations
  const takerTabs = [
    { label: 'Available Loans', value: 'available', icon: 'pi pi-list' },
    { label: 'My Active Loans', value: 'myTaken', icon: 'pi pi-briefcase' },
  ]

  const makerTabs = [
    { label: 'Create Offer', value: 'create', icon: 'pi pi-plus' },
    { label: 'My Offers', value: 'myCreated', icon: 'pi pi-briefcase' },
    { label: 'Income', value: 'income', icon: 'pi pi-chevron-up' },
  ]

  // Sample data
  const availableLoans = ref<LoanOffer[]>([
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
  ])

  const myLoansTaken = ref<LoanAgreement[]>([
    {
      id: 202,
      lender: '0x789e...4a1f',
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
      maker: '0x789e...4a1f',
      collateralRatio: 150,
    },
  ])

  // Quick filter suggestions
  const quickFilters = [
    { query: 'USDC', label: 'USDC' },
    { query: 'DAI', label: 'DAI' },
    { query: 'ETH', label: 'ETH Collateral' },
    { query: 'BTC', label: 'BTC Collateral' },
    { query: 'low rate', label: 'Low Rate' },
    { query: 'short term', label: 'Short Term' },
  ]

  // Filter functions
  const detectChipType = (query: string): FilterChip => {
    const q = query.toUpperCase().trim()

    // Currency detection
    if (['USDC', 'DAI', 'USDT'].includes(q)) {
      return {
        value: q,
        label: q,
        type: 'Currency Filter',
        description: `Show only loans in ${q}`,
        colorClass: 'bg-blue-600 text-white',
        category: 'currency',
      }
    }

    // Collateral detection
    if (['ETH', 'BTC', 'SOL', 'ETHEREUM', 'BITCOIN', 'SOLANA'].includes(q)) {
      const collateral =
        q === 'ETHEREUM' ? 'ETH' : q === 'BITCOIN' ? 'BTC' : q === 'SOLANA' ? 'SOL' : q
      return {
        value: collateral,
        label: `${collateral} Collateral`,
        type: 'Collateral Filter',
        description: `Show only loans with ${collateral} as collateral`,
        colorClass: 'bg-orange-600 text-white',
        category: 'collateral',
      }
    }

    // Rate detection
    const lowerQ = query.toLowerCase()
    if (
      lowerQ.includes('low') ||
      lowerQ.includes('<') ||
      (lowerQ.includes('rate') && !lowerQ.includes('high'))
    ) {
      return {
        value: '< 7% APR',
        label: 'Low Rate (<7%)',
        type: 'Interest Rate Filter',
        description: 'Show loans with APR below 7%',
        colorClass: 'bg-green-600 text-white',
        category: 'rate',
      }
    }
    if (lowerQ.includes('mid') || lowerQ.includes('medium') || lowerQ.includes('average')) {
      return {
        value: '7-10% APR',
        label: 'Mid Rate (7-10%)',
        type: 'Interest Rate Filter',
        description: 'Show loans with APR between 7-10%',
        colorClass: 'bg-green-600 text-white',
        category: 'rate',
      }
    }
    if (lowerQ.includes('high') || lowerQ.includes('>')) {
      return {
        value: '> 10% APR',
        label: 'High Rate (>10%)',
        type: 'Interest Rate Filter',
        description: 'Show loans with APR above 10%',
        colorClass: 'bg-green-600 text-white',
        category: 'rate',
      }
    }

    // Term/Duration detection
    if (
      lowerQ.includes('short') ||
      lowerQ.includes('< 6') ||
      lowerQ.match(/\b[1-5]\s*mo/) !== null
    ) {
      return {
        value: '< 6mo',
        label: 'Short Term (<6mo)',
        type: 'Term Length Filter',
        description: 'Show loans with term less than 6 months',
        colorClass: 'bg-purple-600 text-white',
        category: 'duration',
      }
    }
    if (lowerQ.includes('medium') || lowerQ.includes('6-18') || lowerQ.includes('year')) {
      return {
        value: '6-18mo',
        label: 'Medium Term (6-18mo)',
        type: 'Term Length Filter',
        description: 'Show loans with term between 6-18 months',
        colorClass: 'bg-purple-600 text-white',
        category: 'duration',
      }
    }
    if (lowerQ.includes('long') || lowerQ.includes('> 18') || lowerQ.includes('24')) {
      return {
        value: '> 18mo',
        label: 'Long Term (>18mo)',
        type: 'Term Length Filter',
        description: 'Show loans with term over 18 months',
        colorClass: 'bg-purple-600 text-white',
        category: 'duration',
      }
    }

    // Default: treat as general search
    return {
      value: query,
      label: query,
      type: 'Search Query',
      description: 'Search across all loan properties',
      colorClass: 'bg-gray-600 text-white',
      category: 'search',
    }
  }

  const filterLoans = (loans: LoanOffer[]): LoanOffer[] => {
    if (!filters.value.activeChips || filters.value.activeChips.length === 0) {
      return loans
    }

    return loans.filter(loan => {
      // Group chips by category
      const currencyChips = filters.value.activeChips.filter(c => c.category === 'currency')
      const collateralChips = filters.value.activeChips.filter(c => c.category === 'collateral')
      const rateChips = filters.value.activeChips.filter(c => c.category === 'rate')
      const durationChips = filters.value.activeChips.filter(c => c.category === 'duration')
      const searchChips = filters.value.activeChips.filter(c => c.category === 'search')

      // Currency filter (OR logic within category)
      if (currencyChips.length > 0) {
        const matchesCurrency = currencyChips.some(chip => chip.value === loan.currency)
        if (!matchesCurrency) return false
      }

      // Collateral filter (OR logic within category)
      if (collateralChips.length > 0) {
        const matchesCollateral = collateralChips.some(chip => chip.value === loan.collateralType)
        if (!matchesCollateral) return false
      }

      // Rate filter (OR logic within category)
      if (rateChips.length > 0) {
        const matchesRate = rateChips.some(chip => {
          if (chip.value === '< 7% APR') return loan.interestRate < 7
          if (chip.value === '7-10% APR') return loan.interestRate >= 7 && loan.interestRate <= 10
          if (chip.value === '> 10% APR') return loan.interestRate > 10
          return false
        })
        if (!matchesRate) return false
      }

      // Duration filter (OR logic within category)
      if (durationChips.length > 0) {
        const matchesDuration = durationChips.some(chip => {
          if (chip.value === '< 6mo') return loan.duration < 6
          if (chip.value === '6-18mo') return loan.duration >= 6 && loan.duration <= 18
          if (chip.value === '> 18mo') return loan.duration > 18
          return false
        })
        if (!matchesDuration) return false
      }

      // Search filter (general text search)
      if (searchChips.length > 0) {
        const matchesSearch = searchChips.some(chip => {
          const query = chip.value.toLowerCase()
          return (
            loan.amount.toString().includes(query) ||
            loan.currency.toLowerCase().includes(query) ||
            loan.interestRate.toString().includes(query) ||
            loan.duration.toString().includes(query) ||
            loan.collateralType.toLowerCase().includes(query) ||
            loan.maker.toLowerCase().includes(query)
          )
        })
        if (!matchesSearch) return false
      }

      return true
    })
  }

  // Computed properties
  const filteredAvailableLoans = computed(() => {
    return filterLoans(availableLoans.value).filter(
      loan => loan.amount >= amountFilter.value.min && loan.amount <= amountFilter.value.max
    )
  })

  // Methods
  const addFilterChip = () => {
    if (filters.value.searchQuery.trim()) {
      const query = filters.value.searchQuery.trim()
      const chipInfo = detectChipType(query)
      if (chipInfo && !filters.value.activeChips.some(c => c.value === chipInfo.value)) {
        filters.value.activeChips.push(chipInfo)
        filters.value.searchQuery = ''
      }
    }
  }

  const addQuickFilter = (query: string) => {
    const chipInfo = detectChipType(query)
    if (chipInfo && !filters.value.activeChips.some(c => c.value === chipInfo.value)) {
      filters.value.activeChips.push(chipInfo)
    }
  }

  const removeFilterChip = (index: number) => {
    filters.value.activeChips.splice(index, 1)
  }

  const clearAllFilters = () => {
    filters.value.activeChips = []
  }

  const handlePayment = (loanId: number, paymentAmount: number) => {
    const loan = myLoansTaken.value.find(l => l.id === loanId)
    if (loan && loan.paymentsRemaining > 0) {
      loan.paymentsRemaining -= 1
      // Calculate next payment date (roughly one month later)
      const currentDate = new Date(loan.nextPayment)
      currentDate.setMonth(currentDate.getMonth() + 1)
      loan.nextPayment =
        loan.paymentsRemaining > 0 ? currentDate.toISOString().split('T')[0] : 'Paid Off'

      toast.add({
        severity: 'success',
        summary: 'Payment Processed',
        detail: `Payment of $${paymentAmount} processed successfully! Transaction confirmed on blockchain.`,
        life: 5000,
      })
    }
  }
</script>
