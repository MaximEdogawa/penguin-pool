<template>
  <header class="header">
    <div class="header-content">
      <!-- Left side: Burger menu for small screens -->
      <div class="header-left">
        <button
          @click="toggleSidebar"
          class="burger-menu lg:hidden"
          :class="{ 'menu-open': isSidebarOpen }"
          aria-label="Toggle sidebar"
        >
          <i class="pi pi-bars text-xl"></i>
        </button>
      </div>

      <!-- Center: Search bar -->
      <div class="header-center">
        <div class="search-container">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            placeholder="Search contracts, offers, users..."
            class="search-input"
            v-model="searchQuery"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- Right side: Actions and user menu -->
      <div class="header-right">
        <!-- Notifications -->
        <button class="header-action" @click="toggleNotifications" aria-label="Notifications">
          <i class="pi pi-bell text-lg"></i>
          <span v-if="notificationCount > 0" class="notification-badge">
            {{ notificationCount }}
          </span>
        </button>

        <!-- Theme toggle -->
        <button class="header-action" @click="toggleTheme" aria-label="Toggle theme">
          <i :class="themeIcon" class="text-lg"></i>
        </button>

        <!-- User menu -->
        <div class="user-menu" ref="userMenuRef">
          <button class="user-menu-trigger" @click="toggleUserMenu" aria-label="User menu">
            <div class="user-avatar">
              <i class="pi pi-user text-lg"></i>
            </div>
            <span class="user-name">{{ userName }}</span>
            <i class="pi pi-chevron-down text-sm"></i>
          </button>

          <!-- User dropdown -->
          <div v-if="isUserMenuOpen" class="user-dropdown">
            <div class="user-info">
              <div class="user-avatar-large">
                <i class="pi pi-user text-2xl"></i>
              </div>
              <div class="user-details">
                <p class="user-full-name">{{ userFullName }}</p>
                <p class="user-email">{{ userEmail }}</p>
              </div>
            </div>

            <div class="dropdown-divider"></div>

            <router-link to="/profile" class="dropdown-item">
              <i class="pi pi-user text-sm"></i>
              <span>Profile</span>
            </router-link>

            <router-link to="/dashboard" class="dropdown-item">
              <i class="pi pi-home text-sm"></i>
              <span>Dashboard</span>
            </router-link>

            <div class="dropdown-divider"></div>

            <button class="dropdown-item" @click="handleLogout">
              <i class="pi pi-sign-out text-sm"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useNotificationStore } from '@/features/notifications/store/notificationStore'

  // Props
  interface Props {
    isSidebarOpen: boolean
  }

  defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    'toggle-sidebar': []
  }>()

  // Router
  const router = useRouter()

  // Stores
  const themeStore = useThemeStore()
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  // State
  const searchQuery = ref('')
  const isUserMenuOpen = ref(false)
  const userMenuRef = ref<HTMLElement>()

  // Computed
  const themeIcon = computed(() => {
    return themeStore.effectiveTheme === 'dark' ? 'pi pi-moon' : 'pi pi-sun'
  })

  const userName = computed(() => {
    return userStore.currentUser?.username || 'Guest'
  })

  const userFullName = computed(() => {
    return userStore.currentUser?.username || 'Guest User'
  })

  const userEmail = computed(() => {
    return `${userStore.currentUser?.username || 'guest'}@penguinpool.com`
  })

  const notificationCount = computed(() => {
    return notificationStore.unreadCount
  })

  // Methods
  const toggleSidebar = () => {
    emit('toggle-sidebar')
  }

  const toggleTheme = () => {
    themeStore.toggleTheme()
  }

  const toggleNotifications = () => {
    // TODO: Implement notifications panel
    console.log('Toggle notifications')
  }

  const toggleUserMenu = () => {
    isUserMenuOpen.value = !isUserMenuOpen.value
  }

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery.value)
  }

  const handleLogout = async () => {
    try {
      await userStore.logout()
      router.push('/auth')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Click outside to close user menu
  const handleClickOutside = (event: Event) => {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
      isUserMenuOpen.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<style scoped>
  .header {
    @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-header sticky top-0 z-header;
    height: 8vh; /* 8% of viewport height */
    width: 100%;
    min-width: 0;
    min-height: 60px; /* Minimum height for usability */
    max-height: 80px; /* Maximum height for consistency */
  }

  .header-content {
    @apply flex items-center justify-between px-6 h-full;
    width: 100%;
    min-width: 0;
  }

  /* Header Left */
  .header-left {
    @apply lg:hidden;
  }

  .burger-menu {
    @apply rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 border border-gray-200 dark:border-gray-600 flex items-center justify-center;
    height: calc(8vh - 1rem); /* Slightly smaller than header height */
    min-height: 40px; /* Minimum height for usability */
    max-height: 50px; /* Maximum height for consistency */
    width: calc(8vh - 1rem); /* Square aspect ratio */
    min-width: 40px; /* Minimum width for usability */
    max-width: 50px; /* Maximum width for consistency */
  }

  .burger-menu.menu-open {
    @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800;
  }

  /* Header Center */
  .header-center {
    @apply flex-1 flex justify-center;
  }

  .search-container {
    @apply relative w-full max-w-2xl;
    height: calc(8vh - 1rem); /* Slightly smaller than header height */
    max-width: 48rem; /* Expanded search bar on large screens */
    min-height: 40px; /* Minimum height for usability */
    max-height: 50px; /* Maximum height for consistency */
  }

  .search-icon {
    @apply absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg;
  }

  .search-input {
    @apply w-full h-full pl-12 pr-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200;
  }

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .header-content {
      @apply px-4; /* Smaller padding on mobile */
    }

    .header-left {
      margin-right: 1.5rem; /* Bigger margin between burger and search */
    }

    .header-center {
      margin: 0 1.5rem; /* Bigger margins around search bar */
    }

    .search-container {
      max-width: 64rem; /* Full width on mobile */
      height: calc(8vh - 1rem); /* Keep normal height */
      min-height: 40px; /* Keep normal minimum height */
      max-height: 50px; /* Keep normal maximum height */
    }

    .search-input {
      @apply text-base; /* Bigger text on mobile */
    }

    /* Hide user name on mobile, show only icon */
    .user-name {
      @apply hidden;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      @apply px-3; /* Even smaller padding on small mobile */
    }

    .header-left {
      margin-right: 2rem; /* Even bigger margin on small mobile */
    }

    .header-center {
      margin: 0 2rem; /* Even bigger margins on small mobile */
    }

    .search-container {
      height: calc(8vh - 1rem); /* Keep normal height */
      min-height: 40px; /* Keep normal minimum height */
      max-height: 50px; /* Keep normal maximum height */
    }

    .search-input {
      @apply text-lg; /* Even bigger text on small mobile */
    }
  }

  @media (min-width: 1024px) {
    .search-container {
      max-width: 68rem; /* Expanded search bar on large screens */
    }
  }

  @media (min-width: 1280px) {
    .search-container {
      max-width: 56rem; /* Even more expanded on extra large screens */
    }
  }

  @media (min-width: 1536px) {
    .search-container {
      max-width: 64rem; /* Maximum expansion on 2xl screens */
    }
  }

  /* Header Right */
  .header-right {
    @apply flex items-center space-x-2;
  }

  .header-action {
    @apply relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200;
  }

  .notification-badge {
    @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-sm;
  }

  /* User Menu */
  .user-menu {
    @apply relative;
  }

  .user-menu-trigger {
    @apply flex items-center space-x-3 p-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200;
  }

  .user-avatar {
    @apply w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-xl flex items-center justify-center text-white shadow-sm;
  }

  .user-name {
    @apply text-sm font-semibold;
  }

  .user-dropdown {
    @apply absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700 py-3 z-modal;
  }

  .user-info {
    @apply px-5 py-4;
  }

  .user-avatar-large {
    @apply w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-md;
  }

  .user-details {
    @apply text-center;
  }

  .user-full-name {
    @apply text-base font-semibold text-gray-900 dark:text-white;
  }

  .user-email {
    @apply text-sm text-gray-500 dark:text-gray-400;
  }

  .dropdown-divider {
    @apply border-t border-gray-200 dark:border-gray-700 my-3;
  }

  .dropdown-item {
    @apply flex items-center space-x-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer rounded-xl mx-2;
  }

  .dropdown-item i {
    @apply text-gray-400;
  }

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .header-content {
      @apply px-4; /* Smaller padding on mobile */
    }

    .header-left {
      margin-right: 1.5rem; /* Bigger margin between burger and search */
    }

    .header-center {
      margin: 0 1.5rem; /* Bigger margins around search bar */
    }

    .search-container {
      max-width: none; /* Full width on mobile */
    }
  }

  @media (max-width: 768px) {
    .header-content {
      @apply px-3; /* Even smaller padding on small mobile */
    }

    .header-left {
      margin-right: 2rem; /* Even bigger margin on small mobile */
    }

    .header-center {
      margin: 0 2rem; /* Even bigger margins on small mobile */
    }
  }

  @media (min-width: 1024px) {
    .search-container {
      max-width: 48rem; /* Expanded search bar on large screens */
    }
  }

  @media (min-width: 1280px) {
    .search-container {
      max-width: 56rem; /* Even more expanded on extra large screens */
    }
  }

  @media (min-width: 1536px) {
    .search-container {
      max-width: 64rem; /* Maximum expansion on 2xl screens */
    }
  }
</style>
