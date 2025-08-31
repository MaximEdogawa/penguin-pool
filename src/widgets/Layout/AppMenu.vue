<template>
  <ul class="menu-list">
    <AppMenuItem
      v-for="(item, index) in menuModel"
      :key="item.label"
      :item="item"
      :index="index"
      :root="true"
    />
  </ul>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import AppMenuItem from './AppMenuItem.vue'

  interface MenuItem {
    label: string
    items?: MenuItem[]
    icon?: string
    to?: string
    badge?: string
    url?: string
    target?: string
    class?: string
    disabled?: boolean
    visible?: boolean
    command?: (event: { originalEvent: Event; item: MenuItem }) => void
  }

  const menuModel = ref<MenuItem[]>([
    {
      label: 'Main',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          to: '/dashboard',
        },
        {
          label: 'Loans',
          icon: 'pi pi-credit-card',
          to: '/loans',
        },
        {
          label: 'Offers',
          icon: 'pi pi-briefcase',
          to: '/offers',
        },
      ],
    },
    {
      label: 'Financial Services',
      items: [
        {
          label: 'Piggy Bank',
          icon: 'pi pi-wallet',
          to: '/piggy-bank',
        },
        {
          label: 'Option Contracts',
          icon: 'pi pi-chart-line',
          to: '/option-contracts',
        },
      ],
    },
    {
      label: 'User Management',
      items: [
        {
          label: 'Profile',
          icon: 'pi pi-user',
          to: '/profile',
        },
      ],
    },
  ])
</script>

<style scoped>
  .menu-list {
    @apply space-y-2;
  }
</style>
