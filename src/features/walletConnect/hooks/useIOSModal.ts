import { computed, onMounted, onUnmounted, ref } from 'vue'

export const isIOS = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
})

export function useIOSModal() {
  const isModalVisible = ref(false)
  const modalUri = ref('')

  const handleShowIOSModal = (event: CustomEvent) => {
    if (isIOS.value) {
      modalUri.value = event.detail.uri
      isModalVisible.value = true
    }
  }

  const handleHideIOSModal = () => {
    isModalVisible.value = false
    modalUri.value = ''
  }

  const closeModal = () => {
    isModalVisible.value = false
    modalUri.value = ''
  }

  onMounted(() => {
    if (isIOS.value) {
      window.addEventListener('show_ios_modal', handleShowIOSModal as EventListener)
      window.addEventListener('hide_ios_modal', handleHideIOSModal as EventListener)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('show_ios_modal', handleShowIOSModal as EventListener)
    window.removeEventListener('hide_ios_modal', handleHideIOSModal as EventListener)
  })

  return {
    isModalVisible,
    modalUri,
    closeModal,
    isIOS,
  }
}
