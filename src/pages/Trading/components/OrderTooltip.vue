<template>
  <div class="text-xs space-y-2">
    <div class="flex justify-between border-b border-gray-300 dark:border-gray-600 pb-1">
      <span class="text-gray-500 dark:text-gray-400">Maker:</span>
      <span class="text-gray-700 dark:text-gray-300 font-mono">{{ order.maker }}</span>
    </div>

    <div>
      <div class="text-blue-600 dark:text-blue-400 mb-1 font-semibold">
        Asset Prices (per 1 unit in USDC):
      </div>
      <!-- Show unique assets from both offering and receiving -->
      <div v-for="(asset, idx) in uniqueAssets" :key="idx" class="flex justify-between ml-2 mb-0.5">
        <span class="text-gray-600 dark:text-gray-300">1 {{ asset }} =</span>
        <span class="text-blue-600 dark:text-blue-400 font-mono">
          ${{
            calculateAssetPrice(asset).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
        </span>
      </div>
    </div>

    <div class="border-t border-gray-300 dark:border-gray-600 pt-1">
      <div class="text-red-600 dark:text-red-400 mb-1 font-semibold">Selling:</div>
      <div
        v-for="(item, idx) in order.offering"
        :key="idx"
        class="flex justify-between ml-2 mb-0.5"
      >
        <span class="text-gray-600 dark:text-gray-300">{{ item.asset }} {{ item.amount }}</span>
        <span class="text-red-600 dark:text-red-400 font-mono">
          ${{
            (parseFloat(item.amount) * (usdPrices[item.asset] || 0)).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
        </span>
      </div>
      <div
        class="flex justify-between ml-2 mt-1 pt-1 border-t border-gray-300 dark:border-gray-600"
      >
        <span class="text-gray-500 dark:text-gray-400 font-semibold">Total Selling:</span>
        <span class="text-red-600 dark:text-red-400 font-mono font-semibold">
          ${{
            order.offeringUsdValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
        </span>
      </div>
    </div>

    <div class="border-t border-gray-300 dark:border-gray-600 pt-1">
      <div class="text-green-600 dark:text-green-400 mb-1 font-semibold">Buying:</div>
      <div
        v-for="(item, idx) in order.requesting"
        :key="idx"
        class="flex justify-between ml-2 mb-0.5"
      >
        <span class="text-gray-600 dark:text-gray-300">{{ item.asset }} {{ item.amount }}</span>
        <span class="text-green-600 dark:text-green-400 font-mono">
          ${{
            (parseFloat(item.amount) * (usdPrices[item.asset] || 0)).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
        </span>
      </div>
      <div
        class="flex justify-between ml-2 mt-1 pt-1 border-t border-gray-300 dark:border-gray-600"
      >
        <span class="text-gray-500 dark:text-gray-400 font-semibold">Total Buying:</span>
        <span class="text-green-600 dark:text-green-400 font-mono font-semibold">
          ${{
            order.requestingUsdValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Order {
    id: number
    offering: Array<{ asset: string; amount: string }>
    receiving: Array<{ asset: string; amount: string }>
    maker: string
    timestamp: string
    offeringUsdValue: number
    receivingUsdValue: number
    pricePerUnit: number
    assetPriceInUsdc: number
  }

  interface Props {
    order: Order
    usdPrices: Record<string, number>
  }

  const props = defineProps<Props>()

  const uniqueAssets = computed(() => {
    const allAssets = [...props.order.offering, ...props.order.requesting].map(a => a.asset)
    return [...new Set(allAssets)]
  })

  const calculateAssetPrice = (asset: string) => {
    if (asset === 'USDC') {
      return 1
    } else {
      // Calculate from the order
      const assetItem =
        props.order.offering.find(a => a.asset === asset) ||
        props.order.requesting.find(a => a.asset === asset)
      const usdcItem =
        props.order.offering.find(a => a.asset === 'USDC') ||
        props.order.requesting.find(a => a.asset === 'USDC')

      if (assetItem && usdcItem) {
        // If asset is being sold for USDC
        if (props.order.offering.find(a => a.asset === asset)) {
          return parseFloat(usdcItem.amount) / parseFloat(assetItem.amount)
        } else {
          // If asset is being bought with USDC
          return parseFloat(usdcItem.amount) / parseFloat(assetItem.amount)
        }
      } else {
        return props.usdPrices[asset] || 1
      }
    }
  }
</script>
