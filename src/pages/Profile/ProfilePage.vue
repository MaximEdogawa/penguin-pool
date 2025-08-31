<template>
  <div class="content-page">
    <div class="content-header">
      <h1>Profile & Settings</h1>
      <p>Manage your account and customize your experience</p>
    </div>

    <!-- Profile Tabs -->
    <div class="profile-tabs">
      <div class="profile-tabs-header">
        <PrimeButton
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="profile-tab-button"
          :class="{ active: activeTab === tab.id }"
        >
          <i :class="tab.icon" class="tab-icon"></i>
          <span class="tab-label">{{ tab.label }}</span>
        </PrimeButton>
      </div>

      <!-- Tab Content -->
      <div class="profile-tab-content">
        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="profile-tab-panel">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
            <p class="text-gray-600 dark:text-gray-300">Profile management coming soon...</p>
          </div>
        </div>

        <!-- Themes Tab -->
        <div v-if="activeTab === 'themes'" class="profile-tab-panel">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold mb-4">Theme Settings</h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="theme in availableThemes"
                :key="theme.id"
                :class="[
                  'px-4 py-2 rounded-lg border transition-all duration-200',
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
        </div>

        <!-- Security Tab -->
        <div v-if="activeTab === 'security'" class="profile-tab-panel">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold mb-4">Security Settings</h2>
            <p class="text-gray-600 dark:text-gray-300">Security settings coming soon...</p>
          </div>
        </div>

        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="profile-tab-panel">
          <div class="space-y-4">
            <h2 class="text-xl font-semibold mb-4">User Preferences</h2>
            <p class="text-gray-600 dark:text-gray-300">User preferences coming soon...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Footer -->
    <PageFooter />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import PageFooter from '@/components/PageFooter.vue'

  const route = useRoute()
  const themeStore = useThemeStore()

  // Check if there's a tab query parameter
  const activeTab = ref((route.query.tab as string) || 'profile')

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

  // Available tabs
  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'pi pi-user' },
    { id: 'themes', label: 'Themes', icon: 'pi pi-palette' },
    { id: 'security', label: 'Security', icon: 'pi pi-shield' },
    { id: 'preferences', label: 'Preferences', icon: 'pi pi-cog' },
  ]
</script>
