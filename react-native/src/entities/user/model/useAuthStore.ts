import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  walletAddress?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  walletAddress: string | null
  walletType: 'web3modal' | 'walletconnect' | null
  login: (_user: User, _address: string, _type: 'web3modal' | 'walletconnect') => void
  logout: () => void
  setWalletAddress: (_address: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      user: null,
      walletAddress: null,
      walletType: null,
      login: (_user, _address, _type): void =>
        set({
          isAuthenticated: true,
          user: _user,
          walletAddress: _address,
          walletType: _type,
        }),
      logout: (): void =>
        set({
          isAuthenticated: false,
          user: null,
          walletAddress: null,
          walletType: null,
        }),
      setWalletAddress: (_address): void => set({ walletAddress: _address }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
