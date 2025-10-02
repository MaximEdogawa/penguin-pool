<template>
  <div class="send-transaction">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Send Transaction</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">Send {{ ticker }} to another address</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Recipient Address Field -->
      <AddressField
        v-model="form.recipientAddress"
        :error="errors.recipientAddress"
        :is-valid="isAddressValid"
        :validation-attempted="addressValidationAttempted"
        @validate="validateAddress"
      />

      <!-- Amount Field -->
      <AmountField
        v-model="form.amount"
        :error="errors.amount"
        :available-balance="availableBalance"
        :ticker="ticker"
        @validate="validateAmount"
      />

      <!-- Fee Field -->
      <FeeField
        v-model="form.fee"
        :error="errors.fee"
        :ticker="ticker"
        :minimum-fee="getMinimumFeeInXch()"
        @validate="validateFee"
      />

      <!-- Memo Field -->
      <MemoField v-model="form.memo" />

      <!-- Transaction Summary -->
      <TransactionSummary :amount="form.amount" :fee="form.fee" :ticker="ticker" />

      <!-- Action Buttons -->
      <ActionButtons
        :is-form-valid="isFormValid"
        :is-submitting="isSubmitting"
        @submit="handleSubmit"
        @reset="resetForm"
      />
    </form>

    <!-- Status Messages -->
    <StatusMessages :success-message="successMessage" :error-message="errorMessage" />
  </div>
</template>

<script setup lang="ts">
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import type { TransactionRequest } from '@/features/walletConnect/types/command.types'
  import { getMinimumFeeInXch, xchToMojos } from '@/shared/utils/chia-units'
  import { computed, ref, watch } from 'vue'
  import ActionButtons from './ActionButtons.vue'
  import StatusMessages from './StatusMessages.vue'
  import TransactionSummary from './TransactionSummary.vue'
  import { useTransactionForm } from './composables/useTransactionForm'
  import { useTransactionValidation } from './composables/useTransactionValidation'
  import AddressField from './fields/AddressField.vue'
  import AmountField from './fields/AmountField.vue'
  import FeeField from './fields/FeeField.vue'
  import MemoField from './fields/MemoField.vue'

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

  const { sendTransaction } = useWalletDataService()

  // Form state and validation
  const { form, errors, resetForm } = useTransactionForm()
  const {
    isAddressValid,
    addressValidationAttempted,
    validateAddress,
    validateAmount,
    validateFee,
  } = useTransactionValidation(form, errors, props)

  // UI state
  const isSubmitting = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

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

  // Form submission
  const handleSubmit = async () => {
    clearMessages()

    if (!validateAllFields()) {
      return
    }

    isSubmitting.value = true

    try {
      const params: TransactionRequest = {
        walletId: props.walletId,
        address: form.recipientAddress.trim(),
        amount: xchToMojos(parseFloat(form.amount)),
        fee: xchToMojos(parseFloat(form.fee)),
        memo: form.memo.trim() || undefined,
      }

      await sendTransaction(params)
      successMessage.value = 'Transaction sent successfully!'
      resetForm()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      errorMessage.value = `Transaction failed: ${errorMsg}`
      emit('transaction-error', errorMsg)
    } finally {
      isSubmitting.value = false
    }
  }

  // Helper functions
  const clearMessages = () => {
    successMessage.value = ''
    errorMessage.value = ''
  }

  const validateAllFields = () => {
    const isAddressValidResult = validateAddress()
    const isAmountValidResult = validateAmount()
    const isFeeValidResult = validateFee()

    return isAddressValidResult && isAmountValidResult && isFeeValidResult
  }

  // Auto-validate as user types
  watch([() => form.recipientAddress, () => form.amount, () => form.fee], () => {
    if (form.recipientAddress) validateAddress()
    if (form.amount) validateAmount()
    if (form.fee) validateFee()
  })
</script>

<style scoped>
  .send-transaction {
    @apply w-full;
  }
</style>
