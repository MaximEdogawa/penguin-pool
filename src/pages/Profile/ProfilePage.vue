<template>
  <div class="profile">
    <div class="profile-header">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile & Settings</h1>
      <p class="text-gray-600 dark:text-gray-300">
        Manage your account and customize your experience
      </p>
    </div>

    <!-- Profile Tabs -->
    <div class="profile-tabs">
      <div class="tabs-header">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
        >
          <i :class="tab.icon" class="tab-icon"></i>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="tab-panel">
          <div class="profile-info">
            <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
            <p class="text-gray-600 dark:text-gray-300">Profile management coming soon...</p>
          </div>
        </div>

        <!-- Themes Tab -->
        <div v-if="activeTab === 'themes'" class="tab-panel">
          <ThemeSettings />
        </div>

        <!-- Security Tab -->
        <div v-if="activeTab === 'security'" class="tab-panel">
          <div class="security-settings">
            <h2 class="text-xl font-semibold mb-4">Security Settings</h2>
            <p class="text-gray-600 dark:text-gray-300">Security settings coming soon...</p>
          </div>
        </div>

        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="tab-panel">
          <div class="user-preferences">
            <h2 class="text-xl font-semibold mb-4">User Preferences</h2>
            <p class="text-gray-600 dark:text-gray-300">User preferences coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import ThemeSettings from '@/features/theme/components/ThemeSettings.vue'

  const route = useRoute()

  // Check if there's a tab query parameter
  const activeTab = ref((route.query.tab as string) || 'profile')

  // Available tabs
  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'pi pi-user' },
    { id: 'themes', label: 'Themes', icon: 'pi pi-palette' },
    { id: 'security', label: 'Security', icon: 'pi pi-shield' },
    { id: 'preferences', label: 'Preferences', icon: 'pi pi-cog' },
  ]
</script>

<style scoped>
  .profile {
    @apply p-4 sm:p-6 max-w-7xl mx-auto;
  }

  .profile-header {
    @apply mb-6 sm:mb-8;
  }

  .profile-header h1 {
    @apply text-2xl sm:text-3xl;
  }

  .profile-tabs {
    @apply bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm;
  }

  .tabs-header {
    @apply flex flex-wrap border-b border-gray-200 dark:border-gray-700;
  }

  .tab-button {
    @apply flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 flex-1 sm:flex-none min-w-0;
  }

  .tab-button.active {
    @apply text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/30 dark:bg-primary-900/10;
  }

  .tab-icon {
    @apply text-base;
  }

  .tab-label {
    @apply font-medium;
  }

  .tab-content {
    @apply p-3 sm:p-6;
  }

  .tab-panel {
    @apply min-h-[300px] sm:min-h-[400px];
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .tabs-header {
      @apply flex-col;
    }

    .tab-button {
      @apply justify-center text-center border-b-0 border-r-0 border-l-2 border-l-transparent;
    }

    .tab-button.active {
      @apply border-l-2 border-l-primary-600 dark:border-l-primary-400 border-b-0;
    }
  }

  /* Windows 95 specific styling */
  :global(.theme-windows95) .profile-tabs {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-outset);
  }

  :global(.theme-windows95) .tabs-header {
    border-bottom: 2px solid var(--theme-border);
  }

  :global(.theme-windows95) .tab-button {
    font-family: var(--theme-font-family);
    color: var(--theme-text);
    border-bottom: 2px solid transparent;
  }

  :global(.theme-windows95) .tab-button:hover {
    background: var(--theme-hover);
  }

  :global(.theme-windows95) .tab-button.active {
    color: var(--theme-primary);
    border-bottom-color: var(--theme-primary);
    background: var(--theme-hover);
  }
</style>
