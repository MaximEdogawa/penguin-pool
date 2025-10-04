import { render, screen } from '@testing-library/react-native'
import React from 'react'
import { ThemeProvider } from '../src/app/providers/ThemeProvider'
import { LoginScreen } from '../src/pages/auth/LoginScreen'

// Mock the auth store
jest.mock('../src/entities/user/model/useAuthStore', () => ({
  useAuthStore: (): { isAuthenticated: boolean; login: jest.Mock } => ({
    isAuthenticated: false,
    login: jest.fn(),
  }),
}))

describe('LoginScreen', () => {
  it('renders Penguin Pool title', (): void => {
    render(
      <ThemeProvider>
        <LoginScreen />
      </ThemeProvider>
    )

    expect(screen.getByText('Penguin Pool')).toBeTruthy()
  })

  it('renders connect wallet button', (): void => {
    render(
      <ThemeProvider>
        <LoginScreen />
      </ThemeProvider>
    )

    expect(screen.getByText('Connect Wallet')).toBeTruthy()
  })
})
