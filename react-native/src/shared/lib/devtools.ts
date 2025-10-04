import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import { DevTools as ZustandDevTools } from 'zustand/middleware'

// React Query DevTools
export function QueryDevTools(): React.ReactElement | null {
  if (__DEV__) {
    return React.createElement(ReactQueryDevtools, { initialIsOpen: false })
  }
  return null
}

// Zustand DevTools Middleware
export const devtoolsMiddleware = ZustandDevTools
