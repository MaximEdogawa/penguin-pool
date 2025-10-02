<template>
  <div class="space-y-4">
    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <div class="flex items-center">
        <i class="pi pi-check-circle text-green-600 dark:text-green-400 mr-2"></i>
        <p class="text-green-800 dark:text-green-200">{{ successMessage }}</p>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center">
        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2"></i>
        <p class="text-red-800 dark:text-red-200">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    successMessage: string
    errorMessage: string
  }

  defineProps<Props>()
</script>
