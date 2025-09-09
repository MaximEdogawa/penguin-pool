<template>
  <div class="deep-link-example">
    <h3>Deep Link Examples</h3>
    <p>Try opening these Chia-related apps:</p>

    <div class="apps-grid">
      <div v-for="app in supportedApps" :key="app.id" class="app-card">
        <div class="app-icon">
          <i :class="app.icon"></i>
        </div>
        <div class="app-info">
          <h4>{{ app.name }}</h4>
          <p>{{ app.description }}</p>
          <div class="app-actions">
            <DeepLinkButton
              :app-id="app.id"
              :button-text="`Open ${app.name}`"
              variant="primary"
              size="small"
              @success="onAppOpened"
              @error="onAppError"
            />
            <DeepLinkButton
              :app-id="app.id"
              button-text="Copy Link"
              variant="outline"
              size="small"
              :show-copy-button="false"
              @copy="onLinkCopied"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="lastResult" class="result-message" :class="resultClass">
      <i :class="resultIcon"></i>
      <span>{{ resultMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useDeepLinking } from '../composables/useDeepLinking'
  import type { DeepLinkResult } from '../types/deepLinking.types'
  import DeepLinkButton from './DeepLinkButton.vue'

  const { supportedApps, lastResult } = useDeepLinking()

  const resultClass = computed(() => {
    if (!lastResult.value) return ''
    return lastResult.value.success ? 'success' : 'error'
  })

  const resultIcon = computed(() => {
    if (!lastResult.value) return ''
    return lastResult.value.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'
  })

  const resultMessage = computed(() => {
    if (!lastResult.value) return ''

    if (lastResult.value.success) {
      return `Successfully opened ${lastResult.value.openedApp || 'app'}!`
    } else {
      return `Failed to open app: ${lastResult.value.error}`
    }
  })

  const onAppOpened = (result: DeepLinkResult) => {
    console.log('App opened successfully:', result)
  }

  const onAppError = (error: string) => {
    console.error('Failed to open app:', error)
  }

  const onLinkCopied = (url: string) => {
    console.log('Link copied to clipboard:', url)
  }
</script>

<style scoped>
  .deep-link-example {
    padding: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .deep-link-example h3 {
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  .deep-link-example p {
    margin-bottom: 1.5rem;
    color: var(--text-color-secondary);
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .app-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--surface-300);
    border-radius: 0.75rem;
    background-color: var(--surface-50);
    transition: all 0.2s ease;
  }

  .app-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .app-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background-color: var(--primary-color);
    color: white;
    border-radius: 0.5rem;
    font-size: 1.5rem;
  }

  .app-info {
    flex: 1;
  }

  .app-info h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
    font-size: 1.125rem;
  }

  .app-info p {
    margin: 0 0 1rem 0;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .app-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .result-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
  }

  .result-message.success {
    background-color: var(--green-50);
    color: var(--green-700);
    border: 1px solid var(--green-200);
  }

  .result-message.error {
    background-color: var(--red-50);
    color: var(--red-700);
    border: 1px solid var(--red-200);
  }

  @media (max-width: 640px) {
    .apps-grid {
      grid-template-columns: 1fr;
    }

    .app-card {
      flex-direction: column;
      text-align: center;
    }

    .app-actions {
      justify-content: center;
    }
  }
</style>
