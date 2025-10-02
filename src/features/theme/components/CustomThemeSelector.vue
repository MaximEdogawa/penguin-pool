<template>
  <div class="custom-themes-section">
    <h4>Custom Themes</h4>
    <div v-if="availableCustomThemes.length > 0" class="themes-grid">
      <div
        v-for="theme in availableCustomThemes"
        :key="theme.id"
        class="theme-card"
        :class="{ active: currentCustomTheme?.id === theme.id }"
        @click="applyCustomTheme(theme.id)"
      >
        <div class="theme-preview" :style="getThemePreview(theme)"></div>
        <div class="theme-info">
          <h5>{{ theme.name }}</h5>
          <p>{{ theme.description }}</p>
          <span class="theme-category">{{ theme.category }}</span>
        </div>
      </div>
    </div>
    <div v-else class="no-themes">
      <p>No custom themes available. Create or import a theme to get started.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import { logger } from '@/shared/services/logger'
  import type { CustomTheme } from '../types/theme'

  const themeStore = useThemeStore()

  const availableCustomThemes = computed(() => themeStore.availableCustomThemes)
  const currentCustomTheme = computed(() => themeStore.currentCustomTheme)

  const getThemePreview = (theme: CustomTheme) => ({
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.text,
  })

  const applyCustomTheme = async (themeId: string) => {
    try {
      await themeStore.setCustomTheme(themeId)
    } catch (error) {
      logger.error('Failed to apply custom theme', error as Error)
    }
  }
</script>

<style scoped>
  .custom-themes-section {
    margin-bottom: 24px;
  }

  .custom-themes-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .theme-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-card:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
  }

  .theme-card.active {
    border-color: var(--primary-color);
    background: var(--primary-color-text);
  }

  .theme-preview {
    width: 100%;
    height: 60px;
    border-radius: 6px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
  }

  .theme-info h5 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--text-color);
  }

  .theme-info p {
    font-size: 12px;
    color: var(--text-color-secondary);
    margin: 0 0 8px 0;
  }

  .theme-category {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--surface-100);
    color: var(--text-color-secondary);
  }

  .no-themes {
    text-align: center;
    padding: 32px 16px;
    color: var(--text-color-secondary);
  }
</style>
