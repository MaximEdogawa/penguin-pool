export interface DeepLinkApp {
  id: string
  name: string
  description: string
  icon: string
  scheme: string
  universalLink?: string
  website?: string
  supportedPlatforms: ('ios' | 'android' | 'web')[]
}

export interface DeepLinkResult {
  success: boolean
  error?: string
  openedApp?: string
}

export interface DeepLinkConfig {
  apps: DeepLinkApp[]
  defaultTimeout: number
  retryAttempts: number
}
