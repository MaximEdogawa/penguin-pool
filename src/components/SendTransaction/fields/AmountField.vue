<template>
  <div>
    <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Amount
    </label>
    <div class="relative">
      <input
        id="amount"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement)?.value || '')"
        type="number"
        step="0.000001"
        min="0"
        :max="availableBalance"
        placeholder="0.000000"
        class="input-field pr-16"
        :class="{ 'input-field--error': error }"
        required
      />
      <div
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium"
      >
        {{ ticker }}
      </div>
    </div>
    <div class="flex justify-between mt-1">
      <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
      <p v-else class="text-sm text-gray-500 dark:text-gray-400">
        Available: {{ availableBalance.toFixed(6) }} {{ ticker }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: string
    error: string
    availableBalance: number
    ticker: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'validate'): void
  }

  defineProps<Props>()
  defineEmits<Emits>()
</script>

<style scoped>
  .input-field {
    @apply w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors;
  }

  .input-field--error {
    @apply border-red-500 dark:border-red-400;
  }
</style>
