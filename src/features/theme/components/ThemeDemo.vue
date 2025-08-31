<template>
  <div class="theme-demo">
    <div class="demo-header">
      <h3>Theme Demo</h3>
      <p>Preview how different themes look with various UI elements</p>
    </div>

    <div class="demo-sections">
      <!-- Buttons Demo -->
      <div class="demo-section">
        <h4>Buttons</h4>
        <div class="demo-buttons">
          <PrimeButton class="p-button-primary">Primary Button</PrimeButton>
          <PrimeButton class="p-button-secondary">Secondary Button</PrimeButton>
          <PrimeButton class="p-button-outlined">Outlined Button</PrimeButton>
          <PrimeButton class="p-button-text">Text Button</PrimeButton>
        </div>
      </div>

      <!-- Cards Demo -->
      <div class="demo-section">
        <h4>Cards</h4>
        <div class="demo-cards">
          <div class="demo-card">
            <div class="card-header">
              <h5>Sample Card</h5>
            </div>
            <div class="card-body">
              <p>This is a sample card to demonstrate theme styling.</p>
            </div>
            <div class="card-footer">
              <PrimeButton size="small">Action</PrimeButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Elements Demo -->
      <div class="demo-section">
        <h4>Form Elements</h4>
        <div class="demo-forms">
          <div class="form-group">
            <label for="demo-input">Input Field</label>
            <input type="text" id="demo-input" class="input-field" placeholder="Enter text..." />
          </div>
          <div class="form-group">
            <label for="demo-select">Select Field</label>
            <select id="demo-select" class="input-field">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table Demo -->
      <div class="demo-section">
        <h4>Table</h4>
        <div class="demo-table">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sample Item 1</td>
                <td><span class="badge badge-success">Active</span></td>
                <td><PrimeButton size="small">Edit</PrimeButton></td>
              </tr>
              <tr>
                <td>Sample Item 2</td>
                <td><span class="badge badge-warning">Pending</span></td>
                <td><PrimeButton size="small">Edit</PrimeButton></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Colors Demo -->
      <div class="demo-section">
        <h4>Theme Colors</h4>
        <div class="demo-colors">
          <div class="color-swatch primary">
            <span class="color-name">Primary</span>
          </div>
          <div class="color-swatch secondary">
            <span class="color-name">Secondary</span>
          </div>
          <div class="color-swatch success">
            <span class="color-name">Success</span>
          </div>
          <div class="color-swatch danger">
            <span class="color-name">Danger</span>
          </div>
          <div class="color-swatch warning">
            <span class="color-name">Warning</span>
          </div>
          <div class="color-swatch info">
            <span class="color-name">Info</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // ThemeDemo component for showcasing theme elements
</script>

<style scoped>
  .theme-demo {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .demo-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .demo-header h3 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--text-color);
  }

  .demo-header p {
    color: var(--text-color-secondary);
    font-size: 16px;
  }

  .demo-sections {
    display: grid;
    gap: 32px;
  }

  .demo-section {
    padding: 24px;
    border-radius: 12px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .demo-section h4 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-color);
    border-bottom: 2px solid var(--primary-color);
    padding-bottom: 8px;
  }

  /* Buttons Demo */
  .demo-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  /* Cards Demo */
  .demo-cards {
    display: grid;
    gap: 16px;
  }

  .demo-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    background: var(--surface-section);
    padding: 16px;
    border-bottom: 1px solid var(--surface-border);
  }

  .card-header h5 {
    margin: 0;
    color: var(--text-color);
    font-weight: 600;
  }

  .card-body {
    padding: 16px;
  }

  .card-body p {
    margin: 0;
    color: var(--text-color-secondary);
  }

  .card-footer {
    padding: 16px;
    background: var(--surface-ground);
    border-top: 1px solid var(--surface-border);
    display: flex;
    justify-content: flex-end;
  }

  /* Form Elements Demo */
  .demo-forms {
    display: grid;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-weight: 500;
    color: var(--text-color);
  }

  .input-field {
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-ground);
    color: var(--text-color);
    font-size: 14px;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color-alpha-20);
  }

  /* Table Demo */
  .demo-table {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th,
  .table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--surface-border);
  }

  .table th {
    background: var(--surface-section);
    font-weight: 600;
    color: var(--text-color);
  }

  .table td {
    color: var(--text-color);
  }

  .table tbody tr:hover {
    background: var(--surface-hover);
  }

  .badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge-success {
    background: var(--success-color);
    color: white;
  }

  .badge-warning {
    background: var(--warning-color);
    color: white;
  }

  /* Colors Demo */
  .demo-colors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }

  .color-swatch {
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid var(--surface-border);
  }

  .color-swatch.primary {
    background: var(--primary-color);
  }

  .color-swatch.secondary {
    background: var(--secondary-color);
  }

  .color-swatch.success {
    background: var(--success-color);
  }

  .color-swatch.danger {
    background: var(--danger-color);
  }

  .color-swatch.warning {
    background: var(--warning-color);
  }

  .color-swatch.info {
    background: var(--info-color);
  }

  .color-name {
    color: white;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .theme-demo {
      padding: 16px;
    }

    .demo-section {
      padding: 16px;
    }

    .demo-buttons {
      flex-direction: column;
    }

    .demo-colors {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Windows 95 Theme Specific Styling */
  :global(.theme-windows95) .demo-section {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-highlight) var(--theme-shadow) var(--theme-shadow)
      var(--theme-highlight);
    box-shadow: var(--theme-shadow-outset);
  }

  :global(.theme-windows95) .demo-section h4 {
    background: var(--theme-title-bar);
    color: var(--theme-title-bar-text);
    margin: -24px -24px 16px -24px;
    padding: 8px 24px;
    border-bottom: 2px solid var(--theme-border);
  }

  :global(.theme-windows95) .demo-card {
    background: var(--theme-surface);
    border: 2px solid;
    border-color: var(--theme-shadow) var(--theme-highlight) var(--theme-highlight)
      var(--theme-shadow);
    box-shadow: var(--theme-shadow-inset);
  }

  :global(.theme-windows95) .card-header {
    background: var(--theme-title-bar);
    color: var(--theme-title-bar-text);
  }

  :global(.theme-windows95) .input-field {
    background: var(--theme-highlight);
    border: 2px solid;
    border-color: var(--theme-shadow) var(--theme-highlight) var(--theme-highlight)
      var(--theme-shadow);
    box-shadow: var(--theme-shadow-inset);
    font-family: var(--theme-font-family);
  }

  :global(.theme-windows95) .table th {
    background: var(--theme-menu-bar);
    color: var(--theme-text);
  }

  :global(.theme-windows95) .table td {
    background: var(--theme-surface);
    color: var(--theme-text);
  }
</style>
