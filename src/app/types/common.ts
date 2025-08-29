// Common utility types and interfaces for the application

// Basic utility types
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
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface FormData {
  [key: string]: string | number | boolean | string[]
}

// Theme types
export type Theme = 'light' | 'dark' | 'auto'

// Loading and error states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: Date
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    handler: () => void
  }
}

// User preferences
export interface UserPreferences {
  theme: Theme
  language: string
  currency: Currency
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

// Currency and amount types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'XCH' | 'BTC' | 'ETH'

export interface Amount {
  value: number
  currency: Currency
  formatted?: string
}

// Date and time types
export interface DateRange {
  start: Date
  end: Date
}

// Sorting and filtering
export type SortDirection = 'asc' | 'desc'

export interface SortOption {
  field: string
  direction: SortDirection
}

export interface FilterOption {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith'
  value: string | number | boolean | string[] | number[]
}

export interface PaginationParams {
  page: number
  limit: number
  sort?: SortOption[]
  filters?: FilterOption[]
}

// Result types for better error handling
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// Event system types
export interface AppEvent {
  type: string
  payload?: Record<string, unknown>
  timestamp: Date
  source?: string
}

export type EventListener<T = Record<string, unknown>> = (event: AppEvent & { payload: T }) => void

export interface EventEmitter {
  on<T>(event: string, listener: EventListener<T>): void
  off<T>(event: string, listener: EventListener<T>): void
  emit<T>(event: string, payload?: T): void
}
