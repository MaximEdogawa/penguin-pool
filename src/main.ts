import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

// PrimeVue imports
import PrimeVue from 'primevue/config'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)
app.use(PrimeVue, {
  ripple: true,
  inputStyle: 'outlined',
  unstyled: false,
  pt: {
    // Custom PrimeVue styling
    button: {
      root: { class: 'btn-primary' },
      secondary: { class: 'btn-secondary' },
    },
    card: {
      root: { class: 'card' },
    },
    inputtext: {
      root: { class: 'input-field' },
    },
  },
})

app.mount('#app')
