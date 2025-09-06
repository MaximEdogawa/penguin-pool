import {
  defaultFeatureFlags,
  getCurrentEnvironment,
  getEnabledFeatures,
  isFeatureEnabled,
  loadFeatureFlagsFromEnv,
  validateFeatureFlags,
  type AppFeatureKey,
  type ExperimentalFeatureKey,
  type FeatureFlag,
  type FeatureFlagsConfig,
  type TechnicalFeatureKey,
  type UIFeatureKey,
} from '@/shared/config/featureFlags'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useFeatureFlagsStore = defineStore('featureFlags', () => {
  // State
  const flags = ref<FeatureFlagsConfig>(defaultFeatureFlags)
  const currentEnvironment = ref<'dev' | 'test' | 'staging' | 'production'>(getCurrentEnvironment())
  const validation = ref(validateFeatureFlags())

  // Getters
  const enabledFeatures = computed(() => getEnabledFeatures())

  const isAppFeatureEnabled = (feature: AppFeatureKey) =>
    isFeatureEnabled(flags.value.app[feature], currentEnvironment.value, feature)

  const isTechnicalFeatureEnabled = (feature: TechnicalFeatureKey) =>
    isFeatureEnabled(flags.value.technical[feature], currentEnvironment.value, feature)

  const isUIFeatureEnabled = (feature: UIFeatureKey) =>
    isFeatureEnabled(flags.value.ui[feature], currentEnvironment.value, feature)

  const isExperimentalFeatureEnabled = (feature: ExperimentalFeatureKey) =>
    isFeatureEnabled(flags.value.experimental[feature], currentEnvironment.value, feature)

  // Actions
  const updateFeatureFlag = (
    category: keyof FeatureFlagsConfig,
    feature: string,
    enabled: boolean
  ) => {
    if (flags.value[category] && feature in flags.value[category]) {
      ;(flags.value[category] as Record<string, FeatureFlag>)[feature].enabled = enabled
      validation.value = validateFeatureFlags()
    }
  }

  const updateEnvironment = (env: 'dev' | 'test' | 'staging' | 'production') => {
    currentEnvironment.value = env
    validation.value = validateFeatureFlags(flags.value)
  }

  const resetToDefaults = () => {
    flags.value = defaultFeatureFlags
    currentEnvironment.value = getCurrentEnvironment()
    validation.value = validateFeatureFlags(flags.value)
  }

  const loadFromEnvironment = () => {
    // Load feature flags from environment variables using the new function
    const envFlags = loadFeatureFlagsFromEnv()

    flags.value = envFlags
    validation.value = validateFeatureFlags(flags.value)
  }

  const getFeatureFlag = (
    category: keyof FeatureFlagsConfig,
    feature: string
  ): FeatureFlag | null => {
    if (flags.value[category] && feature in flags.value[category]) {
      return (flags.value[category] as Record<string, FeatureFlag>)[feature]
    }
    return null
  }

  const getFeaturesByCategory = (category: keyof FeatureFlagsConfig) => {
    return flags.value[category]
  }

  const getEnabledFeaturesByCategory = (category: keyof FeatureFlagsConfig) => {
    const categoryFeatures = flags.value[category]
    const enabled: string[] = []

    Object.entries(categoryFeatures).forEach(([key, feature]) => {
      if (isFeatureEnabled(feature, currentEnvironment.value, key)) {
        enabled.push(key)
      }
    })

    return enabled
  }

  // Watch for environment changes
  watch(currentEnvironment, () => {
    validation.value = validateFeatureFlags(flags.value)
  })

  // Initialize from environment on store creation
  loadFromEnvironment()

  return {
    // State
    flags,
    currentEnvironment,
    validation,

    // Getters
    enabledFeatures,
    isAppFeatureEnabled,
    isTechnicalFeatureEnabled,
    isUIFeatureEnabled,
    isExperimentalFeatureEnabled,

    // Actions
    updateFeatureFlag,
    updateEnvironment,
    resetToDefaults,
    loadFromEnvironment,
    getFeatureFlag,
    getFeaturesByCategory,
    getEnabledFeaturesByCategory,
  }
})

// Composable for easy access to feature flags
export const useFeatureFlag = (category: keyof FeatureFlagsConfig, feature: string) => {
  const store = useFeatureFlagsStore()

  const isEnabled = computed(() => {
    const featureFlag = store.getFeatureFlag(category, feature)
    return featureFlag ? isFeatureEnabled(featureFlag, store.currentEnvironment, feature) : false
  })

  const featureFlag = computed(() => store.getFeatureFlag(category, feature))

  return {
    isEnabled,
    featureFlag,
    updateFlag: (enabled: boolean) => store.updateFeatureFlag(category, feature, enabled),
  }
}

// Composable for app features
export const useAppFeature = (feature: AppFeatureKey) => {
  const store = useFeatureFlagsStore()
  return {
    isEnabled: computed(() => store.isAppFeatureEnabled(feature)),
    featureFlag: computed(() => store.getFeatureFlag('app', feature)),
    updateFlag: (enabled: boolean) => store.updateFeatureFlag('app', feature, enabled),
  }
}

// Composable for technical features
export const useTechnicalFeature = (feature: TechnicalFeatureKey) => {
  const store = useFeatureFlagsStore()
  return {
    isEnabled: computed(() => store.isTechnicalFeatureEnabled(feature)),
    featureFlag: computed(() => store.getFeatureFlag('technical', feature)),
    updateFlag: (enabled: boolean) => store.updateFeatureFlag('technical', feature, enabled),
  }
}

// Composable for UI features
export const useUIFeature = (feature: UIFeatureKey) => {
  const store = useFeatureFlagsStore()
  return {
    isEnabled: computed(() => store.isUIFeatureEnabled(feature)),
    featureFlag: computed(() => store.getFeatureFlag('ui', feature)),
    updateFlag: (enabled: boolean) => store.updateFeatureFlag('ui', feature, enabled),
  }
}

// Composable for experimental features
export const useExperimentalFeature = (feature: ExperimentalFeatureKey) => {
  const store = useFeatureFlagsStore()
  return {
    isEnabled: computed(() => store.isExperimentalFeatureEnabled(feature)),
    featureFlag: computed(() => store.getFeatureFlag('experimental', feature)),
    updateFlag: (enabled: boolean) => store.updateFeatureFlag('experimental', feature, enabled),
  }
}
