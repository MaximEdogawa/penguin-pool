<template>
  <div v-if="!isOnline" class="offline-indicator">
    <i class="pi pi-wifi-off"></i>
    <span>You're offline. Some features may be limited.</span>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'
  const isOnline = ref(navigator.onLine)
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })
</script>

<style scoped>
  .offline-indicator {
    @apply fixed top-16 left-1/2 transform -translate-x-1/2 z-50;
    @apply bg-amber-400/20 backdrop-blur-md border border-amber-300/30 rounded-full;
    @apply px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium;
    @apply text-amber-800 dark:text-amber-200 shadow-lg;
    @apply animate-pulse;
  }

  .offline-indicator i {
    @apply text-xs;
  }
</style>
