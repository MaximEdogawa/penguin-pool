<template>
  <div class="theme-settings">
    <div class="settings-header">
      <h3 class="settings-title">Theme Settings</h3>
      <p class="settings-description">Customize your application appearance with custom themes</p>
    </div>

    <CurrentThemeDisplay />

    <ThemeVariantControls />

    <BuiltInThemeSelector />

    <PrimeUIThemeSelector />

    <CustomThemeSelector />

    <ColorCustomization />

    <ThemeImportExport />
  </div>
</template>

<script setup lang="ts">
  import BuiltInThemeSelector from './BuiltInThemeSelector.vue'
  import ColorCustomization from './ColorCustomization.vue'
  import CurrentThemeDisplay from './CurrentThemeDisplay.vue'
  import CustomThemeSelector from './CustomThemeSelector.vue'
  import PrimeUIThemeSelector from './PrimeUIThemeSelector.vue'
  import ThemeImportExport from './ThemeImportExport.vue'
  import ThemeVariantControls from './ThemeVariantControls.vue'
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
</style>
