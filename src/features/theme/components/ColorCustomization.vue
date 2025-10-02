<template>
  <div v-if="primaryColorEnabled" class="color-customization-section">
    <h4>Color Customization</h4>
    <div class="color-controls">
      <div class="color-input-group">
        <label for="primary-color">Primary Color</label>
        <div class="color-input-wrapper">
          <input
            id="primary-color"
            v-model="primaryColor"
            type="color"
            class="color-input"
            @change="updatePrimaryColor"
          />
          <input
            v-model="primaryColor"
            type="text"
            class="color-text-input"
            @change="updatePrimaryColor"
          />
        </div>
      </div>
      <div class="color-input-group">
        <label for="surface-color">Surface Color</label>
        <div class="color-input-wrapper">
          <input
            id="surface-color"
            v-model="surfaceColor"
            type="color"
            class="color-input"
            @change="updateSurfaceColor"
          />
          <input
            v-model="surfaceColor"
            type="text"
            class="color-text-input"
            @change="updateSurfaceColor"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { logger } from '@/shared/services/logger'
  import { ref, watch } from 'vue'
  import { useThemeStore } from '../store/themeStore'

  const themeStore = useThemeStore()

  const primaryColor = ref(themeStore.currentPrimaryColor)
  const surfaceColor = ref(themeStore.currentSurfaceColor)

  const updatePrimaryColor = async () => {
    try {
      await themeStore.updatePrimeUIColors(primaryColor.value, surfaceColor.value)
    } catch (error) {
      logger.error('Failed to update primary color', error as Error)
    }
  }

  const updateSurfaceColor = async () => {
    try {
      await themeStore.updatePrimeUIColors(primaryColor.value, surfaceColor.value)
    } catch (error) {
      logger.error('Failed to update surface color', error as Error)
    }
  }

  watch(
    () => themeStore.currentPrimaryColor,
    newColor => {
      primaryColor.value = newColor
    }
  )

  watch(
    () => themeStore.currentSurfaceColor,
    newColor => {
      surfaceColor.value = newColor
    }
  )
</script>

<style scoped>
  .color-customization-section {
    margin-bottom: 24px;
  }

  .color-customization-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .color-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .color-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .color-input-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
  }

  .color-input-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .color-input {
    width: 40px;
    height: 40px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    cursor: pointer;
  }

  .color-text-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-card);
    color: var(--text-color);
    font-size: 14px;
    font-family: monospace;
  }

  .color-text-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }
</style>
