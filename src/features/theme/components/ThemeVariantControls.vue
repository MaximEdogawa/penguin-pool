<template>
  <div v-if="isPrimeUI || hasCustomTheme" class="theme-variant-section">
    <h4>Theme Variant</h4>
    <div class="variant-controls">
      <button
        :class="['variant-btn', { active: currentThemeVariant === 'light' }]"
        @click="switchToVariant('light')"
      >
        <i class="pi pi-sun"></i>
        Light
      </button>
      <button
        :class="['variant-btn', { active: currentThemeVariant === 'dark' }]"
        @click="switchToVariant('dark')"
      >
        <i class="pi pi-moon"></i>
        Dark
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import { logger } from '@/shared/services/logger'

  const themeStore = useThemeStore()

  const isPrimeUI = computed(() => themeStore.isPrimeUI)
  const hasCustomTheme = computed(() => themeStore.hasCustomTheme)
  const currentThemeVariant = computed(() => themeStore.currentThemeVariant)

  const switchToVariant = async (variant: 'light' | 'dark') => {
    try {
      if (isPrimeUI.value && themeStore.currentPrimeUITheme) {
        await themeStore.setPrimeUITheme(themeStore.currentPrimeUITheme, variant)
      } else if (hasCustomTheme.value) {
        await themeStore.switchThemeVariant(variant)
      }
    } catch (error) {
      logger.error('Failed to switch theme variant', error as Error)
    }
  }
</script>

<style scoped>
  .theme-variant-section {
    margin-bottom: 24px;
  }

  .theme-variant-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .variant-controls {
    display: flex;
    gap: 8px;
  }

  .variant-btn {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    background: var(--surface-card);
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    transition: all 0.2s;
  }

  .variant-btn:hover {
    background: var(--surface-hover);
  }

  .variant-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
</style>
