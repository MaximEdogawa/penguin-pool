<template>
  <div id="app">
    <slot />
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import { useNotificationStore } from '@/features/notifications/store/notificationStore'
  import { useUserStore } from '@/entities/user/store/userStore'

  // Lifecycle
  onMounted(async () => {
    try {
      // Initialize stores only after component is mounted
      const themeStore = useThemeStore()
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()

      // Initialize theme
      await themeStore.initializeTheme()

      // Initialize notifications
      await notificationStore.initialize()

      // Check for existing user session
      await userStore.checkSession()
    } catch (error) {
      console.error('Failed to initialize app:', error)
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
</style>
