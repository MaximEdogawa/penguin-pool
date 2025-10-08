import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        set({ user })
      },
      clearUser: () => {
        set({ user: null })
      },
    }),
    {
      name: 'user-storage',
    },
  ),
)
