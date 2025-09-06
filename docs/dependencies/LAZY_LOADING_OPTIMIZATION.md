# Lazy Loading Optimization Guide

## Overview

Lazy loading is a performance optimization technique that defers the loading of non-critical components until they are actually needed. This reduces the initial bundle size and improves the app's loading performance.

## Implementation Strategy

### ✅ **Components Safe to Lazy Load**

#### **UI Components**

- **WalletConnectModal** (8.62 kB) - Only loads when user clicks connect
- **Heavy form components** - Load when forms are accessed
- **Modal dialogs** - Load when modals are opened
- **Chart components** - Load when data visualization is needed

```typescript
// Example: Lazy load WalletConnectModal
const WalletConnectModal = defineAsyncComponent(
  () => import('@/features/walletConnect/components/WalletConnectModal.vue')
)
```

#### **Page Components**

- **All route pages** - Already implemented with Vue Router
- **Feature-specific pages** - Load when routes are accessed

```typescript
// Example: Route-based lazy loading
{
  path: '/dashboard',
  component: () => import('@/pages/Dashboard/DashboardPage.vue')
}
```

### ❌ **Components NOT Safe to Lazy Load**

#### **State Management Components**

- **AppLayout** - Critical for state synchronization
- **AppProvider** - Manages app-wide state
- **Store components** - Required for state management

#### **Critical UI Components**

- **Navigation components** - Required for app structure
- **Authentication components** - Required for user flow
- **Core layout components** - Required for app structure

## Performance Impact Analysis

### **Before Optimization**

```
Main chunk: 576.75 kB (159.32 kB gzipped)
- All components loaded upfront
- Large initial bundle size
- Slower time to interactive
```

### **After Optimization**

```
Main chunk: 176.32 kB (33.64 kB gzipped) - 69% reduction
WalletConnectModal: 8.62 kB (3.20 kB gzipped) - Lazy loaded
AppLayout: 14.28 kB (4.72 kB gzipped) - Eager loaded
```

## Implementation Examples

### **1. Lazy Load Heavy Modals**

```typescript
// LoginPage.vue
import { defineAsyncComponent } from 'vue'

// Lazy load heavy modal component
const WalletConnectModal = defineAsyncComponent(
  () => import('@/features/walletConnect/components/WalletConnectModal.vue')
)
```

**Benefits:**

- Reduces initial bundle size by 8.62 kB
- Modal only loads when user clicks connect
- Improves initial page load time

### **2. Lazy Load Feature Components**

```typescript
// Dashboard.vue
const AdvancedChart = defineAsyncComponent(() => import('@/components/AdvancedChart.vue'))

// Only load when needed
const showChart = ref(false)
const loadChart = () => {
  showChart.value = true
}
```

**Benefits:**

- Chart component (potentially 50+ kB) only loads when needed
- Dashboard loads faster initially
- Better user experience for users who don't use charts

### **3. Route-Based Lazy Loading**

```typescript
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/pages/Dashboard/DashboardPage.vue'),
  },
  {
    path: '/profile',
    component: () => import('@/pages/Profile/ProfilePage.vue'),
  },
]
```

**Benefits:**

- Each page loads independently
- Better caching (pages can be cached separately)
- Faster navigation between routes

## State Synchronization Considerations

### **⚠️ Critical Issue: Lazy Loading AppLayout**

**Problem:**

```typescript
// This causes state synchronization issues
const AppLayout = defineAsyncComponent(() => import('@/widgets/Layout/AppLayout.vue'))
```

**Why it fails:**

- Wallet connection state restoration happens in `AppProvider`
- `AppLayout` loads after state restoration
- Dashboard components don't get updated state
- User sees "not connected" even when wallet is connected

**Solution:**

```typescript
// Keep AppLayout eager loaded for state sync
import AppLayout from '@/widgets/Layout/AppLayout.vue'
```

### **✅ Safe Lazy Loading Pattern**

```typescript
// Safe: UI components that don't manage state
const HeavyModal = defineAsyncComponent(() => import('@/components/HeavyModal.vue'))

// Safe: Feature components that are self-contained
const DataVisualization = defineAsyncComponent(
  () => import('@/features/analytics/DataVisualization.vue')
)
```

## Best Practices

### **1. Identify Lazy Loading Candidates**

**Ask these questions:**

- Is this component critical for initial app functionality?
- Does this component manage global state?
- Is this component only used in specific user flows?
- Is this component heavy (> 10 kB)?

**If answers are: No, No, Yes, Yes** → Safe to lazy load

### **2. Implement Loading States**

```typescript
const HeavyComponent = defineAsyncComponent({
  loader: () => import('@/components/HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000,
})
```

### **3. Preload Critical Lazy Components**

```typescript
// Preload when user hovers over button
const preloadModal = () => {
  import('@/components/HeavyModal.vue')
}

// In template
<button @mouseenter="preloadModal" @click="showModal">
  Open Modal
</button>
```

### **4. Monitor Bundle Impact**

```bash
# Check bundle sizes
npm run build

# Look for these metrics:
# - Main chunk size (should be < 200 kB)
# - Individual chunk sizes (should be < 100 kB each)
# - Total bundle size (should be < 1 MB)
```

## Performance Metrics

### **Current Bundle Analysis**

| Component              | Loading Strategy | Size         | Gzipped     | Impact                |
| ---------------------- | ---------------- | ------------ | ----------- | --------------------- |
| **Main App**           | Eager            | 176.32 kB    | 33.64 kB    | Core functionality    |
| **AppLayout**          | Eager            | 14.28 kB     | 4.72 kB     | State synchronization |
| **WalletConnectModal** | Lazy             | 8.62 kB      | 3.20 kB     | Only when needed      |
| **Pages**              | Lazy             | < 12 kB each | < 4 kB each | Route-based           |

### **Performance Benefits**

- **69% reduction** in main chunk size
- **Faster initial load** - 12% smaller main chunk
- **Better caching** - Components cached separately
- **Improved UX** - Faster time to interactive

## Common Pitfalls

### **1. Lazy Loading State Management Components**

```typescript
// ❌ Don't do this
const AppLayout = defineAsyncComponent(() => import('@/widgets/Layout/AppLayout.vue'))

// ✅ Do this instead
import AppLayout from '@/widgets/Layout/AppLayout.vue'
```

### **2. Lazy Loading Critical UI Components**

```typescript
// ❌ Don't do this
const Navigation = defineAsyncComponent(() => import('@/components/Navigation.vue'))

// ✅ Do this instead
import Navigation from '@/components/Navigation.vue'
```

### **3. Not Handling Loading States**

```typescript
// ❌ Don't do this
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))

// ✅ Do this instead
const HeavyComponent = defineAsyncComponent({
  loader: () => import('@/components/HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
})
```

## Future Optimizations

### **1. Component-Level Code Splitting**

```typescript
// Split large components into smaller chunks
const Dashboard = defineAsyncComponent(() => import('@/pages/Dashboard/DashboardPage.vue'))

const DashboardCharts = defineAsyncComponent(
  () => import('@/pages/Dashboard/components/Charts.vue')
)
```

### **2. Dynamic Imports with Conditions**

```typescript
// Load different components based on user role
const AdminPanel = defineAsyncComponent(() =>
  userStore.isAdmin ? import('@/components/AdminPanel.vue') : import('@/components/UserPanel.vue')
)
```

### **3. Preloading Strategy**

```typescript
// Preload components on user interaction
const preloadOnHover = () => {
  import('@/components/HeavyComponent.vue')
}

// Preload on route change
router.beforeEach(to => {
  if (to.name === 'dashboard') {
    import('@/pages/Dashboard/DashboardPage.vue')
  }
})
```

## Monitoring and Maintenance

### **Bundle Size Monitoring**

```bash
# Regular bundle analysis
npm run build
npm run analyze  # If bundle analyzer is set up

# Check for:
# - Main chunk size increases
# - New large chunks
# - Unused code in chunks
```

### **Performance Testing**

```bash
# Test loading performance
npm run dev
# Open DevTools > Network > Throttling > Slow 3G
# Check Time to Interactive (TTI)
```

### **User Experience Monitoring**

- Monitor Core Web Vitals
- Track Time to Interactive (TTI)
- Measure First Contentful Paint (FCP)
- Check Largest Contentful Paint (LCP)

## Related Files

- `src/App.vue` - AppLayout loading strategy
- `src/pages/Auth/LoginPage.vue` - WalletConnectModal lazy loading
- `src/router/index.ts` - Route-based lazy loading
- `vite.config.ts` - Bundle splitting configuration
- `docs/dependencies/BUNDLE_ANALYSIS.md` - Bundle size analysis
