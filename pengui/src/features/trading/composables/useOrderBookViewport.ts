'use client'

import { useEffect, useRef, useState } from 'react'
import type { OrderBookOrder } from '../lib/orderBookTypes'

const MAX_VISIBLE_ORDERS = 50
const SCROLL_DEBOUNCE_MS = 300

/**
 * Hook to detect which orders are visible in the viewport
 * Tracks visible order IDs for both sell and buy sections combined
 * Debounces scroll events to avoid excessive updates
 */
export function useOrderBookViewport(
  sellOrders: OrderBookOrder[],
  buyOrders: OrderBookOrder[],
  sellScrollRef: React.RefObject<HTMLDivElement | null>,
  buyScrollRef: React.RefObject<HTMLDivElement | null>
) {
  const [visibleOrderIds, setVisibleOrderIds] = useState<Set<string>>(new Set())
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const orderElementRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Create intersection observer
  useEffect(() => {
    if (!sellScrollRef.current && !buyScrollRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Debounce scroll detection
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }

        scrollTimeoutRef.current = setTimeout(() => {
          const visibleIds = new Set<string>()

          entries.forEach((entry) => {
            const orderId = entry.target.getAttribute('data-order-id')
            if (orderId && entry.isIntersecting) {
              visibleIds.add(orderId)
            }
          })

          // Limit to max 50 visible orders
          if (visibleIds.size > MAX_VISIBLE_ORDERS) {
            const limitedIds = Array.from(visibleIds).slice(0, MAX_VISIBLE_ORDERS)
            setVisibleOrderIds(new Set(limitedIds))
          } else {
            setVisibleOrderIds(visibleIds)
          }
        }, SCROLL_DEBOUNCE_MS)
      },
      {
        root: null, // Use viewport as root
        rootMargin: '50px', // Start loading slightly before visible
        threshold: 0.1, // Trigger when 10% visible
      }
    )

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [sellScrollRef, buyScrollRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Register order element refs
  const registerOrderElement = (orderId: string, element: HTMLElement | null) => {
    if (element) {
      element.setAttribute('data-order-id', orderId)
      orderElementRefs.current.set(orderId, element)
      observerRef.current?.observe(element)
    } else {
      const existingElement = orderElementRefs.current.get(orderId)
      if (existingElement) {
        observerRef.current?.unobserve(existingElement)
        orderElementRefs.current.delete(orderId)
      }
    }
  }

  return {
    visibleOrderIds: Array.from(visibleOrderIds),
    registerOrderElement,
  }
}
