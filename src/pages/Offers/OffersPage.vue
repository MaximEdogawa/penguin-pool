<template>
  <div class="content-page">
    <div class="content-header">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Offers</h1>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
        Create, manage, and take trading offers on the Chia network
      </p>
    </div>

    <div class="content-body">
      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          @click="showCreateOffer = true"
          class="flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <i class="pi pi-plus mr-2"></i>
          Create Offer
        </button>
        <button
          @click="showTakeOffer = true"
          class="flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium rounded-lg transition-colors duration-200"
        >
          <i class="pi pi-shopping-cart mr-2"></i>
          Take Offer
        </button>
        <button
          @click="refreshOffers"
          :disabled="isLoading"
          class="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors duration-200"
        >
          <i class="pi pi-refresh mr-2" :class="{ 'pi-spin': isLoading }"></i>
          Refresh
        </button>
      </div>

      <!-- Offers List -->
      <div class="card p-4 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">My Offers</h2>
          <div class="flex items-center space-x-2">
            <select
              v-model="filters.status"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <!-- Offers Table -->
        <div v-if="offers.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Offer ID
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Status
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Assets
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Created
                </th>
                <th
                  class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="offer in filteredOffers"
                :key="offer.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <button
                    @click="copyOfferId(offer.tradeId)"
                    class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer group relative overflow-hidden"
                    :title="isCopied === offer.tradeId ? 'Copied!' : 'Click to copy offer ID'"
                    :class="{
                      'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300':
                        isCopied === offer.tradeId,
                      'hover:scale-105': isCopied !== offer.tradeId,
                    }"
                  >
                    <span
                      class="transition-all duration-300"
                      :class="{
                        'animate-pulse': isCopied === offer.tradeId,
                      }"
                    >
                      {{ offer.tradeId?.slice(0, 8) || 'Unknown' }}...
                    </span>
                    <!-- Animated background effect -->
                    <div
                      v-if="isCopied === offer.tradeId"
                      class="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded"
                    ></div>
                  </button>
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="getStatusClass(offer.status)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ offer.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <div class="space-y-1">
                    <div
                      v-for="asset in (offer.assetsOffered || []).slice(0, 2)"
                      :key="asset.assetId"
                      class="text-xs"
                    >
                      {{ asset.amount }} {{ asset.symbol || asset.type.toUpperCase() }}
                    </div>
                    <div
                      v-if="(offer.assetsOffered || []).length > 2"
                      class="text-xs text-gray-500"
                    >
                      +{{ (offer.assetsOffered || []).length - 2 }} more
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(offer.createdAt) }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewOffer(offer)"
                      class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                    >
                      View
                    </button>
                    <button
                      v-if="offer.status === 'active'"
                      @click="cancelOffer(offer)"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <i class="pi pi-shopping-bag text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No offers found</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Create your first offer to start trading
          </p>
          <button
            @click="showCreateOffer = true"
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Create Offer
          </button>
        </div>
      </div>
    </div>

    <!-- Create Offer Modal -->
    <CreateOfferModal
      v-if="showCreateOffer"
      @close="showCreateOffer = false"
      @offer-created="handleOfferCreated"
    />

    <!-- Take Offer Modal -->
    <TakeOfferModal
      v-if="showTakeOffer"
      @close="showTakeOffer = false"
      @offer-taken="handleOfferTaken"
    />

    <!-- Offer Details Modal -->
    <OfferDetailsModal
      v-if="selectedOffer"
      :offer="selectedOffer"
      @close="selectedOffer = null"
      @offer-cancelled="handleOfferCancelled"
    />
  </div>
</template>

<script setup lang="ts">
  import CreateOfferModal from '@/components/Offers/CreateOfferModal.vue'
  import OfferDetailsModal from '@/components/Offers/OfferDetailsModal.vue'
  import TakeOfferModal from '@/components/Offers/TakeOfferModal.vue'
  import type { OfferDetails, OfferFilters } from '@/types/offer.types'
  import { computed, onMounted, ref } from 'vue'

  // State
  const offers = ref<OfferDetails[]>([])
  const isLoading = ref(false)
  const showCreateOffer = ref(false)
  const showTakeOffer = ref(false)
  const selectedOffer = ref<OfferDetails | null>(null)
  const isCopied = ref<string | null>(null)
  const filters = ref<OfferFilters>({
    status: '',
  })

  // Computed
  const filteredOffers = computed(() => {
    let filtered = offers.value

    if (filters.value.status) {
      filtered = filtered.filter(offer => offer.status === filters.value.status)
    }

    return filtered
  })

  // Methods
  const refreshOffers = async () => {
    isLoading.value = true
    try {
      // TODO: Implement actual offer fetching from wallet connect
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock data - replace with actual API call
      offers.value = [
        {
          id: '1',
          tradeId: '7901e9ec9d5042a12f2d2ca7c42847e20ede7891b32f3a1ae23dc268c85cbc6d',
          offerString:
            'offer1qqr83wcuu2rykcmqvpsxytznpzctkxlzrxulrh5k5cgr…h5mmvakfcazrhfkyww0ln2d4shh20r9lvsrqpgfz5c394a0gg',
          status: 'active',
          createdAt: new Date(),
          assetsOffered: [{ assetId: '', amount: 1.5, type: 'xch', symbol: 'XCH' }],
          assetsRequested: [{ assetId: 'cat123', amount: 100, type: 'cat', symbol: 'TOKEN' }],
          fee: 0.000001,
          creatorAddress: 'xch1test123',
        },
      ]
    } catch (error) {
      console.error('Failed to refresh offers:', error)
    } finally {
      isLoading.value = false
    }
  }

  const viewOffer = (offer: OfferDetails) => {
    selectedOffer.value = offer
  }

  const cancelOffer = async (offer: OfferDetails) => {
    if (confirm('Are you sure you want to cancel this offer?')) {
      try {
        // TODO: Implement actual offer cancellation
        console.log('Cancelling offer:', offer.tradeId)
        offer.status = 'cancelled'
      } catch (error) {
        console.error('Failed to cancel offer:', error)
      }
    }
  }

  const handleOfferCreated = (offer: OfferDetails) => {
    offers.value.unshift(offer)
    showCreateOffer.value = false
  }

  const handleOfferTaken = (offer: OfferDetails) => {
    // Update the offer status if it was taken
    const existingOffer = offers.value.find(o => o.id === offer.id)
    if (existingOffer) {
      existingOffer.status = 'completed'
    }
    showTakeOffer.value = false
  }

  const handleOfferCancelled = (offer: OfferDetails) => {
    const existingOffer = offers.value.find(o => o.id === offer.id)
    if (existingOffer) {
      existingOffer.status = 'cancelled'
    }
    selectedOffer.value = null
  }

  const getStatusClass = (status: string) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
    }
    return classes[status as keyof typeof classes] || classes.pending
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const copyOfferId = async (offerId: string) => {
    if (!offerId) return

    try {
      await navigator.clipboard.writeText(offerId)
      isCopied.value = offerId
      setTimeout(() => {
        isCopied.value = null
      }, 2000)
    } catch (error) {
      console.error('Failed to copy offer ID:', error)
    }
  }

  // Lifecycle
  onMounted(() => {
    refreshOffers()
  })
</script>

<style scoped>
  .content-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8;
  }

  .content-header {
    @apply mb-6 sm:mb-8;
  }

  .content-body {
    @apply space-y-6;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
