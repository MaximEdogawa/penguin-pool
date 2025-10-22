<template>
  <div>
    <!-- Filters Section -->
    <div class="card p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filters</h2>

      <!-- Search Input -->
      <div class="relative mb-4">
        <InputText
          v-model="localSearchValue"
          placeholder="Search by asset or status... (AND logic - all selected must match)"
          class="w-full"
          @input="handleSearchChange"
        />
        <div
          v-if="filteredSuggestions.length > 0 && localSearchValue"
          class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div
            v-for="(suggestion, idx) in filteredSuggestions"
            :key="idx"
            @click="addFilter(suggestion.column, suggestion.value)"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm flex items-center justify-between"
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
      <div v-if="hasActiveFilters" class="space-y-3">
        <div
          v-for="(values, column) in filters"
          :key="column"
          v-show="values.length > 0"
          class="flex items-start gap-2"
        >
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize min-w-20">
            {{ column === 'buyAsset' ? 'Buy' : column === 'sellAsset' ? 'Sell' : 'Status' }}:
          </span>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-for="value in values"
              :key="value"
              :class="[
                'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm',
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
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <DataTable
          :value="filteredTrades"
          :loading="loading"
          :paginator="false"
          :rows="rowsPerPage"
          :total-records="totalRecords"
          lazy
          @page="onPage"
          class="p-datatable-sm"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Order History</h3>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Showing {{ filteredTrades.length }} orders
              </div>
            </div>
          </template>

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
                    {{ asset.asset }}
                  </span>
                  <span class="text-red-600 dark:text-red-400">{{ asset.amount }}</span>
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
                    {{ asset.asset }}
                  </span>
                  <span class="text-green-600 dark:text-green-400">{{ asset.amount }}</span>
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
      </div>

      <!-- Loading indicator -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <ProgressSpinner size="32" />
      </div>

      <!-- No more data indicator -->
      <div
        v-if="!hasMore && filteredTrades.length > 0"
        class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm"
      >
        No more data to load
      </div>

      <!-- No results indicator -->
      <div
        v-if="!loading && filteredTrades.length === 0"
        class="text-center py-12 text-gray-500 dark:text-gray-400"
      >
        No results found. Try adjusting your filters.
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
  import { computed, onMounted, ref, watch } from 'vue'

  interface Trade {
    id: number
    sellAssets: Array<{ asset: string; amount: string }>
    buyAssets: Array<{ asset: string; amount: string }>
    status: string
    maker: string
    timestamp: string
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

  // Local state
  const localSearchValue = ref(props.searchValue)
  const rowsPerPage = 20
  const totalRecords = computed(() => props.trades.length)

  // Constants
  const availableAssets = ['XCH', 'BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'MATIC', 'AVAX', 'LINK']
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
          trade.buyAssets.some(tradeAsset => tradeAsset.asset === filterAsset)
        )

      // For sell assets: trade must contain ALL selected sell assets
      const sellMatch =
        props.filters.sellAsset.length === 0 ||
        props.filters.sellAsset.every(filterAsset =>
          trade.sellAssets.some(tradeAsset => tradeAsset.asset === filterAsset)
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
    const suggestions = []

    availableAssets.forEach(asset => {
      if (asset.toLowerCase().includes(lowerSearch)) {
        if (!props.filters.buyAsset.includes(asset)) {
          suggestions.push({ value: asset, column: 'buyAsset', label: `Buy ${asset}` })
        }
        if (!props.filters.sellAsset.includes(asset)) {
          suggestions.push({ value: asset, column: 'sellAsset', label: `Sell ${asset}` })
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

  const onPage = (event: { page: number; rows: number }) => {
    // Handle pagination if needed
    // Could implement pagination logic here if needed
    void event // Suppress unused parameter warning
  }

  // Intersection Observer for infinite loading
  const observerTarget = ref<HTMLElement>()

  onMounted(() => {
    if (observerTarget.value) {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && props.hasMore && !props.loading) {
            emit('load-more')
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(observerTarget.value)
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

  /* Force DataTable styling with higher specificity */
  :deep(.p-datatable .p-datatable-wrapper) {
    @apply bg-white dark:bg-gray-800 !important;
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
</style>
