<template>
  <div v-if="showInstallPrompt" class="fixed top-0 left-0 right-0 z-50">
    <div
      class="bg-surface-900 text-surface-100 py-1 px-3 lg:px-6 flex items-center flex-wrap relative"
    >
      <div class="font-bold flex items-center gap-1 text-xs">📱 Install Penguin Pool</div>
      <div class="absolute left-1/2 transform -translate-x-1/2 inline-flex gap-1 items-center">
        <span class="hidden lg:flex leading-normal text-xs">Add to home screen</span>
        <button
          @click="installApp"
          class="text-surface-0 underline font-bold hover:text-primary-400 transition-colors text-xs"
        >
          Install
        </button>
      </div>
      <button
        @click="dismissPrompt"
        class="text-surface-0 hover:bg-surface-500/20 rounded-full p-0.5 transition-colors ml-auto"
      >
        <i class="pi pi-times text-xs"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  interface BeforeInstallPromptEvent extends Event {
    preventDefault(): void
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  interface NavigatorWithStandalone extends Navigator {
    standalone?: boolean
  }

  const showInstallPrompt = ref(false)
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

  onMounted(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as NavigatorWithStandalone).standalone === true
      const isAndroidApp = document.referrer.includes('android-app://')
      const isChromeApp = window.matchMedia('(display-mode: minimal-ui)').matches

      return isStandalone || isIOSStandalone || isAndroidApp || isChromeApp
    }

    if (checkIfInstalled()) {
      showInstallPrompt.value = false
      return
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      deferredPrompt.value = e
      showInstallPrompt.value = true
    })

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      showInstallPrompt.value = false
      deferredPrompt.value = null
    })

    // Show prompt after a short delay if no beforeinstallprompt event
    setTimeout(() => {
      if (!checkIfInstalled() && !deferredPrompt.value) {
        showInstallPrompt.value = true
      }
    }, 2000)
  })

  const installApp = async () => {
    if (!deferredPrompt.value) {
      // Fallback for iOS Safari
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        showIOSInstructions()
        return
      }
      return
    }

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    deferredPrompt.value = null
    showInstallPrompt.value = false
  }

  const dismissPrompt = () => {
    showInstallPrompt.value = false
  }

  const showIOSInstructions = () => {
    // Show iOS-specific installation instructions
    alert(
      'To install Penguin Pool on your iPhone:\n\n' +
        '1. Tap the Share button at the bottom of Safari\n' +
        '2. Scroll down and tap "Add to Home Screen"\n' +
        '3. Tap "Add" to confirm\n\n' +
        'The app will then appear on your home screen!'
    )
  }
</script>
