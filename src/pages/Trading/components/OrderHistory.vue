<template>
  <div>
    <!-- Orders Table -->
    <div class="card overflow-hidden mt-1">
      <div
        class="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Offer History</h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Showing {{ filteredTrades.length }} offers
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
              <button
                @click="showOrderDetails(data)"
                class="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer transition-colors duration-200 font-mono"
                :title="`Click for details: ${data.id}`"
              >
                #{{ data.id.slice(0, 8) }}...
              </button>
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
          v-if="hasMore && !loading && !isLoadingMore && filteredTrades.length > 0"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400">Scroll to load more offers...</div>
        </div>

        <!-- Loading indicator for infinite scroll -->
        <div
          v-if="(loading || isLoadingMore) && filteredTrades.length > 0 && hasMore"
          class="flex justify-center items-center py-2"
        >
          <ProgressSpinner size="20" />
          <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more offers...</span>
        </div>

        <!-- No more data indicator -->
        <div
          v-if="!hasMore && filteredTrades.length > 0"
          class="text-center py-2 text-gray-500 dark:text-gray-400 text-sm"
        >
          No more offers to load
        </div>

        <!-- Empty state - No offers available -->
        <div
          v-if="!loading && filteredTrades.length === 0 && !hasMore"
          class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
        >
          <div class="text-center">
            <div class="text-lg mb-2">No offers available</div>
            <div class="text-sm">There are currently no offers in the system</div>
          </div>
        </div>

        <!-- Empty state - No offers match filters -->
        <div
          v-if="!loading && filteredTrades.length === 0 && hasMore && hasActiveFilters"
          class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
        >
          <div class="text-center">
            <div class="text-lg mb-2">No offers match your filters</div>
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

    <!-- Order Details Modal -->
    <Dialog
      v-model:visible="showDetailsModal"
      modal
      header="Order Details"
      :style="{ width: '90vw', maxWidth: '600px' }"
      class="p-fluid order-details-modal"
    >
      <div v-if="selectedOrder" class="space-y-4">
        <!-- Order ID -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Order ID</label
          >
          <div
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          >
            {{ selectedOrder.id }}
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Status</label
          >
          <Tag
            :value="selectedOrder.status"
            :severity="getStatusSeverity(selectedOrder.status)"
            class="text-sm"
          />
        </div>

        <!-- Sell Side -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Sell Side</label
          >
          <div class="space-y-2">
            <div
              v-for="(asset, idx) in selectedOrder.sellAssets"
              :key="idx"
              class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-mono border border-red-200 dark:border-red-700"
                >
                  {{ getTickerSymbol(asset.id) }}
                </span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                  asset.type?.toUpperCase() || 'Unknown'
                }}</span>
              </div>
              <span class="text-red-600 dark:text-red-400 font-mono font-semibold">
                {{ (asset.amount || 0).toFixed(6) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Buy Side -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Buy Side</label
          >
          <div class="space-y-2">
            <div
              v-for="(asset, idx) in selectedOrder.buyAssets"
              :key="idx"
              class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-mono border border-green-200 dark:border-green-700"
                >
                  {{ getTickerSymbol(asset.id) }}
                </span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{
                  asset.type?.toUpperCase() || 'Unknown'
                }}</span>
              </div>
              <span class="text-green-600 dark:text-green-400 font-mono font-semibold">
                {{ (asset.amount || 0).toFixed(6) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Maker -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Maker</label
          >
          <div
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100 break-all border border-gray-200 dark:border-gray-600"
          >
            {{ selectedOrder.maker }}
          </div>
        </div>

        <!-- Timestamp -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Timestamp</label
          >
          <div
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
          >
            {{ selectedOrder.timestamp }}
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import Dialog from 'primevue/dialog'
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
  const showDetailsModal = ref(false)
  const selectedOrder = ref<Trade | null>(null)
  const isLoadingMore = ref(false)
  const rowsPerPage = 20
  const totalRecords = computed(() => props.trades.length)

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
          trade.buyAssets.some(
            tradeAsset => getTickerSymbol(tradeAsset.id).toLowerCase() === filterAsset.toLowerCase()
          )
        )

      // For sell assets: trade must contain ALL selected sell assets
      const sellMatch =
        props.filters.sellAsset.length === 0 ||
        props.filters.sellAsset.every(filterAsset =>
          trade.sellAssets.some(
            tradeAsset => getTickerSymbol(tradeAsset.id).toLowerCase() === filterAsset.toLowerCase()
          )
        )

      // For status: trade status must match one of selected statuses
      const statusMatch =
        props.filters.status.length === 0 || props.filters.status.includes(trade.status)

      return buyMatch && sellMatch && statusMatch
    })
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

  const showOrderDetails = (order: Trade) => {
    selectedOrder.value = order
    showDetailsModal.value = true
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
            !isLoadingMore.value &&
            props.trades.length > 0
          ) {
            isLoadingMore.value = true
            emit('load-more')
            // Reset loading state after a short delay to prevent rapid firing
            setTimeout(() => {
              isLoadingMore.value = false
            }, 1000)
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

  /* Dialog dark mode styling */
  :deep(.p-dialog) {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
  }

  :deep(.p-dialog-header) {
    @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
  }

  :deep(.p-dialog-title) {
    @apply text-gray-900 dark:text-gray-100 font-semibold;
  }

  :deep(.p-dialog-content) {
    @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100;
  }

  :deep(.p-dialog-footer) {
    @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
  }

  :deep(.p-dialog-close-icon) {
    @apply text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200;
  }

  /* Dialog backdrop */
  :deep(.p-dialog-mask) {
    @apply bg-black/50;
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
