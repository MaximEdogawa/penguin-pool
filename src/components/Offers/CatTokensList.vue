<template>
  <div class="content-page">
    <div class="content-body">
      <!-- CAT Tokens List -->
      <div class="card w-full p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Available CAT Tokens
          </h2>
          <div class="flex items-center space-x-2">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tokens..."
                class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <i
                class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
              ></i>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ filteredTokens.length }} tokens
            </span>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span class="ml-3 text-gray-600 dark:text-gray-400">Loading CAT tokens...</span>
        </div>

        <!-- Error state -->
        <div v-else-if="isError" class="text-center py-12">
          <div class="text-red-600 dark:text-red-400 mb-4">
            <svg
              class="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h3 class="text-lg font-medium mb-2">Failed to load CAT tokens</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {{ error?.message || 'An unknown error occurred.' }}
            </p>
            <button
              @click="refetchTickers"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div
          v-if="filteredTokens.length > 0"
          class="hidden md:block overflow-x-auto"
          @scroll="handleScroll"
        >
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Ticker
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Symbol
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Asset ID
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="token in paginatedTokens"
                :key="token.assetId"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <div class="font-medium">{{ token.ticker }}</div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>{{ token.name }}</div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>{{ token.symbol }}</div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <button
                    @click="copyAssetId(token.assetId)"
                    class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[200px] sm:max-w-[250px]"
                    :title="isCopied === token.assetId ? 'Copied!' : 'Click to copy asset ID'"
                    :class="{
                      'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300':
                        isCopied === token.assetId,
                      'hover:scale-105': isCopied !== token.assetId,
                    }"
                  >
                    <span
                      class="transition-all duration-300 truncate block"
                      :class="{
                        'animate-pulse': isCopied === token.assetId,
                      }"
                    >
                      {{ token.assetId.slice(0, 12) }}...
                    </span>
                    <div
                      v-if="isCopied === token.assetId"
                      class="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded"
                    ></div>
                  </button>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <div class="flex items-center space-x-1">
                    <button
                      @click="copyAssetId(token.assetId)"
                      class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      :title="`Copy ${token.assetId}`"
                    >
                      <i class="pi pi-copy text-sm"></i>
                    </button>
                    <button
                      @click="selectToken(token)"
                      class="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                      :title="`Use ${token.ticker} in offer`"
                    >
                      <i class="pi pi-check text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Infinite Scroll Loading -->
          <div
            v-if="hasMoreData || isLoadingMore"
            class="flex flex-col items-center justify-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2"
          >
            <div
              v-if="isLoadingMore"
              class="flex items-center space-x-2 text-gray-500 dark:text-gray-400"
            >
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span class="text-sm">Loading more tokens...</span>
            </div>
            <div v-else class="flex flex-col items-center space-y-2">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Showing {{ paginatedTokens.length }} of {{ filteredTokens.length }} tokens
              </div>
              <button
                @click="loadMoreTokens"
                class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Load More Tokens
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Card View -->
        <div v-if="filteredTokens.length > 0" class="md:hidden space-y-3">
          <div
            v-for="token in paginatedTokens"
            :key="token.assetId"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
          >
            <!-- Header with Ticker and Actions -->
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ token.ticker }}
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="copyAssetId(token.assetId)"
                  class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  :title="`Copy ${token.assetId}`"
                >
                  <i class="pi pi-copy text-sm"></i>
                </button>
                <button
                  @click="selectToken(token)"
                  class="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  :title="`Use ${token.ticker} in offer`"
                >
                  <i class="pi pi-check text-sm"></i>
                </button>
              </div>
            </div>

            <!-- Token Details -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Name:</span>
                <span class="text-gray-700 dark:text-gray-300">{{ token.name }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Symbol:</span>
                <span class="text-gray-600 dark:text-gray-400">{{ token.symbol }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Asset ID:</span>
                <button
                  @click="copyAssetId(token.assetId)"
                  class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden max-w-[150px]"
                  :title="isCopied === token.assetId ? 'Copied!' : 'Click to copy asset ID'"
                  :class="{
                    'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300':
                      isCopied === token.assetId,
                    'hover:scale-105': isCopied !== token.assetId,
                  }"
                >
                  <span
                    class="transition-all duration-300 truncate block"
                    :class="{
                      'animate-pulse': isCopied === token.assetId,
                    }"
                  >
                    {{ token.assetId.slice(0, 8) }}...
                  </span>
                  <div
                    v-if="isCopied === token.assetId"
                    class="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded"
                  ></div>
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Infinite Scroll Loading -->
          <div
            v-if="hasMoreData || isLoadingMore"
            class="flex flex-col items-center justify-center pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2"
          >
            <div
              v-if="isLoadingMore"
              class="flex items-center space-x-2 text-gray-500 dark:text-gray-400"
            >
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span class="text-sm">Loading more...</span>
            </div>
            <div v-else class="flex flex-col items-center space-y-2">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ paginatedTokens.length }} of {{ filteredTokens.length }} tokens
              </div>
              <button
                @click="loadMoreTokens"
                class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Load More
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg
              class="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              ></path>
            </svg>
            <h3 class="text-lg font-medium mb-2">No CAT tokens found</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {{
                searchQuery
                  ? 'Try adjusting your search terms'
                  : 'CAT token data will appear here once loaded from Dexie'
              }}
            </p>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              Clear Search
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTickerData } from '@/shared/composables/useTickerData'
  import { computed, ref } from 'vue'

  interface Emits {
    (
      e: 'token-selected',
      token: { assetId: string; ticker: string; name: string; symbol: string }
    ): void
  }

  const emit = defineEmits<Emits>()

  const { availableCatTokens, isLoading, isError, error, refetchTickers } = useTickerData()

  const searchQuery = ref('')
  const isCopied = ref('')
  const currentPage = ref(1)
  const itemsPerPage = 20
  const isLoadingMore = ref(false)

  // Computed properties
  const filteredTokens = computed(() => {
    if (!searchQuery.value.trim()) {
      return availableCatTokens.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return availableCatTokens.value.filter(
      token =>
        token.ticker.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.assetId.toLowerCase().includes(query)
    )
  })

  const paginatedTokens = computed(() => {
    const start = 0
    const end = currentPage.value * itemsPerPage
    return filteredTokens.value.slice(start, end)
  })

  const hasMoreData = computed(() => {
    return paginatedTokens.value.length < filteredTokens.value.length
  })

  // Methods

  const loadMoreTokens = async () => {
    if (isLoadingMore.value || !hasMoreData.value) return

    isLoadingMore.value = true

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    currentPage.value += 1
    isLoadingMore.value = false
  }

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
    isCopied.value = assetId

    // Hide animation after 2 seconds
    setTimeout(() => {
      isCopied.value = ''
    }, 2000)
  }

  const selectToken = (token: {
    assetId: string
    ticker: string
    name: string
    symbol: string
  }) => {
    emit('token-selected', token)
  }

  // Reset pagination when search changes
  const resetPagination = () => {
    currentPage.value = 1
  }

  // Infinite scroll handler
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight

    // Load more when user scrolls to bottom (with 100px threshold)
    if (
      scrollTop + clientHeight >= scrollHeight - 100 &&
      hasMoreData.value &&
      !isLoadingMore.value
    ) {
      loadMoreTokens()
    }
  }

  // Watch for search changes to reset pagination
  import { onMounted, onUnmounted, watch } from 'vue'
  watch(searchQuery, resetPagination)

  // Add scroll listener on mount
  onMounted(() => {
    // The scroll handler is now attached directly to the table container via @scroll
    // No need for manual event listener attachment
  })

  // Remove scroll listener on unmount
  onUnmounted(() => {
    // No manual cleanup needed since we're using @scroll directive
  })
</script>
