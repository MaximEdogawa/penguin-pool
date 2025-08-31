import type { CustomTheme } from '@/app/types/theme'

export const windows95Theme: CustomTheme = {
  id: 'windows95',
  name: 'Windows 95',
  category: 'retro',
  version: '2.0.0',
  author: 'Penguin Pool Team',
  description:
    'Authentic Windows 95 aesthetic with classic retro computing colors, 3D borders, and MS Sans Serif typography',

  colors: {
    // Authentic Windows 95 color palette
    primary: '#000080', // Windows 95 blue
    secondary: '#c0c0c0', // Classic Windows 95 gray
    success: '#008000', // Windows 95 green
    danger: '#800000', // Windows 95 red
    warning: '#808000', // Windows 95 yellow
    info: '#008080', // Windows 95 teal

    // Background and surface colors - more authentic
    background: '#008080', // Windows 95 default background (teal)
    surface: '#c0c0c0', // Windows 95 surface color
    text: '#000000', // Black text
    textSecondary: '#404040', // Dark gray secondary text
    border: '#808080', // Windows 95 border gray
    hover: '#d4d0c8', // Windows 95 hover color
    active: '#000080', // Active state (same as primary)
    disabled: '#a0a0a0', // Disabled state gray

    // Additional Windows 95 specific colors
    highlight: '#ffffff', // White highlight
    shadow: '#404040', // Dark shadow
    titleBar: '#000080', // Title bar blue
    titleBarText: '#ffffff', // Title bar text
    menuBar: '#c0c0c0', // Menu bar gray
    scrollBar: '#c0c0c0', // Scroll bar gray
    scrollBarThumb: '#808080', // Scroll bar thumb
  },

  typography: {
    fontFamily: '"MS Sans Serif", "Microsoft Sans Serif", "Segoe UI", "Tahoma", sans-serif',
    fontSizeBase: '11px', // Authentic Windows 95 font size
    fontSizeSmall: '9px', // Smaller text
    fontSizeLarge: '13px', // Larger text
    lineHeight: '1.2',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
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
    // Windows 95 uses inset/outset effects rather than shadows
    sm: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080',
    md: 'inset 2px 2px 0px #ffffff, inset -2px -2px 0px #808080',
    lg: 'inset 3px 3px 0px #ffffff, inset -3px -3px 0px #808080',
    xl: 'inset 4px 4px 0px #ffffff, inset -4px -4px 0px #808080',
  },

  borderRadius: {
    sm: '0px', // Windows 95 has no rounded corners
    md: '0px',
    lg: '0px',
    xl: '0px',
  },

  isActive: false,
}
