# Order Book Price Calculation Documentation

## Overview

This document defines the standardized price calculation logic used in the Penguin Pool order book. The price calculation ensures consistent and intuitive pricing display across both buy and sell orders.

## Core Principles

### 1. Consistent Asset Pair Format

- When filters are active (buyAsset/sellAsset), all prices display as `buyAsset/sellAsset`
- Example: With filters `buyAsset=["TXCH"]` and `sellAsset=["TBYC"]`, all prices show as `TXCH/TBYC`

### 2. Order Type Specific Calculations

- **Sell Orders (Asks)**: `requested/receiving` - How much you need to give per unit you get
- **Buy Orders (Bids)**: `receiving/requested` - How much you get per unit you give

### 3. Price Meaning

The price always represents the exchange rate from the trader's perspective, making it easy to compare offers across both sides of the order book.

## Calculation Logic

### Single Asset Pairs

For orders with exactly one asset in both offering and receiving arrays:

#### Sell Orders (Asks)

```
Price = offering.amount / receiving.amount
```

**Meaning**: How much of the sell asset you need to give per unit of the buy asset you receive.

**Example**:

- Offering: 100 TBYC
- Receiving: 3000 TXCH
- Price: `100/3000 = 0.033 TXCH/TBYC`
- Interpretation: You need to give 0.033 TBYC per TXCH you receive

#### Buy Orders (Bids)

```
Price = receiving.amount / offering.amount
```

**Meaning**: How much of the buy asset you get per unit of the sell asset you give.

**Example**:

- Receiving: 1 TBYC
- Offering: 0.1 TXCH
- Price: `1/0.1 = 10 TXCH/TBYC`
- Interpretation: You get 10 TBYC per TXCH you give

### Multiple Asset Pairs

For orders with multiple assets on either side:

- Display: USD total value
- Format: `$1,250` (formatted with locale-specific number formatting)

## Implementation Details

### Function Signature

```typescript
calculateOrderPrice(order: Order, orderType: 'buy' | 'sell'): string
```

### Parameters

- `order`: The order object containing offering and receiving assets
- `orderType`: Explicitly specifies whether this is a buy or sell order

### Return Format

- **Single Asset Pairs**: `"0.033 TXCH/TBYC"`
- **Multiple Asset Pairs**: `"$1,250"`

### Asset Pair Detection

```typescript
const isSingleAssetPair = (order: Order): boolean => {
  return order.offering.length === 1 && order.receiving.length === 1
}
```

## Filter Integration

### Active Filters

When `buyAsset` and `sellAsset` filters are active:

1. All prices display in the format `buyAsset/sellAsset`
2. Calculation logic remains order-type specific
3. Ensures consistent comparison across buy and sell sides

### No Filters

When no filters are active:

1. Asset pairs are sorted alphabetically
2. Price calculation uses `requested/receiving` as fallback
3. Format: `"0.033 ASSET1/ASSET2"`

## Examples

### Scenario: TXCH/TBYC Trading Pair

**Filter Configuration**:

- `buyAsset: ["TXCH"]`
- `sellAsset: ["TBYC"]`

**Sell Order Example**:

```
Order: Offering 100 TBYC, Receiving 3000 TXCH
Calculation: 100 / 3000 = 0.033
Display: "0.033 TXCH/TBYC"
Meaning: Need 0.033 TBYC per TXCH received
```

**Buy Order Example**:

```
Order: Receiving 1 TBYC, Offering 0.1 TXCH
Calculation: 1 / 0.1 = 10
Display: "10 TXCH/TBYC"
Meaning: Get 10 TBYC per TXCH given
```

### Multi-Asset Order Example

```
Order: Offering [100 TBYC, 50 USDC], Receiving [2000 TXCH]
Display: "$1,250"
Meaning: Total USD value of the offering
```

## Benefits

### 1. Intuitive Comparison

- Both buy and sell orders show the same asset pair format
- Easy to identify best prices across both sides
- Clear understanding of exchange rates

### 2. Consistent Logic

- Explicit order type parameter eliminates ambiguity
- Predictable calculation methods
- Maintainable codebase

### 3. User-Friendly Display

- Standardized formatting across all orders
- Appropriate fallbacks for complex orders
- Locale-aware number formatting

## Usage Guidelines

### For Developers

1. Always pass the correct `orderType` parameter
2. Use the `isSingleAssetPair()` helper to determine calculation method
3. Follow the established format patterns for consistency

### For UI Components

1. Display prices using the `calculateOrderPrice()` function
2. Ensure proper alignment and formatting in order book tables
3. Handle both single and multi-asset orders appropriately

## Future Considerations

### Potential Enhancements

1. **Price History**: Track price changes over time
2. **Volume Weighting**: Consider order sizes in price calculations
3. **Market Depth**: Show cumulative order book depth
4. **Price Alerts**: Notify users of significant price movements

### Performance Optimization

1. **Caching**: Cache calculated prices for frequently accessed orders
2. **Memoization**: Use computed properties for reactive price updates
3. **Batch Processing**: Calculate prices in batches for large order books

## Related Documentation

- [Order Book Architecture](./ORDER_BOOK_ARCHITECTURE.md)
- [Trading Interface Design](./TRADING_INTERFACE.md)
- [Asset Management](./ASSET_MANAGEMENT.md)

---

_Last Updated: [Current Date]_
_Version: 1.0_
_Maintainer: Penguin Pool Development Team_
