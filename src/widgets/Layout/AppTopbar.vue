<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button
        class="layout-menu-button layout-topbar-action"
        @click="toggleMenu"
        :title="layoutState.staticMenuMobileActive ? 'Hide sidebar' : 'Show sidebar'"
      >
        <i class="pi pi-bars"></i>
      </button>
    </div>

    <!-- Global Search Bar (visible on all pages) -->
    <div class="layout-topbar-center flex-1">
      <div class="flex items-center gap-3 w-full">
        <!-- Asset Swap Button -->
        <button
          @click="swapBuySellAssets"
          class="layout-topbar-action"
          :title="assetsSwapped ? 'Revert to normal view' : 'Swap buy and sell assets'"
        >
          <i class="pi pi-arrow-right-arrow-left"></i>
        </button>

        <!-- Search Input - Centered -->
        <div class="search-container">
          <input
            :value="sharedSearchValue"
            @input="handleSearchInput"
            placeholder="Search by asset..."
            class="search-input"
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

        <!-- Filter Toggle Button -->
        <button
          @click="toggleFilterPane"
          class="layout-topbar-action m-4"
          :title="showFilterPane ? 'Hide filter pane' : 'Show filter pane'"
        >
          <i :class="hasActiveFilters ? 'pi pi-filter-fill' : 'pi pi-filter'"></i>
        </button>
      </div>
    </div>

    <div class="layout-topbar-actions">
      <!-- Notifications -->
      <button
        type="button"
        class="layout-topbar-action"
        @click="toggleNotifications"
        aria-label="Notifications"
      >
        <i class="pi pi-bell"></i>
        <span v-if="notificationCount > 0" class="notification-badge">
          {{ notificationCount }}
        </span>
      </button>

      <!-- Theme toggle -->
      <button type="button" class="layout-topbar-action" @click="handleThemeToggle">
        <i :class="themeIcon"></i>
      </button>

      <!-- Config menu -->
      <div class="layout-config-menu">
        <button
          type="button"
          class="layout-topbar-action layout-topbar-action-highlight"
          @click="toggleConfigPanel"
        >
          <i class="pi pi-palette text-gray-600 dark:text-gray-300"></i>
        </button>
        <div v-show="isConfigPanelVisible" class="config-panel-overlay">
          <AppConfigurator />
        </div>
      </div>

      <!-- User menu -->
      <button class="layout-topbar-menu-button layout-topbar-action" @click="toggleUserMenu">
        <i class="pi pi-ellipsis-v"></i>
      </button>

      <div class="layout-topbar-menu" v-show="isUserMenuVisible">
        <div class="layout-topbar-menu-content">
          <button type="button" class="layout-topbar-action" @click="goToProfile">
            <i class="pi pi-user"></i>
            <span>Profile</span>
          </button>
          <button type="button" class="layout-topbar-action" @click="handleLogout">
            <i class="pi pi-sign-out"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useNotificationStore } from '@/features/notifications/store/notificationStore'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import { globalFilterStore } from '@/shared/stores/globalFilterStore'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AppConfigurator from './AppConfigurator.vue'
  import { useLayout } from './composables/layout'

  const router = useRouter()
  const themeStore = useThemeStore()
  const notificationStore = useNotificationStore()
  const { toggleMenu, layoutState } = useLayout()

  // Use global filter store
  const hasActiveFilters = globalFilterStore.hasActiveFilters
  const sharedSearchValue = globalFilterStore.searchValue
  const sharedFilteredSuggestions = globalFilterStore.filteredSuggestions
  const assetsSwapped = globalFilterStore.assetsSwapped
  const showFilterPane = globalFilterStore.showFilterPane

  // Trading methods
  const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    globalFilterStore.setSearchValue(target.value)
    // Emit event to parent component for search handling
    window.dispatchEvent(
      new CustomEvent('global-search-change', {
        detail: { value: target.value },
      })
    )
  }

  const addSharedFilter = (column: string, value: string) => {
    globalFilterStore.addFilter(column, value)
    // Emit event to parent component to handle the filter addition
    window.dispatchEvent(
      new CustomEvent('global-filter-added', {
        detail: { column, value },
      })
    )
  }

  const swapBuySellAssets = () => {
    globalFilterStore.swapBuySellAssets()
    // Emit event to parent component to handle the swap
    window.dispatchEvent(new CustomEvent('global-assets-swapped'))
  }

  const toggleFilterPane = () => {
    globalFilterStore.toggleFilterPane()
    // Emit event to parent component
    window.dispatchEvent(
      new CustomEvent('global-filter-pane-toggle', {
        detail: { show: globalFilterStore.showFilterPane.value },
      })
    )
  }

  // Initialize global filter store
  onMounted(() => {
    globalFilterStore.initialize()
  })

  onMounted(async () => {
    try {
      await themeStore.initializeTheme()
    } catch {
      // Failed to initialize theme store
    }
  })

  const isUserMenuVisible = ref(false)
  const isConfigPanelVisible = ref(false)
  const isThemeToggle = ref(false)

  const themeIcon = computed(() => {
    if (themeStore.isWindows95) {
      return 'pi pi-desktop'
    }
    return themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'
  })

  const notificationCount = computed(() => {
    return notificationStore.unreadCount
  })

  const handleThemeToggle = () => {
    isThemeToggle.value = !isThemeToggle.value
    themeStore.setBuiltInTheme(isThemeToggle.value ? 'light' : 'dark')
  }

  const toggleNotifications = () => {
    // Toggle notifications panel or show notification list
    // TODO: Implement notifications functionality
  }

  const toggleConfigPanel = () => {
    isConfigPanelVisible.value = !isConfigPanelVisible.value
  }

  const toggleUserMenu = () => {
    isUserMenuVisible.value = !isUserMenuVisible.value
  }

  const goToProfile = () => {
    router.push('/profile')
    isUserMenuVisible.value = false
  }

  const handleLogout = async () => {
    try {
      const userStore = useUserStore()
      // Logging out user
      await userStore.logout()
      isUserMenuVisible.value = false
      // Logout completed, redirecting to auth
      await router.push('/auth')
    } catch {
      // Logout failed
    }
  }
</script>

<style scoped>
  .layout-topbar {
    @apply fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
    height: 3rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    transition: left 0.2s;
  }

  .layout-topbar-center {
    @apply flex items-center justify-center w-full;
    flex: 1;
    margin: 0 auto;
    min-width: 0; /* Allow flex item to shrink below content size */
    transition: margin-left 0.2s; /* Smooth transition when sidebar opens/closes */
    position: relative;
    z-index: 10;
  }

  .layout-topbar-center .layout-topbar-action {
    @apply w-auto h-auto p-1 flex-shrink-0;
  }

  .layout-topbar-center .flex-1 {
    min-width: 0; /* Allow search input to shrink */
    max-width: none; /* Remove max width constraint for more flexibility */
    flex-grow: 1; /* Allow it to grow and take available space */
  }

  /* Responsive adjustments for sidebar states */
  @media (min-width: 1024px) {
    .layout-topbar-center {
      margin: 0 auto; /* Center on page */
      max-width: 600px; /* Wider for better search experience */
    }

    .sidebar-collapsed .layout-topbar-center {
      margin: 0 auto; /* Center on page */
      max-width: 800px; /* Even wider when sidebar is collapsed */
    }
  }

  @media (max-width: 1200px) and (min-width: 1024px) {
    .layout-topbar-center {
      margin: 0 auto; /* Center on page */
      max-width: 500px; /* Wider on medium screens */
    }

    .sidebar-collapsed .layout-topbar-center {
      margin: 0 auto; /* Center on page */
      max-width: 700px; /* Wider when sidebar is collapsed */
    }
  }

  @media (max-width: 1023px) {
    .layout-topbar-center {
      margin: 0 auto; /* Keep centered on mobile */
      max-width: none; /* Allow full width on mobile */
    }
  }

  .layout-topbar-actions {
    @apply flex items-center gap-2;
    margin-left: auto;
  }

  .layout-topbar-action {
    @apply inline-flex justify-center items-center rounded-full w-6 h-6 text-gray-600 dark:text-gray-300 transition-all duration-200 cursor-pointer;
    position: relative;
  }

  .layout-topbar-action:hover {
    @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100;
  }

  .layout-topbar-action-highlight {
    @apply bg-primary-500 text-white;
  }

  .layout-topbar-action-highlight:hover {
    @apply bg-primary-600 text-white;
  }

  .layout-menu-button {
    margin-right: 0.5rem;
  }

  .layout-topbar-menu-button {
    display: none;
  }

  .layout-topbar-menu {
    @apply absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg;
    transform-origin: top;
    right: 2rem;
    top: 4rem;
    min-width: 15rem;
    padding: 1rem;
    z-index: 1000;
  }

  .layout-topbar-menu-content {
    @apply flex flex-col gap-2;
  }

  .layout-topbar-menu .layout-topbar-action {
    @apply w-full h-auto justify-start rounded-lg px-3 py-2;
  }

  .layout-topbar-menu .layout-topbar-action i {
    @apply mr-2;
  }

  .layout-topbar-menu .layout-topbar-action span {
    @apply font-medium;
  }

  .notification-badge {
    @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold;
  }

  .layout-config-menu {
    @apply flex gap-2 relative;
  }

  .config-panel-overlay {
    @apply absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg;
    transform-origin: top;
    right: 0;
    top: 4rem;
    min-width: 20rem;
    padding: 1rem;
    z-index: 1000;
  }

  /* Responsive */
  @media (max-width: 1023px) {
    .layout-topbar {
      padding: 0 1rem;
      z-index: 60; /* Ensure it's above sidebar */
    }

    .layout-topbar-logo-container {
      width: auto;
    }

    .layout-menu-button {
      margin-left: 0;
      margin-right: 0.5rem;
      display: inline-flex !important; /* Always show burger menu on mobile */
    }

    .layout-topbar-menu-button {
      display: inline-flex;
    }

    .layout-topbar-center {
      display: flex !important; /* Show search bar on mobile */
      flex: 1;
      margin: 0 auto; /* Center on mobile */
    }

    .layout-topbar-center .flex-1 {
      max-width: none; /* Remove max-width constraint on mobile */
    }

    .layout-topbar-logo span {
      display: none; /* Hide logo text on mobile */
    }
  }

  @media (max-width: 768px) {
    .layout-topbar {
      padding: 0 0.75rem;
    }

    .layout-topbar-logo-container {
      width: auto;
    }

    .layout-menu-button {
      margin-right: 0.5rem;
    }

    .layout-topbar-center {
      margin: 0 auto; /* Keep centered on smaller screens */
      max-width: none; /* Allow full width */
    }

    .layout-topbar-center .flex-1 {
      max-width: none; /* Ensure search input takes available space */
    }
  }

  .search-container {
    @apply relative w-full max-w-4xl;
    height: 2rem;
  }

  .search-input {
    @apply w-full h-full pl-4 pr-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200;
  }
</style>
