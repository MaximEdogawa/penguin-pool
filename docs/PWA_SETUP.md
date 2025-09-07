# PWA Setup Guide

This guide explains how to set up a Progressive Web App (PWA) and generate the necessary icons for your Penguin Pool application.

## Table of Contents

- [PWA Overview](#pwa-overview)
- [PWA Setup Steps](#pwa-setup-steps)
- [Icon Generation](#icon-generation)
- [Testing PWA Installation](#testing-pwa-installation)
- [Troubleshooting](#troubleshooting)

## PWA Overview

A Progressive Web App (PWA) is a web application that can be installed on a user's device and behaves like a native app. Key features include:

- **Installable**: Users can add the app to their home screen
- **Offline capable**: Works without internet connection (optional)
- **Responsive**: Adapts to any screen size
- **Secure**: Served over HTTPS
- **App-like**: Runs in standalone mode without browser UI

## PWA Setup Steps

### 1. Create PWA Manifest

The manifest file tells the browser how your app should behave when installed.

**File**: `public/manifest.json`

```json
{
  "name": "Penguin Pool",
  "short_name": "Penguin Pool",
  "description": "Decentralized lending platform on Chia Network",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en",
  "categories": ["finance", "business", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View your wallet balance and quick actions",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/icons/icon-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

### 2. Update HTML Meta Tags

Add PWA-specific meta tags to your `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    />

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- PWA Meta Tags -->
    <meta name="application-name" content="Penguin Pool" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Penguin Pool" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="msapplication-TileColor" content="#1e40af" />
    <meta name="msapplication-tap-highlight" content="no" />

    <!-- Theme Colors -->
    <meta name="theme-color" content="#1e40af" />
    <meta name="msapplication-navbutton-color" content="#1e40af" />

    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />

    <!-- Standard Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />

    <title>Penguin Pool - Chia DeFi Platform</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 3. Create PWA Install Prompt Component

Create a component to prompt users to install the PWA:

**File**: `src/components/PWAInstallPrompt.vue`

```vue
<template>
  <div v-if="showInstallPrompt" class="fixed top-0 left-0 right-0 z-50">
    <div
      class="bg-surface-900 text-surface-100 py-1 px-3 lg:px-6 flex items-center flex-wrap relative"
    >
      <div class="font-bold flex items-center gap-1 text-xs">📱 Install Penguin Pool</div>
      <div class="absolute left-1/2 transform -translate-x-1/2 inline-flex gap-1 items-center">
        <span class="hidden lg:flex leading-normal text-xs">Add to home screen</span>
        <button
          @click="installApp"
          class="text-surface-0 underline font-bold hover:text-primary-400 transition-colors text-xs"
        >
          Install
        </button>
      </div>
      <button
        @click="dismissPrompt"
        class="text-surface-0 hover:bg-surface-500/20 rounded-full p-0.5 transition-colors ml-auto"
      >
        <i class="pi pi-times text-xs"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  const showInstallPrompt = ref(false)
  const deferredPrompt = ref<any>(null)

  onMounted(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isAndroidApp = document.referrer.includes('android-app://')
      const isChromeApp = window.matchMedia('(display-mode: minimal-ui)').matches

      return isStandalone || isIOSStandalone || isAndroidApp || isChromeApp
    }

    if (checkIfInstalled()) {
      showInstallPrompt.value = false
      return
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      deferredPrompt.value = e
      showInstallPrompt.value = true
    })

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      showInstallPrompt.value = false
      deferredPrompt.value = null
    })

    // Show prompt after a short delay if no beforeinstallprompt event
    setTimeout(() => {
      if (!checkIfInstalled() && !deferredPrompt.value) {
        showInstallPrompt.value = true
      }
    }, 2000)
  })

  const installApp = async () => {
    if (!deferredPrompt.value) {
      // Fallback for iOS Safari
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        showIOSInstructions()
        return
      }
      return
    }

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    deferredPrompt.value = null
    showInstallPrompt.value = false
  }

  const dismissPrompt = () => {
    showInstallPrompt.value = false
  }

  const showIOSInstructions = () => {
    alert(
      'To install Penguin Pool on your iPhone:\n\n' +
        '1. Tap the Share button at the bottom of Safari\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" to confirm\n\n' +
        'The app will then appear on your home screen!'
    )
  }
</script>
```

### 4. Add Component to App

Include the PWA install prompt in your main App component:

**File**: `src/App.vue`

```vue
<template>
  <AppProvider>
    <AppLayout v-if="isAuthenticated">
      <RouterView />
    </AppLayout>
    <RouterView v-else />
    <PWAInstallPrompt />
  </AppProvider>
</template>

<script setup lang="ts">
  import AppProvider from '@/app/providers/AppProvider.vue'
  import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
  // ... other imports
</script>
```

## Icon Generation

### Prerequisites

- macOS with `sips` command (built-in)
- Source SVG file (e.g., `src/assets/penguin-pool.svg`)

### Automated Icon Generation

Use the provided script to generate all required PWA icons:

**File**: `scripts/generate-pwa-icons.sh`

```bash
#!/bin/bash

# Generate PWA icons from the existing SVG
# This script uses macOS built-in sips tool

echo "Generating PWA icons..."

# Source SVG file
SOURCE_SVG="/Users/leo-private/Projects/chia/penguin-pool/src/assets/penguin-pool.svg"

# Check if source exists
if [ ! -f "$SOURCE_SVG" ]; then
    echo "Source SVG not found: $SOURCE_SVG"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p /Users/leo-private/Projects/chia/penguin-pool/public/icons

# Icon sizes needed for PWA
declare -a sizes=(16 32 72 96 128 144 152 192 384 512)

# Generate PNG icons from SVG
for size in "${sizes[@]}"; do
    echo "Generating icon-${size}x${size}.png..."
    sips -s format png -z $size $size "$SOURCE_SVG" --out "/Users/leo-private/Projects/chia/penguin-pool/public/icons/icon-${size}x${size}.png"
done

echo "PWA icons generated successfully!"
echo "Icons are located in: /Users/leo-private/Projects/chia/penguin-pool/public/icons/"
```

### Running the Script

1. **Make the script executable**:

   ```bash
   chmod +x scripts/generate-pwa-icons.sh
   ```

2. **Run the script**:
   ```bash
   ./scripts/generate-pwa-icons.sh
   ```

### Manual Icon Generation (Alternative)

If you don't have macOS or prefer manual generation:

1. **Use online tools**:
   - [PWA Builder](https://www.pwabuilder.com/imageGenerator)
   - [Favicon Generator](https://realfavicongenerator.net/)
   - [App Icon Generator](https://appicon.co/)

2. **Use design tools**:
   - Figma, Sketch, or Adobe Illustrator
   - Export as PNG in required sizes

3. **Required icon sizes**:
   - 16x16, 32x32, 72x72, 96x96
   - 128x128, 144x144, 152x152
   - 192x192, 384x384, 512x512

## Testing PWA Installation

### Desktop (Chrome/Edge)

1. **Open the app** in Chrome or Edge
2. **Look for install icon** in the address bar
3. **Click install** or use the three-dots menu
4. **Confirm installation**

### Mobile (iOS Safari)

1. **Open the app** in Safari
2. **Tap Share button** at the bottom
3. **Scroll down** and tap "Add to Home Screen"
4. **Tap "Add"** to confirm
5. **App appears** on home screen

### Mobile (Android Chrome)

1. **Open the app** in Chrome
2. **Look for install banner** or menu option
3. **Tap "Install"** or "Add to Home Screen"
4. **Confirm installation**

## Troubleshooting

### Common Issues

#### 1. Icons Not Showing

- **Check file paths** in manifest.json
- **Verify icons exist** in public/icons/ directory
- **Clear browser cache** and reload

#### 2. Install Prompt Not Appearing

- **Check console** for JavaScript errors
- **Verify manifest.json** is valid
- **Test on different browsers**

#### 3. App Not Installing

- **Ensure HTTPS** (required for PWA)
- **Check manifest.json** syntax
- **Verify all required fields** are present

#### 4. TypeScript Errors

- **Add type assertions** for browser-specific APIs:
  ```typescript
  const isIOSStandalone = (window.navigator as any).standalone === true
  ```

### Validation Tools

- **PWA Builder**: [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
- **Lighthouse**: Built into Chrome DevTools
- **Web App Manifest Validator**: [https://manifest-validator.appspot.com/](https://manifest-validator.appspot.com/)

### Debugging Tips

1. **Open DevTools** → Application → Manifest
2. **Check console** for PWA-related errors
3. **Test on different devices** and browsers
4. **Verify HTTPS** is working correctly

## Best Practices

### Performance

- **Optimize images** for faster loading
- **Use appropriate icon sizes** for different contexts
- **Minimize manifest file** size

### User Experience

- **Show install prompt** at appropriate times
- **Provide clear instructions** for installation
- **Handle installation gracefully** across platforms

### Security

- **Serve over HTTPS** (required for PWA)
- **Validate manifest.json** before deployment
- **Test on multiple platforms** before release

## Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)
