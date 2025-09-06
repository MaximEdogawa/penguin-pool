<script setup lang="ts">
  import AppProvider from '@/app/providers/AppProvider.vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import AppLayout from '@/widgets/Layout/AppLayout.vue'
  import { computed } from 'vue'
  import { RouterView } from 'vue-router'

  const userStore = useUserStore()
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
