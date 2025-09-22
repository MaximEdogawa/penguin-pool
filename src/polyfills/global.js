// Polyfill for global object to fix ox library circular dependency issues
if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}

// Additional polyfills for Node.js modules that might be needed
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    nextTick: fn => setTimeout(fn, 0),
    version: 'v16.0.0',
  }
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = globalThis.Buffer || {}
}

// Fix for crypto module
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = globalThis.crypto || {
    getRandomValues: arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  }
}

// Fix for circular dependency issues in crypto libraries
try {
  // Ensure proper module loading order
  if (typeof window !== 'undefined') {
    // Pre-initialize critical objects to prevent circular dependency issues
    window.__CRYPTO_INITIALIZED__ = true

    // Fix for viem/ox circular dependencies
    if (!window.__VIEM_INITIALIZED__) {
      window.__VIEM_INITIALIZED__ = true
    }

    // Ensure TextEncoder/TextDecoder are available
    if (typeof window.TextEncoder === 'undefined') {
      window.TextEncoder = globalThis.TextEncoder
    }
    if (typeof window.TextDecoder === 'undefined') {
      window.TextDecoder = globalThis.TextDecoder
    }
  }
} catch (error) {
  console.warn('Polyfill initialization warning:', error)
}
