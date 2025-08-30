<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterView } from 'vue-router'
  import AppProvider from '@/app/providers/AppProvider.vue'
  import AppLayout from '@/widgets/Layout/AppLayout.vue'
  import { useUserStore } from '@/entities/user/store/userStore'

  // Get user store
  const userStore = useUserStore()

  // Check if user is authenticated using the store state
  const isAuthenticated = computed(() => {
    return userStore.isAuthenticated || localStorage.getItem('penguin-pool-user') !== null
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
