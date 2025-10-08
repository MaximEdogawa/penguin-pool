import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../../shared/lib/logger'

const logger = createLogger('ThemeStore')

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      mode: 'light',
      setMode: mode => {
        logger.describeFunction({
          name: 'setMode',
          purpose: 'Sets the application theme mode',
          parameters: { mode: 'ThemeMode - light or dark theme' },
          sideEffects: ['Updates theme state', 'Persists theme preference'],
        })
        logger.warn('Theme mode changed', { mode })
        set({ mode })
      },
      toggleMode: () => {
        logger.describeFunction({
          name: 'toggleMode',
          purpose: 'Toggles between light and dark theme modes',
          returns: 'void',
          sideEffects: ['Updates theme state', 'Persists theme preference'],
        })
        set(state => {
          const newMode = state.mode === 'light' ? 'dark' : 'light'
          logger.warn('Theme mode toggled', { newMode })
          return { mode: newMode }
        })
      },
    }),
    {
      name: 'theme-storage',
    },
  ),
)
