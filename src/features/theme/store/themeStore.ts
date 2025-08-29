import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Theme } from '@/app/types/common'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<Theme>('auto')
  const systemTheme = ref<'light' | 'dark'>('light')

  // Getters
  const effectiveTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      return systemTheme.value
    }
    return currentTheme.value
  })

  const isDark = computed(() => effectiveTheme.value === 'dark')

  // Actions
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem('penguin-pool-theme', theme)
    applyTheme()
  }

  const toggleTheme = () => {
    const newTheme: Theme = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const initializeTheme = async () => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('penguin-pool-theme') as Theme
    if (savedTheme) {
      currentTheme.value = savedTheme
    }

    // Detect system theme
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemTheme.value = mediaQuery.matches ? 'dark' : 'light'

      // Listen for system theme changes
      mediaQuery.addEventListener('change', e => {
        systemTheme.value = e.matches ? 'dark' : 'light'
        if (currentTheme.value === 'auto') {
          applyTheme()
        }
      })
    }

    applyTheme()
  }

  const applyTheme = () => {
    const theme = effectiveTheme.value
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#f9fafb')
    }
  }

  return {
    // State
    currentTheme,
    systemTheme,

    // Getters
    effectiveTheme,
    isDark,

    // Actions
    setTheme,
    toggleTheme,
    initializeTheme,
    applyTheme,
  }
})
