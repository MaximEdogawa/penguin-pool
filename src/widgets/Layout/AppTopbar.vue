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
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AppConfigurator from './AppConfigurator.vue'
  import { useLayout } from './composables/layout'
  const router = useRouter()
  const themeStore = useThemeStore()
  const notificationStore = useNotificationStore()
  const { toggleMenu, layoutState } = useLayout()

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

  .layout-topbar-logo-container {
    @apply flex items-center;
    width: auto;
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
      display: none;
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
  }
</style>
