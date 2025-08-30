# Theme System

This feature provides a comprehensive theming system for the Penguin Pool application, including the Windows 95 retro theme.

## Features

- **Multiple Theme Support**: Built-in light/dark themes plus custom themes
- **Windows 95 Theme**: Authentic retro computing aesthetic with 3D effects
- **Dynamic Theme Switching**: Change themes without page reload
- **Theme Persistence**: Themes are saved and restored across sessions
- **Component Integration**: All PrimeVue components automatically adapt to themes

## Available Themes

### Built-in Themes

- **Auto**: Automatically follows system preference
- **Light**: Modern light theme
- **Dark**: Modern dark theme

### Custom Themes

- **Windows 95**: Classic retro computing aesthetic

## Usage

### Basic Theme Switching

```vue
<template>
  <ThemeSwitcher />
</template>

<script setup>
  import { ThemeSwitcher } from '@/features/theme'
</script>
```

### Programmatic Theme Control

```typescript
import { useThemeStore } from '@/features/theme'

const themeStore = useThemeStore()

// Switch to Windows 95 theme
await themeStore.setTheme('windows95')

// Switch to built-in themes
await themeStore.setTheme('light')
await themeStore.setTheme('dark')
await themeStore.setTheme('auto')
```

### Theme Demo Component

```vue
<template>
  <ThemeDemo />
</template>

<script setup>
  import { ThemeDemo } from '@/features/theme'
</script>
```

## Windows 95 Theme Features

The Windows 95 theme provides an authentic retro computing experience:

### Visual Characteristics

- **Classic Gray Palette**: Authentic Windows 95 colors
- **3D Border Effects**: Inset/outset shadows for buttons and inputs
- **MS Sans Serif Font**: Classic Windows 95 typography
- **No Rounded Corners**: Authentic square design
- **Classic Scrollbars**: Windows 95 style scrollbars

### Component Styling

- **Buttons**: 3D raised effect with proper hover/active states
- **Inputs**: Inset borders with focus indicators
- **Cards**: Outset borders with header styling
- **Tables**: Classic grid layout with proper borders
- **Dropdowns**: Windows 95 style menus

## Architecture

### Theme Manager

The `ThemeManager` service handles:

- Theme switching and application
- CSS custom property management
- Theme persistence and loading
- Custom theme management

### Theme Store

The Pinia store provides:

- Reactive theme state
- Theme switching actions
- Theme metadata access
- Integration with Vue components

### CSS Implementation

Themes are implemented using:

- CSS custom properties (variables)
- Theme-specific CSS classes
- Component overrides for PrimeVue
- Responsive design considerations

## Adding New Themes

To create a new custom theme:

1. **Create Theme Configuration**:

```typescript
// src/features/theme/themes/mytheme.ts
export const myTheme: CustomTheme = {
  id: 'mytheme',
  name: 'My Theme',
  category: 'modern',
  // ... theme configuration
}
```

2. **Create CSS Theme**:

```css
/* src/features/theme/themes/mytheme.css */
.theme-mytheme {
  --theme-primary: #your-color;
  /* ... other variables */
}
```

3. **Register in Theme Manager**:

```typescript
// src/features/theme/services/themeManager.ts
import { myTheme } from '../themes/mytheme'

private availableThemes: CustomTheme[] = [windows95Theme, myTheme]
```

4. **Import CSS**:

```css
/* src/assets/main.css */
@import '../features/theme/themes/mytheme.css';
```

## Browser Support

- **Modern Browsers**: Full support for CSS custom properties
- **Fallback Support**: Graceful degradation for older browsers
- **Progressive Enhancement**: Enhanced experience for supported browsers

## Performance

- **CSS Variables**: Efficient theme switching without DOM manipulation
- **Lazy Loading**: Theme assets loaded on-demand
- **Caching**: Theme configurations cached for faster switching
- **Bundle Optimization**: Minimal impact on initial page load

## Troubleshooting

### Theme Not Applying

1. Check browser console for errors
2. Verify CSS import paths
3. Ensure theme classes are properly applied
4. Check for CSS conflicts

### Custom Theme Issues

1. Validate theme configuration structure
2. Check CSS custom property definitions
3. Verify component class overrides
4. Test in different browsers

## Future Enhancements

- **Theme Marketplace**: Community theme sharing
- **Advanced Customization**: Color picker and live preview
- **Theme Analytics**: Usage statistics and popularity metrics
- **AI-Powered Themes**: Automatic theme generation
- **Dynamic Themes**: Time-based and context-aware switching
