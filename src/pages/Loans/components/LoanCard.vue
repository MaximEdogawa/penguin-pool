<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
  >
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span
            :class="[
              'px-2 py-0.5 rounded text-xs font-semibold',
              loan.assetType === 'ERC20'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                : loan.assetType === 'NFT'
                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                  : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300',
            ]"
          >
            {{ loan.assetType || 'ERC20' }}
          </span>
        </div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">
          {{ getLoanAssetDisplay() }}
        </h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{
            type === 'created'
              ? `Lent to ${loan.borrower}`
              : type === 'taken'
                ? `From ${loan.lender}`
                : `By ${loan.maker}`
          }}
        </p>
      </div>
      <span
        :class="[
          'px-2 py-1 rounded-full text-xs font-medium',
          loan.status === 'available'
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : loan.status === 'funded'
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
        ]"
      >
        {{ loan.status === 'available' ? 'Available' : 'Active' }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="flex items-center gap-1.5">
        <i class="pi pi-chevron-up text-blue-600"></i>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">APR</p>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {{ loan.interestRate }}%
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="pi pi-clock text-purple-600"></i>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">Term</p>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {{ loan.duration }}mo
          </p>
        </div>
      </div>
    </div>

    <!-- Prominent Collateral Ratio Display -->
    <div :class="['rounded-lg p-3 mb-3 border-2', getRiskColorClasses()]">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <i class="pi pi-shield"></i>
          <span class="text-xs font-medium">Collateral Ratio</span>
        </div>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-800">
          {{ getRiskLabel() }}
        </span>
      </div>
      <div class="flex items-baseline gap-2 mb-2">
        <span class="text-3xl font-bold">{{ loan.collateralRatio }}%</span>
        <span
          :class="[
            'px-1.5 py-0.5 rounded text-xs font-semibold',
            loan.collateralAssetType === 'ERC20'
              ? 'bg-orange-100 text-orange-800'
              : loan.collateralAssetType === 'NFT'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-indigo-100 text-indigo-800',
          ]"
        >
          {{ loan.collateralAssetType || 'ERC20' }}
        </span>
      </div>
      <p class="text-sm font-semibold mb-1">
        {{ getCollateralDisplay() }}
      </p>
      <!-- Progress bar for collateral ratio -->
      <div class="w-full bg-white dark:bg-gray-800 rounded-full h-1.5 mt-2">
        <div
          class="h-1.5 rounded-full transition-all"
          :style="{
            width: `${Math.min(loan.collateralRatio / 3, 100)}%`,
            backgroundColor:
              loan.collateralRatio < 130
                ? '#dc2626'
                : loan.collateralRatio < 170
                  ? '#ca8a04'
                  : '#16a34a',
          }"
        />
      </div>
    </div>

    <!-- Interest Breakdown -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-dollar text-blue-600"></i>
        <span class="text-xs font-semibold text-blue-900 dark:text-blue-100"
          >Interest Breakdown</span
        >
      </div>
      <div class="space-y-1.5">
        <div class="flex justify-between items-center">
          <span class="text-xs text-blue-700 dark:text-blue-300">Principal:</span>
          <span class="text-sm font-bold text-blue-900 dark:text-blue-100">
            ${{ loan.amount.toLocaleString() }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-blue-700 dark:text-blue-300">Total Interest:</span>
          <span class="text-sm font-bold text-blue-900 dark:text-blue-100">
            ${{ type === 'taken' ? (loan.totalRepayment - loan.amount).toFixed(2) : totalInterest }}
          </span>
        </div>
        <div class="border-t border-blue-200 dark:border-blue-700 pt-1.5 mt-1.5">
          <div class="flex justify-between items-center">
            <span class="text-xs text-blue-700 dark:text-blue-300">Total Repayment:</span>
            <span class="text-base font-bold text-blue-900 dark:text-blue-100">
              ${{ type === 'taken' ? loan.totalRepayment.toLocaleString() : totalRepayment }}
            </span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-blue-700 dark:text-blue-300">Monthly Payment:</span>
          <span class="text-sm font-semibold text-blue-900 dark:text-blue-100">
            ${{ type === 'taken' ? loan.monthlyPayment : monthlyPayment }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="loan.optionType && loan.strikePrice"
      class="bg-gray-50 dark:bg-gray-700 rounded p-2 mb-3 border border-gray-200 dark:border-gray-600"
    >
      <p class="text-xs font-medium text-gray-700 dark:text-gray-300">Option Contract</p>
      <p class="text-xs text-gray-600 dark:text-gray-400">
        {{ loan.optionType }} @ ${{ loan.strikePrice.toLocaleString() }}
      </p>
    </div>

    <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
      <button
        v-if="type === 'available'"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        Take Loan
      </button>

      <div v-if="type === 'taken'" class="space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-gray-600 dark:text-gray-400">Next Payment</span>
          <span class="font-medium text-gray-800 dark:text-gray-200">{{ loan.nextPayment }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-gray-600 dark:text-gray-400">Remaining</span>
          <span class="font-medium text-gray-800 dark:text-gray-200"
            >{{ loan.paymentsRemaining }}/{{ loan.duration }}</span
          >
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1.5 mb-3">
          <div
            class="bg-blue-600 h-1.5 rounded-full"
            :style="{
              width: `${((loan.duration - loan.paymentsRemaining) / loan.duration) * 100}%`,
            }"
          />
        </div>
        <button
          v-if="loan.paymentsRemaining > 0"
          @click="onPayment && onPayment(loan.id, loan.monthlyPayment)"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-dollar"></i>
          Pay ${{ loan.monthlyPayment }}
        </button>
        <div
          v-else
          class="w-full bg-green-100 text-green-800 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          <i class="pi pi-check-circle"></i>
          Loan Paid Off!
        </div>
      </div>

      <div v-if="type === 'created' && loan.status === 'funded'" class="space-y-1.5">
        <div class="flex justify-between text-xs">
          <span class="text-gray-600 dark:text-gray-400">Funded</span>
          <span class="font-medium text-gray-800 dark:text-gray-200">{{ loan.fundedDate }}</span>
        </div>
        <div class="flex items-center gap-1.5 text-green-600 text-xs font-medium">
          <i class="pi pi-check-circle"></i>
          <span
            >Earning ${{
              ((loan.totalRepayment - loan.amount) / loan.duration).toFixed(2)
            }}/month</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { LoanAgreement, LoanOffer } from '@/types/loan.types'
  import { computed } from 'vue'

  interface Props {
    loan: LoanOffer | LoanAgreement
    type: 'available' | 'taken' | 'created'
    onPayment?: (loanId: number, amount: number) => void
  }

  const props = defineProps<Props>()

  // Computed properties
  const monthlyPayment = computed(() => {
    return calculateMonthlyPayment(props.loan.amount, props.loan.interestRate, props.loan.duration)
  })

  const totalRepayment = computed(() => {
    return (monthlyPayment.value * props.loan.duration).toFixed(2)
  })

  const totalInterest = computed(() => {
    return (parseFloat(totalRepayment.value) - props.loan.amount).toFixed(2)
  })

  // Helper functions
  const calculateMonthlyPayment = (
    principal: number,
    annualRate: number,
    months: number
  ): string => {
    const monthlyRate = annualRate / 100 / 12
    const payment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1)
    return payment.toFixed(2)
  }

  const getLoanAssetDisplay = (): string => {
    if (props.loan.assetType === 'NFT') {
      return `${props.loan.nftCollection} ${props.loan.nftTokenId}`
    } else if (props.loan.assetType === 'Options') {
      return `${props.loan.optionQuantity}x ${props.loan.optionUnderlying} ${props.loan.optionContractType}`
    } else {
      return `${props.loan.amount.toLocaleString()} ${props.loan.currency}`
    }
  }

  const getCollateralDisplay = (): string => {
    if (props.loan.collateralAssetType === 'NFT') {
      return `${props.loan.collateralNftCollection} NFT`
    } else if (props.loan.collateralAssetType === 'Options') {
      return `${props.loan.collateralOptionUnderlying} ${props.loan.collateralOptionType}`
    } else if (props.type === 'taken') {
      return `${props.loan.collateralProvided} ${props.loan.collateralType}`
    } else {
      const requiredCollateral = ((props.loan.amount * props.loan.collateralRatio) / 100).toFixed(2)
      return `${requiredCollateral} ${props.loan.collateralType}`
    }
  }

  const getRiskColorClasses = (): string => {
    if (props.loan.collateralRatio < 130) return 'text-red-600 bg-red-50 border-red-200'
    if (props.loan.collateralRatio < 170) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getRiskLabel = (): string => {
    if (props.loan.collateralRatio < 130) return 'High Risk'
    if (props.loan.collateralRatio < 170) return 'Medium Risk'
    return 'Low Risk'
  }
</script>
