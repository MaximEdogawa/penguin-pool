<template>
  <div v-if="isEnabled" class="feature-flag-wrapper">
    <slot />
  </div>
  <div v-else-if="showFallback" class="feature-flag-fallback">
    <slot name="fallback">
      <div class="feature-disabled-message">
        <i class="pi pi-exclamation-triangle" />
        <span>{{ fallbackMessage }}</span>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
  import type {
    AppFeatureKey,
    ExperimentalFeatureKey,
    TechnicalFeatureKey,
    UIFeatureKey,
  } from '@/shared/config/featureFlags'
  import {
    defaultFeatureFlags,
    getCurrentEnvironment,
    isFeatureEnabled,
  } from '@/shared/config/featureFlags'
  import { computed } from 'vue'

  interface Props {
    category: 'app' | 'technical' | 'ui' | 'experimental'
    feature: string
    showFallback?: boolean
    fallbackMessage?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    showFallback: false,
    fallbackMessage: 'This feature is currently disabled',
  })

  const isEnabled = computed(() => {
    const currentEnv = getCurrentEnvironment()

    switch (props.category) {
      case 'app':
        const appFeature = defaultFeatureFlags.app[props.feature as AppFeatureKey]
        return appFeature ? isFeatureEnabled(appFeature, currentEnv, props.feature) : false
      case 'technical':
        const technicalFeature = defaultFeatureFlags.technical[props.feature as TechnicalFeatureKey]
        return technicalFeature
          ? isFeatureEnabled(technicalFeature, currentEnv, props.feature)
          : false
      case 'ui':
        const uiFeature = defaultFeatureFlags.ui[props.feature as UIFeatureKey]
        return uiFeature ? isFeatureEnabled(uiFeature, currentEnv, props.feature) : false
      case 'experimental':
        const experimentalFeature =
          defaultFeatureFlags.experimental[props.feature as ExperimentalFeatureKey]
        return experimentalFeature
          ? isFeatureEnabled(experimentalFeature, currentEnv, props.feature)
          : false
      default:
        return false
    }
  })
</script>

<style scoped>
  .feature-flag-wrapper {
    width: 100%;
  }

  .feature-flag-fallback {
    width: 100%;
  }

  .feature-disabled-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: var(--p-color-surface-100);
    border: 1px solid var(--p-color-surface-300);
    border-radius: var(--p-border-radius);
    color: var(--p-color-text-secondary);
    font-size: 0.875rem;
  }

  .feature-disabled-message i {
    color: var(--p-color-orange-500);
  }
</style>
