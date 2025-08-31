import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import Aura from '@primeuix/themes/aura'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'
import './assets/main.css'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

import App from './App.vue'
import router from './router'

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
app.component('PrimeMenu', Menu)
app.component('PrimeTabList', TabList)
app.component('PrimeTabs', Tabs)
app.component('PrimeTab', Tab)
app.component('PrimeTabPanel', TabPanel)
app.component('PrimeTabPanels', TabPanels)
app.mount('#app')
