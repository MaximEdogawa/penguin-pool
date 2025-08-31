<template>
  <div class="content-page">
    <div class="content-header">
      <h1>Profile & Settings</h1>
      <p>Manage your account and customize your experience</p>
    </div>

    <!-- Profile Tabs using PrimeVue TabView -->
    <div class="profile-tabs-container">
      <TabView
        v-model:activeIndex="activeTabIndex"
        class="profile-tabview"
        :pt="{
          root: { class: 'w-full h-full' },
          nav: {
            class:
              'border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg',
          },
          navContent: { class: 'flex flex-wrap' },
          inkbar: { class: 'bg-primary-500 dark:bg-primary-400' },
          navItem: { class: 'flex-1 sm:flex-none' },
          navLink: {
            class:
              'flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis',
          },
          navLinkActive: {
            class: 'text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-900/10',
          },
          content: {
            class:
              'p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700',
          },
        }"
      >
        <!-- Profile Tab -->
        <TabPanel header="Profile" value="profile">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Profile Information</h2>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Profile management coming soon...
            </p>
          </div>
        </TabPanel>

        <!-- Themes Tab -->
        <TabPanel header="Themes" value="themes">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Theme Settings</h2>
            <div class="flex flex-wrap gap-2 sm:gap-3">
              <button
                v-for="theme in availableThemes"
                :key="theme.id"
                :class="[
                  'px-3 sm:px-4 py-2 sm:py-2 rounded-lg border transition-all duration-200 text-sm sm:text-base',
                  {
                    'bg-primary-500 text-white border-primary-500': currentTheme === theme.id,
                    'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600':
                      currentTheme !== theme.id,
                  },
                ]"
                @click="setTheme(theme.id)"
              >
                {{ theme.name }}
              </button>
            </div>
          </div>
        </TabPanel>

        <!-- Security Tab -->
        <TabPanel header="Security" value="security">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Security Settings</h2>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Security settings coming soon...
            </p>
          </div>
        </TabPanel>

        <!-- Preferences Tab -->
        <TabPanel header="Preferences" value="preferences">
          <div class="space-y-4">
            <h2 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User Preferences</h2>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              User preferences coming soon...
            </p>
          </div>
        </TabPanel>
      </TabView>
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
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'

  const route = useRoute()
  const router = useRouter()
  const themeStore = useThemeStore()

  // Tab management
  const tabs = [
    { id: 'profile', label: 'Profile', index: 0 },
    { id: 'themes', label: 'Themes', index: 1 },
    { id: 'security', label: 'Security', index: 2 },
    { id: 'preferences', label: 'Preferences', index: 3 },
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
  .profile-tabs-container {
    @apply flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm;
    background-color: var(--surface-ground);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Custom TabView styling */
  .profile-tabview :deep(.p-tabview-nav) {
    @apply border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg;
  }

  .profile-tabview :deep(.p-tabview-nav-content) {
    @apply flex flex-wrap;
  }

  .profile-tabview :deep(.p-tabview-ink-bar) {
    @apply bg-primary-500 dark:bg-primary-400;
  }

  .profile-tabview :deep(.p-tabview-nav-item) {
    @apply flex-1 sm:flex-none;
  }

  .profile-tabview :deep(.p-tabview-nav-link) {
    @apply flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis;
  }

  .profile-tabview :deep(.p-tabview-nav-link.p-highlight) {
    @apply text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-900/10;
  }

  .profile-tabview :deep(.p-tabview-panels) {
    @apply p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 1023px) {
    .profile-tabview :deep(.p-tabview-nav-content) {
      @apply flex-col;
    }

    .profile-tabview :deep(.p-tabview-nav-item) {
      @apply flex-none;
    }

    .profile-tabview :deep(.p-tabview-nav-link) {
      @apply justify-center text-center border-b-0 border-r-0 border-l-2 border-l-transparent;
    }

    .profile-tabview :deep(.p-tabview-nav-link.p-highlight) {
      @apply border-l-2 border-l-primary-600 dark:border-l-primary-400;
    }
  }
</style>
