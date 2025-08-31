<template>
  <div class="config-panel">
    <div class="config-panel-section">
      <div class="config-panel-label">Theme</div>
      <div class="config-panel-themes">
        <PrimeButton
          class="config-theme-btn"
          :class="{ 'active-theme': currentTheme === 'light' && !hasCustomTheme }"
          @click="setTheme('light')"
        >
          Light
        </PrimeButton>
        <PrimeButton
          class="config-theme-btn"
          :class="{ 'active-theme': currentTheme === 'dark' && !hasCustomTheme }"
          @click="setTheme('dark')"
        >
          Dark
        </PrimeButton>
        <PrimeButton
          class="config-theme-btn"
          :class="{ 'active-theme': currentTheme === 'auto' && !hasCustomTheme }"
          @click="setTheme('auto')"
        >
          Auto
        </PrimeButton>
      </div>
    </div>

    <div class="config-panel-section" v-if="availableCustomThemes.length > 0">
      <div class="config-panel-label">Custom Themes</div>
      <div class="config-panel-themes">
        <PrimeButton
          v-for="theme in availableCustomThemes"
          :key="theme.id"
          class="config-theme-btn"
          :class="{ 'active-theme': currentCustomTheme?.id === theme.id }"
          @click="setCustomTheme(theme.id)"
        >
          {{ theme.name }}
        </PrimeButton>
      </div>
    </div>

    <div class="config-panel-section" v-if="hasCustomTheme">
      <div class="config-panel-label">Current Custom Theme</div>
      <div class="config-panel-actions">
        <PrimeButton class="config-clear-btn" @click="clearCustomTheme">
          Clear Custom Theme
        </PrimeButton>
      </div>
    </div>

    <div class="config-panel-section">
      <div class="config-panel-label">Primary Color</div>
      <div class="config-panel-colors">
        <PrimeButton
          v-for="color in primaryColors"
          :key="color.name"
          :class="['config-color-btn', { 'active-color': currentPrimary === color.name }]"
          :style="{ backgroundColor: color.value }"
          @click="setPrimaryColor(color.name)"
        ></PrimeButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useLayout } from './composables/layout'
  import { useThemeStore } from '@/features/theme/store/themeStore'

  // Layout composable
  const { layoutConfig } = useLayout()

  // Theme store
  const themeStore = useThemeStore()

  // Computed
  const currentPrimary = computed(() => layoutConfig.primary)
  const currentTheme = computed(() => themeStore.currentTheme)
  const hasCustomTheme = computed(() => themeStore.hasCustomTheme)
  const currentCustomTheme = computed(() => themeStore.currentCustomTheme)
  const availableCustomThemes = computed(() => themeStore.availableCustomThemes)

  // Primary colors
  const primaryColors = [
    { name: 'emerald', value: '#10b981' },
    { name: 'blue', value: '#3b82f6' },
    { name: 'purple', value: '#8b5cf6' },
    { name: 'red', value: '#ef4444' },
    { name: 'orange', value: '#f97316' },
    { name: 'teal', value: '#14b8a6' },
  ]

  // Methods
  const setTheme = async (theme: 'light' | 'dark' | 'auto') => {
    try {
      await themeStore.setBuiltInTheme(theme)
    } catch (error) {
      console.error('Failed to set theme:', error)
    }
  }

  const setCustomTheme = async (themeId: string) => {
    try {
      await themeStore.setCustomTheme(themeId)
    } catch (error) {
      console.error('Failed to set custom theme:', error)
    }
  }

  const clearCustomTheme = async () => {
    try {
      await themeStore.clearCustomTheme()
    } catch (error) {
      console.error('Failed to clear custom theme:', error)
    }
  }

  const setPrimaryColor = (color: string) => {
    layoutConfig.primary = color

    // Update CSS custom properties with proper color values
    const colorValue = primaryColors.find(c => c.name === color)?.value

    if (colorValue) {
      const root = document.documentElement

      // Set the primary color
      root.style.setProperty('--primary-color', colorValue)

      // Generate hover and active variants
      const hoverColor = generateHoverColor(colorValue)
      const activeColor = generateActiveColor(colorValue)

      // Set the variant colors
      root.style.setProperty('--primary-color-hover', hoverColor)
      root.style.setProperty('--primary-color-active', activeColor)

      // Store in localStorage for persistence
      localStorage.setItem('penguin-pool-primary-color', color)

      console.log(`Primary color applied: ${color} (${colorValue})`)
    } else {
      console.error(`Color not found: ${color}`)
    }
  }

  // Helper functions to generate color variants
  const generateHoverColor = (color: string) => {
    // Darken the color by 10%
    return darkenColor(color, 0.1)
  }

  const generateActiveColor = (color: string) => {
    // Darken the color by 20%
    return darkenColor(color, 0.2)
  }

  const darkenColor = (color: string, amount: number) => {
    // Simple color darkening for hex colors
    const hex = color.replace('#', '')
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount))
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount))
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount))

    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
  }

  // Initialize on component mount
  onMounted(() => {
    // Apply saved primary color
    const savedColor = localStorage.getItem('penguin-pool-primary-color')
    if (savedColor && primaryColors.some(c => c.name === savedColor)) {
      setPrimaryColor(savedColor)
    } else {
      // Apply default color
      setPrimaryColor('emerald')
    }
  })
</script>

<style scoped>
  .config-panel {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4;
    min-width: 20rem;
    z-index: 1001;
  }

  .config-panel-section {
    @apply mb-4;
  }

  .config-panel-section:last-child {
    @apply mb-0;
  }

  .config-panel-label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2;
  }

  .config-panel-themes {
    @apply flex flex-wrap gap-2;
  }

  .config-theme-btn {
    @apply px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200;
    @apply bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600;
  }

  .config-theme-btn:hover {
    @apply bg-gray-50 dark:bg-gray-600;
  }

  .config-theme-btn.active-theme {
    @apply bg-primary-500 text-white border-primary-500;
  }

  .config-panel-actions {
    @apply flex flex-wrap gap-2;
  }

  .config-clear-btn {
    @apply px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200;
    @apply bg-red-500 text-white border-red-500;
  }

  .config-clear-btn:hover {
    @apply bg-red-600 border-red-600;
  }

  .config-panel-colors {
    @apply flex flex-wrap gap-2;
  }

  .config-color-btn {
    @apply w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 transition-all duration-200;
    cursor: pointer;
  }

  .config-color-btn:hover {
    @apply scale-110;
  }

  .config-color-btn.active-color {
    @apply border-primary-500 ring-2 ring-primary-500/20;
  }
</style>
