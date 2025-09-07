// Export types
export type { DeepLinkApp, DeepLinkConfig, DeepLinkResult } from './types/deepLinking.types'

// Export services
export { DeepLinkingService, deepLinkingService } from './services/DeepLinkingService'

// Export composables
export { useDeepLinking } from './composables/useDeepLinking'

// Export components
export { default as DeepLinkButton } from './components/DeepLinkButton.vue'
