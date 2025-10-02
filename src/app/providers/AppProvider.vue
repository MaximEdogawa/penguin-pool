<template>
  <div id="app">
    <slot />
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useNotificationStore } from '@/features/notifications/store/notificationStore'
  import { useThemeStore } from '@/features/theme/store/themeStore'
  import { onMounted } from 'vue'

  // Lifecycle
  onMounted(async () => {
    try {
      const themeStore = useThemeStore()
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()
      await themeStore.initializeTheme()
      await notificationStore.initialize()
      await userStore.checkSession()
    } catch {
      // Failed to initialize app
    }
  })
</script>

<style scoped>
  #app {
    min-height: 100vh;
    height: 100vh;
    background-color: var(--surface-ground);
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
  }

  /* Ensure dark mode support */
  :global(.dark) #app {
    background-color: var(--surface-ground);
  }

  /* Ensure light mode support */
  :global(.light) #app {
    background-color: #ffffff;
  }
</style>
