# Custom Theme Development Guide

## Overview

This guide explains how to create custom themes for Penguin Pool that change visual appearance without breaking layout functionality. Themes should only modify colors, typography, shadows, and borders - never layout properties.

## Theme Architecture Principles

### 1. **Separation of Concerns**

- **Layout**: Handled by Vue components and CSS layout rules
- **Styling**: Handled by themes (colors, fonts, shadows, borders)
- **Behavior**: Handled by JavaScript/Vue logic

### 2. **Never Break Layout**

- ❌ **Don't modify**: `position`, `display`, `width`, `height`, `margin`, `padding`, `overflow`
- ❌ **Don't use**: `!important` for layout properties
- ✅ **Do modify**: `background`, `color`, `border`, `font-family`, `box-shadow`

### 3. **Use CSS Custom Properties**

- Define theme variables in the theme object
- Apply them via CSS classes
- Keep layout CSS separate from theme CSS

## Theme Structure

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

## Creating a Safe Theme

### Step 1: Define Theme Object

```typescript
// src/features/theme/themes/myTheme.ts
import type { CustomTheme } from '../types/theme'

export const myTheme: CustomTheme = {
  id: 'my-theme',
  name: 'My Custom Theme',
  category: 'modern',
  version: '1.0.0',
  author: 'Your Name',
  description: 'A modern, clean theme',

  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    // ... other colors
  },

  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSizeBase: '14px',
    // ... other typography
  },

  // ... other properties
}
```

### Step 2: Create CSS File

```css
/* src/features/theme/themes/myTheme.css */

/* Apply theme class to root */
.theme-my-theme {
  /* Define CSS custom properties */
  --theme-primary: #3b82f6;
  --theme-secondary: #6b7280;
  --theme-background: #ffffff;
  --theme-surface: #f8fafc;
  --theme-text: #1e293b;
  --theme-border: #e2e8f0;

  /* Typography */
  --theme-font-family: 'Inter', sans-serif;
  --theme-font-size-base: 14px;

  /* Shadows */
  --theme-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --theme-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  /* Border radius */
  --theme-border-radius: 8px;
}

/* Apply styles - ONLY VISUAL, NO LAYOUT */
.theme-my-theme {
  background: var(--theme-background);
  color: var(--theme-text);
  font-family: var(--theme-font-family);
}

/* Button styling - preserve layout */
.theme-my-theme .p-button,
.theme-my-theme button {
  background: var(--theme-surface);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow-sm);
  /* DON'T modify: padding, margin, width, height, position, display */
}

/* Sidebar styling - preserve layout */
.theme-my-theme .sidebar {
  background: var(--theme-surface);
  border-right: 1px solid var(--theme-border);
  /* DON'T modify: position, width, height, transform, z-index */
}

/* Input styling - preserve layout */
.theme-my-theme input,
.theme-my-theme .p-inputtext {
  background: var(--theme-surface);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  /* DON'T modify: padding, margin, width, height */
}
```

### Step 3: Register Theme

```typescript
// In your theme manager or main file
import { myTheme } from './themes/myTheme'
import './themes/myTheme.css'

// Add to available themes
themeManager.addCustomTheme(myTheme)
```

## Safe CSS Properties to Modify

### ✅ **Safe to Modify**

- `background` / `background-color`
- `color`
- `border` / `border-color` / `border-style` / `border-width`
- `font-family` / `font-size` / `font-weight` / `font-style`
- `box-shadow` / `text-shadow`
- `border-radius`
- `opacity`
- `text-decoration`
- `outline` / `outline-color`

### ❌ **Never Modify**

- `position`
- `display`
- `width` / `height`
- `margin` / `padding`
- `overflow`
- `z-index`
- `transform`
- `transition` / `animation`
- `flex` / `grid` properties
- `float` / `clear`

## Layout-Safe Patterns

### 1. **Use CSS Custom Properties**

```css
.theme-my-theme {
  --theme-button-padding: 12px 24px;
  --theme-button-border-radius: 8px;
}

.theme-my-theme button {
  padding: var(--theme-button-padding);
  border-radius: var(--theme-button-border-radius);
}
```

### 2. **Target Specific Components**

```css
/* Good: Target specific components */
.theme-my-theme .sidebar-nav {
  background: var(--theme-surface);
}

/* Bad: Target generic elements that might affect layout */
.theme-my-theme nav {
  /* This could break other nav elements */
}
```

### 3. **Use Descendant Selectors**

```css
/* Good: Specific targeting */
.theme-my-theme .sidebar .nav-link {
  color: var(--theme-text);
}

/* Bad: Too generic */
.theme-my-theme .nav-link {
  /* Could affect nav links outside sidebar */
}
```

## Testing Your Theme

### 1. **Layout Testing Checklist**

- [ ] Sidebar opens/closes correctly
- [ ] Sidebar collapses/expands properly
- [ ] Responsive behavior works on mobile
- [ ] No horizontal scrolling issues
- [ ] All buttons and inputs are properly sized
- [ ] No overlapping elements

### 2. **Theme Testing Checklist**

- [ ] Colors are applied correctly
- [ ] Typography changes are visible
- [ ] Shadows and borders render properly
- [ ] Hover states work
- [ ] Focus states are visible
- [ ] Theme switches without errors

### 3. **Cross-Browser Testing**

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Common Pitfalls to Avoid

### 1. **Using !important for Layout**

```css
/* ❌ Bad */
.theme-my-theme .sidebar {
  position: fixed !important; /* Don't override layout */
  width: 300px !important; /* Don't override layout */
}

/* ✅ Good */
.theme-my-theme .sidebar {
  background: var(--theme-surface); /* Only visual */
  border: 1px solid var(--theme-border); /* Only visual */
}
```

### 2. **Overriding Component Layout**

```css
/* ❌ Bad */
.theme-my-theme * {
  margin: 0 !important; /* Breaks spacing */
  padding: 0 !important; /* Breaks spacing */
}

/* ✅ Good */
.theme-my-theme .card {
  background: var(--theme-surface); /* Only visual */
  border: 1px solid var(--theme-border); /* Only visual */
}
```

### 3. **Modifying Flexbox/Grid**

```css
/* ❌ Bad */
.theme-my-theme .sidebar {
  display: block !important; /* Breaks flexbox layout */
}

/* ✅ Good */
.theme-my-theme .sidebar {
  background: var(--theme-surface); /* Only visual */
}
```

## Example: Retro Theme

```css
/* Retro theme example */
.theme-retro {
  --theme-primary: #8b4513;
  --theme-background: #f5f5dc;
  --theme-surface: #deb887;
  --theme-text: #2f1b14;
  --theme-border: #8b4513;
  --theme-font-family: 'Courier New', monospace;
  --theme-border-radius: 0px;
  --theme-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.theme-retro {
  background: var(--theme-background);
  color: var(--theme-text);
  font-family: var(--theme-font-family);
}

.theme-retro .sidebar {
  background: var(--theme-surface);
  border-right: 2px solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.theme-retro button {
  background: var(--theme-surface);
  color: var(--theme-text);
  border: 2px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow);
}
```

## Debugging Theme Issues

### 1. **Check Browser DevTools**

- Inspect element styles
- Look for conflicting CSS rules
- Check if theme classes are applied

### 2. **Common Issues**

- **Layout broken**: Check for layout properties in theme CSS
- **Theme not applied**: Verify theme class is added to root element
- **Conflicting styles**: Look for CSS specificity issues

### 3. **Theme Switching Issues**

- Check console for errors
- Verify theme manager is working
- Ensure CSS files are imported

## Best Practices Summary

1. **Only style, never layout**
2. **Use CSS custom properties**
3. **Target specific components**
4. **Test thoroughly**
5. **Keep themes simple**
6. **Document your theme**
7. **Follow naming conventions**
8. **Test responsive behavior**

## Getting Help

If you encounter issues:

1. Check this guide first
2. Review existing theme implementations
3. Test with minimal CSS changes
4. Ask in the development team
5. Create a minimal reproduction case

Remember: **The goal is beautiful styling without breaking functionality!**
