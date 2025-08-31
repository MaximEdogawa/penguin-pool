import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { themeManager } from '../services/themeManager'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<'light' | 'dark' | 'windows95'>('light')

  // Getters
  const isDark = computed(() => currentTheme.value === 'dark')
  const isWindows95 = computed(() => currentTheme.value === 'windows95')

  // Actions
  const setTheme = async (theme: 'light' | 'dark' | 'windows95') => {
    try {
      currentTheme.value = theme
      await themeManager.switchTheme(theme)
    } catch (error) {
      console.error('Failed to set theme:', error)
      throw error
    }
  }

  const toggleTheme = async () => {
    await themeManager.toggleTheme()
    // Update local state after theme manager changes
    currentTheme.value = themeManager.getCurrentTheme()
  }

  const initializeTheme = async () => {
    try {
      console.log('Initializing theme store...')

      // Get current theme from theme manager
      const theme = themeManager.getCurrentTheme()
      currentTheme.value = theme

      console.log('Theme store initialized with theme:', theme)
    } catch (error) {
      console.error('Failed to initialize theme:', error)
      // Fallback to light theme
      currentTheme.value = 'light'
    }
  }

  return {
    // State
    currentTheme,

    // Getters
    isDark,
    isWindows95,

    // Actions
    setTheme,
    toggleTheme,
    initializeTheme,
  }
})
