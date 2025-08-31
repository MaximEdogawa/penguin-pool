<template>
  <aside class="layout-sidebar" :class="{ 'mobile-mode': isMobileMode }">
    <div class="sidebar-content">
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span v-if="!isMobileMode" class="sidebar-title-text">Navigation</span>
        </div>
        <button
          @click="toggleSidebar"
          class="collapse-toggle"
          :title="isMobileMode ? 'Toggle sidebar' : 'Collapse sidebar'"
        >
          <i :class="collapseIcon" class="text-lg"></i>
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <ul class="nav-menu">
          <li class="nav-item">
            <router-link
              to="/dashboard"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/' || $route.path === '/dashboard' }"
            >
              <i class="pi pi-home nav-icon"></i>
              <span v-if="!isCollapsed" class="nav-label">Dashboard</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              to="/loans"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/loans' }"
            >
              <i class="pi pi-credit-card nav-icon"></i>
              <span v-if="!isCollapsed" class="nav-label">Loans</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              to="/offers"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/offers' }"
            >
              <i class="pi pi-shopping-bag nav-icon"></i>
              <span v-if="!isCollapsed" class="nav-label">Offers</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              to="/option-contracts"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/option-contracts' }"
            >
              <i class="pi pi-file-edit nav-icon"></i>
              <span v-if="!isCollapsed" class="nav-label">Option Contracts</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              to="/piggy-bank"
              class="nav-link"
              :class="{ 'nav-link-active': $route.path === '/piggy-bank' }"
            >
              <i class="pi pi-money-bill nav-icon"></i>
              <span v-if="!isCollapsed" class="nav-label">Piggy Bank</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <!-- User Info Section -->
        <div class="user-info-section">
          <div class="user-avatar">
            <i class="pi pi-user text-xl"></i>
          </div>
          <div v-if="!isMobileMode" class="user-details">
            <p class="user-name">{{ userName }}</p>
            <p class="user-email">{{ userEmail }}</p>
            <!-- Connection Status -->
            <div class="connection-status" :class="connectionStatusClass">
              <div class="connection-dot"></div>
              <span class="connection-text">{{ connectionStatusText }}</span>
            </div>
          </div>
        </div>

        <!-- Settings Link -->
        <div class="settings-section">
          <router-link
            to="/profile"
            class="nav-link"
            :class="{ 'nav-link-active': $route.path === '/profile' }"
            :title="isMobileMode ? 'Settings' : ''"
          >
            <i class="pi pi-cog nav-icon"></i>
            <span v-if="!isMobileMode" class="nav-label">Settings</span>
          </router-link>
        </div>

        <!-- Sign Out Button -->
        <div class="signout-section">
          <button @click="handleLogout" class="nav-link" :title="isMobileMode ? 'Sign Out' : ''">
            <i class="pi pi-sign-out nav-icon"></i>
            <span v-if="!isMobileMode" class="nav-label">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useLayout } from './composables/layout'

  // Router
  const router = useRouter()

  // Store
  const userStore = useUserStore()

  // Layout composable
  const { toggleMenu } = useLayout()

  // State
  const isCollapsed = ref(false)
  const isMobileMode = ref(false)

  // Computed
  const collapseIcon = computed(() => {
    return isCollapsed.value ? 'pi pi-angle-right' : 'pi pi-angle-left'
  })

  const userName = computed(() => {
    return userStore.currentUser?.username || 'Guest'
  })

  const userEmail = computed(() => {
    return `${userStore.currentUser?.username || 'guest'}@penguinpool.com`
  })

  const connectionStatusClass = computed(() => {
    return userStore.currentUser?.walletAddress ? 'connected' : 'disconnected'
  })

  const connectionStatusText = computed(() => {
    return userStore.currentUser?.walletAddress ? 'Connected' : 'Disconnected'
  })

  // Methods
  const toggleSidebar = () => {
    if (isMobileMode.value) {
      toggleMenu()
    } else {
      isCollapsed.value = !isCollapsed.value
    }
  }

  const handleLogout = async () => {
    try {
      // Clear user data from localStorage
      localStorage.removeItem('penguin-pool-user')
      localStorage.removeItem('penguin-pool-theme')
      localStorage.removeItem('penguin-pool-custom-theme')

      // Redirect to auth page after logout
      router.push('/auth')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Handle window resize
  const handleResize = () => {
    isMobileMode.value = window.innerWidth < 768
  }

  // Lifecycle
  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>

<style scoped>
  .layout-sidebar {
    @apply fixed z-50 overflow-y-auto select-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg;
    width: 20rem;
    height: calc(100vh - 8rem);
    top: 6rem;
    left: 2rem;
    transition: all 0.2s ease;
    padding: 0.5rem 1.5rem;
  }

  /* Mobile mode - icon only */
  .layout-sidebar.mobile-mode {
    width: 4rem;
    padding: 0.5rem 0.75rem;
  }

  .sidebar-content {
    @apply flex flex-col h-full;
  }

  /* Sidebar Header */
  .sidebar-header {
    @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
    min-height: 4rem;
  }

  .sidebar-title-text {
    @apply text-lg font-bold text-gray-900 dark:text-white;
  }

  .collapse-toggle {
    @apply p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200;
  }

  /* Navigation */
  .sidebar-nav {
    @apply flex-1 py-4;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    @apply p-4 border-t border-gray-200 dark:border-gray-700;
  }

  /* User Info Section */
  .user-info-section {
    @apply flex items-center space-x-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;
  }

  .user-avatar {
    @apply w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0;
  }

  .user-details {
    @apply flex-1 min-w-0;
  }

  .user-name {
    @apply text-sm font-semibold text-gray-900 dark:text-white truncate mb-1;
  }

  .user-email {
    @apply text-xs text-gray-600 dark:text-gray-400 truncate mb-2;
  }

  /* Connection Status */
  .connection-status {
    @apply flex items-center space-x-2 text-xs;
  }

  .connection-dot {
    @apply w-2 h-2 rounded-full;
  }

  .connection-status.connected .connection-dot {
    @apply bg-green-500;
  }

  .connection-status.disconnected .connection-dot {
    @apply bg-red-500;
  }

  .connection-text {
    @apply text-xs font-medium;
  }

  .connection-status.connected .connection-text {
    @apply text-green-600 dark:text-green-400;
  }

  .connection-status.disconnected .connection-text {
    @apply text-red-600 dark:text-red-400;
  }

  /* Settings and Sign Out */
  .settings-section,
  .signout-section {
    @apply mb-3;
  }

  .nav-menu {
    @apply space-y-1;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nav-item {
    @apply mx-2 mb-1;
  }

  .nav-link {
    @apply flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 cursor-pointer;
  }

  .nav-link-active {
    @apply bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 border border-primary-200/20 dark:border-primary-800/20;
  }

  .nav-icon {
    @apply text-lg flex-shrink-0;
  }

  .nav-label {
    @apply text-sm font-medium flex-1;
  }

  .nav-badge {
    @apply bg-primary-100/30 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 text-xs px-2 py-1 rounded-full font-medium;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Mobile mode adjustments */
  .layout-sidebar.mobile-mode .sidebar-title-text,
  .layout-sidebar.mobile-mode .user-details,
  .layout-sidebar.mobile-mode .nav-label {
    display: none;
  }

  .layout-sidebar.mobile-mode .sidebar-header {
    @apply justify-center p-2;
  }

  .layout-sidebar.mobile-mode .user-info-section {
    @apply justify-center p-2;
  }

  .layout-sidebar.mobile-mode .nav-link {
    @apply justify-center px-2 py-3;
  }

  .layout-sidebar.mobile-mode .nav-icon {
    @apply text-xl;
  }

  /* Responsive */
  @media (max-width: 991px) {
    .layout-sidebar {
      width: 20rem;
      left: 0;
      transform: translateX(-100%);
    }

    .layout-mobile-active .layout-sidebar {
      transform: translateX(0);
    }
  }

  @media (max-width: 767px) {
    .layout-sidebar {
      width: 4rem;
      left: 0;
      transform: translateX(0);
      padding: 0.5rem 0.75rem;
    }
  }
</style>
