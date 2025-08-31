<template>
  <div class="content-page">
    <div class="content-header">
      <h1>Profile & Settings</h1>
      <p>Manage your account and customize your experience</p>
    </div>

    <!-- Profile Tabs using PrimeVue Tabs with TabList and Tab -->
    <div class="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm flex-1 overflow-hidden">
      <PrimeTabs v-model:activeIndex="activeTabIndex" class="w-full h-full profile-tabs">
        <PrimeTabList>
          <PrimeTab v-for="tab in tabs" :key="tab.label" :value="tab.id">
            <div class="flex items-center gap-2 text-inherit">
              <i :class="tab.icon" />
              <span>{{ tab.label }}</span>
            </div>
          </PrimeTab>
        </PrimeTabList>

        <!-- Profile Tab Content -->
        <PrimeTabPanel value="profile">
          <div class="space-y-6">
            <div class="tab-header">
              <h2 class="tab-title">Profile Information</h2>
              <p class="tab-subtitle">Manage your personal information and account details</p>
            </div>
            <div class="tab-content-wrapper">
              <p class="text-gray-600 dark:text-gray-300">Profile management coming soon...</p>
            </div>
          </div>
        </PrimeTabPanel>

        <!-- Themes Tab Content -->
        <PrimeTabPanel value="themes">
          <div class="space-y-6">
            <div class="tab-header">
              <h2 class="tab-title">Theme Settings</h2>
              <p class="tab-subtitle">Customize your visual experience with different themes</p>
            </div>
            <div class="tab-content-wrapper">
              <div class="theme-grid">
                <button
                  v-for="theme in availableThemes"
                  :key="theme.id"
                  :class="[
                    'theme-button',
                    {
                      'theme-button-active': currentTheme === theme.id,
                      'theme-button-inactive': currentTheme !== theme.id,
                    },
                  ]"
                  @click="setTheme(theme.id)"
                >
                  <span class="theme-name">{{ theme.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </PrimeTabPanel>

        <!-- Security Tab Content -->
        <PrimeTabPanel value="security">
          <div class="space-y-6">
            <div class="tab-header">
              <h2 class="tab-title">Security Settings</h2>
              <p class="tab-subtitle">Manage your account security and privacy settings</p>
            </div>
            <div class="tab-content-wrapper">
              <p class="text-gray-600 dark:text-gray-300">Security settings coming soon...</p>
            </div>
          </div>
        </PrimeTabPanel>

        <!-- Preferences Tab Content -->
        <PrimeTabPanel value="preferences">
          <div class="space-y-6">
            <div class="tab-header">
              <h2 class="tab-title">User Preferences</h2>
              <p class="tab-subtitle">Customize your application preferences and settings</p>
            </div>
            <div class="tab-content-wrapper">
              <p class="text-gray-600 dark:text-gray-300">User preferences coming soon...</p>
            </div>
          </div>
        </PrimeTabPanel>
      </PrimeTabs>
    </div>

    <!-- Page Footer -->
    <PageFooter />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import PageFooter from '@/components/PageFooter.vue'

  const route = useRoute()
  const router = useRouter()
  const themeStore = useThemeStore()

  // Tab management
  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'pi pi-user' },
    { id: 'themes', label: 'Themes', icon: 'pi pi-palette' },
    { id: 'security', label: 'Security', icon: 'pi pi-shield' },
    { id: 'preferences', label: 'Preferences', icon: 'pi pi-cog' },
  ]

  // Find initial tab index based on route query or default to profile
  const initialTab = (route.query.tab as string) || 'profile'
  const initialTabIndex = tabs.findIndex(tab => tab.id === initialTab)
  const activeTabIndex = ref(initialTabIndex >= 0 ? initialTabIndex : 0)

  // Watch for tab changes and update route
  watch(activeTabIndex, newIndex => {
    const tabId = tabs[newIndex]?.id
    if (tabId && tabId !== route.query.tab) {
      router.replace({ query: { ...route.query, tab: tabId } })
    }
  })

  // Theme logic
  const currentTheme = computed(() => themeStore.currentTheme)
  const availableThemes = [
    { id: 'light' as const, name: 'Light' },
    { id: 'dark' as const, name: 'Dark' },
    { id: 'windows95' as const, name: 'Windows 95' },
  ]

  const setTheme = async (themeId: 'light' | 'dark' | 'windows95') => {
    await themeStore.setTheme(themeId)
  }
</script>

<style scoped>
  /* Global tab styling using Tailwind classes */
  .profile-tabs {
    /* Base tab container */
  }

  /* Tab list styling */
  .profile-tabs :deep(.p-tabview-nav) {
    @apply bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-4;
  }

  /* Individual tab items */
  .profile-tabs :deep(.p-tabview-nav-item) {
    @apply flex-1;
  }

  /* Tab navigation links */
  .profile-tabs :deep(.p-tabview-nav-link) {
    @apply flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-600 transition-all duration-300 ease-in-out border-b-2 border-transparent;
  }

  /* Active tab styling */
  .profile-tabs :deep(.p-tabview-nav-link.p-highlight) {
    @apply text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800 shadow-sm;
  }

  /* Tab ink bar */
  .profile-tabs :deep(.p-tabview-ink-bar) {
    @apply bg-primary-500 h-0.5;
  }

  /* Tab panels */
  .profile-tabs :deep(.p-tabview-panels) {
    @apply bg-white dark:bg-gray-800 p-8;
  }

  /* Tab content styling */
  .tab-header {
    @apply pb-4 mb-6;
  }

  .tab-title {
    @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
  }

  .tab-subtitle {
    @apply text-gray-600 dark:text-gray-300 text-base;
  }

  .tab-content-wrapper {
    @apply space-y-4;
  }

  /* Theme buttons styling */
  .theme-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .theme-button {
    @apply px-6 py-4 rounded-xl  transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .theme-button-active {
    @apply bg-primary-500 text-white  shadow-lg shadow-primary-500/25;
  }

  .theme-button-inactive {
    @apply bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300  hover:bg-gray-50 dark:hover:bg-gray-600;
  }

  .theme-name {
    @apply text-sm font-semibold;
  }
</style>
