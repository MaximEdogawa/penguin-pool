<template>
  <div>
    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="{ 'sidebar-open': isOpen, 'sidebar-collapsed': isCollapsed || isSmallScreen }"
    >
      <div class="sidebar-content">
        <!-- Sidebar Header -->

        <div class="sidebar-header">
          <div class="sidebar-title">
            <span v-if="!isCollapsed && !isSmallScreen" class="sidebar-title-text">Navigation</span>
          </div>
          <PrimeButton
            @click="$emit('toggle-collapse')"
            :icon="collapseIcon"
            :title="isCollapsed || isSmallScreen ? 'Expand sidebar' : 'Collapse sidebar'"
            text
            rounded
            class="collapse-toggle p-button-text"
          />
        </div>
        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <ul class="nav-menu">
            <li v-for="item in navigationItems" :key="item.label || item.icon" class="nav-item">
              <PrimeButton
                @click="item.command"
                :icon="item.icon"
                :label="item.label"
                :title="item.title || item.label"
                :class="['nav-link w-full justify-start p-button-text', item.class]"
                text
              >
              </PrimeButton>
            </li>
          </ul>
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <!-- User Info Section -->
          <div class="user-info-section">
            <div class="user-avatar">
              <i
                :class="walletStore.isConnected ? 'pi pi-wallet' : 'pi pi-user'"
                class="text-xl text-white"
              ></i>
            </div>
            <div v-if="!isCollapsed && !isSmallScreen" class="user-details">
              <p class="user-name">{{ userName }}</p>
              <p class="user-email">{{ userEmail }}</p>

              <!-- Wallet Connection Info -->
              <div v-if="walletStore.isConnected" class="wallet-info">
                <div class="wallet-fingerprint">
                  <i class="pi pi-key text-sm"></i>
                  <span class="fingerprint-text">{{
                    walletStore.walletInfo?.fingerprint || 'N/A'
                  }}</span>
                </div>
              </div>

              <!-- Connection Status -->
              <div class="connection-status" :class="connectionStatusClass">
                <div class="connection-dot"></div>
                <span class="connection-text">{{ connectionStatusText }}</span>
              </div>
            </div>
          </div>

          <!-- Wallet Connect/Disconnect Button -->
          <div class="wallet-section">
            <PrimeButton
              v-if="walletStore.isConnecting"
              :icon="'pi pi-spin pi-spinner'"
              :label="!isCollapsed && !isSmallScreen ? 'Connecting...' : ''"
              :title="isCollapsed || isSmallScreen ? 'Connecting...' : ''"
              class="nav-link w-full justify-start p-button-text wallet-connecting-btn"
              text
              disabled
            />
            <PrimeButton
              v-else-if="!walletStore.isConnected"
              @click="navigateTo('/auth')"
              :icon="'pi pi-wallet'"
              :label="!isCollapsed && !isSmallScreen ? 'Connect Wallet' : ''"
              :title="isCollapsed || isSmallScreen ? 'Connect Wallet' : ''"
              class="nav-link w-full justify-start p-button-text wallet-connect-btn"
              text
            />
          </div>

          <!-- Settings Link -->
          <div class="settings-section">
            <PrimeButton
              @click="navigateTo('/profile')"
              :icon="'pi pi-cog'"
              :label="!isCollapsed && !isSmallScreen ? 'Settings' : ''"
              :title="isCollapsed || isSmallScreen ? 'Settings' : ''"
              :class="[
                'nav-link w-full justify-start p-button-text',
                { 'nav-link-active': $route.path === '/profile' },
              ]"
              text
            />
          </div>

          <!-- Sign Out Button -->
          <div class="signout-section">
            <PrimeButton
              @click="handleLogout"
              :icon="'pi pi-sign-out'"
              :label="!isCollapsed && !isSmallScreen ? 'Sign Out' : ''"
              :title="isCollapsed || isSmallScreen ? 'Sign Out' : ''"
              text
              class="nav-link w-full justify-start p-button-text"
            />
          </div>
        </div>
      </div>
    </aside>

    <!-- Overlay for small screens - only when sidebar is open -->
    <div
      v-if="isOpen && isSmallScreen"
      class="sidebar-overlay"
      @click="$emit('close')"
      @touchstart.passive="$emit('close')"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useWalletConnectStore } from '@/features/walletConnect/stores/walletConnectStore'
  import {
    defaultFeatureFlags,
    getCurrentEnvironment,
    isFeatureEnabled,
  } from '@/shared/config/featureFlags'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  // Router
  const router = useRouter()
  const route = useRoute()

  // Stores
  const userStore = useUserStore()
  const walletStore = useWalletConnectStore()

  // Props
  interface Props {
    isOpen: boolean
    isCollapsed: boolean
  }

  const props = defineProps<Props>()

  // Emits
  defineEmits<{
    'toggle-collapse': []
    close: []
  }>()

  // Small screen detection
  const windowWidth = ref(window.innerWidth)
  const isSmallScreen = computed(() => {
    return windowWidth.value <= 1023
  })

  // Update window width on resize
  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateWindowWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWindowWidth)
  })

  // Navigation items for PrimeVue Menu
  const navigationItems = computed(() => {
    const currentEnv = getCurrentEnvironment()

    const allItems = [
      {
        label: !props.isCollapsed && !isSmallScreen.value ? 'Dashboard' : '',
        icon: 'pi pi-home',
        command: () => navigateTo('/dashboard'),
        class: route.path === '/' || route.path === '/dashboard' ? 'nav-link-active' : '',
        title: 'Dashboard',
        featureFlag: 'dashboard',
      },
      {
        label: !props.isCollapsed && !isSmallScreen.value ? 'Loans' : '',
        icon: 'pi pi-credit-card',
        command: () => navigateTo('/loans'),
        class: route.path === '/loans' ? 'nav-link-active' : '',
        title: 'Loans',
        featureFlag: 'loans',
      },
      {
        label: !props.isCollapsed && !isSmallScreen.value ? 'Offers' : '',
        icon: 'pi pi-shopping-bag',
        command: () => navigateTo('/offers'),
        class: route.path === '/offers' ? 'nav-link-active' : '',
        title: 'Offers',
        featureFlag: 'offers',
      },
      {
        label: !props.isCollapsed && !isSmallScreen.value ? 'Option Contracts' : '',
        icon: 'pi pi-file-edit',
        command: () => navigateTo('/option-contracts'),
        class: route.path === '/option-contracts' ? 'nav-link-active' : '',
        title: 'Option Contracts',
        featureFlag: 'optionContracts',
      },
      {
        label: !props.isCollapsed && !isSmallScreen.value ? 'Piggy Bank' : '',
        icon: 'pi pi-money-bill',
        command: () => navigateTo('/piggy-bank'),
        class: route.path === '/piggy-bank' ? 'nav-link-active' : '',
        title: 'Piggy Bank',
        featureFlag: 'piggyBank',
      },
    ]

    // Filter items based on feature flags
    const filteredItems = allItems.filter(item => {
      if (!item.featureFlag) return true // Always show items without feature flags

      const feature =
        defaultFeatureFlags.app[item.featureFlag as keyof typeof defaultFeatureFlags.app]
      const isEnabled = feature ? isFeatureEnabled(feature, currentEnv, item.featureFlag) : true

      return isEnabled
    })

    return filteredItems
  })

  // Computed
  const collapseIcon = computed(() => {
    return props.isCollapsed || isSmallScreen.value ? 'pi pi-angle-right' : 'pi pi-angle-left'
  })

  const userName = computed(() => {
    return userStore.currentUser?.username || 'Guest'
  })

  const userEmail = computed(() => {
    return `${userStore.currentUser?.username || 'guest'}@penguinpool.com`
  })

  const connectionStatusClass = computed(() => {
    return walletStore.isConnected ? 'connected' : 'disconnected'
  })

  const connectionStatusText = computed(() => {
    return walletStore.isConnected ? 'Wallet Connected' : 'Wallet Disconnected'
  })

  // Methods
  const navigateTo = (path: string) => {
    router.push(path)
  }

  const handleLogout = async () => {
    try {
      if (walletStore.isConnected) {
        await walletStore.disconnect()
      }
      await userStore.logout()
      // Redirect to auth page after logout
      window.location.href = '/auth'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
</script>

<style scoped>
  .sidebar {
    @apply fixed left-0 top-0 h-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-700/20 shadow-sidebar transition-all duration-300 ease-in-out;
    width: 20vw; /* 20% of viewport width */
    transform: translateX(-100%);
    z-index: 50; /* Higher than overlay */
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar.sidebar-collapsed {
    width: 5vw; /* 5% of viewport width when collapsed */
  }

  .sidebar-content {
    @apply flex flex-col h-full;
  }

  /* Sidebar Header */
  .sidebar-header {
    @apply flex items-center justify-between p-5 border-b border-gray-200/20 dark:border-gray-700/20;
    min-height: 8vh; /* 8% of viewport height */
  }

  .sidebar-title {
    @apply flex items-center;
  }

  .sidebar-title-text {
    @apply text-lg font-bold text-gray-900 dark:text-white;
  }

  .collapse-toggle {
    @apply rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200;
  }

  /* Collapse toggle button styling */
  .sidebar .collapse-toggle.p-button-text {
    @apply text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .sidebar .collapse-toggle.p-button-text:hover {
    @apply bg-gray-100/30 dark:bg-gray-700/30;
  }

  /* Navigation Menu */
  .sidebar-nav {
    @apply flex-1 py-4;
  }

  /* Navigation Menu */
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
    @apply flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 cursor-pointer;
    background: transparent;
    border: none;
    box-shadow: none;
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 44px;
  }

  .nav-link:hover {
    @apply bg-gray-100/30 dark:bg-gray-700/30;
    transform: translateY(-1px);
  }

  .nav-link:focus {
    @apply ring-2 ring-primary-500/20;
    outline: none;
  }

  /* Active State */
  .nav-link.nav-link-active {
    @apply bg-primary-50/30 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 border border-primary-200/20 dark:border-primary-800/20;
  }

  /* Navigation Icon */
  .nav-icon {
    @apply text-lg flex-shrink-0 text-primary-600 dark:text-primary-400;
    font-family: 'primeicons' !important;
    font-style: normal !important;
    font-weight: normal !important;
    font-variant: normal !important;
    text-transform: none !important;
    line-height: 1 !important;
    display: inline-block !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
    width: 20px;
    height: 20px;
    margin-right: 12px;
  }

  /* Navigation Label */
  .nav-label {
    @apply text-sm font-medium flex-1;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Navigation Badge */
  .nav-badge {
    @apply bg-primary-100/30 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 text-xs px-2 py-1 rounded-full font-medium;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    @apply p-4 border-t border-gray-200/20 dark:border-gray-700/20;
  }

  /* User Info Section */
  .user-info-section {
    @apply flex items-center space-x-3 mb-4 p-3 bg-gray-50/30 dark:bg-gray-700/30 rounded-lg;
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

  /* Connection Status within User Section */
  .user-info-section .connection-status {
    @apply flex items-center space-x-2 text-xs;
  }

  .user-info-section .connection-dot {
    @apply w-2 h-2 rounded-full;
  }

  .user-info-section .connection-status.connected .connection-dot {
    @apply bg-green-500;
  }

  .user-info-section .connection-status.disconnected .connection-dot {
    @apply bg-red-500;
  }

  .user-info-section .connection-text {
    @apply text-xs font-medium;
  }

  .user-info-section .connection-status.connected .connection-text {
    @apply text-green-600 dark:text-green-400;
  }

  .user-info-section .connection-status.disconnected .connection-text {
    @apply text-red-600 dark:text-red-400;
  }

  /* Wallet Info Section */
  .wallet-info {
    @apply space-y-1 mb-2;
  }

  .wallet-fingerprint {
    @apply flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300;
  }

  .fingerprint-text {
    @apply font-mono text-sm font-semibold;
  }

  .wallet-fingerprint i {
    @apply text-primary-600 dark:text-primary-400 flex-shrink-0;
  }

  /* Wallet Section */
  .wallet-section {
    @apply mb-3;
  }

  .wallet-connect-btn {
    @apply text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20;
  }

  .wallet-connecting-btn {
    @apply text-gray-500 dark:text-gray-400 cursor-not-allowed;
  }

  .wallet-disconnect-btn {
    @apply text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20;
  }

  /* Sign Out Section */
  .signout-section {
    @apply mb-3;
  }

  /* PrimeVue Button overrides for sidebar */
  .sidebar .p-button.p-button-text {
    @apply text-left justify-start w-full;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    color: inherit !important;
  }

  .sidebar .p-button.p-button-text:hover {
    @apply bg-gray-100/30 dark:bg-gray-700/30;
  }

  .sidebar .p-button.p-button-text:focus {
    @apply ring-2 ring-primary-500/20;
  }

  /* Settings Section - Above connection info */
  .settings-section {
    @apply mb-3;
  }

  .connection-status.disconnected {
    @apply bg-red-50/30 dark:bg-red-900/10 text-red-700 dark:text-red-300 border border-red-200/20 dark:border-red-800/20;
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
    @apply font-medium;
  }

  /* Overlay - only for small screens */
  .sidebar-overlay {
    @apply fixed inset-0 lg:hidden;
    background: rgba(0, 0, 0, 0.3);
    z-index: 40; /* Lower than sidebar but higher than content */
    pointer-events: auto; /* Allow clicks to pass through */
  }

  /* Responsive */
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
      background: rgb(255 255 255 / 0.02); /* Extremely transparent on desktop */
      backdrop-filter: blur(50px); /* Very strong blur for glass effect */
      border: 1px solid rgb(229 231 235 / 0.02); /* Extremely transparent border */
    }

    .sidebar.sidebar-open {
      transform: translateX(0);
    }

    .sidebar.dark {
      background: rgb(31 41 55 / 0.02);
      border: 1px solid rgb(75 85 99 / 0.02);
    }
  }

  @media (max-width: 1200px) {
    .sidebar {
      width: 25vw;
    }

    .sidebar.sidebar-collapsed {
      width: 8vw;
    }
  }

  @media (max-width: 1023px) {
    .sidebar {
      width: 20vw;
      transform: translateX(-100%); /* Hidden by default */
      background: rgb(255 255 255 / 0.95); /* More opaque for mobile */
      backdrop-filter: blur(20px); /* Moderate blur for mobile */
      z-index: 50; /* Lower than topbar */
      border: 1px solid rgb(229 231 235 / 0.3); /* More visible border */
      box-shadow:
        0 8px 32px rgb(0 0 0 / 0.2),
        0 16px 64px rgb(0 0 0 / 0.15);
      top: 0; /* Start from top */
      height: 100vh; /* Full height */
    }

    .sidebar.sidebar-open {
      transform: translateX(0);
    }

    .sidebar.sidebar-collapsed {
      width: 20vw;
    }

    .sidebar.dark {
      background: rgb(31 41 55 / 0.95);
      border: 1px solid rgb(75 85 99 / 0.3);
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 15vw;
    }

    .sidebar.sidebar-collapsed {
      width: 18vw;
    }
  }

  /* Collapsed state adjustments - applies to both manual collapse and small screens */
  .sidebar.sidebar-collapsed .sidebar-header {
    @apply justify-center p-3;
  }

  .sidebar.sidebar-collapsed .sidebar-title-text {
    @apply hidden;
  }

  .sidebar.sidebar-collapsed .nav-link {
    @apply justify-center px-2 py-3;
  }

  .sidebar.sidebar-collapsed .nav-label,
  .sidebar.sidebar-collapsed .nav-badge {
    @apply hidden;
  }

  .sidebar.sidebar-collapsed .connection-status {
    @apply justify-center px-2;
  }

  .sidebar.sidebar-collapsed .connection-text {
    @apply hidden;
  }

  .sidebar.sidebar-collapsed .user-details {
    @apply hidden;
  }

  .sidebar.sidebar-collapsed .user-info-section {
    @apply justify-center p-2;
  }

  /* Hover effects for collapsed state */
  .sidebar.sidebar-collapsed .nav-link:hover {
    @apply bg-gray-100/30 dark:bg-gray-700/30;
  }

  .sidebar.sidebar-collapsed .nav-link.nav-link-active {
    @apply bg-primary-100/30 dark:bg-primary-900/10;
  }

  /* Small screen specific adjustments */
  @media (max-width: 1023px) {
    .sidebar .sidebar-header {
      @apply justify-center p-2;
    }

    .sidebar .nav-link {
      @apply justify-center px-1.5 py-2.5;
    }

    .sidebar .nav-label,
    .sidebar .nav-badge {
      @apply hidden;
    }

    .sidebar .connection-status {
      @apply justify-center px-1.5;
    }

    .sidebar .connection-text {
      @apply hidden;
    }

    .sidebar .sidebar-title-text {
      @apply hidden;
    }

    .sidebar .user-details {
      @apply hidden;
    }

    .sidebar .user-info-section {
      @apply justify-center p-2;
    }

    .sidebar .user-avatar {
      @apply w-6 h-6;
    }

    .sidebar .nav-icon {
      @apply text-base; /* Slightly smaller icons for narrow sidebar */
      margin-right: 0;
    }

    .sidebar .collapse-toggle {
      @apply p-1.5; /* Smaller padding for narrow sidebar */
    }

    /* Ensure collapsed state also has glass effect on small screens */
    .sidebar.sidebar-collapsed {
      background: rgb(
        255 255 255 / 0.01
      ) !important; /* Force almost completely transparent glass effect */
      backdrop-filter: blur(60px) !important; /* Force very strong blur */
      border: 1px solid rgb(229 231 235 / 0.01) !important; /* Force almost invisible border */
      box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.1),
        0 8px 32px rgb(0 0 0 / 0.12),
        0 16px 64px rgb(0 0 0 / 0.08),
        inset 0 1px 0 rgb(255 255 255 / 0.2) !important; /* Force enhanced glass shadow */
    }

    .sidebar.sidebar-collapsed.dark {
      background: rgb(
        31 41 55 / 0.01
      ) !important; /* Force almost completely transparent dark glass effect */
      border: 1px solid rgb(75 85 99 / 0.01) !important;
      box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.05),
        0 8px 32px rgb(0 0 0 / 0.15),
        0 16px 64px rgb(0 0 0 / 0.1),
        inset 0 1px 0 rgb(255 255 255 / 0.1) !important; /* Force enhanced dark glass shadow */
    }
  }

  /* Additional PrimeVue Menu overrides to ensure visibility */
  .nav-menu .p-menuitem-link * {
    pointer-events: none !important;
  }

  .nav-menu .p-menuitem-link {
    pointer-events: auto !important;
  }

  /* Force remove any PrimeVue default styling */
  .nav-menu .p-menuitem-link::before,
  .nav-menu .p-menuitem-link::after {
    display: none !important;
  }

  /* Ensure proper spacing in collapsed state */
  .sidebar.sidebar-collapsed .nav-menu .p-menuitem-link .p-menuitem-icon {
    margin-right: 0 !important;
    margin-left: 0 !important;
  }

  /* Windows 95 theme compatibility - ensure sidebar buttons match theme */
  .theme-windows95 .sidebar .collapse-toggle.p-button-text {
    background: var(--theme-surface) !important;
    border: 2px solid !important;
    border-color: var(--theme-highlight) var(--theme-shadow) var(--theme-shadow)
      var(--theme-highlight) !important;
    box-shadow: var(--theme-shadow-outset) !important;
    color: var(--theme-text) !important;
    padding: 4px 6px !important;
    min-height: 16px !important;
    min-width: 32px !important;
    max-width: 100% !important;
    font-size: var(--theme-font-size-small) !important;
  }

  .theme-windows95 .sidebar .collapse-toggle.p-button-text:hover {
    background: var(--theme-hover) !important;
  }

  .theme-windows95 .sidebar .collapse-toggle.p-button-text:active {
    border-color: var(--theme-shadow) var(--theme-highlight) var(--theme-highlight)
      var(--theme-shadow) !important;
    box-shadow: var(--theme-shadow-inset) !important;
    padding-top: 5px !important;
    padding-left: 7px !important;
  }

  /* Windows 95 theme compatibility - ensure navigation buttons match theme */
  .theme-windows95 .sidebar .nav-link {
    background: var(--theme-surface) !important;
    border: 2px solid !important;
    border-color: var(--theme-highlight) var(--theme-shadow) var(--theme-shadow)
      var(--theme-highlight) !important;
    box-shadow: var(--theme-shadow-outset) !important;
    color: var(--theme-text) !important;
    padding: 4px 6px !important;
    min-height: 16px !important;
    min-width: 32px !important;
    max-width: 100% !important;
    font-size: var(--theme-font-size-small) !important;
    font-family: var(--theme-font-family) !important;
  }

  .theme-windows95 .sidebar .nav-link:hover {
    background: var(--theme-hover) !important;
  }

  .theme-windows95 .sidebar .nav-link:active {
    border-color: var(--theme-shadow) var(--theme-highlight) var(--theme-highlight)
      var(--theme-shadow) !important;
    box-shadow: var(--theme-shadow-inset) !important;
    padding-top: 5px !important;
    padding-left: 7px !important;
  }

  .theme-windows95 .sidebar .nav-link.nav-link-active {
    background: var(--theme-primary) !important;
    color: var(--theme-highlight) !important;
    border-color: var(--theme-highlight) var(--theme-shadow) var(--theme-shadow)
      var(--theme-highlight) !important;
  }

  /* Windows 95 theme compatibility - ensure PrimeVue button overrides match theme */
  .theme-windows95 .sidebar .p-button.p-button-text {
    background: var(--theme-surface) !important;
    border: 2px solid !important;
    border-color: var(--theme-highlight) var(--theme-shadow) var(--theme-shadow)
      var(--theme-highlight) !important;
    box-shadow: var(--theme-shadow-outset) !important;
    color: var(--theme-text) !important;
    padding: 4px 6px !important;
    min-height: 16px !important;
    min-width: 32px !important;
    max-width: 100% !important;
    font-size: var(--theme-font-size-small) !important;
    font-family: var(--theme-font-family) !important;
  }

  .theme-windows95 .sidebar .p-button.p-button-text:hover {
    background: var(--theme-hover) !important;
  }

  .theme-windows95 .sidebar .p-button.p-button-text:active {
    border-color: var(--theme-shadow) var(--theme-highlight) var(--theme-highlight)
      var(--theme-shadow) !important;
    box-shadow: var(--theme-shadow-inset) !important;
    padding-top: 5px !important;
    padding-left: 7px !important;
  }

  .theme-windows95 .sidebar .p-button.p-button-text:focus {
    outline: 1px dotted var(--theme-text) !important;
  }

  /* Windows 95 theme compatibility - ensure icons are properly sized */
  .theme-windows95 .sidebar .nav-link i,
  .theme-windows95 .sidebar .p-button i {
    font-size: 16px !important;
    line-height: 1 !important;
  }

  /* Windows 95 theme compatibility - ensure sidebar background matches theme */
  .theme-windows95 .sidebar {
    background: var(--theme-menu-bar) !important;
    border-right: 2px solid var(--theme-border) !important;
    box-shadow: var(--theme-shadow-outset) !important;
    backdrop-filter: none !important;
  }

  .theme-windows95 .sidebar .sidebar-header {
    background: var(--theme-menu-bar) !important;
    border-bottom: 2px solid var(--theme-border) !important;
  }

  .theme-windows95 .sidebar .sidebar-footer {
    background: var(--theme-menu-bar) !important;
    border-top: 2px solid var(--theme-border) !important;
  }

  .theme-windows95 .sidebar .user-info-section {
    background: var(--theme-surface) !important;
    border: 2px solid !important;
    border-color: var(--theme-shadow) var(--theme-highlight) var(--theme-highlight)
      var(--theme-shadow) !important;
    box-shadow: var(--theme-shadow-inset) !important;
  }

  /* Windows 95 theme compatibility - responsive adjustments */
  @media (max-width: 768px) {
    .theme-windows95 .sidebar .collapse-toggle.p-button-text,
    .theme-windows95 .sidebar .nav-link,
    .theme-windows95 .sidebar .p-button.p-button-text {
      padding: 3px 4px !important;
      min-height: 14px !important;
      min-width: 28px !important;
      max-width: 100% !important;
      font-size: var(--theme-font-size-small) !important;
    }

    .theme-windows95 .sidebar .nav-link i,
    .theme-windows95 .sidebar .p-button i {
      font-size: 14px !important;
    }
  }

  @media (min-width: 1200px) {
    .theme-windows95 .sidebar .collapse-toggle.p-button-text,
    .theme-windows95 .sidebar .nav-link,
    .theme-windows95 .sidebar .p-button.p-button-text {
      padding: 5px 7px !important;
      min-height: 18px !important;
      min-width: 36px !important;
      max-width: 100% !important;
      font-size: var(--theme-font-size-large) !important;
    }

    .theme-windows95 .sidebar .nav-link i,
    .theme-windows95 .sidebar .p-button i {
      font-size: 18px !important;
    }
  }

  /* Ensure buttons fit in collapsed sidebar */
  .sidebar.sidebar-collapsed .nav-link,
  .sidebar.sidebar-collapsed .p-button.p-button-text {
    min-width: auto !important;
    max-width: 100% !important;
    width: 100% !important;
    justify-content: center !important;
  }

  /* Windows 95 theme - collapsed state button sizing */
  .theme-windows95 .sidebar.sidebar-collapsed .nav-link,
  .theme-windows95 .sidebar.sidebar-collapsed .p-button.p-button-text {
    min-width: 32px !important;
    max-width: 100% !important;
    width: 100% !important;
    padding: 4px 2px !important;
  }

  .theme-windows95 .sidebar.sidebar-collapsed .collapse-toggle.p-button-text {
    min-width: 32px !important;
    max-width: 100% !important;
    width: 100% !important;
    padding: 4px 2px !important;
  }

  /* Mobile collapsed state adjustments */
  @media (max-width: 1023px) {
    .theme-windows95 .sidebar.sidebar-collapsed .nav-link,
    .theme-windows95 .sidebar.sidebar-collapsed .p-button.p-button-text,
    .theme-windows95 .sidebar.sidebar-collapsed .collapse-toggle.p-button-text {
      min-width: 28px !important;
      padding: 3px 2px !important;
    }
  }
</style>
