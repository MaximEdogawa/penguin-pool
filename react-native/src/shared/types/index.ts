// User Types
export interface User {
  id: string
  username: string
  walletAddress: string
  balance: number
  createdAt: Date
  updatedAt: Date
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'auto' | 'light' | 'dark'
  language: string
  currency: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    shareAnalytics: boolean
    shareUsageData: boolean
  }
}

// Wallet Types
export interface WalletBalance {
  confirmed: string
  spendable: string
  unconfirmed: string
}

export interface WalletAddress {
  address: string
  fingerprint: number
}

export interface TransactionRequest {
  walletId: number
  recipientAddress: string
  amount: string
  fee: string
  memo?: string
}

// Offer Types
export interface OfferDetails {
  id: string
  tradeId: string
  offerString: string
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired'
  createdAt: Date
  assetsOffered?: AssetInfo[]
  assetsRequested?: AssetInfo[]
  fee: string
  creatorAddress: string
  dexieOfferId?: string
  dexieStatus?: string
  uploadedToDexie: boolean
  dexieOfferData?: Record<string, unknown>
}

export interface AssetInfo {
  assetId: string
  amount: string
  type: AssetType
}

export type AssetType = 'XCH' | 'CAT' | 'NFT'

export interface OfferFilters {
  status: string
}

export interface OfferRequest {
  assetsOffered: AssetInfo[]
  assetsRequested: AssetInfo[]
  fee: string
}

export interface TakeOfferRequest {
  offerString: string
  fee: string
}

export interface CancelOfferRequest {
  id: string
  fee: string
}

// Navigation Types
export interface NavigationRoute {
  name: string
  component: React.ComponentType<Record<string, unknown>>
  title: string
  requiresAuth: boolean
  featureFlag?: string
}

// Feature Flags
export interface FeatureFlags {
  dashboard: boolean
  offers: boolean
  loans: boolean
  optionContracts: boolean
  piggyBank: boolean
  wallet: boolean
  profile: boolean
  serviceHealth: boolean
}

// Service Types
export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: Date
  responseTime?: number
  error?: string
}

// Theme Types
export type ThemeMode = 'light' | 'dark'
export type AITheme = 'ocean' | 'forest' | 'sunset' | 'cyberpunk' | 'none'

// Form Types
export interface TransactionForm {
  recipientAddress: string
  amount: string
  fee: string
  memo: string
}

export interface FormErrors {
  recipientAddress?: string
  amount?: string
  fee?: string
  memo?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Component Props Types
export interface PageProps {
  navigation?: Record<string, unknown>
  route?: Record<string, unknown>
}

export interface ModalProps {
  visible: boolean
  onClose: () => void
}

export interface ButtonProps {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
}
