// Common utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Base entity interface
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string | number; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface FormData {
  [key: string]: any
}

// Theme types
export type Theme = 'light' | 'dark' | 'auto'

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  timestamp: Date
  read: boolean
}

// User preferences
export interface UserPreferences {
  theme: Theme
  language: string
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
  }
}

// Currency and amount types
export type Currency = 'XCH' | 'USD' | 'EUR' | 'BTC' | 'ETH'

export interface Amount {
  value: number
  currency: Currency
  decimals: number
}

// Date range types
export interface DateRange {
  start: Date
  end: Date
}

// Sort and filter types
export type SortDirection = 'asc' | 'desc'

export interface SortOption {
  field: string
  direction: SortDirection
}

export interface FilterOption {
  field: string
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'nin'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
  value: any
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
  sort?: SortOption[]
  filters?: FilterOption[]
}

// Result types
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

// Async result types
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// Event types
export interface AppEvent<T = any> {
  type: string
  payload: T
  timestamp: Date
  source: string
}

// Event emitter types
export type EventListener<T = any> = (event: AppEvent<T>) => void

export interface EventEmitter {
  on<T>(eventType: string, listener: EventListener<T>): void
  off<T>(eventType: string, listener: EventListener<T>): void
  emit<T>(event: AppEvent<T>): void
}
