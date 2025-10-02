<template>
  <div class="theme-import-export-section">
    <h4>Import / Export</h4>
    <div class="import-export-controls">
      <div class="export-controls">
        <input
          v-model="exportThemeId"
          type="text"
          placeholder="Theme ID to export"
          class="export-input"
        />
        <button @click="exportTheme" :disabled="!exportThemeId" class="export-btn">
          <i class="pi pi-download"></i>
          Export Theme
        </button>
      </div>
      <div class="import-controls">
        <input
          id="import-theme"
          type="file"
          accept=".json"
          @change="importTheme"
          style="display: none"
        />
        <button @click="triggerImport" class="import-btn">
          <i class="pi pi-upload"></i>
          Import Theme
        </button>
        <span v-if="importFile" class="imported-file">
          {{ importFile.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useThemeStore } from '../store/themeStore'
  import { logger } from '@/shared/services/logger'

  const themeStore = useThemeStore()

  const exportThemeId = ref('')
  const importFile = ref<File | null>(null)

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
      logger.error('Failed to export theme', error as Error)
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
      logger.error('Failed to import theme', error as Error)
    }
  }
</script>

<style scoped>
  .theme-import-export-section {
    margin-bottom: 24px;
  }

  .theme-import-export-section h4 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-color);
  }

  .import-export-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .export-controls,
  .import-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .export-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    background: var(--surface-card);
    color: var(--text-color);
    font-size: 14px;
  }

  .export-input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .export-btn,
  .import-btn {
    padding: 8px 16px;
    border: 1px solid var(--primary-color);
    border-radius: 6px;
    background: var(--primary-color);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .export-btn:hover,
  .import-btn:hover {
    background: var(--primary-color-dark);
  }

  .export-btn:disabled {
    background: var(--surface-300);
    border-color: var(--surface-300);
    cursor: not-allowed;
  }

  .imported-file {
    font-size: 12px;
    color: var(--text-color-secondary);
    font-style: italic;
  }
</style>
