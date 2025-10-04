npm# Vue.js to React Native Conversion Guide

## Overview

This document outlines the key learnings and challenges encountered when converting a Vue.js application to React Native, along with recommendations for future projects.

## Tech Stack Comparison

### Vue.js Stack (Original)

- **Framework**: Vue.js 3.x
- **UI Library**: PrimeVue
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: CSS/SCSS with PrimeVue themes
- **Environment Variables**: Vite env system (`import.meta.env`)
- **Package Manager**: npm/yarn
- **Development Server**: Vite dev server

### React Native Stack (Converted)

- **Framework**: React Native with Expo
- **UI Library**: React Native Tamagui
- **Build Tool**: Metro Bundler
- **State Management**: Zustand
- **Styling**: StyleSheet API
- **Environment Variables**: Node.js env system (`process.env`)
- **Package Manager**: npm
- **Development Server**: Expo CLI

### Recommended React Native Stack (Future)

- **Framework**: React Native with Expo (with web support enabled)
- **Cross-Platform**: React Native Web (included with Expo)
- **UI Library**: **Tamagui** (works perfectly with Expo)
- **Web3 Integration**: Wagmi + Web3Modal (web wallet connection)
- **Mobile Wallet**: WalletConnect Mobile SDK (for native iOS wallet connection)
- **Component Development**: Storybook (requires @storybook/react-native)
- **Data Fetching**: TanStack Query (React Query) for server state management
- **State Management**: Zustand for client state management
- **Development Tools**: TanStack DevTools for debugging and monitoring
- **Architecture**: Feature-Sliced Design (FSD) methodology
- **Code Quality**: ESLint rules with strict TypeScript enforcement
- **Logging**: React Native logging system
- **Build Tool**: Metro Bundler
- **Styling**: Tamagui's styling system with advanced theming
- **Theming**: Dark/Light modes + AI-generated themes
- **Environment Variables**: Expo Config
- **Package Manager**: npm/yarn
- **Development Server**: Expo CLI

## Key Conversion Challenges

### 1. Environment Variables

**Problem**: Vue.js uses `import.meta.env` syntax which is incompatible with React Native
**Solution**: Convert all `VITE_*` variables to standard `process.env` variables
**Learning**: React Native doesn't support ES modules' `import.meta` syntax

### 2. UI Framework Compatibility

**Problem**: PrimeVue components don't exist in React Native ecosystem
**Challenges Encountered**:

- GluestackUI had `import.meta` dependencies causing bundling errors
- React Native Elements worked but required significant layout restructuring
- Component APIs differ significantly between web and mobile

**Recommendation**: Use **Tamagui** for future projects as it:

- Provides consistent cross-platform components
- Has excellent TypeScript support
- Offers powerful styling system
- Better performance optimizations

### 3. Layout System Differences

**Vue.js**: CSS Grid/Flexbox with PrimeVue layout components
**React Native**: Flexbox-only with StyleSheet API
**Key Differences**:

- No CSS Grid support in React Native
- Different flexbox behavior
- No CSS selectors or cascading styles
- Platform-specific styling considerations

### 4. State Management Migration

**Vue.js**: Pinia stores with reactive properties
**React Native**: Zustand with immutable updates
**Considerations**:

- Different reactivity patterns
- State persistence strategies
- Cross-platform state synchronization

### 5. Navigation System

**Vue.js**: Vue Router with component-based routing
**React Native**: React Navigation with stack/tab navigators
**Differences**:

- Navigation patterns optimized for mobile
- Different lifecycle management
- Platform-specific navigation behaviors

## Conversion Process Steps

### Phase 0: Project Structure Setup (CRITICAL)

1. **Create separate conversion folder**: `react-native-conversion/` or `mobile-app/`
2. **Keep original Vue.js project intact** for reference and comparison
3. **Initialize React Native project** in the new folder
4. **Document the parallel structure** for easy reference

**Recommended Structure:**

```
project-root/
├── src/                      # Original Vue.js application (untouched)
│   ├── components/
│   ├── pages/
│   ├── stores/
│   └── ...
├── react-native/              # New React Native application
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── ...
└── docs/
    └── VUE_TO_REACT_NATIVE_CONVERSION.md
```

**Port Configuration:**

- **Vue.js app**: Runs on port 3000 (default)
- **React Native app**: Configure to run on port 3000 as well
- **Both apps**: Can run simultaneously for side-by-side comparison

### Phase 1: Project Setup

1. **Create React Native folder**: `mkdir react-native && cd react-native`
2. **Initialize React Native project** with Expo in the new folder
3. **Configure port 3000** to match Vue.js app
4. **Install core dependencies**
5. **Set up development environment**
6. **Configure Metro bundler**

### Phase 2: Environment Configuration

1. Convert environment variables from Vite to Node.js format
2. Update configuration files
3. Remove Vite-specific dependencies
4. Add React Native-specific configurations

### Phase 3: UI Framework Selection

1. Evaluate UI libraries (GluestackUI, React Native Elements, Tamagui)
2. Install chosen framework
3. Configure theming system
4. Set up component library

### Phase 4: Component Migration

1. Convert Vue components to React Native components
2. Adapt layout systems
3. Update styling approaches
4. Handle platform-specific behaviors

### Phase 5: State Management

1. **Migrate Pinia stores to Zustand** for client state management
2. **Set up TanStack Query** for server state and data fetching
3. **Separate concerns**: Keep client state (UI, user preferences) separate from server state (API data)
4. **Update reactive patterns** from Vue.js to React patterns
5. **Implement cross-platform state persistence** for Zustand stores
6. **Configure query caching** and offline support with TanStack Query
7. **Test state synchronization** across platforms

### Phase 6: Navigation Implementation

1. Set up React Navigation
2. Convert Vue Router routes
3. Implement mobile-optimized navigation patterns
4. Handle deep linking

## Running Both Applications Simultaneously

### Development Workflow

**Terminal 1 - Vue.js App:**

```bash
# In project root
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - React Native App:**

```bash
# In react-native folder
cd react-native
npx expo start --port 3000 --web
# Runs on http://localhost:3000 (web version)
```

**Benefits of Same Port:**

- **Easy switching**: Same URL for both applications
- **Side-by-side comparison**: Open both in different browser tabs
- **Consistent development**: No need to remember different ports
- **Testing**: Can quickly switch between Vue.js and React Native versions

### Port Configuration

**Vue.js (Vite):**

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
  },
})
```

**React Native (Expo):**

```bash
# Start with specific port
npx expo start --port 3000

# Or configure in app.json
{
  "expo": {
    "web": {
      "port": 3000
    }
  }
}
```

## Best Practices for Future Conversions

### 1. Project Organization (CRITICAL)

- **Always create separate folders** for Vue.js and React Native projects
- **Never modify the original Vue.js project** during conversion
- **Keep both projects running** for side-by-side comparison
- **Use parallel folder structure** for easy reference

**Example Structure:**

```
project-root/
├── src/                         # Original Vue.js (untouched)
│   ├── components/
│   ├── pages/
│   ├── stores/
│   └── ...
├── react-native/                # New React Native app
│   ├── src/
│   ├── package.json
│   ├── app.json
│   └── ...
└── docs/
    └── conversion-guide.md
```

**Port Setup:**

- **Vue.js**: `npm run dev` (port 3000)
- **React Native**: `npx expo start --port 3000` (same port)
- **Access**: Both apps accessible at `http://localhost:3000`

### 2. UI Framework Selection

- **Recommended**: Tamagui for its cross-platform consistency and Expo compatibility
- **Web3 Integration**: Wagmi + Web3Modal for web wallet connections
- **Mobile Wallets**: WalletConnect Mobile SDK for native iOS wallet integration
- **Component Development**: Storybook for isolated component development
- **Cross-Platform**: React Native Web (included with Expo) for web support
- **Data Fetching**: TanStack Query for server state management and caching
- **State Management**: Zustand for lightweight client state management
- **Avoid**: GluestackUI due to bundling issues with `import.meta`

### 3. Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/             # Screen components
├── navigation/          # Navigation configuration
├── stores/             # State management
├── services/           # API and business logic
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── assets/             # Images, fonts, etc.
```

### 4. Styling Approach

- Use Tamagui's styling system for consistency
- Implement design tokens for theming
- Create reusable style components
- Consider platform-specific adaptations

### 5. State Management

- **Client State**: Use Zustand for simple, lightweight state management
- **Server State**: Use TanStack Query for data fetching and caching
- **Separation of Concerns**: Keep client state (UI, user preferences) separate from server state (API data)
- **TypeScript Integration**: Implement proper TypeScript typing for both stores and queries
- **State Persistence**: Consider persistence strategies for Zustand stores
- **Offline Support**: Plan for offline functionality with TanStack Query's caching

### 6. Environment Configuration

- Use Expo Config for environment variables
- Implement proper secret management
- Set up different configurations for dev/staging/prod
- Use TypeScript for configuration validation

### 7. Benefits of Separate Project Structure

**Why This Approach is Critical:**

- **Preserves original functionality**: Vue.js app continues working during conversion
- **Enables side-by-side comparison**: Easy to reference original implementation
- **Reduces risk**: No chance of breaking the working Vue.js application
- **Facilitates testing**: Can test both versions simultaneously
- **Simplifies rollback**: Can easily revert to Vue.js if needed
- **Team collaboration**: Different team members can work on different platforms
- **Gradual migration**: Can migrate features incrementally

## Common Pitfalls to Avoid

### 1. Modifying Original Project (CRITICAL)

- **Never modify the original Vue.js project** during conversion
- **Always create separate folders** for React Native development
- **Avoid in-place conversion** as it risks breaking the working application
- **Keep original project as reference** throughout the conversion process

### 2. Import.meta Issues

- Never use `import.meta` syntax in React Native
- Convert all Vite environment variables early
- Test bundling after each dependency addition

### 3. UI Framework Dependencies

- Check for web-specific dependencies in UI libraries
- Test bundling compatibility before committing
- Have fallback UI solutions ready

### 4. Layout Assumptions

- Don't assume CSS Grid availability
- Test layouts on different screen sizes
- Consider platform-specific behaviors

### 5. State Management Patterns

- Avoid Vue.js reactive patterns in React Native
- Use immutable state updates
- Plan for cross-platform state synchronization

## Recommended Next Steps

### For Future Vue.js to React Native Conversions:

1. **Create separate project folders** - Never modify the original Vue.js project
2. **Use Tamagui** as the primary UI framework
3. **Set up proper TypeScript** configuration from the start
4. **Implement design system** with consistent tokens
5. **Plan mobile-first** navigation patterns
6. **Test on multiple devices** throughout development
7. **Consider performance** optimizations early
8. **Implement proper error handling** and logging
9. **Set up automated testing** for critical paths
10. **Keep both projects running** for side-by-side comparison

### Complete Setup Example:

**Core Dependencies:**

```bash
# Create React Native folder
mkdir react-native && cd react-native

# Expo with web support
npx create-expo-app --template blank-typescript

# Tamagui UI framework
npm install @tamagui/core @tamagui/config @tamagui/animations-react-native

# State management
npm install zustand @tanstack/react-query @tanstack/react-query-devtools

# Web3 integration
npm install wagmi @web3modal/react-native @web3modal/wagmi

# WalletConnect for mobile
npm install @walletconnect/react-native-dapp

# Component development
npm install @storybook/react-native
```

**Tamagui Configuration:**

```typescript
// tamagui.config.ts
import { createTamagui } from '@tamagui/core'
import { config } from '@tamagui/config/v3'

const tamaguiConfig = createTamagui(config)
export default tamaguiConfig
```

**TanStack Query Configuration:**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Zustand Store Example:**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      user: null,
      login: user => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

**Expo Configuration:**

```json
// app.json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "port": 3000
    },
    "plugins": ["@tamagui/expo-plugin"]
  }
}
```

**Running Both Apps:**

```bash
# Terminal 1: Vue.js app (project root)
npm run dev

# Terminal 2: React Native app (react-native folder)
cd react-native
npx expo start --port 3000 --web
```

## Advanced Theming with Tamagui

### Theme Architecture Overview

Tamagui provides a powerful theming system that supports:

- **Dark/Light modes** with automatic switching
- **AI-generated themes** for unique visual experiences
- **Dynamic theme switching** at runtime
- **Component-level theme overrides**
- **Consistent design tokens** across platforms

### Theme Structure

```
src/
├── themes/
│   ├── index.ts              # Theme exports
│   ├── baseTheme.ts          # Base theme configuration
│   ├── darkTheme.ts          # Dark mode theme
│   ├── lightTheme.ts         # Light mode theme
│   ├── aiThemes/             # AI-generated themes
│   │   ├── oceanTheme.ts
│   │   ├── forestTheme.ts
│   │   ├── sunsetTheme.ts
│   │   └── cyberpunkTheme.ts
│   └── tokens/               # Design tokens
│       ├── colors.ts
│       ├── spacing.ts
│       ├── typography.ts
│       └── shadows.ts
├── stores/
│   └── themeStore.ts         # Theme state management
└── components/
    └── ThemeProvider.tsx     # Theme provider component
```

### Base Theme Configuration

```typescript
// src/themes/baseTheme.ts
import { createTamagui } from '@tamagui/core'
import { config } from '@tamagui/config/v3'

export const baseTheme = createTamagui({
  ...config,
  themes: {
    light: {
      background: '#ffffff',
      backgroundHover: '#f8f9fa',
      backgroundPress: '#e9ecef',
      backgroundFocus: '#e9ecef',
      color: '#212529',
      colorHover: '#495057',
      colorPress: '#6c757d',
      colorFocus: '#6c757d',
      borderColor: '#dee2e6',
      borderColorHover: '#adb5bd',
      borderColorPress: '#6c757d',
      borderColorFocus: '#6c757d',
      placeholderColor: '#6c757d',
    },
    dark: {
      background: '#0d1117',
      backgroundHover: '#161b22',
      backgroundPress: '#21262d',
      backgroundFocus: '#21262d',
      color: '#f0f6fc',
      colorHover: '#c9d1d9',
      colorPress: '#8b949e',
      colorFocus: '#8b949e',
      borderColor: '#30363d',
      borderColorHover: '#484f58',
      borderColorPress: '#6e7681',
      borderColorFocus: '#6e7681',
      placeholderColor: '#6e7681',
    },
  },
})
```

### AI-Generated Theme Examples

```typescript
// src/themes/aiThemes/oceanTheme.ts
export const oceanTheme = {
  background: '#0a1929',
  backgroundHover: '#132f4c',
  backgroundPress: '#1e3a8a',
  backgroundFocus: '#1e3a8a',
  color: '#e0f2fe',
  colorHover: '#b3e5fc',
  colorPress: '#81d4fa',
  colorFocus: '#81d4fa',
  borderColor: '#0277bd',
  borderColorHover: '#0288d1',
  borderColorPress: '#039be5',
  borderColorFocus: '#039be5',
  accent: '#00bcd4',
  accentHover: '#26c6da',
  accentPress: '#4dd0e1',
  accentFocus: '#4dd0e1',
}

// src/themes/aiThemes/forestTheme.ts
export const forestTheme = {
  background: '#0d1b0d',
  backgroundHover: '#1a2e1a',
  backgroundPress: '#2d4a2d',
  backgroundFocus: '#2d4a2d',
  color: '#e8f5e8',
  colorHover: '#c8e6c8',
  colorPress: '#a5d6a5',
  colorFocus: '#a5d6a5',
  borderColor: '#4caf50',
  borderColorHover: '#66bb6a',
  borderColorPress: '#81c784',
  borderColorFocus: '#81c784',
  accent: '#4caf50',
  accentHover: '#66bb6a',
  accentPress: '#81c784',
  accentFocus: '#81c784',
}

// src/themes/aiThemes/cyberpunkTheme.ts
export const cyberpunkTheme = {
  background: '#0a0a0a',
  backgroundHover: '#1a1a1a',
  backgroundPress: '#2a2a2a',
  backgroundFocus: '#2a2a2a',
  color: '#00ff00',
  colorHover: '#33ff33',
  colorPress: '#66ff66',
  colorFocus: '#66ff66',
  borderColor: '#ff00ff',
  borderColorHover: '#ff33ff',
  borderColorPress: '#ff66ff',
  borderColorFocus: '#ff66ff',
  accent: '#00ffff',
  accentHover: '#33ffff',
  accentPress: '#66ffff',
  accentFocus: '#66ffff',
}
```

### Theme State Management with Zustand

```typescript
// src/stores/themeStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'
export type AITheme = 'ocean' | 'forest' | 'sunset' | 'cyberpunk' | 'none'

interface ThemeState {
  mode: ThemeMode
  aiTheme: AITheme
  setMode: (mode: ThemeMode) => void
  setAITheme: (theme: AITheme) => void
  toggleMode: () => void
  resetTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      mode: 'light',
      aiTheme: 'none',
      setMode: mode => set({ mode }),
      setAITheme: aiTheme => set({ aiTheme }),
      toggleMode: () => set(state => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      resetTheme: () => set({ mode: 'light', aiTheme: 'none' }),
    }),
    {
      name: 'theme-storage',
    }
  )
)
```

### Theme Provider Component

```typescript
// src/components/ThemeProvider.tsx
import React from 'react'
import { TamaguiProvider } from '@tamagui/core'
import { useThemeStore } from '../stores/themeStore'
import { baseTheme } from '../themes/baseTheme'
import { oceanTheme, forestTheme, cyberpunkTheme } from '../themes/aiThemes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, aiTheme } = useThemeStore()

  // Merge base theme with AI theme if selected
  const getCurrentTheme = () => {
    let theme = baseTheme.themes[mode]

    if (aiTheme !== 'none') {
      const aiThemeConfig = {
        ocean: oceanTheme,
        forest: forestTheme,
        cyberpunk: cyberpunkTheme,
      }[aiTheme]

      theme = { ...theme, ...aiThemeConfig }
    }

    return theme
  }

  return (
    <TamaguiProvider config={baseTheme} defaultTheme={mode}>
      {children}
    </TamaguiProvider>
  )
}
```

### Theme Toggle Components

```typescript
// src/components/ThemeToggle.tsx
import React from 'react'
import { Button, HStack, Text } from '@tamagui/core'
import { useThemeStore } from '../stores/themeStore'

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeStore()

  return (
    <Button onPress={toggleMode} variant="outlined">
      <HStack space="$2" alignItems="center">
        <Text>{mode === 'light' ? '🌙' : '☀️'}</Text>
        <Text>{mode === 'light' ? 'Dark' : 'Light'}</Text>
      </HStack>
    </Button>
  )
}

// src/components/AIThemeSelector.tsx
import React from 'react'
import { Button, HStack, Text, VStack } from '@tamagui/core'
import { useThemeStore } from '../stores/themeStore'

const aiThemes = [
  { id: 'none', name: 'Default', emoji: '🎨' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊' },
  { id: 'forest', name: 'Forest', emoji: '🌲' },
  { id: 'sunset', name: 'Sunset', emoji: '🌅' },
  { id: 'cyberpunk', name: 'Cyberpunk', emoji: '🤖' },
] as const

export function AIThemeSelector() {
  const { aiTheme, setAITheme } = useThemeStore()

  return (
    <VStack space="$2">
      <Text fontSize="$4" fontWeight="bold">AI Themes</Text>
      <HStack space="$2" flexWrap="wrap">
        {aiThemes.map(theme => (
          <Button
            key={theme.id}
            onPress={() => setAITheme(theme.id)}
            variant={aiTheme === theme.id ? 'outlined' : 'ghost'}
            size="$3"
          >
            <HStack space="$1" alignItems="center">
              <Text>{theme.emoji}</Text>
              <Text fontSize="$2">{theme.name}</Text>
            </HStack>
          </Button>
        ))}
      </HStack>
    </VStack>
  )
}
```

### Using Themes in Components

```typescript
// src/components/ThemedCard.tsx
import React from 'react'
import { Card, Text, YStack } from '@tamagui/core'

export function ThemedCard({ children }: { children: React.ReactNode }) {
  return (
    <Card
      backgroundColor="$background"
      borderColor="$borderColor"
      padding="$4"
      borderRadius="$4"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      <YStack space="$3">
        {children}
      </YStack>
    </Card>
  )
}

// Example usage
export function ExampleScreen() {
  return (
    <ThemedCard>
      <Text color="$color" fontSize="$5" fontWeight="bold">
        Themed Content
      </Text>
      <Text color="$colorHover" fontSize="$3">
        This text automatically adapts to the current theme
      </Text>
    </ThemedCard>
  )
}
```

### Theme Management Best Practices

1. **Consistent Token Usage**: Always use theme tokens instead of hardcoded colors
2. **Semantic Naming**: Use semantic names like `$background`, `$color` instead of `$gray100`
3. **AI Theme Integration**: Design AI themes to work with both light and dark modes
4. **Performance**: Use Zustand persistence for theme state across app restarts
5. **Accessibility**: Ensure sufficient contrast ratios in all themes
6. **Testing**: Test all themes across different components and screens

### Theme Installation

```bash
# Additional theming dependencies
npm install @tamagui/animations-react-native
npm install @tamagui/font-inter
npm install @tamagui/theme-base
```

## Feature-Sliced Design Architecture

### FSD Methodology Overview

Feature-Sliced Design (FSD) is a methodology for organizing frontend projects that promotes maintainability, scalability, and developer experience. The React Native conversion should follow FSD principles for better code organization.

### FSD Layer Structure

```
src/
├── app/                    # Application layer
│   ├── providers/          # Global providers
│   ├── styles/             # Global styles
│   └── App.tsx             # App component
├── pages/                  # Page layer
│   ├── dashboard/          # Dashboard page
│   ├── offers/             # Offers page
│   └── profile/            # Profile page
├── widgets/                # Widget layer
│   ├── sidebar/            # Sidebar widget
│   ├── header/             # Header widget
│   └── navigation/          # Navigation widget
├── features/               # Feature layer
│   ├── auth/               # Authentication feature
│   ├── wallet-connect/     # Wallet connection feature
│   ├── offers/             # Offers management feature
│   └── theme/              # Theme management feature
├── entities/               # Entity layer
│   ├── user/               # User entity
│   ├── wallet/             # Wallet entity
│   └── offer/              # Offer entity
├── shared/                 # Shared layer
│   ├── ui/                 # UI components
│   ├── lib/                # Libraries
│   ├── api/                # API layer
│   └── config/             # Configuration
```

### FSD Implementation Example

```typescript
// src/features/auth/ui/LoginForm.tsx
import React from 'react'
import { Button, Input, VStack } from '@tamagui/core'
import { useWalletAuth } from '../model/useWalletAuth'

export function LoginForm() {
  const { connectWallet, isLoading } = useWalletAuth()

  return (
    <VStack space="$4">
      <Input placeholder="Wallet Address" />
      <Button onPress={connectWallet} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </VStack>
  )
}

// src/features/auth/model/useWalletAuth.ts
import { useWalletConnect } from '../api/useWalletConnect'
import { useAuthStore } from '../../entities/user/model/useAuthStore'

export function useWalletAuth() {
  const { connect, disconnect, isConnected } = useWalletConnect()
  const { login, logout } = useAuthStore()

  const connectWallet = async () => {
    try {
      await connect()
      login()
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  return {
    connectWallet,
    disconnectWallet: () => {
      disconnect()
      logout()
    },
    isConnected,
  }
}

// src/features/auth/api/useWalletConnect.ts
import { useConnect, useDisconnect } from 'wagmi'

export function useWalletConnect() {
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return {
    connect,
    disconnect,
  }
}
```

## ESLint Rules & Code Style Guidelines

### Strict ESLint Configuration

```javascript
// eslint.config.js
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactNative from 'eslint-plugin-react-native'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      // TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',

      // React Rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native Rules
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'error',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',

      // General Rules
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-commented-out-code': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'error',
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      'max-len': ['error', { code: 100 }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
    },
  },
]
```

### Code Style Guidelines

#### **TypeScript Best Practices**

```typescript
// ✅ Good: Explicit types, no any
interface User {
  id: string
  name: string
  email: string
  walletAddress?: string
}

function createUser(userData: Omit<User, 'id'>): User {
  return {
    id: generateId(),
    ...userData,
  }
}

// ❌ Bad: Using any, implicit types
function createUser(userData: any): any {
  return {
    id: Math.random(),
    ...userData,
  }
}
```

#### **React Component Guidelines**

```typescript
// ✅ Good: Proper component structure
interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ title, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <TamaguiButton
      onPress={onPress}
      disabled={disabled}
      backgroundColor={variant === 'primary' ? '$blue9' : '$gray9'}
    >
      <Text color="$white">{title}</Text>
    </TamaguiButton>
  )
}

// ❌ Bad: No types, console.log, commented code
export function Button(props: any) {
  // console.log('Button pressed')
  // const oldCode = 'this is commented out'

  return (
    <TamaguiButton onPress={() => console.log('clicked')}>
      <Text>{props.title}</Text>
    </TamaguiButton>
  )
}
```

#### **State Management Guidelines**

```typescript
// ✅ Good: Proper Zustand store
interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      user: null,
      login: user => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: 'auth-storage' }
  )
)

// ❌ Bad: Any types, console logs
export const useAuthStore = create<any>()(
  persist(
    set => ({
      isAuthenticated: false,
      user: null,
      login: (user: any) => {
        console.log('User logged in:', user)
        set({ isAuthenticated: true, user })
      },
    }),
    { name: 'auth-storage' }
  )
)
```

## React Native Logging System

### Logger Setup

```bash
# Install logging dependencies
npm install react-native-logs
npm install @react-native-async-storage/async-storage
```

### Logger Configuration

```typescript
// src/shared/lib/logger.ts
import { logger as RNLogger, consoleTransport, fileAsyncTransport } from 'react-native-logs'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Logger configuration
const config = {
  severity: __DEV__ ? 'debug' : 'error',
  transport: __DEV__ ? consoleTransport : fileAsyncTransport,
  transportOptions: {
    colors: {
      info: 'blue',
      warn: 'yellow',
      error: 'red',
      debug: 'green',
    },
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  enabled: true,
}

// Create logger instance
export const logger = RNLogger.createLogger(config)

// Enhanced logger with context
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  debug(message: string, data?: unknown): void {
    logger.debug(`[${this.context}] ${message}`, data)
  }

  info(message: string, data?: unknown): void {
    logger.info(`[${this.context}] ${message}`, data)
  }

  warn(message: string, data?: unknown): void {
    logger.warn(`[${this.context}] ${message}`, data)
  }

  error(message: string, error?: Error | unknown): void {
    logger.error(`[${this.context}] ${message}`, error)
  }
}

// Logger factory
export function createLogger(context: string): Logger {
  return new Logger(context)
}
```

### Logger Usage Examples

```typescript
// src/features/auth/api/useWalletConnect.ts
import { createLogger } from '../../../shared/lib/logger'

const logger = createLogger('WalletConnect')

export function useWalletConnect() {
  const { connect, disconnect } = useConnect()
  const { disconnect: wagmiDisconnect } = useDisconnect()

  const connectWallet = async (): Promise<void> => {
    try {
      logger.info('Attempting wallet connection')
      await connect()
      logger.info('Wallet connected successfully')
    } catch (error) {
      logger.error('Wallet connection failed', error)
      throw error
    }
  }

  const disconnectWallet = async (): Promise<void> => {
    try {
      logger.info('Disconnecting wallet')
      await wagmiDisconnect()
      logger.info('Wallet disconnected successfully')
    } catch (error) {
      logger.error('Wallet disconnection failed', error)
      throw error
    }
  }

  return {
    connectWallet,
    disconnectWallet,
  }
}

// src/features/offers/model/useOffers.ts
import { createLogger } from '../../../shared/lib/logger'
import { useQuery } from '@tanstack/react-query'

const logger = createLogger('Offers')

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      logger.debug('Fetching offers from API')
      try {
        const response = await fetch('/api/offers')
        const data = await response.json()
        logger.info(`Successfully fetched ${data.length} offers`)
        return data
      } catch (error) {
        logger.error('Failed to fetch offers', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

### Error Boundary with Logging

```typescript
// src/shared/ui/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Text, VStack } from '@tamagui/core'
import { createLogger } from '../lib/logger'

const logger = createLogger('ErrorBoundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <VStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Text fontSize="$5" fontWeight="bold" color="$red9">
              Something went wrong
            </Text>
            <Text fontSize="$3" color="$red7" textAlign="center">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
          </VStack>
        )
      )
    }

    return this.props.children
  }
}
```

### Performance Logging

```typescript
// src/shared/lib/performanceLogger.ts
import { createLogger } from './logger'

const logger = createLogger('Performance')

export class PerformanceLogger {
  private static timers: Map<string, number> = new Map()

  static startTimer(label: string): void {
    this.timers.set(label, Date.now())
    logger.debug(`Timer started: ${label}`)
  }

  static endTimer(label: string): void {
    const startTime = this.timers.get(label)
    if (startTime) {
      const duration = Date.now() - startTime
      logger.info(`Timer ended: ${label} - ${duration}ms`)
      this.timers.delete(label)
    }
  }

  static measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label)
    return fn().finally(() => this.endTimer(label))
  }
}

// Usage example
export async function fetchUserData(userId: string): Promise<User> {
  return PerformanceLogger.measureAsync('fetchUserData', async () => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  })
}
```

### Logging Best Practices

1. **Use Context**: Always use contextual loggers for better debugging
2. **Log Levels**: Use appropriate log levels (debug, info, warn, error)
3. **Structured Data**: Log structured data for better analysis
4. **Error Handling**: Always log errors with context
5. **Performance**: Use performance logging for critical operations
6. **Production**: Disable debug logs in production builds

## Current Vue.js Project Features Summary

### Overview

The Penguin Pool Vue.js application is a comprehensive DeFi lending platform with extensive features for wallet management, offer creation, contract handling, and user experience. Below is a complete inventory of all implemented features that need to be converted to React Native.

### 🏗️ **Core Architecture Features**

#### **Layout & Navigation**

- ✅ **AppLayout**: Main application layout with sidebar and header
- ✅ **AppSidebar**: Collapsible sidebar with navigation menu
- ✅ **AppTopbar**: Header with search, notifications, and user controls
- ✅ **AppMenu**: Dynamic navigation menu system
- ✅ **AppMenuItem**: Individual menu item components
- ✅ **AppConfigurator**: Layout configuration management
- ✅ **Responsive Design**: Mobile and desktop responsive layouts

#### **Theme Management**

- ✅ **Theme System**: Complete theming infrastructure
- ✅ **BuiltInThemeSelector**: Pre-built theme selection
- ✅ **CustomThemeSelector**: Custom theme creation
- ✅ **PrimeUIThemeSelector**: PrimeVue theme integration
- ✅ **ColorCustomization**: Dynamic color customization
- ✅ **ThemeDemo**: Theme preview system
- ✅ **ThemeImportExport**: Theme sharing functionality
- ✅ **ThemeSettings**: Comprehensive theme configuration
- ✅ **ThemeToggle**: Dark/light mode switching
- ✅ **ThemeVariantControls**: Theme variant management
- ✅ **CurrentThemeDisplay**: Active theme visualization
- ✅ **ThemeValidator**: Theme validation system
- ✅ **Windows95 Theme**: Retro theme implementation
- ✅ **Example Themes**: Sample theme configurations

### 🔐 **Authentication & Wallet Features**

#### **Wallet Connect Integration**

- ✅ **WalletConnect Service**: Core wallet connection service
- ✅ **WalletConnect Event Listeners**: Event handling system
- ✅ **Wallet State Management**: Wallet state tracking
- ✅ **IOS Wallet Modal**: iOS-specific wallet interface
- ✅ **Wallet Connect Persistence**: Session persistence
- ✅ **Connection Data Service**: Connection management
- ✅ **Instance Data Service**: Wallet instance management
- ✅ **Session Data Service**: Session handling
- ✅ **Logout Service**: Secure logout functionality
- ✅ **Wallet Data Service**: Wallet data management
- ✅ **Wallet Queries Repository**: Data query system

#### **Wallet Types & Methods**

- ✅ **Chia RPC Types**: Chia blockchain integration
- ✅ **Sage RPC Types**: Sage wallet integration
- ✅ **Command Types**: Command system types
- ✅ **Service Types**: Service layer types
- ✅ **Wallet Info Types**: Wallet information types
- ✅ **Wallet Connect Types**: WalletConnect protocol types
- ✅ **Sage Methods**: Sage wallet methods
- ✅ **Wallet Connect Constants**: Configuration constants

### 📊 **Dashboard & Analytics**

#### **Dashboard Features**

- ✅ **Dashboard Page**: Main dashboard interface
- ✅ **Portfolio Overview**: User portfolio display
- ✅ **Asset Management**: Asset tracking and management
- ✅ **Analytics Charts**: Data visualization
- ✅ **Performance Metrics**: Performance tracking
- ✅ **Real-time Updates**: Live data updates

### 📋 **Offers Management**

#### **Offer System**

- ✅ **Offers Page**: Main offers interface
- ✅ **Create Offer Modal**: Offer creation interface
- ✅ **Take Offer Modal**: Offer acceptance interface
- ✅ **Offer Details Modal**: Detailed offer information
- ✅ **Cat Tokens List**: CAT token management
- ✅ **Offer Inspection**: Offer analysis tools
- ✅ **Offer State Validation**: Offer validation system
- ✅ **Offer Storage**: Offer persistence
- ✅ **Offer Validation**: Offer verification
- ✅ **Offer Storage Service**: Offer data management

### 📄 **Option Contracts**

#### **Contract Management**

- ✅ **Option Contracts Page**: Contract interface
- ✅ **Contract Creation**: Contract creation system
- ✅ **Contract Execution**: Contract execution
- ✅ **Contract Monitoring**: Contract tracking
- ✅ **Risk Management**: Risk assessment tools

### 💰 **Loans & Lending**

#### **Lending System**

- ✅ **Loans Page**: Loan management interface
- ✅ **Loan Creation**: Loan origination
- ✅ **Loan Management**: Loan administration
- ✅ **Interest Calculation**: Interest computation
- ✅ **Payment Processing**: Payment handling
- ✅ **Default Management**: Default handling

### 🐷 **Piggy Bank Features**

#### **Piggy Bank System**

- ✅ **Piggy Bank Page**: Piggy bank interface
- ✅ **Coin-based Settlement**: Unique settlement mechanism
- ✅ **Savings Management**: Savings tracking
- ✅ **Goal Setting**: Savings goals
- ✅ **Progress Tracking**: Progress monitoring

### 👤 **Profile & Settings**

#### **User Management**

- ✅ **Profile Page**: User profile interface
- ✅ **User Store**: User state management
- ✅ **Settings Management**: Configuration system
- ✅ **Preferences**: User preferences
- ✅ **Account Management**: Account administration

### 🔔 **Notifications & Communication**

#### **Notification System**

- ✅ **Notification Store**: Notification state management
- ✅ **Real-time Notifications**: Live notification system
- ✅ **Notification Types**: Various notification types
- ✅ **Notification Settings**: Notification preferences

### 📱 **PWA & Mobile Features**

#### **Progressive Web App**

- ✅ **PWA Install Prompt**: Installation prompts
- ✅ **Offline Indicator**: Offline status display
- ✅ **Service Worker**: Background processing
- ✅ **App Manifest**: PWA configuration
- ✅ **Mobile Optimization**: Mobile-specific features

### 🛠️ **Development & Testing**

#### **Development Tools**

- ✅ **Feature Flags**: Feature toggle system
- ✅ **Feature Flag Store**: Flag state management
- ✅ **Default Feature Flags**: Default configurations
- ✅ **Feature Flag Middleware**: Flag processing
- ✅ **Feature Flag Service**: Flag management
- ✅ **Feature Flag Controller**: Flag API endpoints
- ✅ **Feature Flag Environment**: Environment-specific flags

#### **Testing Infrastructure**

- ✅ **Unit Tests**: Component testing
- ✅ **Playwright Tests**: E2E testing
- ✅ **Component Tests**: Component-specific tests
- ✅ **Test Utilities**: Testing helpers
- ✅ **Test Setup**: Test configuration
- ✅ **Test Fixtures**: Test data

### 📊 **Data Management**

#### **Database & Storage**

- ✅ **Dexie Integration**: IndexedDB wrapper
- ✅ **Dexie Data Service**: Data service layer
- ✅ **Dexie Repository**: Data repository pattern
- ✅ **IndexedDB Setup**: Database configuration
- ✅ **Data Persistence**: Data storage
- ✅ **Offline Support**: Offline data handling

#### **External Services**

- ✅ **KurrentDB Integration**: External database service
- ✅ **KurrentDB HTTP Client**: HTTP client
- ✅ **KurrentDB WebSocket Client**: WebSocket client
- ✅ **KurrentDB Service**: Service layer
- ✅ **KurrentDB Store**: State management
- ✅ **Service Health Monitoring**: Health checks
- ✅ **Uptime Tracking**: Uptime monitoring
- ✅ **Uptime Service**: Uptime management

### 🔧 **Utility & Helper Features**

#### **Utility Functions**

- ✅ **Chia Units**: Chia unit conversion
- ✅ **Offer Parser**: Offer parsing utilities
- ✅ **Ticker Data**: Market data handling
- ✅ **Ticker Mapping**: Data mapping
- ✅ **Session Manager**: Session management
- ✅ **Logger Service**: Logging system

#### **Configuration Management**

- ✅ **Environment Configuration**: Environment variables
- ✅ **Query Client**: API client configuration
- ✅ **Default Configurations**: Default settings
- ✅ **Configuration Validation**: Config validation

### 🎨 **UI Components**

#### **Shared Components**

- ✅ **Confirmation Dialog**: Confirmation modals
- ✅ **Penguin Logo**: Brand logo component
- ✅ **Feature Flag Component**: Feature flag UI
- ✅ **IOS Wallet Connect Button**: iOS-specific button
- ✅ **Offline Indicator**: Offline status component

#### **Transaction Components**

- ✅ **Send Transaction Component**: Transaction interface
- ✅ **Transaction Summary**: Transaction overview
- ✅ **Action Buttons**: Transaction actions
- ✅ **Status Messages**: Transaction status
- ✅ **Address Field**: Address input
- ✅ **Amount Field**: Amount input
- ✅ **Fee Field**: Fee input
- ✅ **Memo Field**: Memo input
- ✅ **Transaction Form**: Form management
- ✅ **Transaction Validation**: Form validation

### 📈 **Analytics & Monitoring**

#### **Performance Monitoring**

- ✅ **Bundle Analysis**: Bundle size analysis
- ✅ **Lazy Loading**: Code splitting
- ✅ **Dependency Analysis**: Dependency tracking
- ✅ **Performance Metrics**: Performance monitoring
- ✅ **Error Tracking**: Error monitoring

### 🔒 **Security Features**

#### **Security Implementation**

- ✅ **Input Validation**: Form validation
- ✅ **XSS Protection**: Cross-site scripting protection
- ✅ **CSRF Protection**: Cross-site request forgery protection
- ✅ **Secure Headers**: Security headers
- ✅ **Authentication Guards**: Route protection

### 📚 **Documentation & Guides**

#### **Documentation System**

- ✅ **API Documentation**: API reference
- ✅ **Code Style Guide**: Coding standards
- ✅ **Technical Documentation**: Technical guides
- ✅ **Implementation Guides**: Implementation docs
- ✅ **Setup Guides**: Setup instructions
- ✅ **Testing Documentation**: Testing guides
- ✅ **Deployment Guides**: Deployment instructions

### 🎯 **Feature Conversion Priority**

#### **High Priority (Core Features)**

1. **Authentication & Wallet Connect**
2. **Dashboard & Analytics**
3. **Offers Management**
4. **Layout & Navigation**
5. **Theme System**

#### **Medium Priority (Important Features)**

1. **Option Contracts**
2. **Loans & Lending**
3. **Piggy Bank**
4. **Profile & Settings**
5. **Notifications**

#### **Low Priority (Enhancement Features)**

1. **PWA Features**
2. **Advanced Analytics**
3. **Testing Infrastructure**
4. **Development Tools**
5. **Documentation System**

### 📊 **Conversion Complexity Assessment**

#### **Simple Conversions (1-2 weeks)**

- Basic UI components
- Static pages
- Simple forms
- Basic navigation

#### **Medium Conversions (2-4 weeks)**

- Wallet integration
- State management
- API integration
- Theme system

#### **Complex Conversions (4-8 weeks)**

- Complete offer system
- Contract management
- Real-time features
- Advanced analytics

#### **Very Complex Conversions (8+ weeks)**

- Full lending system
- Piggy bank mechanics
- Complete PWA features
- Advanced testing suite

This comprehensive feature inventory provides a complete roadmap for converting all Vue.js features to React Native while maintaining full functionality and user experience parity.

## Complete Feature Conversion Guide

### Feature Conversion Strategy

**All Vue.js features must be converted** to maintain feature parity and ensure a complete React Native application. This includes:

1. **Authentication & Wallet Connection**
2. **Dashboard & Analytics**
3. **Offers Management**
4. **Option Contracts**
5. **Loans & Lending**
6. **Piggy Bank Features**
7. **Profile & Settings**
8. **Notifications**
9. **Data Services & APIs**

### Responsive UI Setup with Sidebar and Menu Bar

#### Layout Architecture

```typescript
// src/components/layout/AppLayout.tsx
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HStack, VStack, useMedia } from '@tamagui/core'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useThemeStore } from '../../stores/themeStore'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { mode } = useThemeStore()
  const media = useMedia()
  const insets = useSafeAreaInsets()

  // Responsive sidebar behavior
  const shouldShowSidebar = media.sm ? sidebarOpen : false
  const sidebarWidth = sidebarCollapsed ? 64 : 280

  return (
    <HStack flex={1} backgroundColor="$background">
      {/* Responsive Sidebar */}
      {shouldShowSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <VStack flex={1} marginLeft={shouldShowSidebar ? sidebarWidth : 0}>
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <VStack flex={1} padding="$4" paddingTop={insets.top}>
          {children}
        </VStack>
      </VStack>
    </HStack>
  )
}
```

#### Responsive Sidebar Component

```typescript
// src/components/layout/Sidebar.tsx
import React from 'react'
import { ScrollView } from 'react-native'
import { VStack, HStack, Text, Button, Separator } from '@tamagui/core'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard' },
  { id: 'offers', label: 'Offers', icon: '📋', path: '/offers', badge: '12' },
  { id: 'contracts', label: 'Contracts', icon: '📄', path: '/contracts' },
  { id: 'loans', label: 'Loans', icon: '💰', path: '/loans' },
  { id: 'piggy-bank', label: 'Piggy Bank', icon: '🐷', path: '/piggy-bank' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
]

export function Sidebar({ isOpen, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { mode } = useThemeStore()
  const { walletAddress, isAuthenticated } = useAuthStore()

  return (
    <VStack
      width={isCollapsed ? 64 : 280}
      backgroundColor="$backgroundHover"
      borderRightWidth={1}
      borderRightColor="$borderColor"
      padding="$3"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 2, height: 0 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      {/* Logo Section */}
      <VStack space="$3" alignItems={isCollapsed ? 'center' : 'flex-start'}>
        <HStack space="$2" alignItems="center">
          <Text fontSize="$6">🐧</Text>
          {!isCollapsed && (
            <VStack>
              <Text fontSize="$5" fontWeight="bold" color="$color">
                Penguin Pool
              </Text>
              <Text fontSize="$2" color="$colorHover">
                DeFi Platform
              </Text>
            </VStack>
          )}
        </HStack>

        {!isCollapsed && (
          <Button
            size="$2"
            variant="ghost"
            onPress={onToggleCollapse}
            icon="chevron-left"
          >
            Collapse
          </Button>
        )}
      </VStack>

      <Separator marginVertical="$3" />

      {/* Navigation Menu */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space="$2">
          {navigationItems.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              padding="$3"
              borderRadius="$3"
            >
              <HStack space="$2" alignItems="center">
                <Text fontSize="$4">{item.icon}</Text>
                {!isCollapsed && (
                  <>
                    <Text flex={1} color="$color">
                      {item.label}
                    </Text>
                    {item.badge && (
                      <Text
                        backgroundColor="$red9"
                        color="$red1"
                        fontSize="$1"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        {item.badge}
                      </Text>
                    )}
                  </>
                )}
              </HStack>
            </Button>
          ))}
        </VStack>
      </ScrollView>

      <Separator marginVertical="$3" />

      {/* Wallet Status */}
      <VStack space="$2" alignItems={isCollapsed ? 'center' : 'flex-start'}>
        <HStack space="$2" alignItems="center">
          <Text
            fontSize="$2"
            color={isAuthenticated ? '$green9' : '$red9'}
          >
            {isAuthenticated ? '🟢' : '🔴'}
          </Text>
          {!isCollapsed && (
            <Text fontSize="$2" color="$colorHover">
              {isAuthenticated ? 'Connected' : 'Disconnected'}
            </Text>
          )}
        </HStack>

        {!isCollapsed && walletAddress && (
          <Text
            fontSize="$1"
            color="$colorHover"
            fontFamily="$mono"
          >
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </Text>
        )}
      </VStack>
    </VStack>
  )
}
```

#### Responsive Header Component

```typescript
// src/components/layout/Header.tsx
import React, { useState } from 'react'
import { HStack, VStack, Text, Button, Input } from '@tamagui/core'
import { useMedia } from '@tamagui/core'
import { ThemeToggle } from '../ThemeToggle'
import { AIThemeSelector } from '../AIThemeSelector'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const media = useMedia()

  return (
    <HStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      padding="$3"
      alignItems="center"
      justifyContent="space-between"
    >
      {/* Left Section */}
      <HStack space="$3" alignItems="center">
        <Button
          size="$3"
          variant="ghost"
          onPress={onToggleSidebar}
          icon="menu"
        />

        {/* Responsive Search */}
        {media.sm && (
          <Input
            placeholder="Search offers, contracts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            width={300}
            backgroundColor="$backgroundHover"
            borderColor="$borderColor"
          />
        )}
      </HStack>

      {/* Right Section */}
      <HStack space="$3" alignItems="center">
        {/* Notifications */}
        <Button size="$3" variant="ghost" icon="bell">
          <Text
            backgroundColor="$red9"
            color="$red1"
            fontSize="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            position="absolute"
            top={-5}
            right={-5}
          >
            3
          </Text>
        </Button>

        {/* Theme Controls */}
        <ThemeToggle />

        {/* User Profile */}
        <Button size="$3" variant="ghost" icon="user" />
      </HStack>
    </HStack>
  )
}
```

### Wallet Connect Integration & Login Flow

#### Wallet Connect Setup

```typescript
// src/lib/walletConnect.ts
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { mainnet, arbitrum, polygon } from 'viem/chains'
import { WagmiConfig } from 'wagmi'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID!

// 2. Create wagmiConfig
const metadata = {
  name: 'Penguin Pool',
  description: 'DeFi Lending Platform',
  url: 'https://penguinpool.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

const chains = [mainnet, arbitrum, polygon] as const
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
})

export { wagmiConfig }
```

#### Authentication Store with Wallet Integration

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface AuthState {
  isAuthenticated: boolean
  walletAddress: string | null
  walletType: 'web3modal' | 'walletconnect' | null
  login: (address: string, type: 'web3modal' | 'walletconnect') => void
  logout: () => void
  setWalletAddress: (address: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isAuthenticated: false,
      walletAddress: null,
      walletType: null,
      login: (address, type) =>
        set({
          isAuthenticated: true,
          walletAddress: address,
          walletType: type,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          walletAddress: null,
          walletType: null,
        }),
      setWalletAddress: address => set({ walletAddress: address }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Wallet Connect Hook
export function useWalletAuth() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { login, logout, isAuthenticated } = useAuthStore()

  const connectWallet = async () => {
    try {
      await connect({ connector: connectors[0] })
      if (address) {
        login(address, 'web3modal')
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnect()
      logout()
    } catch (error) {
      console.error('Wallet disconnection failed:', error)
    }
  }

  return {
    address,
    isConnected,
    isAuthenticated,
    connectWallet,
    disconnectWallet,
  }
}
```

#### Login Screen with Wallet Connect

```typescript
// src/screens/LoginScreen.tsx
import React from 'react'
import { VStack, HStack, Text, Button, Card } from '@tamagui/core'
import { useWalletAuth } from '../stores/authStore'
import { ThemeProvider } from '../components/ThemeProvider'

export function LoginScreen() {
  const { connectWallet, isConnected, address } = useWalletAuth()

  if (isConnected) {
    return (
      <ThemeProvider>
        <VStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Card padding="$6" backgroundColor="$background" borderRadius="$4">
            <VStack space="$4" alignItems="center">
              <Text fontSize="$6">🐧</Text>
              <Text fontSize="$5" fontWeight="bold" color="$color">
                Welcome to Penguin Pool
              </Text>
              <Text fontSize="$3" color="$colorHover" textAlign="center">
                Connected to: {address?.slice(0, 8)}...{address?.slice(-8)}
              </Text>
              <Button
                size="$4"
                backgroundColor="$blue9"
                color="$blue1"
                onPress={() => {/* Navigate to dashboard */}}
              >
                Enter Dashboard
              </Button>
            </VStack>
          </Card>
        </VStack>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <VStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Card padding="$6" backgroundColor="$background" borderRadius="$4">
          <VStack space="$4" alignItems="center">
            <Text fontSize="$8">🐧</Text>
            <Text fontSize="$6" fontWeight="bold" color="$color">
              Penguin Pool
            </Text>
            <Text fontSize="$3" color="$colorHover" textAlign="center">
              Connect your wallet to access the DeFi platform
            </Text>

            <VStack space="$3" width="100%">
              <Button
                size="$4"
                backgroundColor="$blue9"
                color="$blue1"
                onPress={connectWallet}
              >
                Connect Wallet
              </Button>

              <Text fontSize="$2" color="$colorHover" textAlign="center">
                Supported wallets: MetaMask, WalletConnect, Coinbase Wallet
              </Text>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ThemeProvider>
  )
}
```

### Data Services Integration

#### API Service with TanStack Query

```typescript
// src/services/apiService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Offers API
export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const response = await fetch('/api/offers')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (offerData: any) => {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

// Wallet Data API
export function useWalletData(address: string) {
  return useQuery({
    queryKey: ['wallet', address],
    queryFn: async () => {
      const response = await fetch(`/api/wallet/${address}`)
      return response.json()
    },
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Dashboard Analytics
export function useDashboardData(address: string) {
  return useQuery({
    queryKey: ['dashboard', address],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/${address}`)
      return response.json()
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
```

### TanStack DevTools Integration

#### DevTools Setup

```typescript
// src/lib/devtools.ts
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { DevTools as ZustandDevTools } from 'zustand/middleware'

// React Query DevTools
export function QueryDevTools() {
  if (__DEV__) {
    return <ReactQueryDevtools initialIsOpen={false} />
  }
  return null
}

// Zustand DevTools Middleware
export const devtoolsMiddleware = ZustandDevTools
```

#### App Setup with DevTools

```typescript
// App.tsx
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { TamaguiProvider } from '@tamagui/core'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { wagmiConfig } from './src/lib/walletConnect'
import { QueryDevTools } from './src/lib/devtools'
import { AppLayout } from './src/components/layout/AppLayout'
import { LoginScreen } from './src/screens/LoginScreen'
import { useAuthStore } from './src/stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
})

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          <TamaguiProvider config={baseTheme}>
            {isAuthenticated ? <AppLayout /> : <LoginScreen />}
            <QueryDevTools />
          </TamaguiProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
```

### Feature Conversion Checklist

#### ✅ Authentication & Wallet

- [ ] Wallet Connect integration
- [ ] Web3Modal setup
- [ ] Authentication state management
- [ ] Login/logout flow
- [ ] Wallet address display

#### ✅ UI Components

- [ ] Responsive sidebar with collapse
- [ ] Header with search and notifications
- [ ] Theme toggle components
- [ ] Navigation menu
- [ ] Mobile-responsive design

#### ✅ Data Services

- [ ] TanStack Query setup
- [ ] API service layer
- [ ] Caching strategies
- [ ] Error handling
- [ ] Loading states

#### ✅ Development Tools

- [ ] TanStack DevTools integration
- [ ] Zustand DevTools
- [ ] Debugging setup
- [ ] Performance monitoring

## Conclusion

Converting Vue.js to React Native requires careful planning and consideration of platform differences. The main challenges revolve around UI framework compatibility, environment configuration, and layout system differences. Using the comprehensive stack with Tamagui, Wagmi, and WalletConnect will provide better cross-platform consistency, seamless Web3 integration, advanced theming capabilities, responsive design, complete feature parity, and reduced conversion complexity.

**Key advantages of the recommended stack:**

- **Tamagui**: Perfect Expo integration with cross-platform consistency
- **Wagmi + Web3Modal**: Robust Web3 wallet connection for web
- **WalletConnect Mobile SDK**: Native iOS wallet integration
- **React Native Web**: Seamless web deployment with Expo
- **Storybook**: Isolated component development and testing
- **TanStack Query**: Powerful data fetching with caching and offline support
- **Zustand**: Lightweight, TypeScript-first state management
- **Advanced Theming**: Dark/Light modes + AI-generated themes with easy management
- **TanStack DevTools**: Comprehensive debugging and monitoring tools
- **Responsive Design**: Mobile-first UI with collapsible sidebar and adaptive layouts
- **Complete Feature Conversion**: All Vue.js features converted with wallet integration

Key takeaways:

- Environment variable conversion is critical
- UI framework selection significantly impacts success
- Mobile-first thinking is essential
- Proper TypeScript setup saves time
- Testing on multiple platforms is crucial

This conversion process provides valuable insights for future cross-platform development projects.

## Key Lesson Learned

**CRITICAL**: The most important lesson from this conversion attempt is to **always create separate project folders** and **never modify the original Vue.js project** during conversion. This approach:

- Prevents breaking the working application
- Enables side-by-side comparison and reference
- Reduces risk and simplifies rollback
- Facilitates team collaboration
- Allows gradual, incremental migration

The original attempt to convert in-place caused configuration conflicts and required extensive cleanup, demonstrating why separate project structures are essential for successful Vue.js to React Native conversions.
