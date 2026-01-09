import { useEffect, useState } from 'react'

/**
 * Hook to detect screen size and determine if mobile or desktop
 * Uses Tailwind's md breakpoint (768px)
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Set initial value
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    // Check on mount
    checkIsMobile()

    // Listen for resize events
    window.addEventListener('resize', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  return { isMobile, isDesktop: !isMobile }
}
