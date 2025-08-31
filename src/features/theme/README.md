# Theme Manager

A comprehensive theme management system for the Penguin Pool application, providing advanced theming capabilities with custom theme support, import/export functionality, and seamless integration with PrimeVue components.

## Features

### 🎨 **Advanced Theme System**

- **Built-in Themes**: Light, Dark, and Auto (system preference detection)
- **Custom Themes**: Create, import, export, and manage custom themes
- **Theme Categories**: Support for 'retro', 'modern', 'professional', and 'minimal' categories
- **Dynamic Theme Switching**: Real-time theme application with CSS custom properties

### 🔧 **Theme Management**

- **Theme Persistence**: Automatic theme saving to localStorage
- **Theme Validation**: Structure validation for imported themes
- **Theme Preview**: Visual preview of theme colors and styling
- **Theme Import/Export**: JSON-based theme sharing and backup

### 🎯 **Component Integration**

- **ThemeToggle**: Advanced theme switcher with dropdown menu
- **ThemeSettings**: Comprehensive theme management interface
- **ThemeDemo**: Interactive theme preview and demonstration
- **AppConfigurator**: Layout configuration with theme integration

### 🌐 **CSS Integration**

- **CSS Custom Properties**: Dynamic theme variable application
- **PrimeVue Integration**: Seamless styling with PrimeVue components
- **Responsive Design**: Mobile-friendly theme switching
- **Windows 95 Theme**: Authentic retro computing aesthetic

## Architecture

### Core Components

#### ThemeManager Service

```typescript
class ThemeManager {
  // Singleton pattern for global theme management
  public static getInstance(): ThemeManager

  // Theme switching and management
  public async switchTheme(themeId: ThemeMode): Promise<void>
  public addCustomTheme(theme: CustomTheme): void
  public removeCustomTheme(themeId: string): void
  public exportTheme(themeId: string): string
  public importTheme(themeJson: string): CustomTheme
}
```

#### Theme Store (Pinia)

```typescript
export const useThemeStore = defineStore('theme', () => {
  // State management
  const currentTheme = ref<BuiltInTheme>('light')
  const currentCustomTheme = ref<CustomTheme | null>(null)
  const availableCustomThemes = ref<CustomTheme[]>([])

  // Actions
  const setBuiltInTheme = async (theme: BuiltInTheme)
  const setCustomTheme = async (themeId: string)
  const clearCustomTheme = async ()
  const importTheme = async (themeJson: string)
  const exportTheme = (themeId: string)
})
```

### Theme Interface

```typescript
interface CustomTheme {
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
```

## Usage

### Basic Theme Switching

```typescript
import { useThemeStore } from '@/features/theme'

const themeStore = useThemeStore()

// Switch to built-in themes
await themeStore.setBuiltInTheme('light')
await themeStore.setBuiltInTheme('dark')
await themeStore.setBuiltInTheme('auto')

// Apply custom theme
await themeStore.setCustomTheme('windows95')

// Clear custom theme
await themeStore.clearCustomTheme()
```

### Theme Import/Export

```typescript
// Export theme
const themeJson = themeStore.exportTheme('windows95')
const blob = new Blob([themeJson], { type: 'application/json' })

// Import theme
const importedTheme = await themeStore.importTheme(themeJson)
```

### Component Usage

```vue
<template>
  <!-- Theme toggle with advanced menu -->
  <ThemeToggle />

  <!-- Theme settings panel -->
  <ThemeSettings />

  <!-- Theme demonstration -->
  <ThemeDemo />
</template>

<script setup>
  import { ThemeToggle, ThemeSettings, ThemeDemo } from '@/features/theme'
</script>
```

## Available Themes

### Built-in Themes

- **Light**: Clean, modern light theme with blue accents
- **Dark**: Sophisticated dark theme with proper contrast
- **Auto**: Automatically follows system preference

### Custom Themes

- **Windows 95**: Authentic retro computing aesthetic with:
  - Classic Windows 95 color palette
  - 3D border effects (inset/outset)
  - MS Sans Serif typography
  - Authentic button and input styling

## CSS Variables

The theme system automatically applies CSS custom properties for dynamic theming:

```css
:root {
  --theme-primary: #000080;
  --theme-background: #008080;
  --theme-surface: #c0c0c0;
  --theme-text: #000000;
  --theme-border: #808080;
  /* ... and many more */
}
```

## Browser Support

- **Modern Browsers**: Full support for all features
- **CSS Custom Properties**: Required for theme switching
- **localStorage**: Required for theme persistence
- **ES6+**: Required for async/await and modern JavaScript features

## Development

### Adding New Themes

1. Create theme definition in `src/features/theme/themes/`
2. Add CSS styling in corresponding `.css` file
3. Import and register in `themeManager.ts`
4. Update theme exports in `index.ts`

### Theme Validation

Themes are automatically validated for:

- Required properties (id, name, category, colors, etc.)
- Proper data types
- Structure integrity

### Testing

```bash
# Build and type check
npm run build

# Development server
npm run dev

# Unit tests
npm run test:unit
```

## Migration from Legacy System

The new theme system maintains backward compatibility:

- Legacy `setTheme()` method still works
- Windows 95 theme support preserved
- Existing localStorage data automatically migrated

## Performance

- **Lazy Loading**: Themes loaded on-demand
- **Efficient Switching**: Minimal DOM manipulation
- **Memory Management**: Proper cleanup of theme resources
- **Caching**: Theme data cached in localStorage

## Contributing

1. Follow the existing theme structure
2. Ensure proper TypeScript typing
3. Add comprehensive CSS styling
4. Test across different themes
5. Update documentation

## License

Part of the Penguin Pool application - see main LICENSE file for details.
