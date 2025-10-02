import { windows95Theme } from '../themes/windows95'
import type {
  BuiltInTheme,
  CustomTheme,
  PrimeUITheme,
  ThemeMode,
  ThemeVariant,
} from '../types/theme'
import { primeUIThemeService } from './primeUIThemeService'

export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: ThemeMode = 'aura-light'
  private readonly availableThemes: CustomTheme[] = [windows95Theme]
  private customThemes: CustomTheme[] = []
  private readonly primeUIThemes: PrimeUITheme[] = ['aura', 'material', 'lara', 'nora']
  private currentPrimeUITheme: PrimeUITheme = 'aura'
  private currentThemeVariant: ThemeVariant = 'light'
  private currentPrimaryColor: string = '#6366f1'
  private currentSurfaceColor: string = '#ffffff'

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
      } catch {
        // Failed to load custom themes
        this.customThemes = []
      }
    }

    // Load current theme from localStorage
    const savedTheme = localStorage.getItem('penguin-pool-theme')
    if (savedTheme) {
      this.currentTheme = savedTheme
      // Parse PrimeUI theme and variant
      if (savedTheme.includes('-')) {
        const [theme, variant] = savedTheme.split('-')
        if (this.primeUIThemes.includes(theme as PrimeUITheme)) {
          this.currentPrimeUITheme = theme as PrimeUITheme
          this.currentThemeVariant = variant as ThemeVariant
        }
      }
    }

    // Load PrimeUI theme preferences
    const savedPrimeUITheme = localStorage.getItem('penguin-pool-primeui-theme')
    if (savedPrimeUITheme && this.primeUIThemes.includes(savedPrimeUITheme as PrimeUITheme)) {
      this.currentPrimeUITheme = savedPrimeUITheme as PrimeUITheme
    }

    const savedThemeVariant = localStorage.getItem('penguin-pool-theme-variant')
    if (savedThemeVariant && (savedThemeVariant === 'light' || savedThemeVariant === 'dark')) {
      this.currentThemeVariant = savedThemeVariant as ThemeVariant
    }

    const savedPrimaryColor = localStorage.getItem('penguin-pool-primary-color')
    if (savedPrimaryColor) {
      this.currentPrimaryColor = savedPrimaryColor
    }

    const savedSurfaceColor = localStorage.getItem('penguin-pool-surface-color')
    if (savedSurfaceColor) {
      this.currentSurfaceColor = savedSurfaceColor
    }
  }

  public getAvailableThemes(): CustomTheme[] {
    const themes = [...this.availableThemes, ...this.customThemes]
    return themes
  }

  public getPrimeUIThemes(): PrimeUITheme[] {
    return primeUIThemeService.getAvailableThemes()
  }

  public getCurrentTheme(): ThemeMode {
    return this.currentTheme
  }

  public getCurrentPrimeUITheme(): PrimeUITheme {
    return this.currentPrimeUITheme
  }

  public getCurrentThemeVariant(): ThemeVariant {
    return this.currentThemeVariant
  }

  public getCurrentPrimaryColor(): string {
    return this.currentPrimaryColor
  }

  public getCurrentSurfaceColor(): string {
    return this.currentSurfaceColor
  }

  public getThemeById(themeId: string): CustomTheme | undefined {
    return this.getAvailableThemes().find(theme => theme.id === themeId)
  }

  public async switchTheme(themeId: ThemeMode): Promise<void> {
    try {
      // Remove all existing theme classes
      this.removeAllThemeClasses()

      if (themeId === 'light' || themeId === 'dark' || themeId === 'auto') {
        // Handle built-in themes
        this.currentTheme = themeId
        this.applyBuiltInTheme(themeId)
        // Save built-in theme preference
        localStorage.setItem('penguin-pool-theme', this.currentTheme)
        // Clear any saved custom theme
        localStorage.removeItem('penguin-pool-custom-theme')
        localStorage.removeItem('penguin-pool-primeui-theme')
        localStorage.removeItem('penguin-pool-theme-variant')
      } else if (
        themeId.includes('-') &&
        this.getPrimeUIThemes().includes(themeId.split('-')[0] as PrimeUITheme)
      ) {
        // Handle PrimeUI themes with variants
        const [theme, variant] = themeId.split('-')
        this.currentTheme = themeId
        this.currentPrimeUITheme = theme as PrimeUITheme
        this.currentThemeVariant = variant as ThemeVariant

        // Use the PrimeUI theme service to apply the theme
        await primeUIThemeService.applyTheme(theme as PrimeUITheme, variant as ThemeVariant)

        // Save PrimeUI theme preference
        localStorage.setItem('penguin-pool-theme', this.currentTheme)
        localStorage.setItem('penguin-pool-primeui-theme', theme)
        localStorage.setItem('penguin-pool-theme-variant', this.currentThemeVariant)
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
          localStorage.removeItem('penguin-pool-primeui-theme')
          localStorage.removeItem('penguin-pool-theme-variant')
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
      // Failed to switch theme
      throw error
    }
  }

  public async updatePrimeUIColors(primaryColor: string, surfaceColor: string): Promise<void> {
    try {
      this.currentPrimaryColor = primaryColor
      this.currentSurfaceColor = surfaceColor

      // Save color preferences
      localStorage.setItem('penguin-pool-primary-color', primaryColor)
      localStorage.setItem('penguin-pool-surface-color', surfaceColor)

      // Apply the updated colors if PrimeUI theme is active
      if (
        this.currentTheme.includes('-') &&
        this.getPrimeUIThemes().includes(this.currentTheme.split('-')[0] as PrimeUITheme)
      ) {
        await primeUIThemeService.updateColors(primaryColor, surfaceColor)
      }
    } catch (error) {
      // Failed to update PrimeUI colors
      throw error
    }
  }

  public async switchThemeVariant(variant: ThemeVariant): Promise<void> {
    try {
      if (
        this.currentTheme.includes('-') &&
        this.getPrimeUIThemes().includes(this.currentTheme.split('-')[0] as PrimeUITheme)
      ) {
        // Switch variant for current PrimeUI theme
        const [theme] = this.currentTheme.split('-')
        const newThemeId = `${theme}-${variant}` as ThemeMode
        await this.switchTheme(newThemeId)
      } else {
        // For custom themes, just update the variant
        this.currentThemeVariant = variant
        localStorage.setItem('penguin-pool-theme-variant', variant)
      }
    } catch (error) {
      // Failed to switch theme variant
      throw error
    }
  }

  private removeAllThemeClasses(): void {
    const root = document.documentElement
    const themeClasses = Array.from(root.classList).filter(cls => cls.startsWith('theme-'))
    themeClasses.forEach(cls => root.classList.remove(cls))

    // Also remove light/dark classes
    root.classList.remove('light', 'dark')

    // Remove PrimeUI theme classes
    this.getPrimeUIThemes().forEach(theme => {
      root.classList.remove(`theme-${theme}`)
      root.classList.remove(`theme-${theme}-light`)
      root.classList.remove(`theme-${theme}-dark`)
      root.classList.remove(`primeui-theme-${theme}`)
      root.classList.remove(`primeui-theme-${theme}-light`)
      root.classList.remove(`primeui-theme-${theme}-dark`)
    })
  }

  private applyBuiltInTheme(theme: BuiltInTheme): void {
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
    this.updateMetaThemeColor(theme === 'auto' ? this.getSystemTheme() : theme)
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  private applyCustomTheme(theme: CustomTheme): void {
    const root = document.documentElement

    // Add custom theme class
    root.classList.add(`theme-${theme.id}`)

    // Apply CSS custom properties
    this.applyThemeVariables(theme)

    // Apply variant if available
    if (this.currentThemeVariant === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

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

      // If this was the current theme, switch to default
      if (this.currentTheme === themeId) {
        this.switchTheme('aura-light')
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

  // Legacy methods for backward compatibility
  public toggleTheme(): void {
    // Cycle through themes: aura-light -> aura-dark -> material-light -> material-dark -> lara-light -> lara-dark -> nora-light -> nora-dark -> windows95 -> aura-light
    const themes: ThemeMode[] = [
      'aura-light',
      'aura-dark',
      'material-light',
      'material-dark',
      'lara-light',
      'lara-dark',
      'nora-light',
      'nora-dark',
      'windows95',
    ]
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    const newTheme = themes[nextIndex]
    this.switchTheme(newTheme)
  }

  public getWindows95Theme(): CustomTheme {
    return windows95Theme
  }
}

export const themeManager = ThemeManager.getInstance()
