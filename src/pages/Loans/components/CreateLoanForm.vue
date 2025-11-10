<template>
  <div class="max-w-6xl mx-auto">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
      >
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Create Loan Offer</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Set up your lending parameters</p>
      </div>

      <!-- Form Content -->
      <div class="p-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column - Loan Details -->
          <div class="space-y-4">
            <div>
              <h3
                class="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3 flex items-center gap-2"
              >
                <i class="pi pi-dollar"></i>
                Loan Asset
              </h3>

              <!-- Asset Type Selector -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Asset Type</label
                >
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="type in ['ERC20', 'NFT', 'Options']"
                    :key="type"
                    @click="newLoan.assetType = type"
                    :class="[
                      'px-3 py-2 rounded text-sm font-medium transition-all border',
                      newLoan.assetType === type
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
                    ]"
                  >
                    {{ type }}
                  </button>
                </div>
              </div>

              <!-- Conditional Fields Based on Asset Type -->
              <div v-if="newLoan.assetType === 'ERC20'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Amount</label
                  >
                  <InputText
                    v-model="newLoan.amount"
                    placeholder="10000"
                    type="number"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Token</label
                  >
                  <Dropdown
                    v-model="newLoan.currency"
                    :options="currencyOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>
              </div>

              <div v-if="newLoan.assetType === 'NFT'" class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                    >Collection</label
                  >
                  <Dropdown
                    v-model="newLoan.nftCollection"
                    :options="nftCollections"
                    option-label="label"
                    option-value="value"
                    placeholder="Select collection"
                    class="w-full"
                  />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Token ID</label
                    >
                    <InputText v-model="newLoan.nftTokenId" placeholder="#1234" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Est. Value</label
                    >
                    <InputText
                      v-model="newLoan.amount"
                      placeholder="50"
                      type="number"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <div v-if="newLoan.assetType === 'Options'" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Underlying</label
                    >
                    <Dropdown
                      v-model="newLoan.optionUnderlying"
                      :options="optionUnderlyings"
                      option-label="label"
                      option-value="value"
                      placeholder="Select asset"
                      class="w-full"
                      :pt="{
                        root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                        input: {
                          class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
                        },
                        panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                        item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                      }"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Type</label
                    >
                    <Dropdown
                      v-model="newLoan.optionContractType"
                      :options="optionTypes"
                      option-label="label"
                      option-value="value"
                      class="w-full"
                      :pt="{
                        root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                        input: {
                          class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
                        },
                        panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                        item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                      }"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Strike ($)</label
                    >
                    <InputText
                      v-model="newLoan.optionStrike"
                      placeholder="2500"
                      type="number"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Quantity</label
                    >
                    <InputText
                      v-model="newLoan.optionQuantity"
                      placeholder="10"
                      type="number"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Value</label
                    >
                    <InputText
                      v-model="newLoan.amount"
                      placeholder="5000"
                      type="number"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-2"
              >
                Annual Interest Rate (APR)
              </label>
              <div class="space-y-2">
                <Slider v-model="interestRateValue" :min="0" :max="25" :step="0.1" class="w-full" />
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-500 dark:text-gray-400">0%</span>
                  <div class="text-center">
                    <span class="text-2xl font-bold text-green-600"
                      >{{ newLoan.interestRate }}%</span
                    >
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">APR</span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">25%</span>
                </div>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-1"
              >
                Offer Valid Until
              </label>
              <Calendar
                v-model="validUntilDate"
                :min-date="new Date()"
                date-format="yy-mm-dd"
                class="w-full"
              />
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-1"
              >
                Loan Term (months)
              </label>
              <Dropdown
                v-model="newLoan.duration"
                :options="durationOptions"
                option-label="label"
                option-value="value"
                placeholder="Select term"
                class="w-full"
                :pt="{
                  root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                  input: { class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' },
                  panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                  item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                }"
              />
            </div>
          </div>

          <!-- Right Column - Collateral & Risk -->
          <div class="space-y-5">
            <div>
              <h3
                class="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3 flex items-center gap-2"
              >
                <i class="pi pi-shield"></i>
                Collateral Requirements
              </h3>

              <!-- Collateral Asset Type Selector -->
              <div class="mb-3">
                <label
                  class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-2"
                  >Collateral Type</label
                >
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="type in ['ERC20', 'NFT', 'Options']"
                    :key="type"
                    @click="newLoan.collateralAssetType = type"
                    :class="[
                      'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      newLoan.collateralAssetType === type
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                    ]"
                  >
                    {{ type }}
                  </button>
                </div>
              </div>

              <!-- Conditional Collateral Fields -->
              <div v-if="newLoan.collateralAssetType === 'ERC20'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                    >Asset</label
                  >
                  <Dropdown
                    v-model="newLoan.collateralType"
                    :options="collateralAssets"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                    :pt="{
                      root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                      input: { class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' },
                      panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                      item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                    }"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                    >Ticker</label
                  >
                  <InputText
                    :value="newLoan.collateralType"
                    disabled
                    class="w-full bg-gray-50 text-gray-700 dark:text-gray-300 font-semibold"
                  />
                </div>
              </div>

              <div v-if="newLoan.collateralAssetType === 'NFT'" class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                    >NFT Collection</label
                  >
                  <Dropdown
                    v-model="newLoan.collateralNftCollection"
                    :options="nftCollections"
                    option-label="label"
                    option-value="value"
                    placeholder="Select collection"
                    class="w-full"
                    :pt="{
                      root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                      input: { class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' },
                      panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                      item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                    }"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                    >Floor Price (ETH)</label
                  >
                  <InputText
                    v-model="newLoan.collateralNftFloor"
                    placeholder="25.5"
                    type="number"
                    class="w-full"
                  />
                </div>
              </div>

              <div v-if="newLoan.collateralAssetType === 'Options'" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Underlying</label
                    >
                    <Dropdown
                      v-model="newLoan.collateralOptionUnderlying"
                      :options="optionUnderlyings"
                      option-label="label"
                      option-value="value"
                      placeholder="Select asset"
                      class="w-full"
                      :pt="{
                        root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                        input: {
                          class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
                        },
                        panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                        item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                      }"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >Type</label
                    >
                    <Dropdown
                      v-model="newLoan.collateralOptionType"
                      :options="optionTypes"
                      option-label="label"
                      option-value="value"
                      class="w-full"
                      :pt="{
                        root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                        input: {
                          class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
                        },
                        panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                        item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-2"
              >
                Collateral Ratio
              </label>
              <div class="space-y-3">
                <Slider
                  v-model="collateralRatioValue"
                  :min="100"
                  :max="300"
                  :step="5"
                  class="w-full"
                />
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-500 dark:text-gray-400">100%</span>
                  <div class="text-center">
                    <span class="text-2xl font-bold text-orange-600"
                      >{{ newLoan.collateralRatio }}%</span
                    >
                    <span class="text-xs text-gray-500 dark:text-gray-400 block">Ratio</span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">300%</span>
                </div>

                <!-- Visual Risk Indicator -->
                <div
                  class="bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 dark:from-red-900/20 dark:via-yellow-900/20 dark:to-green-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span
                      class="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300"
                      >Risk Level</span
                    >
                    <span
                      :class="[
                        'text-xs font-semibold px-2 py-1 rounded-full',
                        parseInt(newLoan.collateralRatio) < 130
                          ? 'bg-red-600 text-white'
                          : parseInt(newLoan.collateralRatio) < 170
                            ? 'bg-yellow-600 text-white'
                            : 'bg-green-600 text-white',
                      ]"
                    >
                      {{ getRiskLevel() }}
                    </span>
                  </div>
                  <div class="relative h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      class="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                      :style="{
                        width: `${Math.min(((parseInt(newLoan.collateralRatio) - 100) / 200) * 100, 100)}%`,
                      }"
                    />
                  </div>
                  <div class="flex justify-between mt-2">
                    <span class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400"
                      >Higher liquidation risk</span
                    >
                    <span class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400"
                      >Safer for lender</span
                    >
                  </div>
                </div>

                <!-- Collateral Calculation -->
                <div
                  v-if="
                    newLoan.amount &&
                    newLoan.collateralRatio &&
                    newLoan.collateralAssetType === 'ERC20'
                  "
                  class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                >
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400"
                      >Required Collateral:</span
                    >
                    <span
                      class="text-sm font-bold text-gray-800 dark:text-gray-200 dark:text-gray-200"
                    >
                      {{
                        (
                          (parseFloat(newLoan.amount) * parseInt(newLoan.collateralRatio)) /
                          100
                        ).toFixed(2)
                      }}
                      {{ newLoan.collateralType }}
                    </span>
                  </div>
                </div>
                <div
                  v-if="newLoan.collateralAssetType === 'NFT'"
                  class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                >
                  <div class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400">
                    Borrower must provide NFT from
                    {{ newLoan.collateralNftCollection || 'selected collection' }}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3
                class="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-3"
              >
                Option Contract (Optional)
              </h3>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-1"
                    >Type</label
                  >
                  <Dropdown
                    v-model="newLoan.optionType"
                    :options="optionTypes"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                    :pt="{
                      root: { class: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200' },
                      input: { class: 'dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600' },
                      panel: { class: 'dark:bg-gray-700 dark:border-gray-600' },
                      item: { class: 'dark:text-gray-200 dark:hover:bg-gray-600' },
                    }"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-1"
                    >Strike Price ($)</label
                  >
                  <InputText
                    v-model="newLoan.strikePrice"
                    placeholder="2500"
                    type="number"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button label="Cancel" severity="secondary" @click="resetForm" class="px-6" />
          <Button
            label="Create Offer"
            severity="success"
            @click="handleCreateLoan"
            class="px-6"
            :disabled="!isFormValid"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { CreateLoanForm } from '@/types/loan.types'
  import Button from 'primevue/button'
  import Calendar from 'primevue/calendar'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import Slider from 'primevue/slider'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref, watch } from 'vue'

  const toast = useToast()

  // Form data
  const newLoan = ref<CreateLoanForm>({
    assetType: 'ERC20',
    amount: '',
    currency: 'USDC',
    interestRate: '8',
    duration: '',
    collateralAssetType: 'ERC20',
    collateralType: 'ETH',
    collateralRatio: '150',
    optionType: 'Call',
    strikePrice: '',
    validUntil: '',
    nftCollection: '',
    nftTokenId: '',
    optionUnderlying: '',
    optionContractType: 'Call',
    optionStrike: '',
    optionQuantity: '',
    collateralNftCollection: '',
    collateralNftFloor: '',
    collateralOptionUnderlying: '',
    collateralOptionType: 'Call',
  })

  // Computed values for sliders
  const interestRateValue = computed({
    get: () => parseFloat(newLoan.value.interestRate),
    set: (value: number) => {
      newLoan.value.interestRate = value.toString()
    },
  })

  const collateralRatioValue = computed({
    get: () => parseInt(newLoan.value.collateralRatio),
    set: (value: number) => {
      newLoan.value.collateralRatio = value.toString()
    },
  })

  const validUntilDate = ref<Date | null>(null)

  // Watch for date changes
  watch(validUntilDate, newDate => {
    if (newDate) {
      newLoan.value.validUntil = newDate.toISOString().split('T')[0]
    }
  })

  // Options
  const currencyOptions = [
    { label: 'USDC', value: 'USDC' },
    { label: 'DAI', value: 'DAI' },
    { label: 'USDT', value: 'USDT' },
    { label: 'ETH', value: 'ETH' },
    { label: 'BTC', value: 'BTC' },
  ]

  const nftCollections = [
    { label: 'Bored Ape Yacht Club', value: 'BAYC' },
    { label: 'Mutant Ape Yacht Club', value: 'MAYC' },
    { label: 'Azuki', value: 'Azuki' },
    { label: 'Doodles', value: 'Doodles' },
    { label: 'Pudgy Penguins', value: 'Pudgy' },
    { label: 'CryptoPunks', value: 'CryptoPunks' },
    { label: 'CloneX', value: 'CloneX' },
  ]

  const optionUnderlyings = [
    { label: 'ETH', value: 'ETH' },
    { label: 'BTC', value: 'BTC' },
    { label: 'SOL', value: 'SOL' },
  ]

  const optionTypes = [
    { label: 'Call', value: 'Call' },
    { label: 'Put', value: 'Put' },
  ]

  const durationOptions = [
    { label: '3 months', value: '3' },
    { label: '6 months', value: '6' },
    { label: '12 months (1 year)', value: '12' },
    { label: '18 months', value: '18' },
    { label: '24 months (2 years)', value: '24' },
    { label: '36 months (3 years)', value: '36' },
  ]

  const collateralAssets = [
    { label: 'Ethereum', value: 'ETH' },
    { label: 'Bitcoin', value: 'BTC' },
    { label: 'Solana', value: 'SOL' },
    { label: 'USDC', value: 'USDC' },
    { label: 'DAI', value: 'DAI' },
  ]

  // Methods
  const getRiskLevel = (): string => {
    const ratio = parseInt(newLoan.value.collateralRatio)
    if (ratio < 130) return 'High Risk'
    if (ratio < 170) return 'Medium Risk'
    return 'Low Risk'
  }

  const handleCreateLoan = () => {
    if (
      newLoan.value.amount &&
      newLoan.value.interestRate &&
      newLoan.value.duration &&
      newLoan.value.collateralRatio
    ) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Loan offer created successfully!',
        life: 3000,
      })

      // Reset form
      newLoan.value = {
        assetType: 'ERC20',
        amount: '',
        currency: 'USDC',
        interestRate: '8',
        duration: '',
        collateralAssetType: 'ERC20',
        collateralType: 'ETH',
        collateralRatio: '150',
        optionType: 'Call',
        strikePrice: '',
        validUntil: '',
        nftCollection: '',
        nftTokenId: '',
        optionUnderlying: '',
        optionContractType: 'Call',
        optionStrike: '',
        optionQuantity: '',
        collateralNftCollection: '',
        collateralNftFloor: '',
        collateralOptionUnderlying: '',
        collateralOptionType: 'Call',
      }
      validUntilDate.value = null
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields',
        life: 3000,
      })
    }
  }
</script>
