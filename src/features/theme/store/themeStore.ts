import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CustomTheme } from '@/app/types/theme'
import { themeManager } from '../services/themeManager'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<'light' | 'dark'>('light')
  const systemTheme = ref<'light' | 'dark'>('light')
  const currentCustomTheme = ref<CustomTheme | null>(null)
  const availableCustomThemes = ref<CustomTheme[]>([])
  const customThemes = ref<CustomTheme[]>([])

  // Getters
  const effectiveTheme = computed(() => {
    // If a custom theme is active, use it, otherwise use built-in theme
    return currentCustomTheme.value ? currentCustomTheme.value.id : currentTheme.value
  })

  const isDark = computed(() => {
    if (currentCustomTheme.value) {
      return currentCustomTheme.value.category === 'retro'
    }
    return currentTheme.value === 'dark'
  })

  const hasCustomTheme = computed(() => currentCustomTheme.value !== null)

  // Actions
  const setBuiltInTheme = async (theme: 'light' | 'dark') => {
    try {
      // Clear any custom theme
      currentCustomTheme.value = null
      currentTheme.value = theme
      await themeManager.switchTheme(theme)
    } catch (error) {
      console.error('Failed to set built-in theme:', error)
      throw error
    }
  }

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = currentTheme.value === 'light' ? 'dark' : 'light'
    setBuiltInTheme(newTheme)
  }

  const setCustomTheme = async (themeId: string) => {
    try {
      const customTheme = themeManager.getThemeById(themeId)
      if (customTheme) {
        currentCustomTheme.value = customTheme
        await themeManager.switchTheme(themeId)
      } else {
        throw new Error(`Custom theme ${themeId} not found`)
      }
    } catch (error) {
      console.error('Failed to set custom theme:', error)
      throw error
    }
  }

  const clearCustomTheme = async () => {
    try {
      currentCustomTheme.value = null
      await themeManager.switchTheme(currentTheme.value)
    } catch (error) {
      console.error('Failed to clear custom theme:', error)
      throw error
    }
  }

  const initializeTheme = async () => {
    try {
      console.log('Initializing theme store...') // Debug log

      // Load available custom themes
      await loadAvailableThemes()

      // Load saved theme from localStorage
      const savedTheme = localStorage.getItem('penguin-pool-theme') as 'light' | 'dark'
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        currentTheme.value = savedTheme
      }

      // Load saved custom theme from localStorage
      const savedCustomTheme = localStorage.getItem('penguin-pool-custom-theme')
      if (savedCustomTheme) {
        try {
          const customTheme = JSON.parse(savedCustomTheme) as CustomTheme
          if (themeManager.getThemeById(customTheme.id)) {
            currentCustomTheme.value = customTheme
          }
        } catch (error) {
          console.error('Failed to load saved custom theme:', error)
        }
      }

      // Detect system theme
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        systemTheme.value = mediaQuery.matches ? 'dark' : 'light'
      }

      // Apply the current theme
      await applyTheme()

      // Listen for theme change events
      window.addEventListener('theme-changed', ((e: CustomEvent) => {
        const themeId = e.detail.theme
        if (themeId === 'light' || themeId === 'dark') {
          currentTheme.value = themeId
          currentCustomTheme.value = null
        } else {
          // Custom theme
          const customTheme = themeManager.getThemeById(themeId)
          if (customTheme) {
            currentCustomTheme.value = customTheme
          }
        }
      }) as EventListener)

      console.log('Theme store initialized successfully') // Debug log
    } catch (error) {
      console.error('Failed to initialize theme:', error)
    }
  }

  const applyTheme = async () => {
    try {
      const themeToApply = currentCustomTheme.value
        ? currentCustomTheme.value.id
        : currentTheme.value
      await themeManager.switchTheme(themeToApply)
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }

  const loadAvailableThemes = async () => {
    try {
      const themes = themeManager.getAvailableThemes()
      console.log('Available themes loaded:', themes) // Debug log
      availableCustomThemes.value = themes
      customThemes.value = themes.filter(theme => theme.id.includes('-custom-'))
    } catch (error) {
      console.error('Failed to load available themes:', error)
    }
  }

  const addCustomTheme = async (theme: CustomTheme) => {
    try {
      themeManager.addCustomTheme(theme)
      await loadAvailableThemes()
    } catch (error) {
      console.error('Failed to add custom theme:', error)
      throw error
    }
  }

  const removeCustomTheme = async (themeId: string) => {
    try {
      themeManager.removeCustomTheme(themeId)
      await loadAvailableThemes()
    } catch (error) {
      console.error('Failed to remove custom theme:', error)
      throw error
    }
  }

  const exportTheme = (themeId: string): string => {
    return themeManager.exportTheme(themeId)
  }

  const importTheme = async (themeJson: string): Promise<CustomTheme> => {
    try {
      const theme = themeManager.importTheme(themeJson)
      await loadAvailableThemes()
      return theme
    } catch (error) {
      console.error('Failed to import theme:', error)
      throw error
    }
  }

  const refreshThemes = async () => {
    await loadAvailableThemes()
  }

  return {
    // State
    currentTheme,
    systemTheme,
    currentCustomTheme,
    availableCustomThemes,
    customThemes,

    // Getters
    effectiveTheme,
    isDark,
    hasCustomTheme,

    // Actions
    setBuiltInTheme,
    toggleTheme,
    setCustomTheme,
    clearCustomTheme,
    initializeTheme,
    applyTheme,
    loadAvailableThemes,
    addCustomTheme,
    removeCustomTheme,
    exportTheme,
    importTheme,
    refreshThemes,
  }
})
