/**
 * Price calculation utilities for order book
 */

import type { OrderBookOrder } from './orderBookTypes'

// Mock USD prices for assets
const USD_PRICES: Record<string, number> = {
  TXCH: 30,
  XCH: 30,
  BTC: 122013,
  ETH: 3500,
  USDT: 1,
  USDC: 1,
  SOL: 120,
  MATIC: 0.85,
  AVAX: 35,
  LINK: 15,
}

export const formatAmount = (amount: number): string => {
  if (amount === 0) return '0'
  if (amount < 0.000001) return amount.toExponential(2)
  if (amount < 0.01) return amount.toFixed(6)
  if (amount < 1) return amount.toFixed(4)
  if (amount < 100) return amount.toFixed(2)
  if (amount < 10000) return amount.toFixed(1)
  return amount.toFixed(0)
}

export const calculateAssetUsdValue = (asset: { code: string; amount: number }): number => {
  if (asset.code === 'USDC' || asset.code === 'USDT') {
    return asset.amount
  } else {
    return asset.amount * (USD_PRICES[asset.code] || 1)
  }
}

export const isSingleAssetPair = (order: OrderBookOrder): boolean => {
  return order.offering.length === 1 && order.receiving.length === 1
}

/**
 * Calculate order price for display
 */
export const calculateOrderPrice = (
  order: OrderBookOrder,
  orderType: 'buy' | 'sell',
  filters?: {
    buyAsset: string[]
    sellAsset: string[]
  },
  getTickerSymbol?: (assetId: string, code?: string) => string
): string => {
  if (isSingleAssetPair(order)) {
    const receivingAsset = order.receiving[0]
    const offeringAsset = order.offering[0]

    if (receivingAsset && offeringAsset && receivingAsset.amount > 0 && offeringAsset.amount > 0) {
      let price

      if (
        filters?.buyAsset &&
        filters.buyAsset.length > 0 &&
        filters?.sellAsset &&
        filters.sellAsset.length > 0 &&
        getTickerSymbol
      ) {
        // Calculate price based on what you're buying (buyAsset) vs what you're selling (sellAsset)
        // Price should always be: sellAsset/buyAsset (how much sell asset per buy asset)

        // Determine which asset is the buy asset and which is the sell asset
        const receivingIsBuyAsset = filters.buyAsset.some(
          (filterAsset) =>
            getTickerSymbol(receivingAsset.id, receivingAsset.code).toLowerCase() ===
              filterAsset.toLowerCase() ||
            receivingAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
            (receivingAsset.code && receivingAsset.code.toLowerCase() === filterAsset.toLowerCase())
        )

        const offeringIsBuyAsset = filters.buyAsset.some(
          (filterAsset) =>
            getTickerSymbol(offeringAsset.id, offeringAsset.code).toLowerCase() ===
              filterAsset.toLowerCase() ||
            offeringAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
            (offeringAsset.code && offeringAsset.code.toLowerCase() === filterAsset.toLowerCase())
        )

        if (receivingIsBuyAsset && !offeringIsBuyAsset) {
          // Receiving buy asset, offering sell asset
          // Price = sell asset amount / buy asset amount
          price = offeringAsset.amount / receivingAsset.amount
        } else if (offeringIsBuyAsset && !receivingIsBuyAsset) {
          // Offering buy asset, receiving sell asset
          // Price = sell asset amount / buy asset amount
          price = receivingAsset.amount / offeringAsset.amount
        } else {
          // Fallback to original logic
          price = offeringAsset.amount / receivingAsset.amount
        }

        // Format price with appropriate precision
        return `${formatAmount(price)}`
      } else {
        // No filters, show price as offered/received
        price = offeringAsset.amount / receivingAsset.amount
        return `${formatAmount(price)}`
      }
    }
  }

  // For multiple asset pairs, show USD total
  return `$${order.offeringUsdValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

/**
 * Calculate average market price from best buy and sell orders
 */
export const calculateAveragePrice = (
  bestSellOrder: OrderBookOrder | undefined,
  bestBuyOrder: OrderBookOrder | undefined
): string => {
  // Get best sell price (lowest ask)
  const bestSellPrice = bestSellOrder
    ? bestSellOrder.receiving[0]?.amount / bestSellOrder.offering[0]?.amount
    : 0

  // Get best buy price (highest bid)
  const bestBuyPrice = bestBuyOrder
    ? bestBuyOrder.offering[0]?.amount / bestBuyOrder.receiving[0]?.amount
    : 0

  // Calculate average if both prices exist
  if (bestSellPrice > 0 && bestBuyPrice > 0) {
    const averagePrice = (bestSellPrice + bestBuyPrice) / 2
    return formatAmount(averagePrice)
  }

  // Fallback to individual prices if only one exists
  if (bestSellPrice > 0) {
    return formatAmount(bestSellPrice)
  }
  if (bestBuyPrice > 0) {
    return formatAmount(bestBuyPrice)
  }

  return 'N/A'
}

/**
 * Apply price adjustment to assets (for maker mode)
 */
export const applyPriceAdjustment = (
  assets: Array<{ amount: number }>,
  adjustment: number
): Array<{ amount: number }> => {
  const multiplier = 1 + adjustment / 100
  return assets.map((asset) => ({
    ...asset,
    amount: asset.amount * multiplier,
  }))
}
