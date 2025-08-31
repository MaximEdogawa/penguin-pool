import type { CustomTheme } from '@/app/types/theme'
import { windows95Theme } from '../themes/windows95'

export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: string = 'auto'
  private availableThemes: CustomTheme[] = [windows95Theme]
  private customThemes: CustomTheme[] = []

  private constructor() {
    this.loadThemes()
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private loadThemes(): void {
    // Load custom themes from localStorage
    const savedCustomThemes = localStorage.getItem('penguin-pool-custom-themes')
    if (savedCustomThemes) {
      try {
        this.customThemes = JSON.parse(savedCustomThemes)
      } catch (error) {
        console.error('Failed to load custom themes:', error)
        this.customThemes = []
      }
    }

    // Load current theme from localStorage
    const savedTheme = localStorage.getItem('penguin-pool-theme')
    if (savedTheme) {
      this.currentTheme = savedTheme
    }
  }

  public getAvailableThemes(): CustomTheme[] {
    const themes = [...this.availableThemes, ...this.customThemes]
    console.log('ThemeManager.getAvailableThemes():', themes) // Debug log
    return themes
  }

  public getCurrentTheme(): string {
    return this.currentTheme
  }

  public getThemeById(themeId: string): CustomTheme | undefined {
    return this.getAvailableThemes().find(theme => theme.id === themeId)
  }

  public async switchTheme(themeId: string): Promise<void> {
    try {
      // Remove all existing theme classes
      this.removeAllThemeClasses()

      if (themeId === 'light' || themeId === 'dark') {
        // Handle built-in themes
        this.currentTheme = themeId
        this.applyBuiltInTheme(themeId)
        // Save built-in theme preference
        localStorage.setItem('penguin-pool-theme', this.currentTheme)
        // Clear any saved custom theme
        localStorage.removeItem('penguin-pool-custom-theme')
      } else {
        // Handle custom themes
        const customTheme = this.getThemeById(themeId)
        if (customTheme) {
          this.currentTheme = themeId
          this.applyCustomTheme(customTheme)
          // Save custom theme preference
          localStorage.setItem('penguin-pool-custom-theme', JSON.stringify(customTheme))
        } else {
          throw new Error(`Theme ${themeId} not found`)
        }
      }

      // Dispatch theme change event
      window.dispatchEvent(
        new CustomEvent('theme-changed', {
          detail: { theme: this.currentTheme },
        })
      )
    } catch (error) {
      console.error('Failed to switch theme:', error)
      throw error
    }
  }

  private removeAllThemeClasses(): void {
    const root = document.documentElement
    const themeClasses = Array.from(root.classList).filter(cls => cls.startsWith('theme-'))
    themeClasses.forEach(cls => root.classList.remove(cls))

    // Also remove light/dark classes
    root.classList.remove('light', 'dark')
  }

  private applyBuiltInTheme(theme: string): void {
    const root = document.documentElement

    if (theme === 'auto') {
      // Detect system theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Update meta theme-color
    this.updateMetaThemeColor(theme)
  }

  private applyCustomTheme(theme: CustomTheme): void {
    const root = document.documentElement

    // Add custom theme class
    root.classList.add(`theme-${theme.id}`)

    // Apply CSS custom properties
    this.applyThemeVariables(theme)

    // Update meta theme-color
    this.updateMetaThemeColor(theme.colors.primary)
  }

  private applyThemeVariables(theme: CustomTheme): void {
    const root = document.documentElement

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })

    // Apply typography variables
    Object.entries(theme.typography).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })

    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })

    // Apply shadow variables
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })

    // Apply border radius variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })
  }

  private updateMetaThemeColor(color: string): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color)
    }
  }

  public addCustomTheme(theme: CustomTheme): void {
    // Ensure unique ID
    if (this.getThemeById(theme.id)) {
      throw new Error(`Theme with ID ${theme.id} already exists`)
    }

    this.customThemes.push(theme)
    this.saveCustomThemes()
  }

  public removeCustomTheme(themeId: string): void {
    const index = this.customThemes.findIndex(theme => theme.id === themeId)
    if (index !== -1) {
      this.customThemes.splice(index, 1)
      this.saveCustomThemes()

      // If this was the current theme, switch to auto
      if (this.currentTheme === themeId) {
        this.switchTheme('auto')
      }
    }
  }

  private saveCustomThemes(): void {
    localStorage.setItem('penguin-pool-custom-themes', JSON.stringify(this.customThemes))
  }

  public exportTheme(themeId: string): string {
    const theme = this.getThemeById(themeId)
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`)
    }

    return JSON.stringify(theme, null, 2)
  }

  public importTheme(themeJson: string): CustomTheme {
    try {
      const theme = JSON.parse(themeJson) as CustomTheme

      // Validate theme structure
      if (!this.validateTheme(theme)) {
        throw new Error('Invalid theme structure')
      }

      // Generate unique ID if one already exists
      if (this.getThemeById(theme.id)) {
        theme.id = `${theme.id}-${Date.now()}`
      }

      this.addCustomTheme(theme)
      return theme
    } catch (error) {
      throw new Error(`Failed to import theme: ${error}`)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validateTheme(theme: any): theme is CustomTheme {
    return (
      theme &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.category === 'string' &&
      theme.colors &&
      theme.typography &&
      theme.spacing &&
      theme.shadows &&
      theme.borderRadius
    )
  }

  public getThemePreview(theme: CustomTheme): string {
    // Return a CSS snippet that can be used for theme previews
    return `
      .theme-preview-${theme.id} {
        --theme-primary: ${theme.colors.primary};
        --theme-background: ${theme.colors.background};
        --theme-surface: ${theme.colors.surface};
        --theme-text: ${theme.colors.text};
        --theme-border: ${theme.colors.border};
      }
    `
  }
}

export const themeManager = ThemeManager.getInstance()
