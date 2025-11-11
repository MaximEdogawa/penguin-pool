<template>
  <div class="pb-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200">
          Lending Income
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Track your earnings and lending performance
        </p>
      </div>
      <div class="flex gap-2">
        <Dropdown
          v-model="selectedPeriod"
          :options="periodOptions"
          option-label="label"
          option-value="value"
          placeholder="All Time"
          class="w-40"
        />
      </div>
    </div>

    <!-- Top Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-green-500">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
            >Total Interest Earned</span
          >
          <div
            class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-dollar text-green-600 dark:text-green-400"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          ${{ totalInterestEarned.toLocaleString() }}
        </div>
        <div class="text-xs text-green-600 dark:text-green-400 font-medium">
          +12.5% from last period
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-blue-500">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Lent</span>
          <div
            class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-chevron-up text-blue-600 dark:text-blue-400"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          ${{ totalLent.toLocaleString() }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
          {{ settledLoans.length }} settled loans
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-purple-500">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. APR</span>
          <div
            class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-chevron-up text-purple-600 dark:text-purple-400"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {{ averageAPR.toFixed(1) }}%
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
          Average return rate
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border-l-4 border-orange-500">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</span>
          <div
            class="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center"
          >
            <i class="pi pi-check-circle text-orange-600 dark:text-orange-400"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">100%</div>
        <div class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
          {{ settledLoans.length }} of {{ settledLoans.length }} paid
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Pie Chart - Income by Currency -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200 mb-4">
          Income Distribution
        </h3>
        <div class="h-80 flex items-center justify-center">
          <div class="text-center">
            <div class="w-48 h-48 mx-auto mb-4 relative">
              <!-- Simple pie chart representation -->
              <div
                class="w-full h-full rounded-full border-8 border-green-500 flex items-center justify-center"
              >
                <div class="text-center">
                  <div
                    class="text-2xl font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200"
                  >
                    ${{ totalInterestEarned.toLocaleString() }}
                  </div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">Total Interest</div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="(data, index) in incomeByCurrency"
                :key="data.currency"
                class="flex items-center gap-2"
              >
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: chartColors[index % chartColors.length] }"
                />
                <div class="flex-1">
                  <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {{ data.currency }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                    ${{ data.interest.toLocaleString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bar Chart - Income Over Time -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200 mb-4">
          Income Timeline
        </h3>
        <div class="h-80">
          <div class="h-full flex items-end justify-between gap-2">
            <div
              v-for="(data, index) in timelineData"
              :key="index"
              class="flex-1 flex flex-col items-center"
            >
              <div
                class="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                :style="{
                  height: `${(data.interest / Math.max(...timelineData.map(d => d.interest))) * 200}px`,
                }"
              />
              <div class="text-xs text-gray-600 mt-2 text-center">
                <div class="font-semibold">${{ data.interest.toLocaleString() }}</div>
                <div>{{ data.date }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Top Performing Asset
        </h4>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ topPerformingAsset.currency }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">
              ${{ topPerformingAsset.interest.toLocaleString() }} earned
            </p>
          </div>
          <div
            class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
          >
            <i class="pi pi-chevron-up text-green-600 dark:text-green-400"></i>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Avg. Loan Duration
        </h4>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ averageDuration.toFixed(1) }} mo
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">
              Average term length
            </p>
          </div>
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center"
          >
            <i class="pi pi-clock text-blue-600 dark:text-blue-400"></i>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Total ROI</h4>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {{ totalROI.toFixed(1) }}%
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">
              Return on investment
            </p>
          </div>
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center"
          >
            <i class="pi pi-dollar text-purple-600 dark:text-purple-400"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Settled Loans History -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200">
          Settled Loans History
        </h3>
        <div class="flex gap-2">
          <Dropdown
            v-model="selectedCurrency"
            :options="currencyOptions"
            option-label="label"
            option-value="value"
            placeholder="All Currencies"
            class="w-40"
          />
          <Dropdown
            v-model="sortBy"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            placeholder="Sort by Date"
            class="w-40"
          />
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="loan in sortedSettledLoans"
          :key="loan.id"
          class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-green-300 dark:hover:border-green-500 hover:shadow-md transition-all"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h4 class="font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200 text-lg">
                  {{ loan.amount.toLocaleString() }} {{ loan.currency }}
                </h4>
                <span
                  class="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold"
                >
                  Settled
                </span>
                <span
                  class="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                >
                  {{ loan.interestRate }}% APR
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Borrower: <span class="font-mono text-xs">{{ loan.borrower }}</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                +${{ loan.totalInterest.toLocaleString() }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                Interest earned
              </p>
            </div>
          </div>

          <div
            class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3 pt-3 border-t border-gray-100 dark:border-gray-600"
          >
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Term</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {{ loan.duration }} months
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Collateral</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {{ loan.collateralRatio }}% {{ loan.collateralType }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Repaid</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                ${{ loan.totalRepaid.toLocaleString() }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Started</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {{ loan.startDate }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Settled</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {{ loan.endDate }}
              </p>
            </div>
          </div>

          <div
            class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-600"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2"
                style="width: 200px"
              >
                <div class="bg-green-500 h-2 rounded-full" style="width: 100%" />
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">100% Complete</span>
            </div>
            <div
              class="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium"
            >
              <i class="pi pi-check-circle"></i>
              <span>Paid in full</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SettledLoan } from '@/types/loan.types'
  import Dropdown from 'primevue/dropdown'
  import { computed, ref } from 'vue'

  // Sample data
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
  const selectedPeriod = ref('all')
  const selectedCurrency = ref('all')
  const sortBy = ref('date')

  // Options
  const periodOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'This Year', value: 'year' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'Last 3 Months', value: '3months' },
  ]

  const currencyOptions = [
    { label: 'All Currencies', value: 'all' },
    { label: 'USDC', value: 'USDC' },
    { label: 'DAI', value: 'DAI' },
    { label: 'USDT', value: 'USDT' },
  ]

  const sortOptions = [
    { label: 'Sort by Date', value: 'date' },
    { label: 'Sort by Interest', value: 'interest' },
    { label: 'Sort by Amount', value: 'amount' },
  ]

  const chartColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']

  // Computed properties
  const totalInterestEarned = computed(() => {
    return settledLoans.value.reduce((sum, loan) => sum + loan.totalInterest, 0)
  })

  const totalLent = computed(() => {
    return settledLoans.value.reduce((sum, loan) => sum + loan.amount, 0)
  })

  const averageAPR = computed(() => {
    return (
      settledLoans.value.reduce((sum, loan) => sum + loan.interestRate, 0) /
      settledLoans.value.length
    )
  })

  const incomeByCurrency = computed(() => {
    const grouped = settledLoans.value.reduce(
      (acc, loan) => {
        if (!acc[loan.currency]) {
          acc[loan.currency] = { currency: loan.currency, interest: 0, count: 0 }
        }
        acc[loan.currency].interest += loan.totalInterest
        acc[loan.currency].count += 1
        return acc
      },
      {} as Record<string, { currency: string; interest: number; count: number }>
    )

    return Object.values(grouped).sort((a, b) => b.interest - a.interest)
  })

  const topPerformingAsset = computed(() => {
    return incomeByCurrency.value[0] || { currency: 'N/A', interest: 0 }
  })

  const averageDuration = computed(() => {
    return (
      settledLoans.value.reduce((sum, loan) => sum + loan.duration, 0) / settledLoans.value.length
    )
  })

  const totalROI = computed(() => {
    return (totalInterestEarned.value / totalLent.value) * 100
  })

  const timelineData = computed(() => {
    return [...settledLoans.value]
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .map(loan => ({
        date: new Date(loan.endDate).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        interest: loan.totalInterest,
        principal: loan.amount,
      }))
  })

  const sortedSettledLoans = computed(() => {
    let filtered = settledLoans.value

    if (selectedCurrency.value !== 'all') {
      filtered = filtered.filter(loan => loan.currency === selectedCurrency.value)
    }

    return filtered.sort((a, b) => {
      switch (sortBy.value) {
        case 'interest':
          return b.totalInterest - a.totalInterest
        case 'amount':
          return b.amount - a.amount
        case 'date':
        default:
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      }
    })
  })
</script>
