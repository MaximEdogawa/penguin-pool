<template>
  <div v-if="amount && fee" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Summary</h3>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-600 dark:text-gray-400">Amount:</span>
        <span class="text-gray-900 dark:text-white"> {{ formatAmount(amount) }} {{ ticker }} </span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600 dark:text-gray-400">Fee:</span>
        <span class="text-gray-900 dark:text-white"> {{ formatAmount(fee) }} {{ ticker }} </span>
      </div>
      <div class="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1">
        <span class="font-medium text-gray-700 dark:text-gray-300">Total:</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ formatAmount(total) }} {{ ticker }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    amount: string
    fee: string
    ticker: string
  }

  const props = defineProps<Props>()

  const total = computed(() => {
    return (parseFloat(props.amount || '0') + parseFloat(props.fee || '0')).toString()
  })

  const formatAmount = (amount: string) => {
    return parseFloat(amount || '0').toFixed(6)
  }
</script>
