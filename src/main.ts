import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import AutoComplete from 'primevue/autocomplete'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)

// Register global components
app.component('PrimeButton', Button)
app.component('PrimeMenu', Menu)
app.component('PrimeAutoComplete', AutoComplete)
app.use(PrimeVue, {
  ripple: true,
  inputStyle: 'filled',
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
