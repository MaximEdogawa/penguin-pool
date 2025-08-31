<template>
  <div class="theme-settings">
    <div class="settings-header">
      <h3 class="settings-title">Theme Settings</h3>
      <p class="settings-description">Customize your application appearance with custom themes</p>
    </div>

    <!-- Current Theme Display -->
    <div class="current-theme-section">
      <h4>Current Theme</h4>
      <div class="current-theme-display">
        <div v-if="hasCustomTheme" class="custom-theme-info">
          <div class="theme-preview" :style="getThemePreview(currentCustomTheme!)"></div>
          <div class="theme-details">
            <h5>{{ currentCustomTheme?.name }}</h5>
            <p>{{ currentCustomTheme?.description }}</p>
            <span class="theme-category">{{ currentCustomTheme?.category }}</span>
            <span class="theme-variant">{{ currentThemeVariant }} variant</span>
          </div>
          <button class="clear-theme-btn" @click="clearCustomTheme">
            <i class="pi pi-times"></i>
            Clear Theme
          </button>
        </div>
        <div v-else-if="isPrimeUI" class="primeui-theme-info">
          <div class="theme-preview" :style="getPrimeUIThemePreview()"></div>
          <div class="theme-details">
            <h5>{{ getPrimeUIThemeName() }}</h5>
            <p>PrimeUI {{ currentPrimeUITheme }} theme</p>
            <span class="theme-category">PrimeUI</span>
            <span class="theme-variant">{{ currentThemeVariant }} variant</span>
          </div>
          <button class="clear-theme-btn" @click="clearPrimeUITheme">
            <i class="pi pi-times"></i>
            Clear Theme
          </button>
        </div>
        <div v-else class="built-in-theme-info">
          <div class="theme-preview" :style="getBuiltInThemePreview()"></div>
          <div class="theme-details">
            <h5>{{ getBuiltInThemeName() }}</h5>
            <p>Built-in {{ currentTheme }} theme</p>
            <span class="theme-category">Built-in</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Variant Toggle -->
    <div v-if="isPrimeUI || hasCustomTheme" class="theme-variant-section">
      <h4>Theme Variant</h4>
      <div class="variant-toggle">
        <button
          class="variant-btn"
          :class="{ active: currentThemeVariant === 'light' }"
          @click="switchToVariant('light')"
        >
          <i class="pi pi-sun"></i>
          Light
        </button>
        <button
          class="variant-btn"
          :class="{ active: currentThemeVariant === 'dark' }"
          @click="switchToVariant('dark')"
        >
          <i class="pi pi-moon"></i>
          Dark
        </button>
      </div>
    </div>

    <!-- PrimeUI Theme Settings -->
    <div v-if="isPrimeUI" class="primeui-settings-section">
      <h4>PrimeUI Theme Customization</h4>
      <div class="primeui-settings-grid">
        <div class="color-picker-group">
          <label for="primary-color">Primary Color:</label>
          <div class="color-input-group">
            <input
              type="color"
              id="primary-color"
              v-model="primaryColor"
              @change="updatePrimaryColor"
              class="color-picker"
            />
            <input
              type="text"
              v-model="primaryColor"
              @input="updatePrimaryColor"
              class="color-text-input"
              placeholder="#6366f1"
            />
          </div>
          <p class="color-help">Click the color picker or type a hex color to test</p>
        </div>
        <div class="color-picker-group">
          <label for="surface-color">Surface Color:</label>
          <div class="color-input-group">
            <input
              type="color"
              id="surface-color"
              v-model="surfaceColor"
              @change="updateSurfaceColor"
              class="color-picker"
            />
            <input
              type="text"
              v-model="surfaceColor"
              @input="updateSurfaceColor"
              class="color-text-input"
              placeholder="#ffffff"
            />
          </div>
          <p class="color-help">Click the color picker or type a hex color to test</p>
        </div>
      </div>
    </div>

    <!-- Available Custom Themes -->
    <div class="available-themes-section">
      <h4>Available Custom Themes</h4>
      <div class="themes-grid">
        <div
          v-for="theme in availableCustomThemes"
          :key="theme.id"
          class="theme-card"
          :class="{ active: currentCustomTheme?.id === theme.id }"
        >
          <div class="theme-preview" :style="getThemePreview(theme)"></div>
          <div class="theme-info">
            <h5>{{ theme.name }}</h5>
            <p>{{ theme.description }}</p>
            <span class="theme-category">{{ theme.category }}</span>
          </div>
          <div class="theme-actions">
            <button
              v-if="currentCustomTheme?.id !== theme.id"
              class="apply-theme-btn"
              @click="applyCustomTheme(theme.id)"
            >
              Apply Theme
            </button>
            <button v-else class="active-theme-btn" disabled>Active</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme Import/Export -->
    <div class="theme-import-export">
      <h4>Import/Export Themes</h4>
      <div class="import-export-actions">
        <div class="export-section">
          <label for="export-theme">Export Current Theme:</label>
          <select id="export-theme" v-model="exportThemeId" class="export-select">
            <option value="">Select a theme to export</option>
            <option v-for="theme in availableCustomThemes" :key="theme.id" :value="theme.id">
              {{ theme.name }}
            </option>
          </select>
          <button class="export-btn" @click="exportTheme" :disabled="!exportThemeId">
            <i class="pi pi-download"></i>
            Export
          </button>
        </div>

        <div class="import-section">
          <label for="import-theme">Import Theme File:</label>
          <input
            type="file"
            id="import-theme"
            accept=".json"
            @change="importTheme"
            class="import-input"
          />
          <button class="import-btn" @click="triggerImport" :disabled="!importFile">
            <i class="pi pi-upload"></i>
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import type { CustomTheme } from '../types/theme'

  const themeStore = useThemeStore()

  const exportThemeId = ref('')
  const importFile = ref<File | null>(null)
  const primaryColor = ref(themeStore.currentPrimaryColor)
  const surfaceColor = ref(themeStore.currentSurfaceColor)

  const currentTheme = computed(() => themeStore.currentTheme)
  const hasCustomTheme = computed(() => themeStore.hasCustomTheme)
  const isPrimeUI = computed(() => themeStore.isPrimeUI)
  const currentCustomTheme = computed(() => themeStore.currentCustomTheme)
  const currentPrimeUITheme = computed(() => themeStore.currentPrimeUITheme)
  const currentThemeVariant = computed(() => themeStore.currentThemeVariant)
  const availableCustomThemes = computed(() => themeStore.availableCustomThemes)

  const getThemePreview = (theme: CustomTheme) => {
    return {
      background: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.text,
    }
  }

  const getPrimeUIThemePreview = () => {
    return {
      background: surfaceColor.value,
      border: `1px solid ${primaryColor.value}`,
      color: primaryColor.value,
    }
  }

  const getBuiltInThemePreview = () => {
    if (currentTheme.value === 'dark') {
      return { background: '#1f2937', border: '1px solid #374151', color: '#f1f5f9' }
    }
    return { background: '#f9fafb', border: '1px solid #e5e7eb', color: '#1e293b' }
  }

  const getBuiltInThemeName = () => {
    switch (currentTheme.value) {
      case 'dark':
        return 'Dark Theme'
      case 'light':
        return 'Light Theme'
      case 'auto':
        return 'Auto Theme (System)'
      default:
        return 'Unknown Theme'
    }
  }

  const getPrimeUIThemeName = () => {
    return currentPrimeUITheme.value
      ? currentPrimeUITheme.value.charAt(0).toUpperCase() + currentPrimeUITheme.value.slice(1)
      : 'No Theme'
  }

  const applyCustomTheme = async (themeId: string) => {
    try {
      await themeStore.setCustomTheme(themeId)
    } catch (error) {
      console.error('Failed to apply custom theme:', error)
    }
  }

  const clearCustomTheme = async () => {
    try {
      await themeStore.clearCustomTheme()
    } catch (error) {
      console.error('Failed to clear custom theme:', error)
    }
  }

  const clearPrimeUITheme = async () => {
    try {
      await themeStore.setBuiltInTheme('light')
    } catch (error) {
      console.error('Failed to clear PrimeUI theme:', error)
    }
  }

  const switchToVariant = async (variant: 'light' | 'dark') => {
    try {
      if (isPrimeUI.value && currentPrimeUITheme.value) {
        await themeStore.setPrimeUITheme(currentPrimeUITheme.value, variant)
      } else if (hasCustomTheme.value) {
        await themeStore.switchThemeVariant(variant)
      }
    } catch (error) {
      console.error('Failed to switch theme variant:', error)
    }
  }

  const updatePrimaryColor = async () => {
    try {
      await themeStore.updatePrimeUIColors(primaryColor.value, surfaceColor.value)
    } catch (error) {
      console.error('Failed to update primary color:', error)
    }
  }

  const updateSurfaceColor = async () => {
    try {
      await themeStore.updatePrimeUIColors(primaryColor.value, surfaceColor.value)
    } catch (error) {
      console.error('Failed to update surface color:', error)
    }
  }

  const exportTheme = () => {
    if (!exportThemeId.value) return

    try {
      const themeJson = themeStore.exportTheme(exportThemeId.value)
      const blob = new Blob([themeJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportThemeId.value}-theme.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export theme:', error)
    }
  }

  const triggerImport = () => {
    const input = document.getElementById('import-theme') as HTMLInputElement
    input?.click()
  }

  const importTheme = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    try {
      const text = await file.text()
      await themeStore.importTheme(text)
      importFile.value = file
    } catch (error) {
      console.error('Failed to import theme:', error)
    }
  }

  // Watch for theme changes to update color inputs
  import { watch } from 'vue'
  watch(
    () => themeStore.currentPrimaryColor,
    newColor => {
      primaryColor.value = newColor
    }
  )
  watch(
    () => themeStore.currentSurfaceColor,
    newColor => {
      surfaceColor.value = newColor
    }
  )
</script>

<style scoped>
  .theme-settings {
    padding: 16px;
    max-width: 100%;
  }

  @media (min-width: 640px) {
    .theme-settings {
      padding: 24px;
      max-width: 800px;
    }
  }

  .settings-header {
    margin-bottom: 24px;
    text-align: center;
  }

  .settings-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--text-color);
  }

  .settings-description {
    color: var(--text-color-secondary);
    font-size: 14px;
  }

  /* Dark theme specific adjustments */
  :global(.dark) .settings-title {
    color: #e5e7eb; /* Softer white for dark theme */
  }

  :global(.dark) .settings-description {
    color: #9ca3af; /* Softer gray for dark theme */
  }

  @media (min-width: 640px) {
    .settings-header {
      margin-bottom: 32px;
    }

    .settings-title {
      font-size: 24px;
    }

    .settings-description {
      font-size: 16px;
    }
  }

  .current-theme-section,
  .theme-variant-section,
  .primeui-settings-section,
  .available-themes-section,
  .theme-import-export {
    margin-bottom: 24px;
    padding: 16px;
    border-radius: 8px;
  }

  /* Theme-specific backgrounds for sections */
  :global(.dark) .current-theme-section,
  :global(.dark) .available-themes-section,
  :global(.dark) .primeui-settings-section,
  :global(.dark) .theme-variant-section {
    background: #1a4731; /* Dark green for dark theme */
  }

  :global(.theme-windows95) .current-theme-section,
  :global(.theme-windows95) .available-themes-section,
  :global(.theme-windows95) .primeui-settings-section,
  :global(.theme-windows95) .theme-variant-section {
    background: #ffffff; /* White for Windows 95 theme */
    border: 2px solid;
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-outset);
  }

  /* Default light theme */
  .current-theme-section,
  .available-themes-section,
  .primeui-settings-section,
  .theme-variant-section {
    background: #374151; /* Dark color for light theme */
  }

  .current-theme-section h4,
  .theme-variant-section h4,
  .primeui-settings-section h4,
  .available-themes-section h4,
  .theme-import-export h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #ffffff;
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 6px;
  }

  /* Theme-specific adjustments for section headers */
  :global(.dark) .current-theme-section h4,
  :global(.dark) .available-themes-section h4,
  :global(.dark) .theme-import-export h4,
  :global(.dark) .primeui-settings-section h4,
  :global(.dark) .theme-variant-section h4 {
    color: #ffffff;
    border-bottom-color: #2d6a4f;
  }

  :global(.theme-windows95) .current-theme-section h4,
  :global(.theme-windows95) .available-themes-section h4,
  :global(.theme-windows95) .primeui-settings-section h4,
  :global(.theme-windows95) .theme-variant-section h4 {
    color: var(--theme-text);
    border-bottom-color: var(--theme-border);
  }

  @media (min-width: 640px) {
    .current-theme-section,
    .theme-variant-section,
    .primeui-settings-section,
    .available-themes-section,
    .theme-import-export {
      margin-bottom: 32px;
    }

    .current-theme-section h4,
    .theme-variant-section h4,
    .primeui-settings-section h4,
    .available-themes-section h4,
    .theme-import-export h4 {
      font-size: 18px;
      margin-bottom: 16px;
      padding-bottom: 8px;
    }
  }

  .current-theme-display {
    background: #ffffff;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 12px;
  }

  /* Theme specific adjustments for current theme display */
  :global(.dark) .current-theme-display {
    background: #1f2937;
    border-color: #374151;
  }

  :global(.theme-windows95) .current-theme-display {
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
  }

  .custom-theme-info,
  .primeui-theme-info,
  .built-in-theme-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    background: #ffffff;
    padding: 12px;
    border-radius: 6px;
  }

  /* Theme specific backgrounds for theme info */
  :global(.dark) .custom-theme-info,
  :global(.dark) .primeui-theme-info,
  :global(.dark) .built-in-theme-info {
    background: #1f2937;
  }

  :global(.theme-windows95) .custom-theme-info,
  :global(.theme-windows95) .primeui-theme-info,
  :global(.theme-windows95) .built-in-theme-info {
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
  }

  @media (min-width: 640px) {
    .current-theme-display {
      padding: 16px;
    }

    .custom-theme-info,
    .primeui-theme-info,
    .built-in-theme-info {
      gap: 16px;
    }
  }

  .theme-preview {
    width: 50px;
    height: 35px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .theme-details h5 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--text-color);
  }

  .theme-details p {
    color: var(--text-color-secondary);
    margin-bottom: 6px;
    font-size: 12px;
  }

  /* Dark theme specific adjustments for theme details */
  :global(.dark) .theme-details h5 {
    color: #e5e7eb; /* Softer white for dark theme */
  }

  :global(.dark) .theme-details p {
    color: #9ca3af; /* Softer gray for dark theme */
  }

  @media (min-width: 640px) {
    .theme-preview {
      width: 60px;
      height: 40px;
    }

    .theme-details h5 {
      font-size: 16px;
    }

    .theme-details p {
      font-size: 14px;
      margin-bottom: 8px;
    }
  }

  .theme-category {
    display: inline-block;
    background: var(--primary-color);
    color: var(--primary-color-text);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
    margin-right: 8px;
  }

  .theme-variant {
    display: inline-block;
    background: var(--secondary-color);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
  }

  @media (min-width: 640px) {
    .theme-category,
    .theme-variant {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
  }

  .clear-theme-btn {
    margin-left: auto;
    padding: 6px 12px;
    background: var(--danger-color);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s ease;
  }

  @media (min-width: 640px) {
    .clear-theme-btn {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  .clear-theme-btn:hover {
    background: var(--danger-color-hover);
  }

  /* Theme Variant Toggle */
  .variant-toggle {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .variant-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: 2px solid var(--surface-border);
    border-radius: 8px;
    background: var(--surface-ground);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .variant-btn:hover {
    border-color: var(--primary-color);
    background: var(--surface-hover);
  }

  .variant-btn.active {
    background: var(--primary-color);
    color: var(--primary-color-text);
    border-color: var(--primary-color);
  }

  .variant-btn i {
    font-size: 16px;
  }

  /* PrimeUI Settings Styles */
  .primeui-settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .primeui-settings-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
  }

  .color-picker-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .color-picker-group label {
    font-weight: 500;
    color: var(--text-color);
    font-size: 14px;
  }

  .color-input-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .color-picker {
    width: 50px;
    height: 40px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: none;
  }

  .color-text-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-ground);
    color: var(--text-color);
    font-size: 14px;
    font-family: monospace;
  }

  .color-text-input:focus {
    outline: none;
    border-color: var(--primary-color);
    ring: 2px;
    ring-color: var(--primary-color);
    ring-opacity: 0.2;
  }

  .color-help {
    font-size: 12px;
    color: var(--text-color-secondary);
    margin: 0;
    font-style: italic;
  }

  .themes-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 640px) {
    .themes-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
  }

  .theme-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  /* Theme-specific backgrounds for theme cards */
  :global(.dark) .theme-card {
    background: #1f2937;
    border-color: #374151;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  :global(.theme-windows95) .theme-card {
    background: #c0c0c0;
    border: 2px solid;
    border-color: #ffffff #808080 #808080 #ffffff;
    box-shadow: none;
  }

  @media (min-width: 640px) {
    .theme-card {
      padding: 16px;
    }
  }

  .theme-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .theme-card.active {
    border-color: var(--primary-color);
    background: #4f46e5; /* Solid indigo color for active state */
    color: #ffffff;
  }

  /* Theme-specific active states */
  :global(.dark) .theme-card.active {
    background: #22c55e; /* Solid green color for dark theme */
  }

  :global(.theme-windows95) .theme-card.active {
    background: #000080; /* Classic Windows 95 blue */
  }

  .theme-card.active .theme-category {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .theme-info {
    margin: 10px 0;
  }

  .theme-info h5 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #111827;
  }

  .theme-info p {
    font-size: 12px;
    margin-bottom: 6px;
    color: #4b5563;
  }

  /* Theme specific adjustments for theme info */
  :global(.dark) .theme-info h5 {
    color: #f3f4f6;
  }

  :global(.dark) .theme-info p {
    color: #d1d5db;
  }

  :global(.theme-windows95) .theme-info h5 {
    color: #000000;
  }

  :global(.theme-windows95) .theme-info p {
    color: #000000;
  }

  /* Override colors for active cards */
  .theme-card.active .theme-info h5,
  .theme-card.active .theme-info p {
    color: #ffffff;
  }

  @media (min-width: 640px) {
    .theme-info {
      margin: 12px 0;
    }

    .theme-info h5 {
      font-size: 16px;
    }

    .theme-info p {
      font-size: 14px;
      margin-bottom: 8px;
    }
  }

  .theme-actions {
    display: flex;
    justify-content: flex-end;
  }

  .apply-theme-btn,
  .active-theme-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  @media (min-width: 640px) {
    .apply-theme-btn,
    .active-theme-btn {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  .apply-theme-btn {
    background: var(--primary-color);
    color: var(--primary-color-text);
  }

  .apply-theme-btn:hover {
    background: var(--primary-color-hover);
  }

  .active-theme-btn {
    background: var(--success-color);
    color: white;
    cursor: default;
  }

  .import-export-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .export-section,
  .import-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  @media (min-width: 640px) {
    .import-export-actions {
      gap: 20px;
    }

    .export-section,
    .import-section {
      gap: 8px;
    }
  }

  .export-section label,
  .import-section label {
    font-weight: 500;
    color: var(--text-color);
  }

  /* Dark theme specific adjustments for form labels */
  :global(.dark) .export-section label,
  :global(.dark) .import-section label {
    color: #e5e7eb; /* Softer white for dark theme */
  }

  .export-select,
  .import-input {
    padding: 6px 10px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-ground);
    color: var(--text-color);
    font-size: 14px;
  }

  .export-btn,
  .import-btn {
    padding: 6px 12px;
    background: var(--primary-color);
    color: var(--primary-color-text);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s ease;
    align-self: flex-start;
  }

  @media (min-width: 640px) {
    .export-select,
    .import-input {
      padding: 8px 12px;
      font-size: 14px;
    }

    .export-btn,
    .import-btn {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  .export-btn:hover,
  .import-btn:hover {
    background: var(--primary-color-hover);
  }

  .export-btn:disabled,
  .import-btn:disabled {
    background: var(--surface-border);
    color: var(--text-color-secondary);
    cursor: not-allowed;
  }

  /* Windows 95 specific styling */
  :global(.theme-windows95) .theme-settings {
    font-family: var(--theme-font-family);
    background: var(--theme-background);
    color: var(--theme-text);
  }

  :global(.theme-windows95) .theme-card {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-outset);
  }

  :global(.theme-windows95) .theme-card:hover {
    border-color: var(--theme-primary);
  }

  :global(.theme-windows95) .theme-card.active {
    background: var(--theme-primary);
    color: var(--theme-surface);
    border-color: var(--theme-primary);
  }

  :global(.theme-windows95) .export-select,
  :global(.theme-windows95) .import-input {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-inset);
    font-family: var(--theme-font-family);
  }

  :global(.theme-windows95) .export-btn,
  :global(.theme-windows95) .import-btn {
    background: var(--theme-primary);
    color: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-primary) var(--theme-border) var(--theme-border) var(--theme-primary);
    box-shadow: var(--theme-shadow-outset);
    font-family: var(--theme-font-family);
  }

  :global(.theme-windows95) .export-btn:hover,
  :global(.theme-windows95) .import-btn:hover {
    background: var(--theme-hover);
    color: var(--theme-text);
  }
</style>
