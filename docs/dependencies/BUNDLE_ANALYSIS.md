# Bundle Analysis

## Current Bundle Size (Production Build)

Based on the latest build output:

```
dist/index.html                                                           0.91 kB │ gzip:   0.45 kB
dist/assets/primeicons-C6QP2o4f.woff2                                    35.15 kB
dist/assets/penguin-pool-ByytN1bB.svg                                    50.73 kB
dist/assets/primeicons-MpK4pl85.ttf                                      84.06 kB
dist/assets/primeicons-DjwUDZjB.woff                                     85.06 kB
dist/assets/primeicons-DMOk5skT.eot                                      85.16 kB
dist/assets/primeicons-Dr5RGzOO.svg                                     342.53 kB
dist/assets/DashboardPage-BzLBUkK-.css                                    0.70 kB │ gzip:   0.30 kB
dist/assets/ProfilePage-owX9yUiO.css                                      6.45 kB │ gzip:   1.30 kB
dist/assets/LoginPage-ubuH8dF_.css                                       27.31 kB │ gzip:   3.77 kB
dist/assets/index-BTTDIccS.css                                          137.24 kB │ gzip:  19.46 kB
dist/assets/LoansPage-Bqgntf1v.js                                         0.46 kB │ gzip:   0.32 kB
dist/assets/OffersPage-C2sbn_TW.js                                        0.46 kB │ gzip:   0.32 kB
dist/assets/PiggyBankPage-CZ8-iHKl.js                                     0.46 kB │ gzip:   0.33 kB
dist/assets/OptionContractsPage-DkG6zaT0.js                               0.49 kB │ gzip:   0.33 kB
dist/assets/PageFooter.vue_vue_type_script_setup_true_lang-tXX50_k6.js    0.51 kB │ gzip:   0.32 kB
dist/assets/ProfilePage-Ut_CLSov.js                                       3.56 kB │ gzip:   1.43 kB
dist/assets/DashboardPage-CtmwjqZt.js                                    11.01 kB │ gzip:   3.08 kB
dist/assets/utils-vendor-VXhyTF-D.js                                     26.02 kB │ gzip:   7.74 kB
dist/assets/secp256k1-DavbRBKT.js                                        31.50 kB │ gzip: 12.58 kB
dist/assets/LoginPage-Yek2c8Rw.js                                        40.75 kB │ gzip:  15.18 kB
dist/assets/ServiceHealthPage-DNKr_S0_.js                                67.62 kB │ gzip:  19.75 kB
dist/assets/vue-vendor-D-HwTFgE.js                                      101.66 kB │ gzip:  40.03 kB
dist/assets/ui-vendor-BUR7LuR9.js                                       181.44 kB │ gzip:  41.41 kB
dist/assets/index-DQBFe7Eq.js                                           576.75 kB │ gzip: 159.32 kB
```

## Chunk Analysis

### Main Application Chunk

- **File**: `index-DQBFe7Eq.js`
- **Size**: 576.75 kB (159.32 kB gzipped)
- **Contains**: Main application code, WalletConnect, Chia functionality
- **Status**: ⚠️ Large chunk size warning

### Vendor Chunks

#### Vue Ecosystem

- **File**: `vue-vendor-D-HwTFgE.js`
- **Size**: 101.66 kB (40.03 kB gzipped)
- **Contains**: Vue, Vue Router, Pinia
- **Status**: ✅ Reasonable size

#### UI Components

- **File**: `ui-vendor-BUR7LuR9.js`
- **Size**: 181.44 kB (41.41 kB gzipped)
- **Contains**: PrimeVue components
- **Status**: ✅ Reasonable size

#### Utilities

- **File**: `utils-vendor-VXhyTF-D.js`
- **Size**: 26.02 kB (7.74 kB gzipped)
- **Contains**: TanStack Query, other utilities
- **Status**: ✅ Good size

#### Cryptography

- **File**: `secp256k1-DavbRBKT.js`
- **Size**: 31.50 kB (12.58 kB gzipped)
- **Contains**: Cryptographic functions
- **Status**: ✅ Necessary for wallet operations

### Page-Specific Chunks

- **Dashboard**: 11.01 kB (3.08 kB gzipped)
- **Login**: 40.75 kB (15.18 kB gzipped)
- **Service Health**: 67.62 kB (19.75 kB gzipped)
- **Other pages**: < 4 kB each

## Dependency Impact Analysis

### WalletConnect Dependencies

- **@walletconnect/sign-client**: ~45 kB
- **@walletconnect/modal**: ~25 kB
- **@walletconnect/types**: ~5 kB
- **Total WalletConnect**: ~75 kB

### Unused Ethereum Dependencies

- **@walletconnect/utils**: ~15 kB (unused)
- **viem**: ~120 kB (unused)
- **ox**: ~50 kB (unused)
- **Total unused**: ~185 kB

### Chia-Specific Dependencies

- **@kurrent/kurrentdb-client**: ~30 kB
- **Socket.io-client**: ~20 kB
- **QR code generation**: ~15 kB
- **Total Chia**: ~65 kB

## Optimization Opportunities

### 1. Code Splitting

**Current**: Large main chunk (576 kB)
**Opportunity**: Split by feature/route
**Potential savings**: 100-200 kB

```typescript
// Example: Lazy load heavy features
const WalletConnect = defineAsyncComponent(() => import('./WalletConnect.vue'))
```

### 2. Tree Shaking

**Current**: Some unused code removed
**Opportunity**: More aggressive tree shaking
**Potential savings**: 50-100 kB

### 3. Dynamic Imports

**Current**: All code loaded upfront
**Opportunity**: Load features on demand
**Potential savings**: 150-250 kB initial load

### 4. Vendor Chunk Optimization

**Current**: Manual chunk splitting
**Opportunity**: More granular splitting
**Potential savings**: Better caching

## Bundle Size Targets

### Current State

- **Total JS**: ~900 kB
- **Gzipped**: ~250 kB
- **Main chunk**: 576 kB (too large)

### Target State

- **Total JS**: < 600 kB
- **Gzipped**: < 200 kB
- **Main chunk**: < 300 kB
- **Largest chunk**: < 200 kB

## Monitoring Commands

### Build Analysis

```bash
npm run build
# Check output for chunk sizes
```

### Bundle Analyzer (if added)

```bash
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.ts for visual analysis
```

### Dependency Analysis

```bash
npm ls --depth=0
# Check direct dependencies
npm ls --depth=1
# Check first-level dependencies
```

## Performance Impact

### Loading Performance

- **Initial load**: 250 kB gzipped
- **Time to interactive**: ~2-3 seconds (estimated)
- **Largest contentful paint**: Affected by main chunk size

### Runtime Performance

- **Memory usage**: ~50-100 MB (estimated)
- **Parse time**: ~100-200 ms (estimated)
- **Unused code**: Still loaded but not executed

## Recommendations

### Immediate Actions

1. **Implement code splitting** for large features
2. **Add bundle analyzer** for visual inspection
3. **Monitor bundle size** in CI/CD

### Medium-term Actions

1. **Optimize vendor chunks** for better caching
2. **Implement dynamic imports** for heavy features
3. **Review dependencies** for unused packages

### Long-term Actions

1. **Consider custom WalletConnect** if bundle size becomes critical
2. **Monitor WalletConnect v3** for better modularity
3. **Evaluate Chia-native alternatives** as they become available

## Related Files

- `vite.config.ts` - Build configuration
- `package.json` - Dependencies
- `docs/dependencies/` - Dependency documentation
- `src/features/walletConnect/` - WalletConnect implementation
