// Theme system types and interfaces

export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  danger: string
  warning: string
  info: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  hover: string
  active: string
  disabled: string
}

export interface ThemeTypography {
  fontFamily: string
  fontSizeBase: string
  fontSizeSmall: string
  fontSizeLarge: string
  lineHeight: string
  fontWeightNormal: string
  fontWeightMedium: string
  fontWeightBold: string
}

export interface ThemeSpacing {
  unit: string
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ThemeShadows {
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ThemeBorderRadius {
  sm: string
  md: string
  lg: string
  xl: string
}

export interface CustomTheme {
  id: string
  name: string
  category: 'retro' | 'modern' | 'professional' | 'minimal'
  version: string
  author: string
  description: string
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  shadows: ThemeShadows
  borderRadius: ThemeBorderRadius
  isActive: boolean
}

export type BuiltInTheme = 'light' | 'dark' | 'auto'
export type ThemeMode = BuiltInTheme | string // string for custom theme IDs

export interface ThemeState {
  currentTheme: ThemeMode
  availableThemes: CustomTheme[]
  customThemes: CustomTheme[]
  systemTheme: 'light' | 'dark'
}
