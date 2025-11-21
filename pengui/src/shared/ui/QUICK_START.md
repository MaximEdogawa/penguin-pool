# Quick Start Guide

## Finding Components

### Method 1: Search in IDE

1. Open any file in your IDE
2. Type `import { ` and start typing a component name
3. Your IDE will autocomplete available components from `@/shared/ui`

### Method 2: Browse the Catalog

- Open `COMPONENT_CATALOG.md` and use `Ctrl+F` / `Cmd+F` to search
- Components are organized by category

### Method 3: Check the Index

- Open `index.ts` to see all exported components with documentation
- Each component has JSDoc comments explaining usage

## Common Components

### Button

```tsx
import { Button } from '@/shared/ui'

;<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

### Modal

```tsx
import { Modal } from '@/shared/ui'

;<Modal onClose={handleClose}>
  <div>Content</div>
</Modal>
```

### AssetSelector

```tsx
import { AssetSelector } from '@/shared/ui'

;<AssetSelector assets={assets} onAssetsChange={handleChange} />
```

## All Available Components

Import from `@/shared/ui`:

- `Button` - Interactive button
- `Modal` - Overlay dialog
- `AssetSelector` - Asset selection form
- `AmountInput` - Amount input field
- `AssetIdInput` - Asset ID input
- `AssetTypeSelector` - Asset type selector
- `TokenDropdown` - Token dropdown
- `TokenSearchInput` - Token search
- `RemoveAssetButton` - Remove button
- `CopyableHexString` - Copyable hex display
- `DashboardLayout` - Dashboard layout
- `WalletConnectionGuard` - Route guard
- `PenguinLogo` - App logo
- `GithubIcon` - GitHub icon
- `XIcon` - X icon

## TypeScript Support

All components export their prop types:

```tsx
import { Button, type ButtonProps } from '@/shared/ui'
import { Modal, type ModalProps } from '@/shared/ui'
```

## Need More Details?

- See `README.md` for full documentation
- See `COMPONENT_CATALOG.md` for quick reference
- Check component source files for implementation details
