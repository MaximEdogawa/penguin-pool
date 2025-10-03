<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Available CAT Tokens</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Human-readable CAT token information from Dexie tickers
      </p>
    </div>

    <div class="p-4">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600 dark:text-gray-400">Loading CAT tokens...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="isError" class="text-center py-8">
        <div class="text-red-600 dark:text-red-400 mb-2">
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          Failed to load CAT tokens
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ error?.message || 'Unknown error occurred' }}
        </p>
        <button
          @click="refetchTickers"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>

      <!-- CAT tokens list -->
      <div v-else-if="availableCatTokens.length > 0" class="space-y-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="token in availableCatTokens"
            :key="token.assetId"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ token.ticker }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ token.name }}
                </div>
              </div>
              <div
                @click="copyAssetId(token.assetId)"
                class="text-xs text-gray-400 dark:text-gray-500 font-mono cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors relative"
                :title="`Click to copy: ${token.assetId}`"
              >
                <span :class="{ 'opacity-0': copiedStates[token.assetId] }">
                  {{ token.assetId.slice(0, 8) }}...
                </span>
                <span
                  v-if="copiedStates[token.assetId]"
                  class="absolute inset-0 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold animate-pulse"
                >
                  ✓ Copied!
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center pt-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ availableCatTokens.length }} CAT tokens available
          </p>
          <button
            @click="refetchTickers"
            class="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Refresh data
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <div class="text-gray-400 dark:text-gray-500 mb-2">
          <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            ></path>
          </svg>
          No CAT tokens found
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
          CAT token data will appear here once loaded from Dexie
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTickerData } from '@/shared/composables/useTickerData'
  import { ref } from 'vue'

  const { availableCatTokens, isLoading, isError, error, refetchTickers } = useTickerData()

  const copiedStates = ref<Record<string, boolean>>({})

  const copyAssetId = async (assetId: string) => {
    try {
      await navigator.clipboard.writeText(assetId)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = assetId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    // Show copied animation
    copiedStates.value[assetId] = true

    // Hide animation after 2 seconds
    setTimeout(() => {
      copiedStates.value[assetId] = false
    }, 2000)
  }
</script>
