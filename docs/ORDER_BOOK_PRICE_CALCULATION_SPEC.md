# Order Book Price Calculation - Technical Specification

## API Reference

### `calculateOrderPrice(order: Order, orderType: 'buy' | 'sell'): string`

Calculates and formats the price for an order based on its type and asset composition.

#### Parameters

- `order: Order` - The order object containing asset information
- `orderType: 'buy' | 'sell'` - Explicit order type for calculation logic

#### Returns

- `string` - Formatted price string (e.g., "0.033 TXCH/TBYC" or "$1,250")

#### Order Interface

```typescript
interface Order {
  id: string
  offering: Array<{
    id: string
    code: string
    name: string
    amount: number
  }>
  receiving: Array<{
    id: string
    code: string
    name: string
    amount: number
  }>
  maker: string
  timestamp: string
  offeringUsdValue: number
  receivingUsdValue: number
  offeringXchValue: number
  receivingXchValue: number
  pricePerUnit: number
}
```

### `isSingleAssetPair(order: Order): boolean`

Determines if an order contains exactly one asset in both offering and receiving arrays.

#### Parameters

- `order: Order` - The order to check

#### Returns

- `boolean` - True if order has single asset pairs, false otherwise

## Calculation Rules

### Rule 1: Single Asset Pairs

When `isSingleAssetPair(order) === true`:

#### Sell Orders

```typescript
price = order.offering[0].amount / order.requesting[0].amount
```

#### Buy Orders

```typescript
price = order.requesting[0].amount / order.offering[0].amount
```

### Rule 2: Multiple Asset Pairs

When `isSingleAssetPair(order) === false`:

```typescript
return `$${order.offeringUsdValue.toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})}`
```

### Rule 3: Asset Pair Formatting

#### With Active Filters

```typescript
const buyAssetSymbol = filters.buyAsset[0].toUpperCase()
const sellAssetSymbol = filters.sellAsset[0].toUpperCase()
return `${formatAmount(price)} ${buyAssetSymbol}/${sellAssetSymbol}`
```

#### Without Filters (Alphabetical)

```typescript
const assets = [receivingSymbol, offeringSymbol].sort()
return `${formatAmount(price)} ${assets[0]}/${assets[1]}`
```

## Implementation Examples

### Vue.js Component Usage

```vue
<template>
  <div class="price-column">
    {{ calculateOrderPrice(order, orderType) }}
  </div>
</template>

<script setup lang="ts">
  // In sell orders section
  const sellOrders = computed(() =>
    filteredSellOrders.value.map(order => ({
      ...order,
      price: calculateOrderPrice(order, 'sell'),
    }))
  )

  // In buy orders section
  const buyOrders = computed(() =>
    filteredBuyOrders.value.map(order => ({
      ...order,
      price: calculateOrderPrice(order, 'buy'),
    }))
  )
</script>
```

### React Hook Usage

```typescript
const useOrderPrice = (order: Order, orderType: 'buy' | 'sell') => {
  return useMemo(() => {
    return calculateOrderPrice(order, orderType)
  }, [order, orderType])
}
```

## Error Handling

### Division by Zero

```typescript
if (receivingAsset && offeringAsset && receivingAsset.amount > 0) {
  // Safe to calculate price
  const price = offeringAsset.amount / receivingAsset.amount
}
```

### Missing Assets

```typescript
if (receivingAsset && offeringAsset) {
  // Both assets exist
}
```

### Invalid Order Type

```typescript
if (orderType === 'sell') {
  // Sell order logic
} else if (orderType === 'buy') {
  // Buy order logic
} else {
  // Fallback to sell order logic
}
```

## Performance Considerations

### Memoization

```typescript
const memoizedPrice = useMemo(
  () => calculateOrderPrice(order, orderType),
  [order.id, order.offering, order.requesting, orderType]
)
```

### Batch Processing

```typescript
const calculateBatchPrices = (orders: Order[], orderType: 'buy' | 'sell') => {
  return orders.map(order => ({
    ...order,
    calculatedPrice: calculateOrderPrice(order, orderType),
  }))
}
```

## Testing

### Unit Test Examples

```typescript
describe('calculateOrderPrice', () => {
  it('should calculate sell order price correctly', () => {
    const order: Order = {
      offering: [{ id: 'tbyc', amount: 100 }],
      receiving: [{ id: 'txch', amount: 3000 }],
    }

    const result = calculateOrderPrice(order, 'sell')
    expect(result).toBe('0.033 TXCH/TBYC')
  })

  it('should calculate buy order price correctly', () => {
    const order: Order = {
      offering: [{ id: 'txch', amount: 0.1 }],
      receiving: [{ id: 'tbyc', amount: 1 }],
    }

    const result = calculateOrderPrice(order, 'buy')
    expect(result).toBe('10 TXCH/TBYC')
  })
})
```

## Migration Guide

### From Legacy Price Calculation

```typescript
// Old way (inconsistent)
const price = order.requestingUsdValue / order.offeringUsdValue

// New way (explicit and consistent)
const price = calculateOrderPrice(order, 'sell')
```

### Updating Existing Components

1. Replace direct price calculations with `calculateOrderPrice()`
2. Add explicit `orderType` parameter
3. Update template bindings to use the new function
4. Test thoroughly with both buy and sell orders

---

_Technical Specification v1.0_
_Compatible with Penguin Pool v0.0.0+_
