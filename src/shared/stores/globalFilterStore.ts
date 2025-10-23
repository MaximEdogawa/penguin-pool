import type { FilterState, SuggestionItem } from '@/pages/Trading/types'
import { computed, reactive } from 'vue'

export interface GlobalFilterState {
  searchValue: string
  filteredSuggestions: SuggestionItem[]
  filters: FilterState
  assetsSwapped: boolean
  showFilterPane: boolean
}

class GlobalFilterStore {
  private state = reactive<GlobalFilterState>({
    searchValue: '',
    filteredSuggestions: [],
    filters: {
      buyAsset: [],
      sellAsset: [],
      status: [],
    },
    assetsSwapped: false,
    showFilterPane: false,
  })

  // Computed properties
  get hasActiveFilters() {
    return computed(() => {
      return Object.values(this.state.filters).some(f => f && f.length > 0)
    })
  }

  get searchValue() {
    return computed(() => this.state.searchValue)
  }

  get filteredSuggestions() {
    return computed(() => this.state.filteredSuggestions)
  }

  get filters() {
    return computed(() => this.state.filters)
  }

  get assetsSwapped() {
    return computed(() => this.state.assetsSwapped)
  }

  get showFilterPane() {
    return computed(() => this.state.showFilterPane)
  }

  // Methods
  setSearchValue(value: string) {
    this.state.searchValue = value
    this.saveToLocalStorage()
  }

  setFilteredSuggestions(suggestions: SuggestionItem[]) {
    this.state.filteredSuggestions = suggestions
  }

  addFilter(column: string, value: string) {
    if (
      column === 'buyAsset' &&
      !this.state.filters.buyAsset.some(filter => filter.toLowerCase() === value.toLowerCase())
    ) {
      this.state.filters.buyAsset.push(value)
    } else if (
      column === 'sellAsset' &&
      !this.state.filters.sellAsset.some(filter => filter.toLowerCase() === value.toLowerCase())
    ) {
      this.state.filters.sellAsset.push(value)
    } else if (
      column === 'status' &&
      !(
        this.state.filters.status?.some(filter => filter.toLowerCase() === value.toLowerCase()) ??
        false
      )
    ) {
      if (!this.state.filters.status) {
        this.state.filters.status = []
      }
      this.state.filters.status.push(value)
    }
    this.state.searchValue = ''
    this.state.filteredSuggestions = []
    this.saveToLocalStorage()
  }

  removeFilter(column: keyof FilterState, value: string) {
    if (column === 'buyAsset') {
      const index = this.state.filters.buyAsset.findIndex(
        filter => filter.toLowerCase() === value.toLowerCase()
      )
      if (index > -1) {
        this.state.filters.buyAsset.splice(index, 1)
      }
    } else if (column === 'sellAsset') {
      const index = this.state.filters.sellAsset.findIndex(
        filter => filter.toLowerCase() === value.toLowerCase()
      )
      if (index > -1) {
        this.state.filters.sellAsset.splice(index, 1)
      }
    } else if (column === 'status' && this.state.filters.status) {
      const index = this.state.filters.status.findIndex(
        filter => filter.toLowerCase() === value.toLowerCase()
      )
      if (index > -1) {
        this.state.filters.status.splice(index, 1)
      }
    }
    this.saveToLocalStorage()
  }

  clearAllFilters() {
    this.state.filters.buyAsset = []
    this.state.filters.sellAsset = []
    this.state.filters.status = []
    this.saveToLocalStorage()
  }

  swapBuySellAssets() {
    // Swap the buy and sell asset arrays
    const tempBuyAssets = [...this.state.filters.buyAsset]
    const tempSellAssets = [...this.state.filters.sellAsset]

    this.state.filters.buyAsset = tempSellAssets
    this.state.filters.sellAsset = tempBuyAssets

    // Toggle the swap state
    this.state.assetsSwapped = !this.state.assetsSwapped

    this.saveToLocalStorage()
  }

  toggleFilterPane() {
    this.state.showFilterPane = !this.state.showFilterPane
  }

  setShowFilterPane(show: boolean) {
    this.state.showFilterPane = show
  }

  // Persistence methods
  private saveToLocalStorage() {
    try {
      const stateToSave = {
        filters: this.state.filters,
        searchValue: this.state.searchValue,
        assetsSwapped: this.state.assetsSwapped,
      }
      localStorage.setItem('globalFilterState', JSON.stringify(stateToSave))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save filter state to localStorage:', error)
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('globalFilterState')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.state.filters = parsed.filters || {
          buyAsset: [],
          sellAsset: [],
          status: [],
        }
        this.state.searchValue = parsed.searchValue || ''
        this.state.assetsSwapped = parsed.assetsSwapped || false
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load filter state from localStorage:', error)
    }
  }

  setDefaultFilter() {
    // Set default TXCH TBYC filter (buy TXCH, sell TBYC)
    this.state.filters.buyAsset = ['TXCH']
    this.state.filters.sellAsset = ['TBYC']
    this.saveToLocalStorage()
  }

  // Initialize the store
  initialize() {
    this.loadFromLocalStorage()

    // Set default filter if no filters are applied
    if (!this.hasActiveFilters.value) {
      this.setDefaultFilter()
    }
  }
}

// Export singleton instance
export const globalFilterStore = new GlobalFilterStore()
