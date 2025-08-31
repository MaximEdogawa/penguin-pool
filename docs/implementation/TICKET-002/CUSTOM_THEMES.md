# Custom Themes System

## Overview

The Custom Themes System is a comprehensive theming solution that allows users to personalize their Penguin Pool experience with multiple pre-built themes and the ability to create custom themes.

## Pre-built Themes

### 1. Windows 95 Theme

- **Style**: Retro computing aesthetic
- **Colors**: Classic gray palette with blue accents
- **Use Case**: Nostalgic computing experience, retro gaming applications
- **Accessibility**: High contrast for readability

### 2. Material Design Theme

- **Style**: Google's Material Design 3 principles
- **Colors**: Dynamic color system with elevation and shadows
- **Use Case**: Modern web applications, Google ecosystem integration
- **Accessibility**: Built-in accessibility features and color contrast

### 3. Nord Theme

- **Style**: Arctic-inspired minimalist design
- **Colors**: Cool blues and grays with reduced eye strain
- **Use Case**: Long coding sessions, dark mode preference
- **Accessibility**: Optimized for reduced eye strain and focus

### 4. Solarized Theme

- **Style**: Professional color scheme
- **Colors**: Carefully selected palette for long viewing sessions
- **Use Case**: Professional development environments, documentation
- **Accessibility**: Scientifically designed for readability

## Technical Architecture

### CSS Custom Properties

```css
:root {
  /* Color Palette */
  --theme-primary: #007bff;
  --theme-secondary: #6c757d;
  --theme-success: #28a745;
  --theme-danger: #dc3545;
  --theme-warning: #ffc107;
  --theme-info: #17a2b8;

  /* Typography */
  --theme-font-family: 'Inter', sans-serif;
  --theme-font-size-base: 1rem;
  --theme-line-height: 1.5;

  /* Spacing */
  --theme-spacing-unit: 0.25rem;
  --theme-border-radius: 0.375rem;

  /* Shadows */
  --theme-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --theme-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --theme-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Theme Configuration Files

```json
{
  "name": "Windows 95",
  "category": "Retro",
  "version": "1.0.0",
  "author": "Penguin Pool Team",
  "description": "Classic Windows 95 aesthetic",
  "colors": {
    "primary": "#000080",
    "secondary": "#c0c0c0",
    "background": "#c0c0c0",
    "surface": "#ffffff",
    "text": "#000000"
  },
  "typography": {
    "fontFamily": "MS Sans Serif, sans-serif",
    "fontSize": "14px"
  }
}
```

## Theme Switching Implementation

### Theme Store (Pinia)

```typescript
export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'default',
    availableThemes: [],
    customThemes: [],
  }),

  actions: {
    switchTheme(themeName: string) {
      this.currentTheme = themeName
      this.applyTheme(themeName)
      this.persistTheme(themeName)
    },

    applyTheme(themeName: string) {
      const theme = this.getTheme(themeName)
      if (theme) {
        this.updateCSSVariables(theme)
        this.updateComponentClasses(theme)
      }
    },
  },
})
```

### Dynamic Theme Application

```typescript
function updateCSSVariables(theme: Theme) {
  const root = document.documentElement

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value)
  })

  Object.entries(theme.typography).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value)
  })
}
```

## Component Integration

### Theme-Aware Components

```vue
<template>
  <div class="theme-aware-component">
    <slot />
  </div>
</template>

<script setup lang="ts">
  import { useThemeStore } from '@/stores/theme'

  const themeStore = useThemeStore()

  // Component automatically inherits theme variables
</script>

<style scoped>
  .theme-aware-component {
    background-color: var(--theme-surface);
    color: var(--theme-text);
    border: 1px solid var(--theme-border);
    border-radius: var(--theme-border-radius);
    padding: var(--theme-spacing-unit);
    box-shadow: var(--theme-shadow-sm);
  }
</style>
```

## User Interface

### Theme Switcher Component

```vue
<template>
  <div class="theme-switcher">
    <Dropdown
      v-model="selectedTheme"
      :options="availableThemes"
      option-label="name"
      option-value="id"
      placeholder="Select Theme"
      @change="onThemeChange"
    >
      <template #option="slotProps">
        <div class="theme-option">
          <div class="theme-preview" :style="getThemePreview(slotProps.option)">
            <div class="preview-header"></div>
            <div class="preview-content"></div>
          </div>
          <span class="theme-name">{{ slotProps.option.name }}</span>
        </div>
      </template>
    </Dropdown>
  </div>
</template>
```

## Custom Theme Creation

### Theme Builder Interface

- **Color Palette Generator**: Interactive color picker with accessibility validation
- **Typography Settings**: Font family, size, and line height customization
- **Component Preview**: Live preview of how components look with the theme
- **Export/Import**: JSON format for sharing themes

### Theme Validation

- **Accessibility Check**: WCAG 2.1 AA compliance validation
- **Color Contrast**: Automatic contrast ratio calculation
- **Performance Impact**: Bundle size and rendering performance analysis

## Future Enhancements

### Phase 2

- **Theme Marketplace**: Community theme sharing platform
- **Advanced Customization**: CSS custom property editor
- **Theme Analytics**: Usage statistics and popularity metrics

### Phase 3

- **AI-Powered Themes**: Automatic theme generation based on user preferences
- **Dynamic Themes**: Time-based and context-aware theme switching
- **Theme Plugins**: Extensible theme system with third-party support

## Browser Support

- **Modern Browsers**: Full support for CSS custom properties
- **Fallback Support**: Graceful degradation for older browsers
- **Progressive Enhancement**: Enhanced experience for supported browsers

## Performance Considerations

- **CSS Variables**: Efficient theme switching without DOM manipulation
- **Lazy Loading**: Theme assets loaded on-demand
- **Caching**: Theme configurations cached for faster switching
- **Bundle Optimization**: Minimal impact on initial page load
