<template>
  <div class="theme-toggle">
    <!-- Main theme toggle button -->
    <PrimeButton
      class="theme-toggle-btn p-button-text"
      @click="toggleTheme"
      :aria-label="`Switch theme`"
      :title="`Switch theme`"
    >
      <template #icon>
        <i :class="themeIcon" class="theme-icon"></i>
      </template>
    </PrimeButton>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'

  const themeStore = useThemeStore()

  const themeIcon = computed(() => {
    if (themeStore.isWindows95) {
      return 'pi pi-desktop'
    }
    return themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'
  })

  const toggleTheme = () => {
    themeStore.toggleTheme()
  }
</script>

<style scoped>
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  .theme-toggle-btn {
    width: 2.5rem !important;
    height: 2.5rem !important;
  }

  .theme-icon {
    font-size: 1rem;
  }

  /* Ensure PrimeButtons have no outlines */
  :deep(.p-button) {
    outline: none !important;
    box-shadow: none !important;
  }

  :deep(.p-button:focus) {
    outline: none !important;
    box-shadow: none !important;
  }

  :deep(.p-button:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }
</style>
