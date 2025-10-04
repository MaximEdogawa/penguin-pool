import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'
export type AITheme = 'ocean' | 'forest' | 'sunset' | 'cyberpunk' | 'none'

interface ThemeState {
  mode: ThemeMode
  aiTheme: AITheme
  setMode: (_mode: ThemeMode) => void
  setAITheme: (_theme: AITheme) => void
  toggleMode: () => void
  resetTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      mode: 'light',
      aiTheme: 'none',
      setMode: (_mode): void => set({ mode: _mode }),
      setAITheme: (_aiTheme): void => set({ aiTheme: _aiTheme }),
      toggleMode: (): void => set(state => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      resetTheme: (): void => set({ mode: 'light', aiTheme: 'none' }),
    }),
    {
      name: 'theme-storage',
    }
  )
)
