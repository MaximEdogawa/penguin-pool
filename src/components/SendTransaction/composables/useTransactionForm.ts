import { getMinimumFeeInXch } from '@/shared/utils/chia-units'
import { reactive } from 'vue'

export interface TransactionForm {
  recipientAddress: string
  amount: string
  fee: string
  memo: string
}

export interface FormErrors {
  recipientAddress: string
  amount: string
  fee: string
}

export function useTransactionForm() {
  const form = reactive<TransactionForm>({
    recipientAddress: '',
    amount: '',
    fee: getMinimumFeeInXch().toString(),
    memo: '',
  })

  const errors = reactive<FormErrors>({
    recipientAddress: '',
    amount: '',
    fee: '',
  })

  const resetForm = () => {
    form.recipientAddress = ''
    form.amount = ''
    form.fee = getMinimumFeeInXch().toString()
    form.memo = ''

    errors.recipientAddress = ''
    errors.amount = ''
    errors.fee = ''
  }

  return {
    form,
    errors,
    resetForm,
  }
}
