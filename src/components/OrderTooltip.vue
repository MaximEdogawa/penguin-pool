<template>
  <div
    v-if="visible"
    class="fixed bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg p-3 shadow-xl z-50 min-w-[300px] pointer-events-none"
    :style="tooltipStyle"
  >
    <div class="space-y-2">
      <div class="text-sm font-semibold text-gray-900 dark:text-white">Order Details</div>

      <!-- Order ID -->
      <div>
        <span class="text-xs text-gray-500 dark:text-gray-400">ID:</span>
        <span class="text-xs font-mono text-gray-900 dark:text-white ml-1">
          {{ order.id.slice(0, 16) }}...
        </span>
      </div>

      <!-- Offering Assets -->
      <div>
        <span class="text-xs text-gray-500 dark:text-gray-400">Offering:</span>
        <div class="mt-1 space-y-1">
          <div
            v-for="(asset, idx) in order.offering"
            :key="idx"
            class="flex items-center justify-between text-xs"
          >
            <span class="text-gray-900 dark:text-white">{{ getTickerSymbol(asset.id) }}</span>
            <div class="flex flex-col items-end">
              <span class="font-mono text-gray-700 dark:text-gray-300">{{
                formatAmount(asset.amount || 0)
              }}</span>
              <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                Full: {{ (asset.amount || 0).toFixed(8) }}
              </span>
              <span class="font-mono text-xs text-green-600 dark:text-green-400">
                ${{ calculateAssetUsdValue(asset).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Receiving Assets -->
      <div>
        <span class="text-xs text-gray-500 dark:text-gray-400">Receiving:</span>
        <div class="mt-1 space-y-1">
          <div
            v-for="(asset, idx) in order.receiving"
            :key="idx"
            class="flex items-center justify-between text-xs"
          >
            <span class="text-gray-900 dark:text-white">{{ getTickerSymbol(asset.id) }}</span>
            <div class="flex flex-col items-end">
              <span class="font-mono text-gray-700 dark:text-gray-300">{{
                formatAmount(asset.amount || 0)
              }}</span>
              <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                Full: {{ (asset.amount || 0).toFixed(8) }}
              </span>
              <span class="font-mono text-xs text-green-600 dark:text-green-400">
                ${{ calculateAssetUsdValue(asset).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400">
        Maker: {{ order.maker.slice(0, 8) }}...
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">
        {{ new Date(order.timestamp).toLocaleString() }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTickerMapping } from '@/shared/composables/useTickerMapping'
  import { computed } from 'vue'

  interface Order {
    id: string
    offering: Array<{ id: string; code: string; name: string; amount: number }>
    receiving: Array<{ id: string; code: string; name: string; amount: number }>
    maker: string
    timestamp: string
    offeringUsdValue: number
    receivingUsdValue: number
    offeringXchValue: number
    receivingXchValue: number
    pricePerUnit: number
  }

  interface Props {
    order: Order | null
    visible: boolean
    position: { x: number; y: number }
    direction: 'top' | 'bottom'
  }

  const props = defineProps<Props>()

  const { getTickerSymbol } = useTickerMapping()

  // Mock USD prices
  const usdPrices: Record<string, number> = {
    TXCH: 30,
    BTC: 45000,
    ETH: 3000,
    USDT: 1,
    USDC: 1,
    SOL: 120,
    MATIC: 0.85,
    AVAX: 35,
    LINK: 15,
  }

  const formatAmount = (amount: number): string => {
    if (amount === 0) return '0'
    if (amount < 0.000001) return amount.toExponential(2)
    if (amount < 0.01) return amount.toFixed(6)
    if (amount < 1) return amount.toFixed(4)
    if (amount < 100) return amount.toFixed(2)
    if (amount < 10000) return amount.toFixed(1)
    return amount.toFixed(0)
  }

  const calculateAssetUsdValue = (asset: {
    id: string
    code: string
    name: string
    amount: number
  }) => {
    if (asset.code === 'USDC') {
      return asset.amount
    } else {
      return asset.amount * (usdPrices[asset.code] || 1)
    }
  }

  const tooltipStyle = computed(() => {
    if (!props.visible || !props.order) return {}

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = props.position.x + 10
    let top: number

    // Position tooltip based on direction
    if (props.direction === 'top') {
      // Tooltip appears above - estimate height as 200px
      top = props.position.y - 200 - 10
    } else {
      // Tooltip appears below
      top = props.position.y + 10
    }

    // Adjust if tooltip would go off screen horizontally
    if (left + 300 > viewportWidth) {
      left = props.position.x - 300 - 10
    }

    // Adjust if tooltip would go off screen vertically
    if (props.direction === 'top' && top < 10) {
      // If top tooltip would go off top, show it below instead
      top = props.position.y + 10
    } else if (props.direction === 'bottom' && top + 200 > viewportHeight) {
      // If bottom tooltip would go off bottom, show it above instead
      top = props.position.y - 200 - 10
    }

    // Ensure tooltip doesn't go off the left edge
    if (left < 10) {
      left = 10
    }

    // Ensure tooltip doesn't go off the top edge
    if (top < 10) {
      top = 10
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    }
  })
</script>
