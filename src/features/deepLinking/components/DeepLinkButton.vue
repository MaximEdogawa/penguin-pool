<template>
  <div class="deep-link-button-container">
    <button :class="buttonClass" :disabled="isLoading || disabled" @click="handleClick">
      <i v-if="isLoading" class="pi pi-spin pi-spinner"></i>
      <i v-else :class="app?.icon || 'pi pi-external-link'"></i>
      <span v-if="!isLoading">{{ buttonText }}</span>
      <span v-else>Opening...</span>
    </button>

    <div v-if="showCopyButton" class="copy-button-container">
      <button class="copy-button" :disabled="isLoading" @click="handleCopy" :title="copyButtonText">
        <i class="pi pi-copy"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useDeepLinking } from '../composables/useDeepLinking'

  interface Props {
    appId: string
    path?: string
    params?: Record<string, string>
    buttonText?: string
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'small' | 'medium' | 'large'
    disabled?: boolean
    showCopyButton?: boolean
    copyButtonText?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    buttonText: 'Open App',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    showCopyButton: true,
    copyButtonText: 'Copy Link',
  })

  const emit = defineEmits<{
    success: [result: { success: boolean; openedApp?: string; error?: string }]
    error: [error: string]
    copy: [url: string]
  }>()

  const { openApp, openInNewTab, copyDeepLink, getApp, isLoading, platform } = useDeepLinking()

  const app = computed(() => getApp(props.appId))
  const isCopied = ref(false)

  const buttonClass = computed(() => [
    'deep-link-button',
    `deep-link-button--${props.variant}`,
    `deep-link-button--${props.size}`,
    {
      'deep-link-button--loading': isLoading.value,
      'deep-link-button--disabled': props.disabled,
    },
  ])

  const handleClick = async () => {
    if (props.disabled || isLoading.value) return

    try {
      let result
      if (platform.value === 'web') {
        // For web, open in new tab
        const opened = openInNewTab(props.appId, props.path, props.params)
        result = {
          success: opened,
          openedApp: app.value?.name,
          error: opened ? undefined : 'Failed to open in new tab',
        }
      } else {
        // For mobile, try deep link
        result = await openApp(props.appId, props.path, props.params)
      }

      if (result.success) {
        emit('success', result)
      } else {
        emit('error', result.error || 'Failed to open app')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      emit('error', errorMessage)
    }
  }

  const handleCopy = async () => {
    if (isLoading.value) return

    try {
      const success = await copyDeepLink(props.appId, props.path, props.params)
      if (success) {
        isCopied.value = true
        setTimeout(() => {
          isCopied.value = false
        }, 2000)

        const url = app.value ? `${app.value.scheme || app.value.website}${props.path || ''}` : ''
        emit('copy', url)
      }
    } catch (err) {
      console.error('Failed to copy deep link:', err)
    }
  }
</script>

<style scoped>
  .deep-link-button-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .deep-link-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    font-family: inherit;
  }

  .deep-link-button--primary {
    background-color: var(--primary-color);
    color: white;
  }

  .deep-link-button--primary:hover:not(.deep-link-button--disabled) {
    background-color: var(--primary-color-dark);
  }

  .deep-link-button--secondary {
    background-color: var(--surface-100);
    color: var(--text-color);
    border: 1px solid var(--surface-300);
  }

  .deep-link-button--secondary:hover:not(.deep-link-button--disabled) {
    background-color: var(--surface-200);
  }

  .deep-link-button--outline {
    background-color: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
  }

  .deep-link-button--outline:hover:not(.deep-link-button--disabled) {
    background-color: var(--primary-color);
    color: white;
  }

  .deep-link-button--small {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .deep-link-button--medium {
    padding: 0.75rem 1rem;
    font-size: 1rem;
  }

  .deep-link-button--large {
    padding: 1rem 1.5rem;
    font-size: 1.125rem;
  }

  .deep-link-button--loading {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .deep-link-button--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid var(--surface-300);
    background-color: var(--surface-100);
    color: var(--text-color);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-button:hover:not(:disabled) {
    background-color: var(--surface-200);
    border-color: var(--surface-400);
  }

  .copy-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .copy-button-container {
    position: relative;
  }

  .copy-button-container::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--surface-900);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    margin-bottom: 0.25rem;
  }

  .copy-button:hover + .copy-button-container::after {
    opacity: 1;
  }
</style>
