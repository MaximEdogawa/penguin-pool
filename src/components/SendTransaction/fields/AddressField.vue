<template>
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
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement)?.value || '')"
        type="text"
        placeholder="Enter Chia address (xch1... or txch1...)"
        class="input-field"
        :class="{ 'input-field--error': error }"
        required
      />
      <button
        v-if="modelValue"
        @click="$emit('validate')"
        type="button"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        <i class="pi pi-check" v-if="isValid"></i>
        <i class="pi pi-times" v-else-if="validationAttempted"></i>
      </button>
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    <p v-else-if="isValid" class="mt-1 text-sm text-green-600 dark:text-green-400">Valid address</p>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: string
    error: string
    isValid: boolean
    validationAttempted: boolean
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
