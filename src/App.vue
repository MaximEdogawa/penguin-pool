<script setup lang="ts">
  import AppProvider from '@/app/providers/AppProvider.vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useFeatureFlagsStore } from '@/stores/featureFlags'
  import { computed, onMounted } from 'vue'
  import { RouterView } from 'vue-router'
  import AppLayout from '@/widgets/Layout/AppLayout.vue'

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
  </AppProvider>
</template>

<style scoped>
  /* App-level styles are now handled by AppLayout */
</style>
