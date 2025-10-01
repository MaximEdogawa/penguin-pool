<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="mb-6">
          <p class="text-gray-600 dark:text-gray-400">{{ message }}</p>
          <div v-if="details" class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
              {{ details }}
            </p>
          </div>
          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-start">
              <i class="pi pi-exclamation-triangle text-red-500 mr-2 mt-0.5"></i>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            {{ cancelText }}
          </button>
          <button
            @click="$emit('confirm')"
            :disabled="isLoading"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner mr-2"></i>
            <i v-else class="pi pi-exclamation-triangle mr-2"></i>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    title: string
    message: string
    details?: string
    errorMessage?: string
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
  }

  interface Emits {
    (e: 'close'): void
    (e: 'confirm'): void
  }

  withDefaults(defineProps<Props>(), {
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isLoading: false,
  })

  defineEmits<Emits>()
</script>
