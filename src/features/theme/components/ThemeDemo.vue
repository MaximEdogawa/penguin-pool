<template>
  <div class="theme-demo">
    <h2 class="demo-title">Windows 95 Theme Demo</h2>

    <div class="demo-section">
      <h3>Buttons</h3>
      <div class="demo-buttons">
        <button class="p-button">Default Button</button>
        <button class="p-button p-button-primary">Primary Button</button>
        <button class="p-button p-button-secondary">Secondary Button</button>
        <button class="p-button" disabled>Disabled Button</button>
      </div>
    </div>

    <div class="demo-section">
      <h3>Form Elements</h3>
      <div class="demo-form">
        <div class="form-group">
          <label>Text Input:</label>
          <input type="text" class="p-inputtext" placeholder="Enter text here..." />
        </div>
        <div class="form-group">
          <label>Dropdown:</label>
          <select class="p-dropdown">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Cards</h3>
      <div class="demo-cards">
        <div class="p-card">
          <div class="p-card-header">Card Header</div>
          <div class="p-card-body">
            <p>
              This is a sample card with Windows 95 styling. Notice the 3D borders and classic gray
              colors.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h3>Table</h3>
      <div class="demo-table">
        <table class="p-datatable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Contract A</td>
              <td>Loan</td>
              <td>Active</td>
            </tr>
            <tr>
              <td>Contract B</td>
              <td>Option</td>
              <td>Pending</td>
            </tr>
            <tr>
              <td>Contract C</td>
              <td>Pool</td>
              <td>Completed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="demo-section">
      <h3>Theme Information</h3>
      <div class="theme-info">
        <p><strong>Current Theme:</strong> {{ currentThemeName }}</p>
        <p><strong>Category:</strong> {{ currentThemeCategory }}</p>
        <p><strong>Description:</strong> {{ currentThemeDescription }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useThemeStore } from '../store/themeStore'

  const themeStore = useThemeStore()

  const currentThemeName = computed(() => {
    if (themeStore.currentCustomTheme) {
      return themeStore.currentCustomTheme.name
    }
    return themeStore.currentTheme === 'dark' ? 'Dark Theme' : 'Light Theme'
  })

  const currentThemeCategory = computed(() => {
    if (themeStore.currentCustomTheme) {
      return themeStore.currentCustomTheme.category
    }
    return 'built-in'
  })

  const currentThemeDescription = computed(() => {
    if (themeStore.currentCustomTheme) {
      return themeStore.currentCustomTheme.description
    }
    return 'Default system theme'
  })
</script>

<style scoped>
  .theme-demo {
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  .demo-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 24px;
    text-align: center;
  }

  .demo-section {
    margin-bottom: 32px;
  }

  .demo-section h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .demo-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .demo-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-weight: 500;
    font-size: 14px;
  }

  .demo-cards {
    display: flex;
    gap: 16px;
  }

  .demo-table {
    overflow-x: auto;
  }

  .theme-info {
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .theme-info p {
    margin: 8px 0;
  }

  /* Windows 95 specific styling */
  :global(.theme-windows95) .theme-demo {
    font-family: 'MS Sans Serif', 'Microsoft Sans Serif', sans-serif;
    background: var(--theme-background);
    color: var(--theme-text);
  }

  :global(.theme-windows95) .demo-title {
    color: var(--theme-primary);
    border-bottom: 2px solid var(--theme-border);
    padding-bottom: 8px;
  }

  :global(.theme-windows95) .demo-section h3 {
    color: var(--theme-primary);
    border-bottom: 1px solid var(--theme-border);
  }

  :global(.theme-windows95) .theme-info {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-border) var(--theme-surface) var(--theme-surface) var(--theme-border);
    box-shadow: var(--theme-shadow-inset);
  }
</style>
