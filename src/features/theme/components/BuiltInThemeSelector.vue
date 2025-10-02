<template>
  <div class="built-in-themes-section">
    <h4>Built-in Themes</h4>
    <div class="theme-options">
      <button
        v-for="theme in builtInThemes"
        :key="theme.id"
        :class="['theme-option', { active: currentTheme === theme.id }]"
        @click="setBuiltInTheme(theme.id)"
      >
        <i :class="theme.icon"></i>
        {{ theme.name }}
        <span class="theme-description">{{ theme.description }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import { logger } from '@/shared/services/logger'

  const themeStore = useThemeStore()

  const currentTheme = computed(() => themeStore.currentTheme)

  const builtInThemes = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean light theme',
      icon: 'pi pi-sun',
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes',
      icon: 'pi pi-moon',
    },
    {
      id: 'auto',
      name: 'Auto',
      description: 'Follows system',
      icon: 'pi pi-cog',
    },
  ]

  const setBuiltInTheme = async (themeId: string) => {
    try {
      await themeStore.setBuiltInTheme(themeId)
    } catch (error) {
      logger.error('Failed to set built-in theme', error as Error)
    }
  }
</script>

<style scoped>
  .built-in-themes-section {
    margin-bottom: 24px;
  }

  .built-in-themes-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .theme-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-option {
    padding: 12px 16px;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    background: var(--surface-card);
    color: var(--text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    transition: all 0.2s;
    text-align: left;
  }

  .theme-option:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
  }

  .theme-option.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .theme-option i {
    font-size: 16px;
    width: 20px;
  }

  .theme-description {
    font-size: 12px;
    opacity: 0.7;
    margin-left: auto;
  }
</style>
