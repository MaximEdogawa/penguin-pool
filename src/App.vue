<script setup lang="ts">
  import AppProvider from '@/app/providers/AppProvider.vue'
  import OfflineIndicator from '@/components/OfflineIndicator.vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useFeatureFlagsStore } from '@/stores/featureFlags'
  import AppLayout from '@/widgets/Layout/AppLayout.vue'
  import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
  import { computed, onMounted } from 'vue'
  import { RouterView } from 'vue-router'

  const userStore = useUserStore()
  const featureFlags = useFeatureFlagsStore()

  const isAuthenticated = computed(() => {
    return userStore.isAuthenticated
  })

  // Initialize feature flags on app startup
  onMounted(() => {
    featureFlags.loadFromEnvironment()
  })
</script>

<template>
  <AppProvider>
    <OfflineIndicator />
    <AppLayout v-if="isAuthenticated">
      <RouterView />
    </AppLayout>
    <RouterView v-else />
    <!-- TanStack Query DevTools - only shown in development -->
    <VueQueryDevtools />
  </AppProvider>
</template>

<style scoped>
  /* App-level styles are now handled by AppLayout */
</style>
