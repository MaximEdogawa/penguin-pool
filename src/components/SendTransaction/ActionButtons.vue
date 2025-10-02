<template>
  <div class="flex space-x-4">
    <button
      type="submit"
      :disabled="!isFormValid || isSubmitting"
      class="btn btn--primary"
      @click="$emit('submit')"
    >
      <i v-if="isSubmitting" class="pi pi-spin pi-spinner mr-2"></i>
      <i v-else class="pi pi-send mr-2"></i>
      {{ isSubmitting ? 'Sending...' : 'Send Transaction' }}
    </button>
    <button type="button" class="btn btn--secondary" @click="$emit('reset')">Reset</button>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    isFormValid: boolean
    isSubmitting: boolean
  }

  interface Emits {
    (e: 'submit'): void
    (e: 'reset'): void
  }

  defineProps<Props>()
  defineEmits<Emits>()
</script>

<style scoped>
  .btn {
    @apply font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center;
  }

  .btn--primary {
    @apply flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white;
  }

  .btn--secondary {
    @apply border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700;
  }
</style>
