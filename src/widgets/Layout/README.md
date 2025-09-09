# Sakai-Style Layout System

This directory contains the refactored layout system for Penguin Pool, inspired by the Sakai Vue template and built with PrimeVue components.

## Overview

The new layout system provides a modern, responsive design with the following features:

- **Sakai-style Layout**: Clean, professional design following PrimeVue Sakai template patterns
- **PrimeVue Integration**: Built with PrimeVue components for consistency and functionality
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme System**: Integrated with the existing theme management system
- **Layout Modes**: Support for both static and overlay sidebar modes

## Components

### Core Layout Components

- **AppLayout.vue**: Main layout wrapper that orchestrates all layout components
- **AppTopbar.vue**: Fixed top navigation bar with logo, search, and actions
- **AppSidebar.vue**: Sidebar container that houses the navigation menu
- **AppMenu.vue**: Hierarchical navigation menu structure
- **AppMenuItem.vue**: Individual menu item with support for submenus and badges
- **AppConfigurator.vue**: Theme and layout configuration panel

### Layout Composable

- **layout.ts**: Centralized layout state management and configuration

## Features

### Layout Modes

1. **Static Mode**: Sidebar is always visible and pushes content to the right
2. **Overlay Mode**: Sidebar overlays content when opened

### Responsive Behavior

- **Desktop (≥1024px)**: Full sidebar with static layout
- **Tablet (768px-1023px)**: Collapsible sidebar with overlay behavior
- **Mobile (<768px)**: Overlay sidebar with touch-friendly interactions

### Navigation Features

- **Hierarchical Menus**: Support for nested menu structures
- **Active States**: Visual indication of current page/route
- **Badges**: Support for notification badges on menu items
- **Icons**: PrimeIcons integration for consistent iconography

### Theme Integration

- **Preset Themes**: Built-in theme presets (Aura, Saga, Vela, Arya)
- **Primary Colors**: Customizable primary color schemes
- **Custom Themes**: Integration with existing custom theme system
- **Dark Mode**: Built-in dark/light theme toggle

## Usage

### Basic Implementation

```vue
<template>
  <AppLayout>
    <!-- Your page content here -->
  </AppLayout>
</template>

<script setup>
  import { AppLayout } from '@/widgets'
</script>
```

### Layout Configuration

```typescript
import { useLayout } from '@/widgets/Layout/composables/layout'

const { layoutConfig, toggleMenu, toggleDarkMode } = useLayout()

// Change layout mode
layoutConfig.menuMode = 'overlay'

// Toggle sidebar
toggleMenu()

// Toggle dark mode
toggleDarkMode()
```

### Custom Menu Items

```typescript
const menuModel = ref([
  {
    label: 'Section',
    items: [
      {
        label: 'Page',
        icon: 'pi pi-fw pi-home',
        to: '/page',
        badge: 'New', // Optional badge
      },
    ],
  },
])
```

## CSS Classes

### Layout Classes

- `.layout-wrapper`: Main layout container
- `.layout-main-container`: Content area wrapper
- `.layout-main`: Main content area
- `.layout-topbar`: Fixed top navigation
- `.layout-sidebar`: Sidebar container
- `.layout-footer`: Footer container

### Layout Mode Classes

- `.layout-static`: Static sidebar mode
- `.layout-overlay`: Overlay sidebar mode
- `.layout-static-inactive`: Static sidebar collapsed
- `.layout-overlay-active`: Overlay sidebar open
- `.layout-mobile-active`: Mobile sidebar open

### Utility Classes

- `.layout-mask`: Overlay mask for mobile/overlay modes
- `.animate-fadein`: Fade-in animation for overlays

## CSS Variables

The layout system uses CSS custom properties for consistent theming:

```css
:root {
  --layout-section-transition-duration: 0.2s;
  --element-transition-duration: 0.2s;
  --content-border-radius: 0.5rem;
  --focus-ring-width: 2px;
  --focus-ring-color: var(--primary-color);
}
```

## Responsive Breakpoints

- **xs**: < 640px
- **sm**: ≥ 640px
- **md**: ≥ 768px
- **lg**: ≥ 1024px
- **xl**: ≥ 1280px
- **2xl**: ≥ 1536px

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: CSS Grid, Flexbox, CSS Custom Properties, CSS Transitions

## Migration Notes

### From Old Layout

1. **AppHeader** → **AppTopbar**: Enhanced with search and config panel
2. **AppSidebar** → **AppSidebar + AppMenu**: Modular menu system
3. **Layout Logic**: Centralized in `useLayout` composable
4. **CSS Classes**: Updated to Sakai-style naming conventions

### Breaking Changes

- CSS class names have changed to follow Sakai conventions
- Layout state management is now centralized
- Responsive behavior has been updated for better mobile experience

## Future Enhancements

- [ ] **Breadcrumbs**: Navigation breadcrumb component
- [ ] **Search**: Enhanced search functionality with filters
- [ ] **Notifications**: Integrated notification system
- [ ] **User Profile**: Enhanced user profile management
- [ ] **Keyboard Navigation**: Full keyboard navigation support
- [ ] **Accessibility**: Enhanced ARIA support and screen reader compatibility

## Contributing

When adding new features to the layout system:

1. Follow the existing component structure
2. Use the `useLayout` composable for state management
3. Maintain responsive design principles
4. Test across different screen sizes and devices
5. Update this documentation accordingly
