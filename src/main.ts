import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'

import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'
import './assets/main.css'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)

// Register global components

app.use(router)
app.use(PrimeVue, {
  options: {
    darkModeSelector: '.dark',
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.component('PrimeButton', Button)
app.component('PrimeMenu', Menu)
app.mount('#app')
