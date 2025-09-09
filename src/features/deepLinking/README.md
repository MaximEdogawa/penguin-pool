# Deep Linking Feature

This feature provides a flexible deep linking system for opening external apps and websites from the Penguin Pool application.

## Features

- **Multi-platform support**: iOS, Android, and Web
- **Multiple app support**: Pre-configured with popular Chia-related apps
- **Fallback handling**: Graceful fallback to universal links or websites
- **Copy to clipboard**: Easy sharing of deep links
- **TypeScript support**: Fully typed for better development experience

## Pre-configured Apps

- **Spacescan.io**: Chia blockchain explorer
- **Chia Explorer**: Official Chia blockchain explorer
- **Chia Network**: Official Chia Network website

## Usage

### Basic Usage with Composable

```vue
<template>
  <div>
    <button @click="openSpacescan">Open Spacescan</button>
    <button @click="copyLink">Copy Link</button>
  </div>
</template>

<script setup>
  import { useDeepLinking } from '@/features/deepLinking'

  const { openApp, copyDeepLink, supportedApps } = useDeepLinking()

  const openSpacescan = async () => {
    const result = await openApp('spacescan', '/address/your-address')
    if (result.success) {
      console.log('App opened successfully!')
    }
  }

  const copyLink = async () => {
    const success = await copyDeepLink('spacescan', '/address/your-address')
    if (success) {
      console.log('Link copied to clipboard!')
    }
  }
</script>
```

### Using the DeepLinkButton Component

```vue
<template>
  <DeepLinkButton
    app-id="spacescan"
    path="/address/your-address"
    button-text="Open Spacescan"
    variant="primary"
    size="medium"
    @success="onSuccess"
    @error="onError"
  />
</template>

<script setup>
  import { DeepLinkButton } from '@/features/deepLinking'

  const onSuccess = result => {
    console.log('App opened:', result)
  }

  const onError = error => {
    console.error('Failed to open app:', error)
  }
</script>
```

### Advanced Usage with Parameters

```vue
<template>
  <DeepLinkButton
    app-id="spacescan"
    path="/search"
    :params="{ q: 'your-search-term', type: 'address' }"
    button-text="Search on Spacescan"
  />
</template>
```

## API Reference

### DeepLinkingService

The main service class that handles deep linking operations.

#### Methods

- `getApps()`: Get all available apps
- `getSupportedApps()`: Get apps supported on current platform
- `getApp(appId)`: Get specific app by ID
- `generateDeepLink(appId, path?, params?)`: Generate deep link URL
- `openApp(appId, path?, params?)`: Try to open app with deep link
- `openInNewTab(appId, path?, params?)`: Open app in new tab (web only)
- `copyDeepLink(appId, path?, params?)`: Copy deep link to clipboard

### useDeepLinking Composable

Vue composable for reactive deep linking functionality.

#### Returns

- `isLoading`: Loading state
- `error`: Error message
- `lastResult`: Last operation result
- `apps`: All available apps
- `supportedApps`: Apps supported on current platform
- `platform`: Current platform ('ios' | 'android' | 'web')
- `openApp()`: Open app function
- `openInNewTab()`: Open in new tab function
- `copyDeepLink()`: Copy deep link function
- `generateDeepLink()`: Generate deep link function
- `getApp()`: Get app function
- `clearError()`: Clear error state
- `clearResult()`: Clear last result

### DeepLinkButton Component

Pre-built button component for deep linking.

#### Props

- `appId` (required): ID of the app to open
- `path?`: Path to append to the deep link
- `params?`: Query parameters
- `buttonText?`: Text to display on button
- `variant?`: Button style variant ('primary' | 'secondary' | 'outline')
- `size?`: Button size ('small' | 'medium' | 'large')
- `disabled?`: Whether button is disabled
- `showCopyButton?`: Whether to show copy button
- `copyButtonText?`: Text for copy button tooltip

#### Events

- `@success`: Emitted when app opens successfully
- `@error`: Emitted when app fails to open
- `@copy`: Emitted when link is copied

## Adding New Apps

To add a new app, modify the `DeepLinkingService` constructor:

```typescript
{
  id: 'your-app-id',
  name: 'Your App Name',
  description: 'App description',
  icon: 'pi pi-your-icon',
  scheme: 'yourapp://',
  universalLink: 'https://yourapp.com',
  website: 'https://yourapp.com',
  supportedPlatforms: ['ios', 'android', 'web']
}
```

## Platform Behavior

- **iOS**: Tries deep link scheme first, falls back to universal link
- **Android**: Tries deep link scheme first, falls back to universal link
- **Web**: Opens in new tab/window

## Error Handling

The service provides comprehensive error handling:

- App not found
- Platform not supported
- Deep link generation failure
- App opening failure
- Clipboard access failure

All errors are returned in the `DeepLinkResult` object with descriptive error messages.
