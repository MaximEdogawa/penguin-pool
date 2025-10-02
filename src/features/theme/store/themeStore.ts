import { useFeatureFlagsStore } from '@/stores/featureFlags'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { themeManager } from '../services/themeManager'
import { logger } from '@/shared/services/logger'
import type { BuiltInTheme, CustomTheme, PrimeUITheme, ThemeMode } from '../types/theme'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<ThemeMode>('light')
  const systemTheme = ref<'light' | 'dark'>('light')
  const currentCustomTheme = ref<CustomTheme | null>(null)
  const currentPrimeUITheme = ref<PrimeUITheme | null>(null)
  const currentPrimaryColor = ref<string>('#3b82f6')
  const currentSurfaceColor = ref<string>('#ffffff')
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
    if (currentPrimeUITheme.value) {
      return false // PrimeUI themes are light by default
    }
    return currentTheme.value === 'dark'
  })

  const isWindows95 = computed(() => {
    if (currentCustomTheme.value) {
      return currentCustomTheme.value.id === 'windows95'
    }
    return false
  })

  const isPrimeUI = computed(() => {
    return currentPrimeUITheme.value && !currentCustomTheme.value
  })

  const currentThemeVariant = computed(() => {
    if (currentCustomTheme.value) {
      return currentCustomTheme.value.category === 'retro' ? 'dark' : 'light'
    }
    if (currentPrimeUITheme.value) {
      // Extract variant from theme mode if it exists
      if (typeof currentTheme.value === 'string' && currentTheme.value.includes('-')) {
        const parts = currentTheme.value.split('-')
        if (
          parts.length >= 2 &&
          (parts[parts.length - 1] === 'light' || parts[parts.length - 1] === 'dark')
        ) {
          return parts[parts.length - 1] as 'light' | 'dark'
        }
      }
      return 'light' // Default to light for PrimeUI themes
    }
    return currentTheme.value === 'dark' ? 'dark' : 'light'
  })

  const hasCustomTheme = computed(() => currentCustomTheme.value !== null)

  const availablePrimeUIThemes = computed(() => {
    return themeManager.getPrimeUIThemes()
  })

  // Actions
  const setBuiltInTheme = async (theme: BuiltInTheme) => {
    try {
      // Clear any custom theme and PrimeUI theme
      currentCustomTheme.value = null
      currentPrimeUITheme.value = null
      currentTheme.value = theme
      await themeManager.switchTheme(theme)
    } catch (error) {
      logger.error('Failed to set built-in theme:', error)
      throw error
    }
  }

  const setPrimeUITheme = async (theme: PrimeUITheme, variant?: 'light' | 'dark') => {
    try {
      // Clear any custom theme
      currentCustomTheme.value = null
      currentPrimeUITheme.value = theme

      // Set theme mode with variant if provided
      if (variant) {
        currentTheme.value = `${theme}-${variant}` as ThemeMode
      } else {
        currentTheme.value = theme
      }

      await themeManager.switchTheme(currentTheme.value)
    } catch (error) {
      logger.error('Failed to set PrimeUI theme:', error)
      throw error
    }
  }

  const switchThemeVariant = async (variant: 'light' | 'dark') => {
    try {
      if (currentCustomTheme.value) {
        // For custom themes, we need to create a new theme with the variant
        // This is a simplified approach - in a real implementation you might want to
        // create a copy of the theme with different colors
        // For now, just log the action since we don't have variant support for custom themes
      } else if (currentPrimeUITheme.value) {
        // For PrimeUI themes, switch the variant
        await setPrimeUITheme(currentPrimeUITheme.value, variant)
      } else {
        // For built-in themes, just set the theme
        await setBuiltInTheme(variant === 'dark' ? 'dark' : 'light')
      }
    } catch (error) {
      logger.error('Failed to switch theme variant:', error)
      throw error
    }
  }

  const updatePrimeUIColors = async (primaryColor: string, surfaceColor: string) => {
    try {
      currentPrimaryColor.value = primaryColor
      currentSurfaceColor.value = surfaceColor
      await themeManager.updatePrimeUIColors(primaryColor, surfaceColor)
    } catch (error) {
      logger.error('Failed to update PrimeUI colors:', error)
      throw error
    }
  }

  const toggleTheme = () => {
    if (!hasCustomTheme.value) {
      const currentVariant = currentThemeVariant.value
      const newVariant = currentVariant === 'light' ? 'dark' : 'light'
      setPrimeUITheme(currentPrimeUITheme.value!, newVariant)
    } else {
      setPrimeUITheme('aura', 'light')
    }
  }

  const setCustomTheme = async (themeId: string) => {
    try {
      const customTheme = themeManager.getThemeById(themeId)
      if (customTheme) {
        currentCustomTheme.value = customTheme
        currentPrimeUITheme.value = null
        await themeManager.switchTheme(themeId)
      } else {
        throw new Error(`Custom theme ${themeId} not found`)
      }
    } catch (error) {
      logger.error('Failed to set custom theme:', error)
      throw error
    }
  }

  const clearCustomTheme = async () => {
    try {
      currentCustomTheme.value = null
      await themeManager.switchTheme(currentTheme.value)
    } catch (error) {
      logger.error('Failed to clear custom theme:', error)
    }
  }

  const initializeTheme = async () => {
    try {
      // Load available custom themes
      await loadAvailableThemes()

      // Load saved theme from localStorage
      const savedTheme = localStorage.getItem('penguin-pool-theme') as ThemeMode
      if (savedTheme) {
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
          currentTheme.value = savedTheme as BuiltInTheme
        } else if (
          savedTheme.includes('-') &&
          availablePrimeUIThemes.value.includes(savedTheme.split('-')[0] as PrimeUITheme)
        ) {
          // Handle PrimeUI themes with variants
          const [theme] = savedTheme.split('-')
          currentPrimeUITheme.value = theme as PrimeUITheme
          currentTheme.value = savedTheme as ThemeMode
        } else if (availablePrimeUIThemes.value.includes(savedTheme as PrimeUITheme)) {
          // Handle PrimeUI themes without variants (fallback)
          currentPrimeUITheme.value = savedTheme as PrimeUITheme
          currentTheme.value = savedTheme as ThemeMode
        }
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
          logger.error('Failed to load saved custom theme:', error)
        }
      }

      // Load PrimeUI theme preferences
      const savedPrimeUITheme = localStorage.getItem('penguin-pool-primeui-theme')
      if (
        savedPrimeUITheme &&
        availablePrimeUIThemes.value.includes(savedPrimeUITheme as PrimeUITheme)
      ) {
        currentPrimeUITheme.value = savedPrimeUITheme as PrimeUITheme
      }

      // Load color preferences
      const savedPrimaryColor = localStorage.getItem('penguin-pool-primary-color')
      if (savedPrimaryColor) {
        currentPrimaryColor.value = savedPrimaryColor
      }

      const savedSurfaceColor = localStorage.getItem('penguin-pool-surface-color')
      if (savedSurfaceColor) {
        currentSurfaceColor.value = savedSurfaceColor
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
        if (themeId === 'light' || themeId === 'dark' || themeId === 'auto') {
          currentTheme.value = themeId as BuiltInTheme
          currentCustomTheme.value = null
          currentPrimeUITheme.value = 'lara'
        } else if (availablePrimeUIThemes.value.includes(themeId as PrimeUITheme)) {
          currentPrimeUITheme.value = themeId as PrimeUITheme
          currentTheme.value = themeId as ThemeMode
          currentCustomTheme.value = null
        } else {
          // Custom theme
          const customTheme = themeManager.getThemeById(themeId)
          if (customTheme) {
            currentCustomTheme.value = customTheme
            currentPrimeUITheme.value = 'lara'
          }
        }
      }) as EventListener)
    } catch (error) {
      logger.error('Failed to initialize theme:', error)
    }
  }

  const applyTheme = async () => {
    try {
      const themeToApply = currentCustomTheme.value
        ? currentCustomTheme.value.id
        : currentTheme.value
      await themeManager.switchTheme(themeToApply)
    } catch (error) {
      logger.error('Failed to apply theme:', error)
    }
  }

  const loadAvailableThemes = async () => {
    try {
      // Check if custom themes feature is enabled
      const featureFlags = useFeatureFlagsStore()
      const customThemesEnabled = featureFlags.isUIFeatureEnabled('customThemes')

      if (customThemesEnabled) {
        const themes = themeManager.getAvailableThemes()
        availableCustomThemes.value = themes
        customThemes.value = themes.filter(theme => theme.id.includes('-custom-'))
      } else {
        // If custom themes are disabled, clear the available themes
        availableCustomThemes.value = []
        customThemes.value = []
      }
    } catch (error) {
      logger.error('Failed to load available themes:', error)
    }
  }

  const addCustomTheme = async (theme: CustomTheme) => {
    try {
      // Check if custom themes feature is enabled
      const featureFlags = useFeatureFlagsStore()
      const customThemesEnabled = featureFlags.isUIFeatureEnabled('customThemes')

      if (!customThemesEnabled) {
        throw new Error('Custom themes feature is disabled')
      }

      themeManager.addCustomTheme(theme)
      await loadAvailableThemes()
    } catch (error) {
      logger.error('Failed to add custom theme:', error)
      throw error
    }
  }

  const removeCustomTheme = async (themeId: string) => {
    try {
      // Check if custom themes feature is enabled
      const featureFlags = useFeatureFlagsStore()
      const customThemesEnabled = featureFlags.isUIFeatureEnabled('customThemes')

      if (!customThemesEnabled) {
        throw new Error('Custom themes feature is disabled')
      }

      themeManager.removeCustomTheme(themeId)
      await loadAvailableThemes()
    } catch (error) {
      logger.error('Failed to remove custom theme:', error)
    }
  }

  const exportTheme = (themeId: string): string => {
    return themeManager.exportTheme(themeId)
  }

  const importTheme = async (themeJson: string): Promise<CustomTheme> => {
    try {
      // Check if custom themes feature is enabled
      const featureFlags = useFeatureFlagsStore()
      const customThemesEnabled = featureFlags.isUIFeatureEnabled('customThemes')

      if (!customThemesEnabled) {
        throw new Error('Custom themes feature is disabled')
      }

      const theme = themeManager.importTheme(themeJson)
      await loadAvailableThemes()
      return theme
    } catch (error) {
      logger.error('Failed to import theme:', error)
      throw error
    }
  }

  const refreshThemes = async () => {
    await loadAvailableThemes()
  }

  // Legacy methods for backward compatibility
  const setTheme = async (theme: ThemeMode) => {
    try {
      if (theme === 'light' || theme === 'dark' || theme === 'auto') {
        await setBuiltInTheme(theme as BuiltInTheme)
      } else if (availablePrimeUIThemes.value.includes(theme as PrimeUITheme)) {
        // For PrimeUI themes, always include a default variant
        await setPrimeUITheme(theme as PrimeUITheme, 'light')
      } else {
        await setCustomTheme(theme)
      }
    } catch (error) {
      logger.error('Failed to set theme:', error)
      throw error
    }
  }

  return {
    // State
    currentTheme,
    systemTheme,
    currentCustomTheme,
    currentPrimeUITheme,
    currentPrimaryColor,
    currentSurfaceColor,
    availableCustomThemes,
    customThemes,

    // Getters
    effectiveTheme,
    isDark,
    isWindows95,
    isPrimeUI,
    currentThemeVariant,
    hasCustomTheme,
    availablePrimeUIThemes,

    // Actions
    setBuiltInTheme,
    setPrimeUITheme,
    updatePrimeUIColors,
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
    switchThemeVariant,

    // Legacy methods
    setTheme,
  }
})
