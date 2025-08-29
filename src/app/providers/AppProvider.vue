<template>
  <div id="app" :class="themeClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import { useNotificationStore } from '@/features/notifications/store/notificationStore'
  import { useUserStore } from '@/entities/user/store/userStore'

  // State
  const isInitialized = ref(false)
  const currentTheme = ref('light')

  // Computed
  const themeClass = computed(() => ({
    'theme-light': currentTheme.value === 'light',
    'theme-dark': currentTheme.value === 'dark',
    'theme-auto': currentTheme.value === 'auto',
  }))

  // Lifecycle
  onMounted(async () => {
    try {
      // Initialize stores only after component is mounted
      const themeStore = useThemeStore()
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()

      // Initialize theme
      await themeStore.initializeTheme()
      currentTheme.value = themeStore.effectiveTheme

      // Initialize notifications
      await notificationStore.initialize()

      // Check for existing user session
      await userStore.checkSession()

      isInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize app:', error)
      // Fallback to light theme
      currentTheme.value = 'light'
    }
  })
</script>

<style scoped>
  #app {
    min-height: 100vh;
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  .theme-light {
    @apply bg-gray-50 text-gray-900;
  }

  .theme-dark {
    @apply bg-gray-900 text-gray-100;
  }

  .theme-auto {
    /* Auto theme will be handled by CSS media queries */
  }
</style>
