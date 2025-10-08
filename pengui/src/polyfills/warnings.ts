// Suppress specific React Native web warnings
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  const originalWarn = console.warn
  // eslint-disable-next-line no-console
  console.warn = (...args) => {
    const message = args[0]
    if (
      typeof message === 'string' &&
      (message.includes('props.pointerEvents is deprecated') ||
        message.includes('Use style.pointerEvents'))
    ) {
      return // Suppress React Native web deprecation warnings
    }
    originalWarn.apply(console, args)
  }
}
