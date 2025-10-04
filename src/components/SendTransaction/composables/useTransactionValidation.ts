import { getMinimumFeeInXch } from '@/shared/utils/chia-units'
import { ref } from 'vue'
import type { FormErrors, TransactionForm } from './useTransactionForm'

interface ValidationProps {
  availableBalance: number
}

export function useTransactionValidation(
  form: TransactionForm,
  errors: FormErrors,
  props: ValidationProps
) {
  const isAddressValid = ref(false)
  const addressValidationAttempted = ref(false)

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

    if (fee < getMinimumFeeInXch()) {
      errors.fee = `Minimum fee is ${getMinimumFeeInXch()}`
      return false
    }

    errors.fee = ''
    return true
  }

  return {
    isAddressValid,
    addressValidationAttempted,
    validateAddress,
    validateAmount,
    validateFee,
  }
}
