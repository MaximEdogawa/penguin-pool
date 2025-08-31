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
      <AppFooter />
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
  import AppFooter from './AppFooter.vue'

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
  }

  .layout-main-container {
    @apply flex flex-col min-h-screen justify-between;
    padding: 6rem 2rem 0 2rem;
    transition: margin-left 0.2s;
  }

  .layout-main {
    @apply flex-1;
    padding-bottom: 2rem;
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

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .layout-main-container {
      padding: 6rem 1rem 0 1rem;
      margin-left: 0 !important; /* No margin on mobile */
    }
  }

  @media (max-width: 768px) {
    .layout-main-container {
      padding: 6rem 0.5rem 0 0.5rem;
    }
  }
</style>
