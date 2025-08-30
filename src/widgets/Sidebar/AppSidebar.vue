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
          <div class="sidebar-logo">
            <PenguinLogo class="logo-icon" />
            <span v-if="!isCollapsed && !isSmallScreen" class="logo-text">Penguin Pool</span>
          </div>
          <button
            @click="$emit('toggle-collapse')"
            class="collapse-toggle"
            :title="isCollapsed || isSmallScreen ? 'Expand sidebar' : 'Collapse sidebar'"
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
                :class="{ 'nav-link-active': $route.path === '/dashboard' }"
                :title="isCollapsed || isSmallScreen ? 'Dashboard' : ''"
              >
                <i class="pi pi-home nav-icon"></i>
                <span v-if="!isCollapsed && !isSmallScreen" class="nav-label">Dashboard</span>
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                to="/loans"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path === '/loans' }"
                :title="isCollapsed || isSmallScreen ? 'Loans' : ''"
              >
                <i class="pi pi-credit-card nav-icon"></i>
                <span v-if="!isCollapsed && !isSmallScreen" class="nav-label">Loans</span>
                <span v-if="!isCollapsed && !isSmallScreen" class="nav-badge">New</span>
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                to="/offers"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path === '/offers' }"
                :title="isCollapsed || isSmallScreen ? 'Offers' : ''"
              >
                <i class="pi pi-shopping-bag nav-icon"></i>
                <span v-if="!isCollapsed && !isSmallScreen" class="nav-label">Offers</span>
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                to="/option-contracts"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path === '/option-contracts' }"
                :title="isCollapsed || isSmallScreen ? 'Option Contracts' : ''"
              >
                <i class="pi pi-file-edit nav-icon"></i>
                <span v-if="!isCollapsed && !isSmallScreen" class="nav-label"
                  >Option Contracts</span
                >
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                to="/piggy-bank"
                class="nav-link"
                :class="{ 'nav-link-active': $route.path === '/piggy-bank' }"
                :title="isCollapsed || isSmallScreen ? 'Piggy Bank' : ''"
              >
                <i class="pi pi-money-bill nav-icon"></i>
                <span v-if="!isCollapsed && !isSmallScreen" class="nav-label">Piggy Bank</span>
              </router-link>
            </li>
          </ul>
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <!-- Connection Info - Always visible -->
          <div class="connection-info">
            <div
              class="connection-status"
              :class="connectionStatusClass"
              :title="isCollapsed || isSmallScreen ? connectionStatusText : ''"
            >
              <div class="connection-dot"></div>
              <span v-if="!isCollapsed && !isSmallScreen" class="connection-text">
                {{ connectionStatusText }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Overlay for small screens - only when sidebar is open -->
    <div v-if="isOpen && isSmallScreen" class="sidebar-overlay" @click="$emit('close')"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import PenguinLogo from '@/components/PenguinLogo.vue'

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

  // Store
  const userStore = useUserStore()

  // Computed
  const collapseIcon = computed(() => {
    return props.isCollapsed || isSmallScreen.value ? 'pi pi-angle-right' : 'pi pi-angle-left'
  })

  const connectionStatusClass = computed(() => {
    return userStore.currentUser?.walletAddress ? 'connected' : 'disconnected'
  })

  const connectionStatusText = computed(() => {
    return userStore.currentUser?.walletAddress ? 'Connected' : 'Disconnected'
  })

  // Small screen detection
  const isSmallScreen = computed(() => {
    return window.innerWidth <= 1023
  })
</script>

<style scoped>
  .sidebar {
    @apply fixed left-0 top-0 h-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-r border-gray-200/20 dark:border-gray-700/20 shadow-sidebar z-sidebar transition-all duration-300 ease-in-out;
    width: 20vw; /* 20% of viewport width */
    transform: translateX(-100%);
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

  .sidebar-logo {
    @apply flex items-center space-x-3;
  }

  .logo-icon {
    @apply w-8 h-8 flex-shrink-0;
  }

  .logo-text {
    @apply text-lg font-bold text-gray-900 dark:text-white;
  }

  .collapse-toggle {
    @apply p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200;
  }

  /* Navigation Menu */
  .sidebar-nav {
    @apply flex-1 py-4;
  }

  .nav-menu {
    @apply space-y-1;
  }

  .nav-item {
    @apply mx-2;
  }

  .nav-link {
    @apply flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 cursor-pointer;
  }

  .nav-link-active {
    @apply bg-primary-50/30 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 border border-primary-200/20 dark:border-primary-800/20;
  }

  .nav-icon {
    @apply text-lg flex-shrink-0;
  }

  .nav-label {
    @apply text-sm font-medium flex-1;
  }

  .nav-badge {
    @apply bg-primary-100/30 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 text-xs px-2 py-1 rounded-full font-medium;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    @apply p-4 border-t border-gray-200/20 dark:border-gray-700/20;
  }

  /* Connection Info - Always visible */
  .connection-info {
    @apply flex justify-center;
  }

  .connection-status {
    @apply flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium;
  }

  .connection-status.connected {
    @apply bg-green-50/30 dark:bg-green-900/10 text-green-700 dark:text-green-300 border border-green-200/20 dark:border-green-800/20;
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
    @apply fixed inset-0 bg-black/20 z-sidebar lg:hidden;
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
      width: 25vw; /* 25% on medium screens */
    }

    .sidebar.sidebar-collapsed {
      width: 8vw; /* 8% when collapsed on medium screens */
    }
  }

  @media (max-width: 1023px) {
    .sidebar {
      width: 10vw; /* 10% of viewport width on small screens */
      transform: translateX(-100%); /* Hidden by default */
      background: rgb(255 255 255 / 0.01); /* Almost completely transparent glass effect */
      backdrop-filter: blur(60px); /* Very strong blur for better glass effect */
      z-index: 50; /* Higher z-index to overlay content */
      border: 1px solid rgb(229 231 235 / 0.01); /* Almost invisible border */
      box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.1),
        0 8px 32px rgb(0 0 0 / 0.12),
        0 16px 64px rgb(0 0 0 / 0.08),
        inset 0 1px 0 rgb(255 255 255 / 0.2); /* Enhanced glass shadow */
    }

    .sidebar.sidebar-open {
      transform: translateX(0); /* Show when toggled */
    }

    .sidebar.sidebar-collapsed {
      width: 10vw; /* Keep 10% width when collapsed */
    }

    .sidebar.dark {
      background: rgb(31 41 55 / 0.01); /* Almost completely transparent dark mode */
      border: 1px solid rgb(75 85 99 / 0.01);
      box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.05),
        0 8px 32px rgb(0 0 0 / 0.15),
        0 16px 64px rgb(0 0 0 / 0.1),
        inset 0 1px 0 rgb(255 255 255 / 0.1); /* Enhanced dark glass shadow */
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 10vw; /* 10% of viewport width on mobile */
    }

    .sidebar.sidebar-collapsed {
      width: 10vw; /* Keep 10% width when collapsed */
    }
  }

  /* Collapsed state adjustments - applies to both manual collapse and small screens */
  .sidebar.sidebar-collapsed .sidebar-header {
    @apply justify-center p-3;
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

  /* Hover effects for collapsed state */
  .sidebar.sidebar-collapsed .nav-link:hover {
    @apply bg-gray-100/30 dark:bg-gray-700/30;
  }

  .sidebar.sidebar-collapsed .nav-link-active {
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

    .sidebar .logo-text {
      @apply hidden;
    }

    .sidebar .nav-icon {
      @apply text-base; /* Slightly smaller icons for narrow sidebar */
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
</style>
