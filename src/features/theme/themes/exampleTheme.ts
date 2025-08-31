import type { CustomTheme } from '../types/theme'

/**
 * Example Theme - Safe Theming Demonstration
 *
 * This theme demonstrates the safe approach to custom theming:
 * - Only modifies visual properties (colors, fonts, shadows, borders)
 * - Never touches layout properties (position, display, width, height, margin, padding)
 * - Uses CSS custom properties for consistent theming
 * - Follows the custom theme guide best practices
 */
export const exampleTheme: CustomTheme = {
  id: 'example',
  name: 'Example Theme',
  category: 'modern',
  version: '1.0.0',
  author: 'Penguin Pool Team',
  description:
    'A demonstration theme showing safe theming practices - only visual changes, no layout modifications',

  colors: {
    // Primary color palette
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Violet
    success: '#10b981', // Emerald
    danger: '#ef4444', // Red
    warning: '#f59e0b', // Amber
    info: '#06b6d4', // Cyan

    // Background and surface colors
    background: '#f8fafc', // Slate 50
    surface: '#ffffff', // White
    text: '#0f172a', // Slate 900
    textSecondary: '#475569', // Slate 600
    border: '#e2e8f0', // Slate 200
    hover: '#f1f5f9', // Slate 100
    active: '#4f46e5', // Indigo 600
    disabled: '#94a3b8', // Slate 400

    // Additional theme colors
    highlight: '#fef3c7', // Amber 100
    shadow: '#1e293b', // Slate 800
    titleBar: '#6366f1', // Indigo 500
    titleBarText: '#ffffff', // White
    menuBar: '#f8fafc', // Slate 50
    scrollBar: '#cbd5e1', // Slate 300
    scrollBarThumb: '#94a3b8', // Slate 400
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    fontSizeBase: '14px',
    fontSizeSmall: '12px',
    fontSizeLarge: '16px',
    lineHeight: '1.5',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '600',
  },

  spacing: {
    unit: '4px',
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
  },

  shadows: {
    // Subtle, modern shadows
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  borderRadius: {
    // Consistent border radius system
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  isActive: false,
}
