<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">My Loan Offers</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your lending portfolio</p>
      </div>
    </div>

    <!-- TVL and Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium opacity-90">Total Value Locked</span>
          <i class="pi pi-shield opacity-80"></i>
        </div>
        <div class="text-3xl font-bold mb-1">${{ totalValueLocked.toLocaleString() }}</div>
        <div class="text-xs opacity-80">${{ currentlyLent.toLocaleString() }} currently lent</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-green-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Offers</span>
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-clock text-green-600"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {{ activeOffersCount }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          ${{ activeOffersValue.toLocaleString() }} available
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-blue-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Currently Taken</span>
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-chevron-up text-blue-600"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {{ fundedLoansCount }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          ${{ fundedLoansValue.toLocaleString() }} lent out
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-purple-500">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Settled Loans</span>
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-check-circle text-purple-600"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {{ settledLoans.length }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          +${{ totalInterestEarned.toLocaleString() }} earned
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
          >Filter by Status:</span
        >
        <div class="flex gap-2">
          <Button
            v-for="filter in statusFilters"
            :key="filter.value"
            :label="filter.label"
            :severity="filter.value === loanStatusFilter ? 'info' : 'secondary'"
            size="small"
            @click="loanStatusFilter = filter.value"
          />
        </div>
      </div>
    </div>

    <!-- Amount Filter -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <i class="pi pi-filter"></i>
          Filter by Amount
        </h3>
        <Button
          label="Reset"
          severity="secondary"
          size="small"
          text
          @click="amountFilter = { min: 0, max: 100000 }"
        />
      </div>

      <div class="flex items-center gap-4">
        <div class="flex-1">
          <Slider v-model="amountFilterMax" :min="0" :max="100000" :step="1000" class="w-full" />
        </div>
        <div class="text-right min-w-[100px]">
          <span class="text-sm font-bold text-gray-800 dark:text-gray-200">
            Up to ${{
              amountFilter.max === 100000 ? '100k+' : (amountFilter.max / 1000).toFixed(0) + 'k'
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- Filtered Loans Display -->
    <div v-if="filteredLoans.length > 0">
      <!-- Active/Available Loans -->
      <div
        v-if="
          (loanStatusFilter === 'all' || loanStatusFilter === 'available') && activeLoans.length > 0
        "
        class="mb-6"
      >
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          Active Offers ({{ activeLoans.length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          <LoanCard v-for="loan in activeLoans" :key="loan.id" :loan="loan" type="created" />
        </div>
      </div>

      <!-- Currently Taken Loans -->
      <div
        v-if="
          (loanStatusFilter === 'all' || loanStatusFilter === 'funded') && fundedLoans.length > 0
        "
        class="mb-6"
      >
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          Currently Taken ({{ fundedLoans.length }})
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          <LoanCard v-for="loan in fundedLoans" :key="loan.id" :loan="loan" type="created" />
        </div>
      </div>

      <!-- Settled Loans -->
      <div
        v-if="
          (loanStatusFilter === 'all' || loanStatusFilter === 'settled') &&
          settledLoansFiltered.length > 0
        "
        class="mb-6"
      >
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
          Settled Loans ({{ settledLoansFiltered.length }})
        </h3>
        <div class="space-y-3 pb-6">
          <div
            v-for="loan in settledLoansFiltered"
            :key="loan.id"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h4 class="font-bold text-gray-800 dark:text-gray-200 text-lg">
                    {{ loan.amount.toLocaleString() }} {{ loan.currency }}
                  </h4>
                  <span
                    class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold"
                  >
                    Settled
                  </span>
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {{ loan.interestRate }}% APR
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Borrower: <span class="font-mono text-xs">{{ loan.borrower }}</span>
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-green-600">
                  +${{ loan.totalInterest.toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500">Interest earned</p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p class="text-xs text-gray-500 mb-1">Term</p>
                <p class="text-sm font-semibold text-gray-800">{{ loan.duration }} months</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Collateral</p>
                <p class="text-sm font-semibold text-gray-800">
                  {{ loan.collateralRatio }}% {{ loan.collateralType }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Total Repaid</p>
                <p class="text-sm font-semibold text-gray-800">
                  ${{ loan.totalRepaid.toLocaleString() }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Started</p>
                <p class="text-sm font-semibold text-gray-800">{{ loan.startDate }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Settled</p>
                <p class="text-sm font-semibold text-gray-800">{{ loan.endDate }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-lg shadow p-8 text-center">
      <p class="text-gray-500 text-sm">No loans found for this filter.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { AmountFilter, LoanOffer, SettledLoan } from '@/types/loan.types'
  import Button from 'primevue/button'
  import Slider from 'primevue/slider'
  import { computed, ref } from 'vue'
  import LoanCard from './LoanCard.vue'

  // Sample data
  const myLoansCreated = ref<LoanOffer[]>([
    {
      id: 101,
      amount: 15000,
      currency: 'USDC',
      interestRate: 7.5,
      duration: 12,
      collateralType: 'ETH',
      collateralRatio: 140,
      optionType: 'Call',
      strikePrice: 2800,
      status: 'funded',
      borrower: '0x456b...8c2d',
      fundedDate: '2024-10-15',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
      maker: 'You',
      totalRepayment: 16200,
    },
    {
      id: 102,
      amount: 8000,
      currency: 'DAI',
      interestRate: 9.2,
      duration: 6,
      collateralType: 'BTC',
      collateralRatio: 155,
      optionType: 'Put',
      strikePrice: 45000,
      status: 'available',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
      maker: 'You',
    },
    {
      id: 103,
      amount: 20000,
      currency: 'USDC',
      interestRate: 8.8,
      duration: 18,
      collateralType: 'ETH',
      collateralRatio: 165,
      optionType: 'Call',
      strikePrice: 2600,
      status: 'funded',
      borrower: '0x789c...4d2e',
      fundedDate: '2024-09-20',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
      maker: 'You',
      totalRepayment: 22000,
    },
    {
      id: 104,
      amount: 12000,
      currency: 'USDT',
      interestRate: 7.0,
      duration: 12,
      collateralType: 'SOL',
      collateralRatio: 150,
      optionType: 'Call',
      strikePrice: 120,
      status: 'available',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
      maker: 'You',
    },
    {
      id: 105,
      amount: 30000,
      currency: 'DAI',
      interestRate: 10.5,
      duration: 24,
      collateralType: 'ETH',
      collateralRatio: 180,
      optionType: 'Call',
      strikePrice: 3000,
      status: 'funded',
      borrower: '0x234d...9e1f',
      fundedDate: '2024-08-10',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
      maker: 'You',
      totalRepayment: 33000,
    },
  ])

  const settledLoans = ref<SettledLoan[]>([
    {
      id: 201,
      amount: 12000,
      currency: 'USDC',
      interestRate: 8.5,
      duration: 12,
      collateralType: 'ETH',
      collateralRatio: 150,
      borrower: '0x789a...3e4f',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      totalRepaid: 12510,
      totalInterest: 510,
      status: 'settled',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
    },
    {
      id: 202,
      amount: 8000,
      currency: 'DAI',
      interestRate: 6.2,
      duration: 6,
      collateralType: 'BTC',
      collateralRatio: 130,
      borrower: '0x234b...7c8d',
      startDate: '2024-07-01',
      endDate: '2024-12-31',
      totalRepaid: 8248,
      totalInterest: 248,
      status: 'settled',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
    },
    {
      id: 203,
      amount: 25000,
      currency: 'USDC',
      interestRate: 10.0,
      duration: 24,
      collateralType: 'ETH',
      collateralRatio: 175,
      borrower: '0x567c...9a1b',
      startDate: '2023-10-01',
      endDate: '2025-10-01',
      totalRepaid: 27625,
      totalInterest: 2625,
      status: 'settled',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
    },
    {
      id: 204,
      amount: 5000,
      currency: 'USDT',
      interestRate: 7.8,
      duration: 12,
      collateralType: 'SOL',
      collateralRatio: 160,
      borrower: '0x890d...4e2c',
      startDate: '2024-02-15',
      endDate: '2025-02-15',
      totalRepaid: 5213,
      totalInterest: 213,
      status: 'settled',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
    },
    {
      id: 205,
      amount: 18000,
      currency: 'DAI',
      interestRate: 9.5,
      duration: 18,
      collateralType: 'ETH',
      collateralRatio: 145,
      borrower: '0x123e...6f5d',
      startDate: '2023-11-20',
      endDate: '2025-05-20',
      totalRepaid: 19755,
      totalInterest: 1755,
      status: 'settled',
      assetType: 'ERC20',
      collateralAssetType: 'ERC20',
    },
  ])

  // State
  const loanStatusFilter = ref('all')
  const amountFilter = ref<AmountFilter>({ min: 0, max: 100000 })

  // Computed values for slider
  const amountFilterMax = computed({
    get: () => amountFilter.value.max,
    set: (value: number) => {
      amountFilter.value = { min: 0, max: value }
    },
  })

  // Computed statistics
  const totalValueLocked = computed(() => {
    const funded = myLoansCreated.value
      .filter(l => l.status === 'funded')
      .reduce((sum, loan) => sum + loan.amount, 0)
    const settled = settledLoans.value.reduce((sum, loan) => sum + loan.amount, 0)
    return funded + settled
  })

  const currentlyLent = computed(() => {
    return myLoansCreated.value
      .filter(l => l.status === 'funded')
      .reduce((sum, loan) => sum + loan.amount, 0)
  })

  const activeOffersCount = computed(() => {
    return myLoansCreated.value.filter(l => l.status === 'available').length
  })

  const activeOffersValue = computed(() => {
    return myLoansCreated.value
      .filter(l => l.status === 'available')
      .reduce((sum, loan) => sum + loan.amount, 0)
  })

  const fundedLoansCount = computed(() => {
    return myLoansCreated.value.filter(l => l.status === 'funded').length
  })

  const fundedLoansValue = computed(() => {
    return myLoansCreated.value
      .filter(l => l.status === 'funded')
      .reduce((sum, loan) => sum + loan.amount, 0)
  })

  const totalInterestEarned = computed(() => {
    return settledLoans.value.reduce((sum, loan) => sum + loan.totalInterest, 0)
  })

  // Filter options
  const statusFilters = [
    { label: `All (${myLoansCreated.value.length + settledLoans.value.length})`, value: 'all' },
    {
      label: `Active (${myLoansCreated.value.filter(l => l.status === 'available').length})`,
      value: 'available',
    },
    {
      label: `Currently Taken (${myLoansCreated.value.filter(l => l.status === 'funded').length})`,
      value: 'funded',
    },
    { label: `Settled (${settledLoans.value.length})`, value: 'settled' },
  ]

  // Filtered data
  const activeLoans = computed(() => {
    return myLoansCreated.value.filter(
      loan =>
        loan.status === 'available' &&
        loan.amount >= amountFilter.value.min &&
        loan.amount <= amountFilter.value.max
    )
  })

  const fundedLoans = computed(() => {
    return myLoansCreated.value.filter(
      loan =>
        loan.status === 'funded' &&
        loan.amount >= amountFilter.value.min &&
        loan.amount <= amountFilter.value.max
    )
  })

  const settledLoansFiltered = computed(() => {
    return settledLoans.value.filter(
      loan => loan.amount >= amountFilter.value.min && loan.amount <= amountFilter.value.max
    )
  })

  const filteredLoans = computed(() => {
    const allLoans = [...myLoansCreated.value, ...settledLoans.value]
    return loanStatusFilter.value === 'all'
      ? allLoans.filter(
          loan => loan.amount >= amountFilter.value.min && loan.amount <= amountFilter.value.max
        )
      : allLoans.filter(
          loan =>
            loan.status === loanStatusFilter.value &&
            loan.amount >= amountFilter.value.min &&
            loan.amount <= amountFilter.value.max
        )
  })
</script>
