import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createLogger } from '../../shared/lib/logger'

const logger = createLogger('UserStore')

export interface User {
  id: string
  walletAddress: string | null
  isAuthenticated: boolean
}

interface UserState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      user: null,
      setUser: user => {
        logger.warn('User set', { userId: user.id })
        set({ user })
      },
      clearUser: () => {
        logger.warn('User cleared')
        set({ user: null })
      },
    }),
    {
      name: 'user-storage',
    }
  )
)
