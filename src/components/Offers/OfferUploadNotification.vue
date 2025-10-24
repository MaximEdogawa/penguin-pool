<template>
  <div
    v-if="showNotification"
    class="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-md"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Offer Created Successfully!
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Your offer has been saved locally. Would you like to upload it to Dexie for public
          trading?
        </p>
        <div class="flex items-center space-x-2">
          <button
            @click="uploadToDexie"
            :disabled="isUploading"
            class="flex items-center px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-xs font-medium rounded-md transition-colors duration-200"
          >
            <i v-if="isUploading" class="pi pi-spin pi-spinner mr-1"></i>
            <i v-else class="pi pi-upload mr-1"></i>
            {{ isUploading ? 'Uploading...' : 'Upload to Dexie' }}
          </button>
          <button
            @click="dismiss"
            class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-md transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        @click="dismiss"
        class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <i class="pi pi-times text-sm"></i>
      </button>
    </div>

    <!-- Success/Error Messages -->
    <div
      v-if="uploadResult"
      class="mt-3 p-2 rounded-md"
      :class="
        uploadResult.success
          ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
          : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
      "
    >
      <div class="flex items-center">
        <i
          :class="uploadResult.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"
          class="mr-1"
        ></i>
        <span class="text-xs">
          {{
            uploadResult.success
              ? `Uploaded successfully! Dexie ID: ${uploadResult.dexieId}`
              : uploadResult.error
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useOfferSubmission } from '@/shared/composables/useOfferSubmission'
  import type { OfferDetails } from '@/types/offer.types'
  import { onMounted, onUnmounted, ref } from 'vue'

  interface Props {
    offer?: OfferDetails
    offerString?: string
    source?: string
  }

  const props = defineProps<Props>()

  const { uploadOfferToDexie } = useOfferSubmission()

  // State
  const showNotification = ref(false)
  const isUploading = ref(false)
  const uploadResult = ref<{ success: boolean; dexieId?: string; error?: string } | null>(null)

  // Methods
  const uploadToDexie = async () => {
    if (!props.offerString) return

    isUploading.value = true
    uploadResult.value = null

    try {
      const result = await uploadOfferToDexie(props.offerString)
      uploadResult.value = { success: true, dexieId: result.dexieId }

      // Auto-dismiss after 3 seconds on success
      setTimeout(() => {
        dismiss()
      }, 3000)
    } catch (error) {
      uploadResult.value = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload offer',
      }
    } finally {
      isUploading.value = false
    }
  }

  const dismiss = () => {
    showNotification.value = false
    uploadResult.value = null
  }

  // Listen for offer creation events
  const handleOfferCreated = (event: CustomEvent) => {
    const { source } = event.detail

    // Only show for offers created in offer page (not trading view)
    if (source === 'offer-page') {
      showNotification.value = true
      uploadResult.value = null
    }
  }

  // Lifecycle
  onMounted(() => {
    window.addEventListener('offer-created', handleOfferCreated as EventListener)
  })

  onUnmounted(() => {
    window.removeEventListener('offer-created', handleOfferCreated as EventListener)
  })
</script>
