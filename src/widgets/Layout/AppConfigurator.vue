<template>
  <div class="config-panel">
    <div class="config-panel-section">
      <div class="config-panel-label">Theme Preset</div>
      <div class="config-panel-presets">
        <button
          v-for="preset in themePresets"
          :key="preset.name"
          :class="['config-preset-btn', { 'active-preset': currentPreset === preset.name }]"
          @click="setThemePreset(preset.name)"
        >
          {{ preset.label }}
        </button>
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

    <div class="config-panel-section">
      <div class="config-panel-label">Custom Themes</div>
      <div class="config-panel-themes">
        <PrimeButton
          v-for="theme in availableThemes"
          :key="theme.id"
          :class="['config-theme-btn', { 'active-theme': currentTheme === theme.id }]"
          @click="setCustomTheme(theme.id)"
        >
          {{ theme.name }}
        </PrimeButton>
        <PrimeButton class="config-theme-btn config-theme-btn-clear" @click="clearCustomTheme">
          Clear
        </PrimeButton>
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
  const currentPreset = computed(() => layoutConfig.preset)
  const currentPrimary = computed(() => layoutConfig.primary)
  const currentTheme = computed(() => themeStore.effectiveTheme)
  const availableThemes = computed(() => themeStore.availableCustomThemes)

  // Theme presets
  const themePresets = [
    { name: 'Aura', label: 'Aura' },
    { name: 'Saga', label: 'Saga' },
    { name: 'Vela', label: 'Vela' },
    { name: 'Arya', label: 'Arya' },
  ]

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
  const setThemePreset = (preset: string) => {
    layoutConfig.preset = preset

    // Apply theme preset by updating CSS classes
    const root = document.documentElement

    // Remove all existing theme classes
    root.classList.remove('theme-aura', 'theme-saga', 'theme-vela', 'theme-arya')

    // Add the new theme class
    root.classList.add(`theme-${preset.toLowerCase()}`)

    // Update data attribute for consistency
    root.setAttribute('data-theme', preset.toLowerCase())

    // Store in localStorage for persistence
    localStorage.setItem('penguin-pool-theme-preset', preset)

    console.log(`Theme preset applied: ${preset}`)
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

  // Initialize themes on component mount
  onMounted(() => {
    // Apply saved theme preset
    const savedPreset = localStorage.getItem('penguin-pool-theme-preset')
    if (savedPreset && themePresets.some(p => p.name === savedPreset)) {
      setThemePreset(savedPreset)
    } else {
      // Apply default theme
      setThemePreset('Aura')
    }

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

  .config-panel-presets {
    @apply flex flex-wrap gap-2;
  }

  .config-preset-btn {
    @apply px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200;
    @apply bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600;
  }

  .config-preset-btn:hover {
    @apply bg-gray-50 dark:bg-gray-600;
  }

  .config-preset-btn.active-preset {
    @apply bg-primary-500 text-white border-primary-500;
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

  .config-panel-settings {
    @apply flex flex-col gap-2;
  }

  .config-radio {
    @apply flex items-center gap-2 cursor-pointer;
  }

  .config-radio input[type='radio'] {
    @apply w-4 h-4 text-primary-500 border-gray-300 dark:border-gray-600;
  }

  .config-radio span {
    @apply text-sm text-gray-700 dark:text-gray-300;
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

  .config-theme-btn-clear {
    @apply bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800;
  }

  .config-theme-btn-clear:hover {
    @apply bg-red-100 dark:bg-red-800/30;
  }
</style>
