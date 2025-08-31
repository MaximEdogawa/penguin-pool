<template>
  <li :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
    <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">
      {{ item.label }}
    </div>

    <router-link
      v-if="item.to && !item.items && item.visible !== false"
      @click="itemClick($event, item)"
      :class="[item.class, { 'active-route': checkActiveRoute(item) }]"
      tabindex="0"
      :to="item.to"
    >
      <i :class="item.icon" class="layout-menuitem-icon"></i>
      <span class="layout-menuitem-text">{{ item.label }}</span>
      <span v-if="item.badge" class="layout-menuitem-badge">{{ item.badge }}</span>
    </router-link>

    <div v-if="item.items && item.visible !== false" class="menu-section">
      <div v-for="child in item.items" :key="child.label" class="menu-item-wrapper">
        <router-link
          v-if="child.to"
          @click="itemClick($event, child)"
          :class="[child.class, { 'active-route': checkActiveRoute(child) }]"
          tabindex="0"
          :to="child.to"
        >
          <i :class="child.icon" class="layout-menuitem-icon"></i>
          <span class="layout-menuitem-text">{{ child.label }}</span>
          <span v-if="child.badge" class="layout-menuitem-badge">{{ child.badge }}</span>
        </router-link>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
  import { onBeforeMount, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useLayout } from './composables/layout'

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

  const route = useRoute()
  const { layoutState, setActiveMenuItem, toggleMenu } = useLayout()

  const props = defineProps<{
    item: MenuItem
    index: number
    root?: boolean
    parentItemKey?: string | null
  }>()

  const isActiveMenu = ref(false)
  const itemKey = ref<string>('')

  onBeforeMount(() => {
    itemKey.value = props.parentItemKey
      ? props.parentItemKey + '-' + props.index
      : String(props.index)

    const activeItem = layoutState.activeMenuItem
    isActiveMenu.value = Boolean(
      activeItem === itemKey.value || (activeItem && activeItem.startsWith(itemKey.value + '-'))
    )
  })

  watch(
    () => layoutState.activeMenuItem,
    newVal => {
      isActiveMenu.value = Boolean(
        newVal === itemKey.value || (newVal && newVal.startsWith(itemKey.value + '-'))
      )
    }
  )

  function itemClick(event: Event, item: MenuItem) {
    if (item.disabled) {
      event.preventDefault()
      return
    }

    // Close mobile sidebar after navigation
    if ((item.to || item.url) && layoutState.staticMenuMobileActive) {
      toggleMenu()
    }

    if (item.command) {
      item.command({ originalEvent: event, item: item })
    }

    const foundItemKey = item.items
      ? isActiveMenu.value
        ? props.parentItemKey
        : itemKey.value
      : itemKey.value

    if (foundItemKey) {
      setActiveMenuItem(foundItemKey)
    }
  }

  function checkActiveRoute(item: MenuItem) {
    return route.path === item.to
  }
</script>

<style scoped>
  .layout-root-menuitem {
    > .layout-menuitem-root-text {
      @apply text-xs font-bold text-gray-900 dark:text-white uppercase;
      margin: 0.75rem 0;
      color: var(--text-color-secondary);
    }

    > a {
      display: none;
    }
  }

  .menu-section {
    @apply space-y-1;
  }

  .menu-item-wrapper {
    @apply mx-2;
  }

  a {
    @apply select-none;
  }

  .layout-menuitem-icon {
    @apply mr-3 text-lg flex-shrink-0;
    width: 1.25rem;
    text-align: center;
  }

  .layout-menuitem-text {
    @apply text-sm font-medium flex-1;
  }

  .layout-menuitem-badge {
    @apply bg-primary-100/30 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 text-xs px-2 py-1 rounded-full font-medium ml-auto;
  }

  /* Menu item styling */
  .menu-item-wrapper a {
    @apply flex items-center relative outline-none text-gray-700 dark:text-gray-200 cursor-pointer rounded-lg transition-all duration-200;
    padding: 0.75rem 1rem;

    &.active-route {
      @apply font-bold text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-900/10;
    }

    &:hover {
      @apply bg-gray-100/30 dark:bg-gray-700/30;
    }

    &:focus {
      @apply ring-2 ring-primary-500/20;
    }
  }

  /* Mobile mode adjustments */
  .layout-sidebar.mobile-mode .layout-menuitem-text,
  .layout-sidebar.mobile-mode .layout-menuitem-root-text,
  .layout-sidebar.mobile-mode .layout-menuitem-badge {
    display: none;
  }

  .layout-sidebar.mobile-mode .menu-item-wrapper a {
    justify-content: center;
    padding: 0.75rem;
  }

  .layout-sidebar.mobile-mode .layout-menuitem-icon {
    margin-right: 0;
    font-size: 1.25rem;
  }
</style>
