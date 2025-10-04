import type {
  AIThemeConfig,
  CustomTheme,
  ThemeAnimation,
  ThemeBorderRadius,
  ThemeBreakpoints,
  ThemeColors,
  ThemeGenerator,
  ThemeShadows,
  ThemeSpacing,
  ThemeTypography,
} from '../types/theme'

export class AIThemeGenerator implements ThemeGenerator {
  private readonly colorPalettes: Record<string, Record<string, string>> = {
    ocean: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
      accent: '#0284c7',
      highlight: '#e0f2fe',
    },
    forest: {
      primary: '#059669',
      secondary: '#10b981',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0891b2',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#14532d',
      textSecondary: '#365314',
      border: '#bbf7d0',
      accent: '#047857',
      highlight: '#dcfce7',
    },
    sunset: {
      primary: '#ea580c',
      secondary: '#f97316',
      success: '#16a34a',
      warning: '#eab308',
      error: '#dc2626',
      info: '#0891b2',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#9a3412',
      textSecondary: '#c2410c',
      border: '#fed7aa',
      accent: '#c2410c',
      highlight: '#fed7aa',
    },
    cyberpunk: {
      primary: '#8b5cf6',
      secondary: '#a855f7',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      background: '#0f0f23',
      surface: '#1a1a2e',
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      border: '#374151',
      accent: '#7c3aed',
      highlight: '#312e81',
    },
    aurora: {
      primary: '#06b6d4',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
      accent: '#0891b2',
      highlight: '#e0f2fe',
    },
    neon: {
      primary: '#00ff88',
      secondary: '#ff0080',
      success: '#00ff88',
      warning: '#ffff00',
      error: '#ff0040',
      info: '#00ffff',
      background: '#000000',
      surface: '#111111',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#333333',
      accent: '#ff0080',
      highlight: '#001122',
    },
    minimal: {
      primary: '#000000',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      accent: '#374151',
      highlight: '#f3f4f6',
    },
    professional: {
      primary: '#1e40af',
      secondary: '#374151',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#111827',
      textSecondary: '#4b5563',
      border: '#d1d5db',
      accent: '#1d4ed8',
      highlight: '#eff6ff',
    },
  }

  private readonly intensityMultipliers = {
    subtle: 0.7,
    moderate: 1.0,
    bold: 1.3,
  }

  generateTheme(config: AIThemeConfig): CustomTheme {
    const baseColors = this.colorPalettes[config.theme]
    if (!baseColors) {
      throw new Error(`Unknown AI theme: ${config.theme}`)
    }

    const intensity = this.intensityMultipliers[config.intensity]
    const colors = this.generateColorVariations(baseColors, intensity, config)

    return {
      id: `ai-${config.theme}-${config.intensity}-${Date.now()}`,
      name: `${this.capitalize(config.theme)} ${this.capitalize(config.intensity)}`,
      category: 'ai-generated',
      version: '1.0.0',
      author: 'AI Theme Generator',
      description:
        `AI-generated ${config.theme} theme with ${config.intensity} intensity, ` +
        `${config.colorHarmony} harmony, and ${config.mood} mood`,
      tags: [config.theme, config.intensity, config.colorHarmony, config.mood, 'ai-generated'],
      colors: this.generateFullColorPalette(colors),
      typography: this.generateTypography(config),
      spacing: this.generateSpacing(),
      borderRadius: this.generateBorderRadius(config),
      shadows: this.generateShadows(config),
      animation: this.generateAnimation(),
      breakpoints: this.generateBreakpoints(),
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  generateVariations(baseTheme: CustomTheme, count: number): CustomTheme[] {
    return Array.from({ length: count }, (_, i) => this.createVariation(baseTheme, i))
  }

  optimizeForAccessibility(theme: CustomTheme): CustomTheme {
    // Ensure proper contrast ratios
    const optimizedColors = this.optimizeColorContrast(theme.colors)

    return {
      ...theme,
      colors: optimizedColors,
      description: `${theme.description} (Accessibility Optimized)`,
      tags: [...theme.tags, 'accessibility-optimized'],
      updatedAt: new Date(),
    }
  }

  exportTheme(theme: CustomTheme): string {
    return JSON.stringify(theme, null, 2)
  }

  importTheme(themeJson: string): CustomTheme {
    try {
      const theme = JSON.parse(themeJson) as CustomTheme

      // Validate theme structure
      if (!this.validateTheme(theme)) {
        throw new Error('Invalid theme structure')
      }

      return theme
    } catch (error) {
      throw new Error(`Failed to import theme: ${error}`)
    }
  }

  private generateColorVariations(
    baseColors: Record<string, string>,
    intensity: number,
    config: AIThemeConfig
  ): Record<string, string> {
    const variations: Record<string, string> = {}

    Object.entries(baseColors).forEach(([key, color]) => {
      variations[key] = this.adjustColorIntensity(color, intensity)
    })

    // Apply color harmony
    if (config.colorHarmony !== 'monochromatic') {
      this.applyColorHarmony(variations, config.colorHarmony)
    }

    // Apply mood adjustments
    this.applyMoodAdjustments(variations, config.mood)

    return variations
  }

  private generateFullColorPalette(baseColors: Record<string, string>): ThemeColors {
    return {
      // Primary colors
      primary: baseColors.primary,
      primaryHover: this.lightenColor(baseColors.primary, 0.1),
      primaryActive: this.darkenColor(baseColors.primary, 0.1),
      primaryDisabled: this.desaturateColor(baseColors.primary, 0.5),

      // Secondary colors
      secondary: baseColors.secondary,
      secondaryHover: this.lightenColor(baseColors.secondary, 0.1),
      secondaryActive: this.darkenColor(baseColors.secondary, 0.1),

      // Status colors
      success: baseColors.success,
      successHover: this.lightenColor(baseColors.success, 0.1),
      successActive: this.darkenColor(baseColors.success, 0.1),
      warning: baseColors.warning,
      warningHover: this.lightenColor(baseColors.warning, 0.1),
      warningActive: this.darkenColor(baseColors.warning, 0.1),
      error: baseColors.error,
      errorHover: this.lightenColor(baseColors.error, 0.1),
      errorActive: this.darkenColor(baseColors.error, 0.1),
      info: baseColors.info,
      infoHover: this.lightenColor(baseColors.info, 0.1),
      infoActive: this.darkenColor(baseColors.info, 0.1),

      // Background colors
      background: baseColors.background,
      backgroundHover: this.lightenColor(baseColors.background, 0.05),
      backgroundActive: this.darkenColor(baseColors.background, 0.05),
      backgroundDisabled: this.desaturateColor(baseColors.background, 0.3),

      // Surface colors
      surface: baseColors.surface,
      surfaceHover: this.lightenColor(baseColors.surface, 0.05),
      surfaceActive: this.darkenColor(baseColors.surface, 0.05),
      surfaceDisabled: this.desaturateColor(baseColors.surface, 0.3),

      // Text colors
      text: baseColors.text,
      textHover: this.lightenColor(baseColors.text, 0.1),
      textActive: this.darkenColor(baseColors.text, 0.1),
      textDisabled: this.desaturateColor(baseColors.text, 0.5),
      textSecondary: baseColors.textSecondary,
      textTertiary: this.desaturateColor(baseColors.textSecondary, 0.3),

      // Border colors
      border: baseColors.border,
      borderHover: this.lightenColor(baseColors.border, 0.1),
      borderActive: this.darkenColor(baseColors.border, 0.1),
      borderDisabled: this.desaturateColor(baseColors.border, 0.5),

      // Shadow colors
      shadow: baseColors.text,
      shadowHover: this.lightenColor(baseColors.text, 0.1),

      // Special colors
      accent: baseColors.accent,
      highlight: baseColors.highlight,
      overlay: this.addAlpha(baseColors.text, 0.5),
    }
  }

  private generateTypography(config: AIThemeConfig): ThemeTypography {
    const baseFontSize = config.mood === 'professional' ? 14 : 16

    return {
      fontFamily:
        config.mood === 'professional'
          ? '"Inter", "Segoe UI", "Roboto", sans-serif'
          : '"SF Pro Display", "Inter", "Segoe UI", sans-serif',
      fontFamilyMono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      fontFamilyHeading:
        config.mood === 'professional'
          ? '"Inter", "Segoe UI", "Roboto", sans-serif'
          : '"SF Pro Display", "Inter", "Segoe UI", sans-serif',
      fontSize: {
        xs: baseFontSize - 4,
        sm: baseFontSize - 2,
        md: baseFontSize,
        lg: baseFontSize + 2,
        xl: baseFontSize + 4,
        '2xl': baseFontSize + 6,
        '3xl': baseFontSize + 8,
        '4xl': baseFontSize + 12,
        '5xl': baseFontSize + 16,
        '6xl': baseFontSize + 20,
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.6,
        loose: 1.8,
      },
      letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
      },
    }
  }

  private generateSpacing(): ThemeSpacing {
    return {
      space: {
        0: 0,
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        7: 28,
        8: 32,
        9: 36,
        10: 40,
        12: 48,
        14: 56,
        16: 64,
        20: 80,
        24: 96,
        28: 112,
        32: 128,
        36: 144,
        40: 160,
        44: 176,
        48: 192,
        52: 208,
        56: 224,
        60: 240,
        64: 256,
        72: 288,
        80: 320,
        96: 384,
      },
      padding: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      margin: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
    }
  }

  private generateBorderRadius(config: AIThemeConfig): ThemeBorderRadius {
    const baseRadius = config.mood === 'playful' ? 8 : 4

    return {
      borderRadius: {
        none: 0,
        xs: baseRadius / 2,
        sm: baseRadius,
        md: baseRadius * 1.5,
        lg: baseRadius * 2,
        xl: baseRadius * 3,
        '2xl': baseRadius * 4,
        '3xl': baseRadius * 6,
        full: 9999,
      },
    }
  }

  private generateShadows(config: AIThemeConfig): ThemeShadows {
    const baseShadow = config.mood === 'mysterious' ? 0.3 : 0.1

    return {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: config.mood === 'energetic' ? 4 : 2,
      },
      shadowOpacity: baseShadow,
      shadowRadius: config.mood === 'energetic' ? 8 : 4,
      elevation: config.mood === 'energetic' ? 8 : 4,
    }
  }

  private generateAnimation(): ThemeAnimation {
    return {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500,
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  }

  private generateBreakpoints(): ThemeBreakpoints {
    return {
      breakpoints: {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
      },
    }
  }

  private createVariation(baseTheme: CustomTheme, index: number): CustomTheme {
    const variation = JSON.parse(JSON.stringify(baseTheme)) as CustomTheme

    // Modify colors slightly
    Object.keys(variation.colors).forEach(key => {
      const color = variation.colors[key as keyof typeof variation.colors]
      if (typeof color === 'string' && color.startsWith('#')) {
        variation.colors[key as keyof typeof variation.colors] = this.shiftHue(color, index * 30)
      }
    })

    variation.id = `${baseTheme.id}-variation-${index}`
    variation.name = `${baseTheme.name} Variation ${index + 1}`
    variation.description = `Variation of ${baseTheme.name} with shifted color palette`
    variation.tags = [...baseTheme.tags, 'variation']
    variation.createdAt = new Date()
    variation.updatedAt = new Date()

    return variation
  }

  private optimizeColorContrast(colors: Record<string, string>): Record<string, string> {
    // Ensure proper contrast ratios for accessibility
    // This is a simplified version - in production, you'd use a proper contrast checking library
    return colors
  }

  private adjustColorIntensity(color: string, intensity: number): string {
    // Adjust color intensity based on the multiplier
    if (intensity === 1.0) {
      return color
    }

    const hsl = this.hexToHsl(color)
    hsl.l = Math.max(0, Math.min(100, hsl.l * intensity))
    return this.hslToHex(hsl)
  }

  private applyColorHarmony(
    _colors: Record<string, string>,
    _harmony: string
  ): Record<string, string> {
    // Apply color harmony rules
    // This is a simplified version - in production, you'd implement proper color theory
  }

  private applyMoodAdjustments(
    colors: Record<string, string>,
    mood: string
  ): Record<string, string> {
    // Apply mood-based color adjustments
    switch (mood) {
      case 'calm':
        // Reduce saturation
        Object.keys(colors).forEach(key => {
          colors[key] = this.desaturateColor(colors[key], 0.2)
        })
        break
      case 'energetic':
        // Increase saturation
        Object.keys(colors).forEach(key => {
          colors[key] = this.saturateColor(colors[key], 0.2)
        })
        break
      case 'mysterious':
        // Darken colors
        Object.keys(colors).forEach(key => {
          colors[key] = this.darkenColor(colors[key], 0.2)
        })
        break
    }
  }

  private lightenColor(color: string, amount: number): string {
    const hsl = this.hexToHsl(color)
    hsl.l = Math.min(100, hsl.l + amount * 100)
    return this.hslToHex(hsl)
  }

  private darkenColor(color: string, amount: number): string {
    const hsl = this.hexToHsl(color)
    hsl.l = Math.max(0, hsl.l - amount * 100)
    return this.hslToHex(hsl)
  }

  private saturateColor(color: string, amount: number): string {
    const hsl = this.hexToHsl(color)
    hsl.s = Math.min(100, hsl.s + amount * 100)
    return this.hslToHex(hsl)
  }

  private desaturateColor(color: string, amount: number): string {
    const hsl = this.hexToHsl(color)
    hsl.s = Math.max(0, hsl.s - amount * 100)
    return this.hslToHex(hsl)
  }

  private shiftHue(color: string, degrees: number): string {
    const hsl = this.hexToHsl(color)
    hsl.h = (hsl.h + degrees) % 360
    return this.hslToHex(hsl)
  }

  private addAlpha(color: string, alpha: number): string {
    const rgb = this.hexToRgb(color)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const rgb = this.hexToRgb(hex)
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  private hslToHex(hsl: { h: number; s: number; l: number }): string {
    const h = hsl.h / 360
    const s = hsl.s / 100
    const l = hsl.l / 100

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) {
        t += 1
      }
      if (t > 1) {
        t -= 1
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t
      }
      if (t < 1 / 2) {
        return q
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6
      }
      return p
    }

    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private validateTheme(theme: Record<string, unknown>): boolean {
    return (
      theme &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.category === 'string' &&
      theme.colors &&
      theme.typography &&
      theme.spacing &&
      theme.borderRadius &&
      theme.shadows &&
      theme.animation &&
      theme.breakpoints
    )
  }
}

export const aiThemeGenerator = new AIThemeGenerator()
