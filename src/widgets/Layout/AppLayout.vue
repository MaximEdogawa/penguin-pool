<template>
  <div class="layout-wrapper" :class="containerClass">
    <!-- Topbar -->
    <AppTopbar />

    <!-- Sidebar -->
    <AppSidebar
      :is-open="layoutState.staticMenuMobileActive"
      :is-collapsed="layoutState.staticMenuDesktopInactive"
      @close="closeMobileMenu"
      @toggle-collapse="toggleMenu"
    />

    <!-- Main Content Area -->
    <div
      class="layout-main-container"
      :class="{ 'mobile-menu-open': layoutState.staticMenuMobileActive }"
    >
      <div class="layout-main">
        <router-view />
      </div>
    </div>

    <!-- Layout Mask for overlay mode -->
    <div
      v-if="layoutState.staticMenuMobileActive"
      class="layout-mask animate-fadein"
      @click="closeMobileMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useLayout } from './composables/layout'
  import AppTopbar from './AppTopbar.vue'
  import AppSidebar from './AppSidebar.vue'

  // Router
  const route = useRoute()

  // Layout composable
  const { layoutState, toggleMenu, closeMobileMenu } = useLayout()

  const containerClass = computed(() => {
    return {
      'layout-static': true,
      'layout-static-inactive': layoutState.staticMenuDesktopInactive && !layoutState.isMobile,
      'layout-mobile-active': layoutState.staticMenuMobileActive,
    }
  })

  // Watch for route changes to close sidebar on mobile
  watch(
    () => route.path,
    () => {
      if (layoutState.isMobile) {
        closeMobileMenu()
      }
    }
  )
</script>

<style scoped>
  .layout-wrapper {
    @apply min-h-screen;
    height: 100vh;
    background-color: var(--surface-ground);
    transition: background-color 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .layout-main-container {
    @apply flex flex-col;
    flex: 1;
    margin-top: 4rem; /* Account for topbar height */
    transition: margin-left 0.2s;
    background-color: var(--surface-ground);
    height: calc(100vh - 4rem);
    position: relative;
    overflow: hidden;
  }

  .layout-main {
    @apply flex-1;
    height: 100%;
    background-color: var(--surface-ground);
    overflow: hidden; /* Let individual pages handle their own scrolling */
  }

  .layout-mask {
    @apply fixed inset-0 z-40 bg-black bg-opacity-50;
    display: block;
  }

  /* Layout modes */
  .layout-static .layout-main-container {
    margin-left: 20vw; /* 20% for sidebar */
  }

  .layout-static-inactive .layout-main-container {
    margin-left: 5vw; /* 5% for collapsed sidebar */
  }

  .mobile-menu-open .layout-main-container {
    margin-left: 0; /* No margin on mobile when sidebar is open */
  }

  /* Responsive adjustments using standard media queries */
  @media (max-width: 1023px) {
    .layout-main-container {
      margin-left: 0 !important; /* No margin on mobile */
    }
  }

  /* Ensure dark mode support */
  :global(.dark) .layout-wrapper {
    background-color: var(--surface-ground);
  }

  :global(.dark) .layout-main-container {
    background-color: var(--surface-ground);
  }

  :global(.dark) .layout-main {
    background-color: var(--surface-ground);
  }
</style>
