<template>
  <div class="mb-2">
    <div class="px-1 py-1">
      <div class="flex items-center gap-2">
        <!-- Asset Swap Button -->
        <Button
          @click="swapBuySellAssets"
          :class="[
            'p-2 transition-colors',
            assetsSwapped
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
          ]"
          icon="pi pi-arrow-right-arrow-left"
          severity="secondary"
          size="small"
          :pt="{
            root: 'rounded-lg border-0',
          }"
          v-tooltip="assetsSwapped ? 'Revert to normal view' : 'Swap buy and sell assets'"
        />

        <!-- Search Input -->
        <div class="relative flex-1">
          <InputText
            :value="sharedSearchValue"
            @input="handleInputChange"
            placeholder="Search by asset... (AND logic - all selected assets must match)"
            class="w-full text-sm"
          />
          <div
            v-if="sharedFilteredSuggestions.length > 0 && sharedSearchValue"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <div
              v-for="(suggestion, idx) in sharedFilteredSuggestions"
              :key="idx"
              @click="addSharedFilter(suggestion.column, suggestion.value)"
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
                    ? assetsSwapped
                      ? 'Sell'
                      : 'Buy'
                    : suggestion.column === 'sellAsset'
                      ? assetsSwapped
                        ? 'Buy'
                        : 'Sell'
                      : 'Status'
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filters -->
    <div v-if="hasActiveSharedFilters" class="space-y-2 mt-2">
      <div
        v-for="(values, column) in sharedFilters"
        :key="column"
        v-show="values && values.length > 0"
        class="flex items-start gap-2"
      >
        <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
          {{ column === 'status' ? 'Status:' : '' }}
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="value in values"
            :key="value"
            :class="[
              'inline-flex items-center gap-1 px-2 py-1 rounded text-xs',
              column === 'buyAsset'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : column === 'sellAsset'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
            ]"
          >
            {{ value }}
            <button
              @click="removeSharedFilter(column as keyof FilterState, value)"
              class="hover:opacity-70 ml-1"
            >
              ×
            </button>
          </span>
        </div>
      </div>
      <button
        @click="clearAllSharedFilters"
        class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
      >
        Clear All Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { FilterState, SuggestionItem } from '@/pages/Trading/types'
  import Button from 'primevue/button'
  import InputText from 'primevue/inputtext'

  interface Props {
    sharedSearchValue: string
    sharedFilteredSuggestions: SuggestionItem[]
    sharedFilters: FilterState
    hasActiveSharedFilters: boolean
    assetsSwapped: boolean
  }

  interface Emits {
    (e: 'update:sharedSearchValue', value: string): void
    (e: 'handleSearchChange'): void
    (e: 'addSharedFilter', column: string, value: string): void
    (e: 'removeSharedFilter', column: keyof FilterState, value: string): void
    (e: 'clearAllSharedFilters'): void
    (e: 'swapBuySellAssets'): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const handleInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:sharedSearchValue', target.value)
    emit('handleSearchChange')
  }

  const addSharedFilter = (column: string, value: string) => {
    emit('addSharedFilter', column, value)
  }

  const removeSharedFilter = (column: keyof FilterState, value: string) => {
    emit('removeSharedFilter', column, value)
  }

  const clearAllSharedFilters = () => {
    emit('clearAllSharedFilters')
  }

  const swapBuySellAssets = () => {
    emit('swapBuySellAssets')
  }
</script>
