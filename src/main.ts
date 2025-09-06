import Aura from '@primeuix/themes/aura'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { watch } from 'vue'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

import 'primeicons/primeicons.css'
import Button from 'primevue/button'
import ConfirmationService from 'primevue/confirmationservice'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import { validateEnvironment } from './shared/config/environment'
import { useWalletConnectStore } from './features/walletConnect/stores/walletConnectStore'

// Validate environment configuration early
validateEnvironment()

const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.penguin-pool-dark',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.component('PrimeButton', Button)
app.component('PrimeDialog', Dialog)
app.component('PrimeMenu', Menu)
app.component('PrimeTabList', TabList)
app.component('PrimeTabs', Tabs)
app.component('PrimeTab', Tab)
app.component('PrimeTabPanel', TabPanel)
app.component('PrimeTabPanels', TabPanels)

// Global wallet disconnection watcher
app.mount('#app')

const walletStore = useWalletConnectStore()

watch(
  () => walletStore.isConnected,
  async connected => {
    if (!connected && router.currentRoute.value.path !== '/auth') {
      console.log('Wallet disconnected, redirecting to auth...')
      await router.push('/auth')
    } else {
      console.log('Wallet connected, redirecting to dashboard...')
    }
  }
)
