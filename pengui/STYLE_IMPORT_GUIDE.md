# How to Import Styles from @maximedogawa/chia-wallet-connect-react

This guide explains how to properly import and configure styles from the `@maximedogawa/chia-wallet-connect-react` package in your Next.js application.

## Importing Styles

### Method 1: JavaScript Import (Recommended for Next.js with Turbopack)

In your root layout file (`app/layout.tsx` or `pages/_app.tsx`), import the styles using a JavaScript import statement:

```typescript
import '@maximedogawa/chia-wallet-connect-react/styles'
```

**Example:**

```typescript
'use client'

import './globals.css'
// Import wallet connect package styles directly
import '@maximedogawa/chia-wallet-connect-react/styles'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### Method 2: CSS @import (Alternative, but may not work with Turbopack)

If you prefer CSS imports, you can add this to your global CSS file:

```css
@import '@maximedogawa/chia-wallet-connect-react/styles';
```

**Note:** This method may not work correctly with Next.js 16's Turbopack. Use Method 1 for better compatibility.

## Package Export Path

The package exports styles at the following path:

- Package export: `@maximedogawa/chia-wallet-connect-react/styles`
- Actual file: `node_modules/@maximedogawa/chia-wallet-connect-react/dist/styles/globals.css`

The package's `package.json` defines this export:

```json
{
  "exports": {
    "./styles": "./dist/styles/globals.css"
  }
}
```

## Tailwind Configuration

If you're using Tailwind CSS, you may want to include the package's components in your Tailwind content paths to ensure all Tailwind classes are properly processed:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    // Include chia-wallet-connect-react package components
    './node_modules/@maximedogawa/chia-wallet-connect-react/dist/**/*.{js,jsx,ts,tsx}',
  ],
  // ... rest of config
}
```

## Next.js Configuration

Make sure your `next.config.ts` includes the package in `transpilePackages`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@maximedogawa/chia-wallet-connect-react'],
  // ... rest of config
}

export default nextConfig
```

## Troubleshooting

### Styles Not Loading

1. **Check import order**: Make sure the package styles are imported after your base Tailwind imports but before your custom styles.

2. **Verify package installation**: Ensure the package is properly installed:

   ```bash
   npm list @maximedogawa/chia-wallet-connect-react
   # or
   bun list @maximedogawa/chia-wallet-connect-react
   ```

3. **Check build output**: Look for any CSS-related errors in your build output:

   ```bash
   npm run build
   # or
   bun run build
   ```

4. **Turbopack compatibility**: If using Turbopack (Next.js 16 default), use JavaScript imports (`import '@maximedogawa/chia-wallet-connect-react/styles'`) rather than CSS `@import` statements.

### Images Not Loading

If wallet icons/images are not displaying:

1. **Default WalletConnect Icon**: The package expects a default WalletConnect icon at `/assets/walletconnect.svg`. Create this file in your `public/assets/` directory if you want to use a custom icon, or set the `NEXT_PUBLIC_WALLET_CONNECT_ICON` environment variable to point to your icon URL.

2. **Wallet Metadata Icons**: Wallet icons come from WalletConnect session metadata (`peer.metadata.icons`). These are external URLs and should load automatically. If they don't load:
   - Check browser console for CORS or network errors
   - Verify the wallet metadata includes valid icon URLs
   - Ensure the wallet provider is returning proper metadata

3. **Local Images**: If using local images, place them in the `public/` directory and reference them with absolute paths (e.g., `/assets/my-icon.png`).

**Note:** The package uses standard `<img>` tags (not Next.js Image component), so Next.js image optimization configuration is not needed.

## Complete Example

Here's a complete example of a Next.js layout with proper style imports:

```typescript
'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@maximedogawa/chia-wallet-connect-react'
import { WalletManager } from '@maximedogawa/chia-wallet-connect-react'
import { useEffect } from 'react'

// Import styles in this order:
// 1. Base Tailwind styles
import './globals.css'
// 2. Package styles
import '@maximedogawa/chia-wallet-connect-react/styles'
// 3. Your custom styles (if any)
import './custom-styles.css'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize WalletManager
    const walletManager = new WalletManager('/your-app-icon.png', {
      name: 'Your App',
      description: 'Your app description',
      url: 'https://your-app.com',
      icons: ['/your-app-icon.png'],
    })
    walletManager.detectEvents()
  }, [])

  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            {children}
          </PersistGate>
        </Provider>
      </body>
    </html>
  )
}
```

## Summary

- ✅ **Use JavaScript import**: `import '@maximedogawa/chia-wallet-connect-react/styles'`
- ✅ **Import in layout file**: Add to your root layout component
- ✅ **Configure Tailwind**: Include package components in content paths
- ✅ **Configure Next.js**: Add package to `transpilePackages`
- ✅ **Default WalletConnect icon**: Place at `/public/assets/walletconnect.svg` or set `NEXT_PUBLIC_WALLET_CONNECT_ICON` env variable
- ✅ **Wallet icons**: Load automatically from WalletConnect session metadata (external URLs)
