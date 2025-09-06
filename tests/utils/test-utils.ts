/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'
import type { ComponentMountingOptions } from '@vue/test-utils'

// Test utilities for Vue components
export class TestUtils {
  /**
   * Mount a component with basic test configuration
   */
  static mountComponent<T>(
    component: T,
    options: ComponentMountingOptions<T> = {}
  ): VueWrapper<InstanceType<T>> {
    const defaultOptions: ComponentMountingOptions<T> = {
      global: {
        stubs: {
          // Stub common PrimeVue components
          PrimeVue: true,
          Toast: true,
          ToastService: true,
          ConfirmDialog: true,
          ConfirmService: true,
          DialogService: true,
          DynamicDialog: true,
          RouterLink: true,
          RouterView: true,
        },
        mocks: {
          // Mock common composables
          $t: (key: string) => key, // i18n mock
          $route: {
            path: '/',
            name: 'home',
            params: {},
            query: {},
            hash: '',
          },
          $router: {
            push: vi.fn(),
            replace: vi.fn(),
            go: vi.fn(),
            back: vi.fn(),
            forward: vi.fn(),
          },
        },
      },
      ...options,
    }

    return mount(component, defaultOptions)
  }

  /**
   * Wait for next tick
   */
  static async waitForNextTick() {
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  /**
   * Wait for a specific condition
   */
  static async waitFor(
    condition: () => boolean,
    timeout: number = 1000,
    interval: number = 10
  ): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }

    throw new Error(`Condition not met within ${timeout}ms`)
  }

  /**
   * Mock fetch with specific response
   */
  static mockFetchResponse(url: string | RegExp, response: any, status: number = 200) {
    const mockResponse = {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => response,
      text: async () => JSON.stringify(response),
      headers: new Headers(),
    }

    if (typeof url === 'string') {
      vi.mocked(fetch).mockImplementationOnce(requestUrl => {
        if (requestUrl === url) {
          return Promise.resolve(mockResponse as Response)
        }
        return Promise.reject(new Error('URL not matched'))
      })
    } else {
      vi.mocked(fetch).mockImplementationOnce(requestUrl => {
        if (url.test(requestUrl.toString())) {
          return Promise.resolve(mockResponse as Response)
        }
        return Promise.reject(new Error('URL not matched'))
      })
    }
  }

  /**
   * Mock fetch with error
   */
  static mockFetchError(url: string | RegExp, error: string = 'Network error') {
    vi.mocked(fetch).mockImplementationOnce(() => {
      return Promise.reject(new Error(error))
    })
  }

  /**
   * Create mock event
   */
  static createMockEvent(type: string, options: any = {}) {
    return new Event(type, options)
  }

  /**
   * Create mock keyboard event
   */
  static createMockKeyboardEvent(type: string, key: string, options: any = {}) {
    return new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    })
  }

  /**
   * Create mock mouse event
   */
  static createMockMouseEvent(type: string, options: any = {}) {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...options,
    })
  }

  /**
   * Mock window.location
   */
  static mockLocation(pathname: string = '/', search: string = '') {
    Object.defineProperty(window, 'location', {
      value: {
        href: `http://localhost:3000${pathname}${search}`,
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname,
        search,
        hash: '',
        reload: vi.fn(),
        replace: vi.fn(),
        assign: vi.fn(),
      },
      writable: true,
    })
  }

  /**
   * Mock localStorage
   */
  static mockLocalStorage(data: Record<string, string> = {}) {
    const mock = {
      getItem: vi.fn((key: string) => data[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        data[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete data[key]
      }),
      clear: vi.fn(() => {
        Object.keys(data).forEach(key => delete data[key])
      }),
      length: Object.keys(data).length,
      key: vi.fn((index: number) => Object.keys(data)[index] || null),
    }

    Object.defineProperty(window, 'localStorage', {
      value: mock,
      writable: true,
    })

    return mock
  }

  /**
   * Mock sessionStorage
   */
  static mockSessionStorage(data: Record<string, string> = {}) {
    const mock = {
      getItem: vi.fn((key: string) => data[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        data[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete data[key]
      }),
      clear: vi.fn(() => {
        Object.keys(data).forEach(key => delete data[key])
      }),
      length: Object.keys(data).length,
      key: vi.fn((index: number) => Object.keys(data)[index] || null),
    }

    Object.defineProperty(window, 'sessionStorage', {
      value: mock,
      writable: true,
    })

    return mock
  }

  /**
   * Clean up all mocks
   */
  static cleanup() {
    vi.clearAllMocks()
    vi.clearAllTimers()
  }
}

// Export individual utility functions for convenience
export const {
  mountComponent,
  waitForNextTick,
  waitFor,
  mockFetchResponse,
  mockFetchError,
  createMockEvent,
  createMockKeyboardEvent,
  createMockMouseEvent,
  mockLocation,
  mockLocalStorage,
  mockSessionStorage,
  cleanup,
} = TestUtils

// Common test data factories
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  walletAddress: '0x1234567890abcdef',
  isAuthenticated: true,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

export const createTestLoan = (overrides: Partial<any> = {}) => ({
  id: 'loan-123',
  amount: 1000,
  currency: 'XCH',
  interestRate: 5.5,
  term: 30,
  status: 'active',
  borrowerId: 'user-123',
  lenderId: 'user-456',
  createdAt: new Date('2024-01-01'),
  dueDate: new Date('2024-02-01'),
  ...overrides,
})

export const createTestOptionContract = (overrides: Partial<any> = {}) => ({
  id: 'option-123',
  type: 'call',
  strikePrice: 100,
  underlying: 'XCH',
  expiryDate: new Date('2024-12-31'),
  premium: 10,
  status: 'active',
  buyerId: 'user-123',
  sellerId: 'user-456',
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

// Common test assertions
export const expectElementToBeVisible = (wrapper: VueWrapper<any>, selector: string) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.isVisible()).toBe(true)
}

export const expectElementToHaveText = (
  wrapper: VueWrapper<any>,
  selector: string,
  text: string
) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.text()).toContain(text)
}

export const expectElementToHaveClass = (
  wrapper: VueWrapper<any>,
  selector: string,
  className: string
) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.classes()).toContain(className)
}

export const expectElementToBeDisabled = (wrapper: VueWrapper<any>, selector: string) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.attributes('disabled')).toBeDefined()
}

export const expectElementToBeEnabled = (wrapper: VueWrapper<any>, selector: string) => {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  expect(element.attributes('disabled')).toBeUndefined()
}
