<template>
  <div class="theme-toggle">
    <!-- Main theme toggle button -->
    <PrimeButton
      class="theme-toggle-btn p-button-text"
      @click="toggleTheme"
      :aria-label="`Switch to ${isDark ? 'light' : 'dark'} theme`"
      :title="`Switch to ${isDark ? 'light' : 'dark'} theme`"
    >
      <template #icon>
        <i :class="themeIcon" class="theme-icon"></i>
      </template>
    </PrimeButton>

    <!-- Theme menu -->
    <div class="theme-menu-container">
      <PrimeButton
        class="p-button-text"
        @click="toggleMenu"
        :aria-label="'Theme options'"
        :title="'Theme options'"
      >
        <template #icon>
          <i class="pi pi-chevron-down"></i>
        </template>
      </PrimeButton>

      <PrimeMenu
        ref="menu"
        :model="menuItems"
        :popup="true"
        :pt="{
          root: { class: 'theme-menu' },
          submenu: { class: 'theme-submenu' },
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import type { MenuItem } from 'primevue/menuitem'

  const themeStore = useThemeStore()
  const menu = ref()

  const isDark = computed(() => themeStore.isDark)
  const hasCustomTheme = computed(() => themeStore.hasCustomTheme)
  const currentTheme = computed(() => themeStore.currentTheme)
  const availableCustomThemes = computed(() => themeStore.availableCustomThemes)

  const themeIcon = computed(() => {
    if (hasCustomTheme.value) {
      return 'pi pi-palette'
    }
    return isDark.value ? 'pi pi-sun' : 'pi pi-moon'
  })

  const toggleTheme = () => {
    if (hasCustomTheme.value) {
      // If custom theme is active, clear it and go back to built-in
      clearCustomTheme()
    } else {
      // Toggle between light and dark
      themeStore.toggleTheme()
    }
  }

  const toggleMenu = (event: Event) => {
    menu.value?.toggle(event)
  }

  const menuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        label: 'Built-in Themes',
        items: [
          {
            label: 'Light',
            icon: 'pi pi-sun',
            class: !hasCustomTheme.value && currentTheme.value === 'light' ? 'active-theme' : '',
            command: () => themeStore.setBuiltInTheme('light'),
          },
          {
            label: 'Dark',
            icon: 'pi pi-moon',
            class: !hasCustomTheme.value && currentTheme.value === 'dark' ? 'active-theme' : '',
            command: () => themeStore.setBuiltInTheme('dark'),
          },
        ],
      },
    ]

    if (availableCustomThemes.value.length > 0) {
      items.push({
        label: 'Custom Themes',
        items: availableCustomThemes.value.map(theme => ({
          label: theme.name,
          icon: 'pi pi-palette',
          class:
            hasCustomTheme.value && themeStore.currentCustomTheme?.id === theme.id
              ? 'active-theme'
              : '',
          command: () => themeStore.setCustomTheme(theme.id),
        })),
      })
    }

    if (hasCustomTheme.value) {
      items.push({
        label: 'Clear Custom Theme',
        icon: 'pi pi-times',
        class: 'clear-theme',
        command: clearCustomTheme,
      })
    }

    return items
  })

  const clearCustomTheme = async () => {
    try {
      await themeStore.clearCustomTheme()
    } catch (error) {
      console.error('Failed to clear custom theme:', error)
    }
  }
</script>

<style scoped>
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  .theme-toggle-btn {
    width: 2.5rem !important;
    height: 2.5rem !important;
  }

  .theme-icon {
    font-size: 1rem;
  }

  .theme-menu-container {
    display: flex;
    align-items: center;
  }

  :deep(.theme-menu) {
    min-width: 200px;
  }

  :deep(.active-theme) {
    background: var(--primary-color);
    color: var(--primary-color-text);
  }

  :deep(.clear-theme) {
    color: var(--red-500);
  }

  :deep(.clear-theme:hover) {
    background: var(--red-500);
    color: white;
  }

  /* Windows 95 specific styling */
  :global(.theme-windows95) :deep(.p-button) {
    border: 2px solid;
    border-color: var(--theme-surface) var(--theme-border) var(--theme-border) var(--theme-surface);
    box-shadow: var(--theme-shadow-outset);
    background: var(--theme-surface);
    color: var(--theme-text);
    min-height: 23px;
    min-width: 23px;
  }

  :global(.theme-windows95) :deep(.p-button:hover) {
    background: var(--theme-hover);
  }

  :global(.theme-windows95) :deep(.p-button:active) {
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-inset);
  }

  :global(.theme-windows95) :deep(.p-menu) {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-outset);
    font-family: var(--theme-font-family);
  }

  :global(.theme-windows95) :deep(.p-submenu-header) {
    background: var(--theme-primary);
    color: var(--theme-surface);
    font-weight: var(--theme-font-weight-bold);
  }

  :global(.theme-windows95) :deep(.p-menuitem-link:hover) {
    background: var(--theme-hover);
  }

  :global(.theme-windows95) :deep(.active-theme) {
    background: var(--theme-primary);
    color: var(--theme-surface);
  }
</style>
