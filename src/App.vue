<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppProvider from '@/app/providers/AppProvider.vue'
</script>

<template>
  <AppProvider>
    <div class="app-container">
      <RouterView />
    </div>
  </AppProvider>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
}
</style>
