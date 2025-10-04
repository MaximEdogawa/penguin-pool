// AI-Ready Theme System Types for React Native with Tamagui

export interface ThemeColors {
  // Primary color palette
  primary: string
  primaryHover: string
  primaryActive: string
  primaryDisabled: string

  // Secondary colors
  secondary: string
  secondaryHover: string
  secondaryActive: string

  // Status colors
  success: string
  successHover: string
  successActive: string
  warning: string
  warningHover: string
  warningActive: string
  error: string
  errorHover: string
  errorActive: string
  info: string
  infoHover: string
  infoActive: string

  // Background colors
  background: string
  backgroundHover: string
  backgroundActive: string
  backgroundDisabled: string

  // Surface colors
  surface: string
  surfaceHover: string
  surfaceActive: string
  surfaceDisabled: string

  // Text colors
  text: string
  textHover: string
  textActive: string
  textDisabled: string
  textSecondary: string
  textTertiary: string

  // Border colors
  border: string
  borderHover: string
  borderActive: string
  borderDisabled: string

  // Shadow colors
  shadow: string
  shadowHover: string

  // Special colors
  accent: string
  highlight: string
  overlay: string
}

export interface ThemeTypography {
  // Font families
  fontFamily: string
  fontFamilyMono: string
  fontFamilyHeading: string

  // Font sizes
  fontSize: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    '2xl': number
    '3xl': number
    '4xl': number
    '5xl': number
    '6xl': number
  }

  // Font weights
  fontWeight: {
    light: string
    normal: string
    medium: string
    semibold: string
    bold: string
    extrabold: string
  }

  // Line heights
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
    loose: number
  }

  // Letter spacing
  letterSpacing: {
    tight: number
    normal: number
    wide: number
  }
}

export interface ThemeSpacing {
  // Spacing scale
  space: {
    0: number
    1: number
    2: number
    3: number
    4: number
    5: number
    6: number
    7: number
    8: number
    9: number
    10: number
    12: number
    14: number
    16: number
    20: number
    24: number
    28: number
    32: number
    36: number
    40: number
    44: number
    48: number
    52: number
    56: number
    60: number
    64: number
    72: number
    80: number
    96: number
  }

  // Padding and margin
  padding: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }

  margin: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}

export interface ThemeBorderRadius {
  borderRadius: {
    none: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    '2xl': number
    '3xl': number
    full: number
  }
}

export interface ThemeShadows {
  shadowColor: string
  shadowOffset: {
    width: number
    height: number
  }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export interface ThemeAnimation {
  // Animation durations
  duration: {
    fast: number
    normal: number
    slow: number
  }

  // Animation curves
  easing: {
    linear: string
    ease: string
    easeIn: string
    easeOut: string
    easeInOut: string
  }
}

export interface ThemeBreakpoints {
  breakpoints: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}

export interface CustomTheme {
  id: string
  name: string
  category: 'modern' | 'retro' | 'professional' | 'minimal' | 'ai-generated' | 'custom'
  version: string
  author: string
  description: string
  tags: string[]
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  borderRadius: ThemeBorderRadius
  shadows: ThemeShadows
  animation: ThemeAnimation
  breakpoints: ThemeBreakpoints
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type BuiltInTheme = 'light' | 'dark' | 'auto'
export type AITheme =
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'cyberpunk'
  | 'aurora'
  | 'neon'
  | 'minimal'
  | 'professional'
export type ThemeMode = BuiltInTheme | AITheme | string // string for custom theme IDs

export interface ThemeState {
  mode: ThemeMode
  aiTheme: AITheme
  customThemes: CustomTheme[]
  availableThemes: CustomTheme[]
  isDark: boolean
  systemTheme: 'light' | 'dark'
}

export interface AIThemeConfig {
  theme: AITheme
  intensity: 'subtle' | 'moderate' | 'bold'
  colorHarmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic'
  mood: 'calm' | 'energetic' | 'professional' | 'playful' | 'mysterious'
}

export interface ThemeGenerator {
  generateTheme(_config: AIThemeConfig): CustomTheme
  generateVariations(_baseTheme: CustomTheme, _count: number): CustomTheme[]
  optimizeForAccessibility(_theme: CustomTheme): CustomTheme
  exportTheme(_theme: CustomTheme): string
  importTheme(_themeJson: string): CustomTheme
}

// Tamagui-specific theme configuration
export interface TamaguiThemeConfig {
  name: string
  theme: {
    background: string
    backgroundHover: string
    backgroundPress: string
    backgroundFocus: string
    backgroundStrong: string
    backgroundTransparent: string
    color: string
    colorHover: string
    colorPress: string
    colorFocus: string
    colorTransparent: string
    borderColor: string
    borderColorHover: string
    borderColorPress: string
    borderColorFocus: string
    placeholderColor: string
    color1: string
    color2: string
    color3: string
    color4: string
    color5: string
    color6: string
    color7: string
    color8: string
    color9: string
    color10: string
    color11: string
    color12: string
  }
}
