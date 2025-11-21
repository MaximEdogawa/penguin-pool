// Cache the iOS detection result to avoid repeated checks
let _isIOSCache: boolean | null = null

/**
 * Detect if the current platform is iOS (iPhone/iPad)
 * Handles the case where iPhone user agents contain "Mac OS X"
 * Uses caching to avoid repeated checks
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false

  // Return cached result if available
  if (_isIOSCache !== null) {
    return _isIOSCache
  }

  const { userAgent } = navigator

  // Check for actual iOS devices first (iPhone/iPad/iPod)
  const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent)

  if (!isIOSDevice) {
    _isIOSCache = false
    return false
  }

  // Check if it's actually macOS (not iOS)
  // Modern iPhones report as "Mac OS X" in user agent but are still iOS
  const isMacOS = /Mac OS X/.test(userAgent) && !/iPhone|iPad|iPod/.test(userAgent)

  if (isMacOS) {
    _isIOSCache = false
    return false
  }

  // If it has iPhone/iPad/iPod in user agent, it's iOS regardless of Mac OS X
  const result = isIOSDevice && !('MSStream' in window)

  _isIOSCache = result
  return result
}
