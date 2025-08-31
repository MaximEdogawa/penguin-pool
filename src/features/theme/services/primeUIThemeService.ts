import type { PrimeUITheme, ThemeVariant } from '../types/theme'

export class PrimeUIThemeService {
  private static instance: PrimeUIThemeService
  private currentTheme: PrimeUITheme | null = null
  private currentVariant: ThemeVariant = 'light'

  private constructor() {}

  public static getInstance(): PrimeUIThemeService {
    if (!PrimeUIThemeService.instance) {
      PrimeUIThemeService.instance = new PrimeUIThemeService()
    }
    return PrimeUIThemeService.instance
  }

  public getAvailableThemes(): PrimeUITheme[] {
    return ['aura', 'lara', 'nora', 'material']
  }

  public async applyTheme(theme: PrimeUITheme, variant: ThemeVariant = 'light'): Promise<void> {
    try {
      // Remove existing PrimeUI theme classes
      this.removeThemeClasses()

      // Add theme class to document
      document.documentElement.classList.add(`primeui-theme-${theme}`)
      document.documentElement.classList.add(`primeui-theme-${theme}-${variant}`)

      // Apply theme-specific CSS custom properties
      this.applyThemeStyles(theme, variant)

      // Store current theme
      this.currentTheme = theme
      this.currentVariant = variant
    } catch (error) {
      console.error(`Failed to apply PrimeUI theme ${theme}:`, error)
      throw error
    }
  }

  private applyThemeStyles(theme: PrimeUITheme, variant: ThemeVariant): void {
    // Apply theme-specific CSS custom properties
    switch (theme) {
      case 'aura':
        this.applyAuraTheme(variant)
        break
      case 'lara':
        this.applyLaraTheme(variant)
        break
      case 'nora':
        this.applyNoraTheme(variant)
        break
      case 'material':
        this.applyMaterialTheme(variant)
        break
    }
  }

  private applyAuraTheme(variant: ThemeVariant): void {
    const root = document.documentElement

    if (variant === 'light') {
      root.style.setProperty('--primeui-primary-color', '#6366f1')
      root.style.setProperty('--primeui-surface-color', '#ffffff')
      root.style.setProperty('--primeui-text-color', '#1e293b')
      root.style.setProperty('--primeui-border-color', '#e2e8f0')
    } else {
      root.style.setProperty('--primeui-primary-color', '#60a5fa')
      root.style.setProperty('--primeui-surface-color', '#1e293b')
      root.style.setProperty('--primeui-text-color', '#f1f5f9')
      root.style.setProperty('--primeui-border-color', '#334155')
    }
  }

  private applyLaraTheme(variant: ThemeVariant): void {
    const root = document.documentElement

    if (variant === 'light') {
      root.style.setProperty('--primeui-primary-color', '#3b82f6')
      root.style.setProperty('--primeui-surface-color', '#ffffff')
      root.style.setProperty('--primeui-text-color', '#1e293b')
      root.style.setProperty('--primeui-border-color', '#e2e8f0')
    } else {
      root.style.setProperty('--primeui-primary-color', '#60a5fa')
      root.style.setProperty('--primeui-surface-color', '#1e293b')
      root.style.setProperty('--primeui-text-color', '#f1f5f9')
      root.style.setProperty('--primeui-border-color', '#334155')
    }
  }

  private applyNoraTheme(variant: ThemeVariant): void {
    const root = document.documentElement

    if (variant === 'light') {
      root.style.setProperty('--primeui-primary-color', '#8b5cf6')
      root.style.setProperty('--primeui-surface-color', '#ffffff')
      root.style.setProperty('--primeui-text-color', '#1e293b')
      root.style.setProperty('--primeui-border-color', '#e2e8f0')
    } else {
      root.style.setProperty('--primeui-primary-color', '#a78bfa')
      root.style.setProperty('--primeui-surface-color', '#1e293b')
      root.style.setProperty('--primeui-text-color', '#f1f5f9')
      root.style.setProperty('--primeui-border-color', '#334155')
    }
  }

  private applyMaterialTheme(variant: ThemeVariant): void {
    const root = document.documentElement

    if (variant === 'light') {
      root.style.setProperty('--primeui-primary-color', '#1976d2')
      root.style.setProperty('--primeui-surface-color', '#ffffff')
      root.style.setProperty('--primeui-text-color', '#1e293b')
      root.style.setProperty('--primeui-border-color', '#e2e8f0')
    } else {
      root.style.setProperty('--primeui-primary-color', '#42a5f5')
      root.style.setProperty('--primeui-surface-color', '#1e293b')
      root.style.setProperty('--primeui-text-color', '#f1f5f9')
      root.style.setProperty('--primeui-border-color', '#334155')
    }
  }

  private removeThemeClasses(): void {
    const root = document.documentElement
    const themeClasses = Array.from(root.classList).filter(cls => cls.startsWith('primeui-theme-'))
    themeClasses.forEach(cls => root.classList.remove(cls))
  }

  public getCurrentTheme(): PrimeUITheme | null {
    return this.currentTheme
  }

  public getCurrentVariant(): ThemeVariant {
    return this.currentVariant
  }

  public async updateColors(primaryColor: string, surfaceColor: string): Promise<void> {
    try {
      const root = document.documentElement
      root.style.setProperty('--primeui-primary-color', primaryColor)
      root.style.setProperty('--primeui-surface-color', surfaceColor)
    } catch (error) {
      console.error('Failed to update PrimeUI colors:', error)
      throw error
    }
  }
}

export const primeUIThemeService = PrimeUIThemeService.getInstance()
