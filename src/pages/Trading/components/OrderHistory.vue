<template>
  <div>
    <!-- Filters Section -->
    <div class="px-2 py-1">
      <!-- Search Input -->
      <div class="relative">
        <InputText
          v-model="localSearchValue"
          placeholder="Search by asset or status... (AND logic - all selected must match)"
          class="w-full text-sm"
          @input="handleSearchChange"
        />
        <div
          v-if="filteredSuggestions.length > 0 && localSearchValue"
          class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="(suggestion, idx) in filteredSuggestions"
            :key="idx"
            @click="addFilter(suggestion.column, suggestion.value)"
            class="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm flex items-center justify-between"
          >
            <span>{{ suggestion.label }}</span>
            <span
              :class="[
                'text-xs px-2 py-0.5 rounded-full',
                suggestion.column === 'buyAsset'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : suggestion.column === 'sellAsset'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
              ]"
            >
              {{
                suggestion.column === 'buyAsset'
                  ? 'Buy'
                  : suggestion.column === 'sellAsset'
                    ? 'Sell'
                    : 'Status'
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Active Filters -->
      <div v-if="hasActiveFilters" class="space-y-2">
        <div
          v-for="(values, column) in filters"
          :key="column"
          v-show="values.length > 0"
          class="flex items-start gap-2"
        >
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize min-w-16">
            {{ column === 'buyAsset' ? 'Buy' : column === 'sellAsset' ? 'Sell' : 'Status' }}:
          </span>
          <div class="flex items-center gap-1 flex-wrap">
            <span
              v-for="value in values"
              :key="value"
              :class="[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                column === 'buyAsset'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : column === 'sellAsset'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
              ]"
            >
              {{ value }}
              <button
                @click="removeFilter(column, value)"
                class="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
            <button
              @click="clearFilters(column)"
              class="text-xs text-gray-500 hover:text-gray-400 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card overflow-hidden mt-1">
      <div
        class="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Order History</h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Showing {{ filteredTrades.length }} orders
        </div>
      </div>

      <!-- Fixed height table container -->
      <div class="relative table-container">
        <!-- Loading overlay for initial load -->
        <div
          v-if="loading && filteredTrades.length === 0"
          class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center z-10"
        >
          <div class="text-center">
            <ProgressSpinner size="32" />
            <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading orders...</div>
          </div>
        </div>

        <DataTable
          :value="filteredTrades"
          :loading="false"
          :paginator="false"
          :rows="rowsPerPage"
          :total-records="totalRecords"
          lazy
          @page="onPage"
          class="p-datatable-sm h-full"
          scrollable
          scroll-height="100%"
        >
          <Column field="id" header="ID" :sortable="false">
            <template #body="{ data }">
              <span class="text-gray-600 dark:text-gray-400">#{{ data.id }}</span>
            </template>
          </Column>

          <Column header="Sell Side" :sortable="false">
            <template #body="{ data }">
              <div class="space-y-1">
                <div
                  v-for="(asset, idx) in data.sellAssets"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <span
                    class="px-2 py-0.5 bg-red-100 dark:bg-red-900 bg-opacity-50 dark:bg-opacity-30 text-red-700 dark:text-red-400 rounded text-xs font-mono"
                  >
                    {{ getTickerSymbol(asset.id) }}
                  </span>
                  <span class="text-red-600 dark:text-red-400">{{
                    (asset.amount || 0).toFixed(6)
                  }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Buy Side" :sortable="false">
            <template #body="{ data }">
              <div class="space-y-1">
                <div
                  v-for="(asset, idx) in data.buyAssets"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <span
                    class="px-2 py-0.5 bg-green-100 dark:bg-green-900 bg-opacity-50 dark:bg-opacity-30 text-green-700 dark:text-green-400 rounded text-xs font-mono"
                  >
                    {{ getTickerSymbol(asset.id) }}
                  </span>
                  <span class="text-green-600 dark:text-green-400">{{
                    (asset.amount || 0).toFixed(6)
                  }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column field="status" header="Status" :sortable="false">
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="getStatusSeverity(data.status)"
                class="text-xs"
              />
            </template>
          </Column>

          <Column field="maker" header="Maker" :sortable="false">
            <template #body="{ data }">
              <span class="text-gray-600 dark:text-gray-400 font-mono text-sm">
                {{ data.maker }}
              </span>
            </template>
          </Column>

          <Column field="timestamp" header="Timestamp" :sortable="false">
            <template #body="{ data }">
              <span class="text-gray-600 dark:text-gray-400 text-sm">
                {{ data.timestamp }}
              </span>
            </template>
          </Column>
        </DataTable>

        <!-- Infinite scroll trigger -->
        <div
          ref="observerTarget"
          class="flex justify-center items-center py-2"
          v-if="hasMore && !loading && filteredTrades.length > 0"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400">Scroll to load more...</div>
        </div>

        <!-- Loading indicator for infinite scroll -->
        <div
          v-if="loading && filteredTrades.length > 0"
          class="flex justify-center items-center py-2"
        >
          <ProgressSpinner size="20" />
          <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more orders...</span>
        </div>

        <!-- No more data indicator -->
        <div
          v-if="!hasMore && filteredTrades.length > 0"
          class="text-center py-2 text-gray-500 dark:text-gray-400 text-sm"
        >
          No more orders to load
        </div>

        <!-- Empty state - No orders available -->
        <div
          v-if="!loading && filteredTrades.length === 0 && !hasMore"
          class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
        >
          <div class="text-center">
            <div class="text-lg mb-2">No orders available</div>
            <div class="text-sm">There are currently no orders in the system</div>
          </div>
        </div>

        <!-- Empty state - No orders match filters -->
        <div
          v-if="!loading && filteredTrades.length === 0 && hasMore && hasActiveFilters"
          class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
        >
          <div class="text-center">
            <div class="text-lg mb-2">No orders match your filters</div>
            <div class="text-sm">Try adjusting your search criteria or clear filters</div>
            <button
              @click="clearAllFilters"
              class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import InputText from 'primevue/inputtext'
  import ProgressSpinner from 'primevue/progressspinner'
  import Tag from 'primevue/tag'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useTickerMapping } from '@/shared/composables/useTickerMapping'

  interface Trade {
    id: string
    sellAssets: Array<{ id: string; code: string; name: string; amount: number }>
    buyAssets: Array<{ id: string; code: string; name: string; amount: number }>
    status: string
    maker: string
    timestamp: string
    date_found: string
    date_completed?: string | null
    date_pending?: string | null
    date_expiry?: string | null
    known_taker?: unknown | null
  }

  interface Props {
    trades: Trade[]
    loading: boolean
    hasMore: boolean
    filters: {
      buyAsset: string[]
      sellAsset: string[]
      status: string[]
    }
    searchValue: string
    filteredSuggestions: Array<{
      value: string
      column: string
      label: string
    }>
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'load-more': []
    'update-filters': [filters: Record<string, string[]>]
    'update-search': [value: string]
    'add-filter': [column: string, value: string]
    'remove-filter': [column: string, value: string]
    'clear-filters': [column: string]
  }>()

  // Services
  const { getTickerSymbol } = useTickerMapping()

  // Local state
  const localSearchValue = ref(props.searchValue)
  const rowsPerPage = 20
  const totalRecords = computed(() => props.trades.length)

  // Constants
  const statusOptions = ['Open', 'Filled', 'Cancelled', 'Partial']

  // Computed
  const hasActiveFilters = computed(() => {
    return Object.values(props.filters).some(f => f.length > 0)
  })

  const filteredTrades = computed(() => {
    return props.trades.filter(trade => {
      // For buy assets: trade must contain ALL selected buy assets
      const buyMatch =
        props.filters.buyAsset.length === 0 ||
        props.filters.buyAsset.every(filterAsset =>
          trade.buyAssets.some(tradeAsset => getTickerSymbol(tradeAsset.id) === filterAsset)
        )

      // For sell assets: trade must contain ALL selected sell assets
      const sellMatch =
        props.filters.sellAsset.length === 0 ||
        props.filters.sellAsset.every(filterAsset =>
          trade.sellAssets.some(tradeAsset => getTickerSymbol(tradeAsset.id) === filterAsset)
        )

      // For status: trade status must match one of selected statuses
      const statusMatch =
        props.filters.status.length === 0 || props.filters.status.includes(trade.status)

      return buyMatch && sellMatch && statusMatch
    })
  })

  const filteredSuggestions = computed(() => {
    if (!localSearchValue.value) return []
    const lowerSearch = localSearchValue.value.toLowerCase()
    const suggestions: Array<{ value: string; column: string; label: string }> = []

    // Get unique assets from the actual trade data
    const allAssets = new Set<string>()

    // Collect all unique asset codes from sell and buy assets
    props.trades.forEach(trade => {
      trade.sellAssets.forEach(asset => {
        const tickerSymbol = getTickerSymbol(asset.id)
        if (tickerSymbol) {
          allAssets.add(tickerSymbol)
        }
      })
      trade.buyAssets.forEach(asset => {
        const tickerSymbol = getTickerSymbol(asset.id)
        if (tickerSymbol) {
          allAssets.add(tickerSymbol)
        }
      })
    })

    // Generate suggestions from real data
    allAssets.forEach(tickerSymbol => {
      if (tickerSymbol.toLowerCase().includes(lowerSearch)) {
        if (!props.filters.buyAsset.includes(tickerSymbol)) {
          suggestions.push({
            value: tickerSymbol,
            column: 'buyAsset',
            label: `Buy ${tickerSymbol}`,
          })
        }
        if (!props.filters.sellAsset.includes(tickerSymbol)) {
          suggestions.push({
            value: tickerSymbol,
            column: 'sellAsset',
            label: `Sell ${tickerSymbol}`,
          })
        }
      }
    })

    statusOptions.forEach(status => {
      if (status.toLowerCase().includes(lowerSearch) && !props.filters.status.includes(status)) {
        suggestions.push({ value: status, column: 'status', label: status })
      }
    })

    return suggestions
  })

  // Methods
  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'Open':
        return 'success'
      case 'Filled':
        return 'info'
      case 'Cancelled':
        return 'danger'
      case 'Partial':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const handleSearchChange = () => {
    emit('update-search', localSearchValue.value)
  }

  const addFilter = (column: string, value: string) => {
    emit('add-filter', column, value)
    localSearchValue.value = ''
  }

  const removeFilter = (column: string, value: string) => {
    emit('remove-filter', column, value)
  }

  const clearFilters = (column: string) => {
    emit('clear-filters', column)
  }

  const clearAllFilters = () => {
    // Clear all filter columns
    Object.keys(props.filters).forEach(column => {
      emit('clear-filters', column)
    })
  }

  const onPage = (event: { page: number; rows: number }) => {
    // For infinite scroll, we don't use traditional pagination
    // Instead, we load more data when scrolling to the bottom
    void event // Suppress unused parameter warning
  }

  // Intersection Observer for infinite loading
  const observerTarget = ref<HTMLElement>()
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (observerTarget.value && props.hasMore) {
      observer = new IntersectionObserver(
        entries => {
          if (
            entries[0].isIntersecting &&
            props.hasMore &&
            !props.loading &&
            props.trades.length > 0
          ) {
            emit('load-more')
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px', // Start loading 50px before the element comes into view
        }
      )
      observer.observe(observerTarget.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  // Watch for observer target changes
  watch(observerTarget, newTarget => {
    if (newTarget && observer && props.hasMore && props.trades.length > 0) {
      observer.disconnect()
      observer.observe(newTarget)
    }
  })

  // Watch for prop changes
  watch(
    () => props.searchValue,
    newValue => {
      localSearchValue.value = newValue
    }
  )
</script>

<style scoped>
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }

  /* DataTable base styling */
  :deep(.p-datatable) {
    @apply bg-transparent;
  }

  :deep(.p-datatable-wrapper) {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
  }

  :deep(.p-datatable-table) {
    @apply bg-white dark:bg-gray-800;
  }

  /* Header styling */
  :deep(.p-datatable-header) {
    @apply bg-transparent border-none p-4;
  }

  :deep(.p-datatable-thead) {
    @apply bg-gray-50 dark:bg-gray-700;
  }

  :deep(.p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-3;
  }

  /* Body styling */
  :deep(.p-datatable-tbody) {
    @apply bg-white dark:bg-gray-800;
  }

  :deep(.p-datatable-tbody > tr) {
    @apply border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800;
  }

  :deep(.p-datatable-tbody > tr:hover) {
    @apply bg-gray-50 dark:bg-gray-700;
  }

  :deep(.p-datatable-tbody > tr > td) {
    @apply border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-4 py-3;
  }

  /* Ensure hover state maintains proper background */
  :deep(.p-datatable-tbody > tr:hover > td) {
    @apply bg-gray-50 dark:bg-gray-700;
  }

  /* Footer styling */
  :deep(.p-datatable-footer) {
    @apply bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600;
  }

  /* Tag component dark mode */
  :deep(.p-tag) {
    @apply text-xs font-semibold;
  }

  :deep(.p-tag.p-tag-success) {
    @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300;
  }

  :deep(.p-tag.p-tag-info) {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300;
  }

  :deep(.p-tag.p-tag-danger) {
    @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300;
  }

  :deep(.p-tag.p-tag-warning) {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300;
  }

  :deep(.p-tag.p-tag-secondary) {
    @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300;
  }

  /* Dark mode for dropdown suggestions */
  :deep(.p-dropdown-panel) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-dropdown-item) {
    @apply text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600;
  }

  /* Dark mode for input fields */
  :deep(.p-inputtext) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
  }

  :deep(.p-inputtext:focus) {
    @apply border-primary-500 dark:border-primary-400 ring-primary-500 dark:ring-primary-400;
  }

  /* Dark mode for loading spinner */
  :deep(.p-progress-spinner-circle) {
    @apply stroke-primary-500 dark:stroke-primary-400;
  }

  /* Prevent scroll conflicts */
  :deep(.p-datatable .p-datatable-wrapper) {
    @apply bg-white dark:bg-gray-800 !important;
    overflow: visible !important;
  }

  :deep(.p-datatable .p-datatable-scrollable-wrapper) {
    overflow: visible !important;
  }

  :deep(.p-datatable .p-datatable-scrollable-body) {
    overflow: visible !important;
  }

  /* Ensure proper scrolling behavior */
  .card {
    overflow: visible !important;
  }

  :deep(.p-datatable .p-datatable-table) {
    @apply bg-white dark:bg-gray-800 !important;
  }

  :deep(.p-datatable .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-700 !important;
    @apply text-gray-700 dark:text-gray-300 !important;
    @apply border-gray-200 dark:border-gray-600 !important;
  }

  :deep(.p-datatable .p-datatable-tbody > tr) {
    @apply bg-white dark:bg-gray-800 !important;
    @apply border-gray-200 dark:border-gray-600 !important;
  }

  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    @apply bg-white dark:bg-gray-800 !important;
    @apply text-gray-900 dark:text-gray-100 !important;
    @apply border-gray-200 dark:border-gray-600 !important;
  }

  :deep(.p-datatable .p-datatable-tbody > tr:hover) {
    @apply bg-gray-50 dark:bg-gray-700 !important;
  }

  :deep(.p-datatable .p-datatable-tbody > tr:hover > td) {
    @apply bg-gray-50 dark:bg-gray-700 !important;
  }

  /* Responsive table container */
  .table-container {
    height: 60vh;
    min-height: 400px;
    max-height: 800px;
  }

  @media (max-width: 768px) {
    .table-container {
      height: 50vh;
      min-height: 300px;
      max-height: 600px;
    }
  }

  @media (max-width: 480px) {
    .table-container {
      height: 40vh;
      min-height: 250px;
      max-height: 500px;
    }
  }
</style>
