<template>
  <div class="send-transaction">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Recipient Address -->
      <div>
        <label
          for="recipient-address"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Recipient Address
        </label>
        <div class="relative">
          <input
            id="recipient-address"
            v-model="form.recipientAddress"
            type="text"
            placeholder="Enter Chia address (xch1... or txch1...)"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            :class="{ 'border-red-500 dark:border-red-400': errors.recipientAddress }"
            required
          />
          <button
            v-if="form.recipientAddress"
            @click="validateAddress"
            type="button"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <i class="pi pi-check" v-if="isAddressValid"></i>
            <i class="pi pi-times" v-else-if="addressValidationAttempted"></i>
          </button>
        </div>
        <p v-if="errors.recipientAddress" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.recipientAddress }}
        </p>
        <p v-else-if="isAddressValid" class="mt-1 text-sm text-green-600 dark:text-green-400">
          Valid address
        </p>
      </div>

      <!-- Amount -->
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount
        </label>
        <div class="relative">
          <input
            id="amount"
            v-model="form.amount"
            type="number"
            step="0.000001"
            min="0"
            :max="availableBalance"
            placeholder="0.000000"
            class="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            :class="{ 'border-red-500 dark:border-red-400': errors.amount }"
            required
          />
          <div
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium"
          >
            {{ ticker }}
          </div>
        </div>
        <div class="flex justify-between mt-1">
          <p v-if="errors.amount" class="text-sm text-red-600 dark:text-red-400">
            {{ errors.amount }}
          </p>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">
            Available: {{ availableBalance.toFixed(6) }} {{ ticker }}
          </p>
        </div>
      </div>

      <!-- Fee -->
      <div>
        <label for="fee" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transaction Fee
        </label>
        <div class="relative">
          <input
            id="fee"
            v-model="form.fee"
            type="number"
            step="0.000001"
            min="0"
            placeholder="0.000001"
            class="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            :class="{ 'border-red-500 dark:border-red-400': errors.fee }"
            required
          />
          <div
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium"
          >
            {{ ticker }}
          </div>
        </div>
        <p v-if="errors.fee" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.fee }}
        </p>
        <p v-else class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Minimum fee: 0.000001 {{ ticker }}
        </p>
      </div>

      <!-- Memo (Optional) -->
      <div>
        <label for="memo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Memo (Optional)
        </label>
        <textarea
          id="memo"
          v-model="form.memo"
          rows="3"
          placeholder="Add a note to this transaction..."
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Transaction Summary -->
      <div v-if="form.amount && form.fee" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transaction Summary
        </h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Amount:</span>
            <span class="text-gray-900 dark:text-white"
              >{{ parseFloat(form.amount || '0').toFixed(6) }} {{ ticker }}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Fee:</span>
            <span class="text-gray-900 dark:text-white"
              >{{ parseFloat(form.fee || '0').toFixed(6) }} {{ ticker }}</span
            >
          </div>
          <div class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1">
            <span class="font-medium text-gray-700 dark:text-gray-300">Total:</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ (parseFloat(form.amount || '0') + parseFloat(form.fee || '0')).toFixed(6) }}
              {{ ticker }}
            </span>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <i v-if="isSubmitting" class="pi pi-spin pi-spinner mr-2"></i>
          <i v-else class="pi pi-send mr-2"></i>
          {{ isSubmitting ? 'Sending...' : 'Send Transaction' }}
        </button>
        <button
          type="button"
          @click="resetForm"
          class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          Reset
        </button>
      </div>
    </form>

    <!-- Success/Error Messages -->
    <div
      v-if="successMessage"
      class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <div class="flex items-center">
        <i class="pi pi-check-circle text-green-600 dark:text-green-400 mr-2"></i>
        <p class="text-green-800 dark:text-green-200">{{ successMessage }}</p>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2"></i>
        <p class="text-red-800 dark:text-red-200">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    SendTransactionWalletRequest,
    SendTransactionWalletResponse,
  } from '@/types/transaction.types'
  import { computed, reactive, ref } from 'vue'

  interface Props {
    walletId: number
    availableBalance: number
    ticker: string
  }

  interface Emits {
    (e: 'transaction-sent', transactionId: string): void
    (e: 'transaction-error', error: string): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Form state
  const form = reactive({
    recipientAddress: '',
    amount: '',
    fee: '0.000001',
    memo: '',
  })

  const errors = reactive({
    recipientAddress: '',
    amount: '',
    fee: '',
  })

  // UI state
  const isSubmitting = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const isAddressValid = ref(false)
  const addressValidationAttempted = ref(false)

  // Computed properties
  const isFormValid = computed(() => {
    return (
      form.recipientAddress &&
      form.amount &&
      form.fee &&
      !errors.recipientAddress &&
      !errors.amount &&
      !errors.fee &&
      parseFloat(form.amount) > 0 &&
      parseFloat(form.fee) > 0
    )
  })

  // Validation functions
  const validateAddress = () => {
    addressValidationAttempted.value = true
    const address = form.recipientAddress.trim()

    // Basic Chia address validation
    const chiaAddressRegex = /^(xch|txch)1[a-z0-9]{58}$/
    const isValid = chiaAddressRegex.test(address)

    isAddressValid.value = isValid

    if (!isValid) {
      errors.recipientAddress = 'Invalid Chia address format'
    } else {
      errors.recipientAddress = ''
    }

    return isValid
  }

  const validateAmount = () => {
    const amount = parseFloat(form.amount)
    const fee = parseFloat(form.fee)
    const total = amount + fee

    if (amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
      return false
    }

    if (total > props.availableBalance) {
      errors.amount = `Insufficient balance. Total (${total.toFixed(6)}) exceeds available (${props.availableBalance.toFixed(6)})`
      return false
    }

    errors.amount = ''
    return true
  }

  const validateFee = () => {
    const fee = parseFloat(form.fee)

    if (fee <= 0) {
      errors.fee = 'Fee must be greater than 0'
      return false
    }

    if (fee < 0.000001) {
      errors.fee = 'Minimum fee is 0.000001'
      return false
    }

    errors.fee = ''
    return true
  }

  // Form submission
  const handleSubmit = async () => {
    // Clear previous messages
    successMessage.value = ''
    errorMessage.value = ''

    // Validate form
    const isAddressValid = validateAddress()
    const isAmountValid = validateAmount()
    const isFeeValid = validateFee()

    if (!isAddressValid || !isAmountValid || !isFeeValid) {
      return
    }

    isSubmitting.value = true

    try {
      const sendTransaction = async (
        data: SendTransactionWalletRequest
      ): Promise<SendTransactionWalletResponse> => {
        console.log('Send transaction called with:', data)
        return {
          success: true,
          transactionId: 'test-tx-id',
          data: {
            transactionId: 'test-tx-id',
            status: 'pending',
            fee: data.transaction.fee,
          },
          error: null,
        }
      }

      const result = await sendTransaction({
        transaction: {
          amount: Math.floor(parseFloat(form.amount) * 1000000000000), // Convert to mojos
          fee: Math.floor(parseFloat(form.fee) * 1000000000000), // Convert to mojos
          recipient: form.recipientAddress.trim(),
          memo: form.memo || undefined,
        },
      })

      if (result.success && result.data) {
        successMessage.value = `Transaction sent successfully! Transaction ID: ${result.data.transactionId}`
        emit('transaction-sent', result.data.transactionId)
        resetForm()
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      errorMessage.value = `Transaction failed: ${errorMsg}`
      emit('transaction-error', errorMsg)
    } finally {
      isSubmitting.value = false
    }
  }

  const resetForm = () => {
    form.recipientAddress = ''
    form.amount = ''
    form.fee = '0.000001'
    form.memo = ''

    errors.recipientAddress = ''
    errors.amount = ''
    errors.fee = ''

    successMessage.value = ''
    errorMessage.value = ''
    isAddressValid.value = false
    addressValidationAttempted.value = false
  }

  // Watch for changes to validate in real-time
  const validateForm = () => {
    if (form.recipientAddress) {
      validateAddress()
    }
    if (form.amount) {
      validateAmount()
    }
    if (form.fee) {
      validateFee()
    }
  }

  // Auto-validate as user types
  import { watch } from 'vue'
  watch([() => form.recipientAddress, () => form.amount, () => form.fee], validateForm)
</script>

<style scoped>
  .send-transaction {
    @apply w-full;
  }

  /* Custom scrollbar for textarea */
  textarea::-webkit-scrollbar {
    width: 6px;
  }

  textarea::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-600 rounded;
  }

  textarea::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-500 rounded;
  }

  textarea::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-400;
  }
</style>
