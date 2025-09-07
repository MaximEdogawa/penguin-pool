<script setup lang="ts">
  import AppProvider from '@/app/providers/AppProvider.vue'
  import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useFeatureFlagsStore } from '@/stores/featureFlags'
  import AppLayout from '@/widgets/Layout/AppLayout.vue'
  import { computed, onMounted } from 'vue'
  import { RouterView } from 'vue-router'

  const userStore = useUserStore()
  const featureFlags = useFeatureFlagsStore()

  const isAuthenticated = computed(() => {
    return userStore.isAuthenticated || localStorage.getItem('penguin-pool-user') !== null
  })

  // Initialize feature flags on app startup
  onMounted(() => {
    featureFlags.loadFromEnvironment()
  })
</script>

<template>
  <AppProvider>
    <AppLayout v-if="isAuthenticated">
      <RouterView />
    </AppLayout>
    <RouterView v-else />
    <PWAInstallPrompt />
  </AppProvider>
</template>

<style scoped>
  /* App-level styles are now handled by AppLayout */
</style>
