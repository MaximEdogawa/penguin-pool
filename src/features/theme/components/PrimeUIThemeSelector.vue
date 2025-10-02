<template>
  <div class="primeui-themes-section">
    <h4>PrimeUI Themes</h4>
    <div class="primeui-grid">
      <div
        v-for="theme in primeUIThemes"
        :key="theme.id"
        class="primeui-theme-card"
        :class="{ active: currentPrimeUITheme === theme.id }"
        @click="setPrimeUITheme(theme.id)"
      >
        <div class="theme-preview" :style="getPrimeUIThemePreview(theme)"></div>
        <div class="theme-info">
          <h5>{{ theme.name }}</h5>
          <p>{{ theme.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import { logger } from '@/shared/services/logger'

  const themeStore = useThemeStore()

  const currentPrimeUITheme = computed(() => themeStore.currentPrimeUITheme)

  const primeUIThemes = [
    { id: 'aura', name: 'Aura', description: 'Modern and clean' },
    { id: 'lara', name: 'Lara', description: 'Professional look' },
    { id: 'saga', name: 'Saga', description: 'Classic design' },
    { id: 'vela', name: 'Vela', description: 'Elegant style' },
    { id: 'arya', name: 'Arya', description: 'Dark theme' },
    { id: 'nova', name: 'Nova', description: 'Fresh design' },
    { id: 'fluent', name: 'Fluent', description: 'Microsoft style' },
    { id: 'material', name: 'Material', description: 'Google design' },
    { id: 'bootstrap', name: 'Bootstrap', description: 'Twitter style' },
  ]

  const getPrimeUIThemePreview = (_theme: { id: string }) => ({
    background: themeStore.currentSurfaceColor,
    border: `1px solid ${themeStore.currentPrimaryColor}`,
    color: themeStore.currentPrimaryColor,
  })

  const setPrimeUITheme = async (themeId: string) => {
    try {
      await themeStore.setPrimeUITheme(themeId, themeStore.currentThemeVariant)
    } catch (error) {
      logger.error('Failed to set PrimeUI theme', error as Error)
    }
  }
</script>

<style scoped>
  .primeui-themes-section {
    margin-bottom: 24px;
  }

  .primeui-themes-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .primeui-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .primeui-theme-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primeui-theme-card:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
  }

  .primeui-theme-card.active {
    border-color: var(--primary-color);
    background: var(--primary-color-text);
  }

  .theme-preview {
    width: 100%;
    height: 40px;
    border-radius: 4px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 500;
  }

  .theme-info h5 {
    font-size: 12px;
    font-weight: 600;
    margin: 0 0 2px 0;
    color: var(--text-color);
  }

  .theme-info p {
    font-size: 10px;
    color: var(--text-color-secondary);
    margin: 0;
  }
</style>
