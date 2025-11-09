import { globalFilterStore } from '@/shared/stores/globalFilterStore'

export function useGlobalFilters() {
  return {
    // State
    sharedSearchValue: globalFilterStore.searchValue,
    sharedFilteredSuggestions: globalFilterStore.filteredSuggestions,
    sharedFilters: globalFilterStore.filters,
    hasActiveSharedFilters: globalFilterStore.hasActiveFilters,
    assetsSwapped: globalFilterStore.assetsSwapped,
    showFilterPane: globalFilterStore.showFilterPane,

    // Methods
    setSearchValue: globalFilterStore.setSearchValue.bind(globalFilterStore),
    setFilteredSuggestions: globalFilterStore.setFilteredSuggestions.bind(globalFilterStore),
    addFilter: globalFilterStore.addFilter.bind(globalFilterStore),
    removeFilter: globalFilterStore.removeFilter.bind(globalFilterStore),
    clearAllFilters: globalFilterStore.clearAllFilters.bind(globalFilterStore),
    swapBuySellAssets: globalFilterStore.swapBuySellAssets.bind(globalFilterStore),
    toggleFilterPane: globalFilterStore.toggleFilterPane.bind(globalFilterStore),
    setShowFilterPane: globalFilterStore.setShowFilterPane.bind(globalFilterStore),
    setDefaultFilter: globalFilterStore.setDefaultFilter.bind(globalFilterStore),
  }
}
