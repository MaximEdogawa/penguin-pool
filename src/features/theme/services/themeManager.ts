import type { Windows95Theme } from '../types/theme'
import { windows95Theme } from '../themes/windows95'

export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: 'light' | 'dark' | 'windows95' = 'light'

  private constructor() {
    this.loadTheme()
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private loadTheme(): void {
    // Load current theme from localStorage
    const savedTheme = localStorage.getItem('penguin-pool-theme') as 'light' | 'dark' | 'windows95'
    if (
      savedTheme &&
      (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'windows95')
    ) {
      this.currentTheme = savedTheme
    } else {
      // Default to system preference
      this.currentTheme = this.getSystemTheme()
    }

    // Apply the theme immediately
    this.applyTheme()
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  public getCurrentTheme(): 'light' | 'dark' | 'windows95' {
    return this.currentTheme
  }

  public async switchTheme(theme: 'light' | 'dark' | 'windows95'): Promise<void> {
    try {
      console.log('ThemeManager: Switching to theme:', theme)

      this.currentTheme = theme

      // Save theme preference
      localStorage.setItem('penguin-pool-theme', theme)

      // Apply the theme
      this.applyTheme()

      console.log('ThemeManager: Theme applied successfully')
    } catch (error) {
      console.error('Failed to switch theme:', error)
      throw error
    }
  }

  private applyTheme(): void {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'theme-windows95')

    if (this.currentTheme === 'windows95') {
      // Apply Windows 95 theme
      root.classList.add('theme-windows95')
    } else {
      // Apply basic light/dark theme
      root.classList.add(this.currentTheme)
    }

    console.log('ThemeManager: Applied theme class:', this.currentTheme)
    console.log('ThemeManager: Current document classes:', root.classList.toString())
  }

  public toggleTheme(): void {
    // Cycle through themes: light -> dark -> windows95 -> light
    const themes: ('light' | 'dark' | 'windows95')[] = ['light', 'dark', 'windows95']
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    const newTheme = themes[nextIndex]
    this.switchTheme(newTheme)
  }

  public getWindows95Theme(): Windows95Theme {
    return windows95Theme
  }
}

export const themeManager = ThemeManager.getInstance()
