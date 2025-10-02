<template>
  <div class="current-theme-section">
    <h4>Current Theme</h4>
    <div class="current-theme-display">
      <div v-if="hasCustomTheme" class="custom-theme-info">
        <div class="theme-preview" :style="getThemePreview(currentCustomTheme!)"></div>
        <div class="theme-details">
          <h5>{{ currentCustomTheme?.name }}</h5>
          <p>{{ currentCustomTheme?.description }}</p>
          <span class="theme-category">{{ currentCustomTheme?.category }}</span>
          <span class="theme-variant">{{ currentThemeVariant }} variant</span>
        </div>
        <button class="clear-theme-btn" @click="clearCustomTheme">
          <i class="pi pi-times"></i>
          Clear Theme
        </button>
      </div>
      <div v-else-if="isPrimeUI" class="primeui-theme-info">
        <div class="theme-preview" :style="getPrimeUIThemePreview()"></div>
        <div class="theme-details">
          <h5>{{ getPrimeUIThemeName() }}</h5>
          <p>PrimeUI {{ currentPrimeUITheme }} theme</p>
          <span class="theme-category">PrimeUI</span>
          <span class="theme-variant">{{ currentThemeVariant }} variant</span>
        </div>
        <button class="clear-theme-btn" @click="clearPrimeUITheme">
          <i class="pi pi-times"></i>
          Clear Theme
        </button>
      </div>
      <div v-else class="built-in-theme-info">
        <div class="theme-preview" :style="getBuiltInThemePreview()"></div>
        <div class="theme-details">
          <h5>{{ getBuiltInThemeName() }}</h5>
          <p>Built-in {{ currentTheme }} theme</p>
          <span class="theme-category">Built-in</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import { logger } from '@/shared/services/logger'
  import type { CustomTheme } from '../types/theme'

  const themeStore = useThemeStore()

  const currentTheme = computed(() => themeStore.currentTheme)
  const hasCustomTheme = computed(() => themeStore.hasCustomTheme)
  const isPrimeUI = computed(() => themeStore.isPrimeUI)
  const currentCustomTheme = computed(() => themeStore.currentCustomTheme)
  const currentPrimeUITheme = computed(() => themeStore.currentPrimeUITheme)
  const currentThemeVariant = computed(() => themeStore.currentThemeVariant)

  const getThemePreview = (theme: CustomTheme) => ({
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.text,
  })

  const getPrimeUIThemePreview = () => ({
    background: themeStore.currentSurfaceColor,
    border: `1px solid ${themeStore.currentPrimaryColor}`,
    color: themeStore.currentPrimaryColor,
  })

  const getBuiltInThemePreview = () => {
    if (currentTheme.value === 'dark') {
      return { background: '#1f2937', border: '1px solid #374151', color: '#f1f5f9' }
    }
    return { background: '#f9fafb', border: '1px solid #e5e7eb', color: '#1e293b' }
  }

  const getBuiltInThemeName = () => {
    switch (currentTheme.value) {
      case 'dark':
        return 'Dark Theme'
      case 'light':
        return 'Light Theme'
      case 'auto':
        return 'Auto Theme (System)'
      default:
        return 'Unknown Theme'
    }
  }

  const getPrimeUIThemeName = () => {
    return currentPrimeUITheme.value
      ? currentPrimeUITheme.value.charAt(0).toUpperCase() + currentPrimeUITheme.value.slice(1)
      : 'No Theme'
  }

  const clearCustomTheme = async () => {
    try {
      await themeStore.clearCustomTheme()
    } catch (error) {
      logger.error('Failed to clear custom theme', error as Error)
    }
  }

  const clearPrimeUITheme = async () => {
    try {
      await themeStore.setBuiltInTheme('light')
    } catch (error) {
      logger.error('Failed to clear PrimeUI theme', error as Error)
    }
  }
</script>

<style scoped>
  .current-theme-section {
    margin-bottom: 24px;
  }

  .current-theme-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .current-theme-display {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 16px;
  }

  .custom-theme-info,
  .primeui-theme-info,
  .built-in-theme-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .theme-preview {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
  }

  .theme-details {
    flex: 1;
  }

  .theme-details h5 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--text-color);
  }

  .theme-details p {
    font-size: 14px;
    color: var(--text-color-secondary);
    margin: 0 0 8px 0;
  }

  .theme-category,
  .theme-variant {
    display: inline-block;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 8px;
    background: var(--surface-100);
    color: var(--text-color-secondary);
  }

  .clear-theme-btn {
    background: var(--red-500);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background-color 0.2s;
  }

  .clear-theme-btn:hover {
    background: var(--red-600);
  }
</style>
