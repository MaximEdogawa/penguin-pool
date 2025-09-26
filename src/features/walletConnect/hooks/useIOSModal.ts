import { onMounted, onUnmounted, ref } from 'vue'

const detectIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function useIOSModal() {
  const isIOS = detectIOS()
  const isModalVisible = ref(false)
  const modalUri = ref('')

  const handleShowIOSModal = (event: CustomEvent) => {
    if (isIOS) {
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
    if (isIOS) {
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
