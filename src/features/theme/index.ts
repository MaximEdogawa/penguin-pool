// Theme feature exports

// Components
export { default as ThemeToggle } from './components/ThemeToggle.vue'
export { default as ThemeDemo } from './components/ThemeDemo.vue'
export { default as ThemeSettings } from './components/ThemeSettings.vue'

// Store
export { useThemeStore } from './store/themeStore'

// Services
export { themeManager } from './services/themeManager'

// Themes
export { windows95Theme } from './themes/windows95'

// Types
export type {
  CustomTheme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeShadows,
  ThemeBorderRadius,
  ThemeMode,
  ThemeState,
} from '@/app/types/theme'
