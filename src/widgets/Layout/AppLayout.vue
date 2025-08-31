<template>
  <div v-if="isAuthenticated" class="layout-wrapper" :class="containerClass">
    <!-- Topbar -->
    <AppTopbar />

    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="layout-main-container">
      <div class="layout-main">
        <router-view />
      </div>
      <AppFooter />
    </div>

    <!-- Layout Mask for overlay mode -->
    <div class="layout-mask animate-fadein" @click="handleMaskClick"></div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useLayout } from './composables/layout'

  // Router
  const router = useRouter()
  const route = useRoute()

  // Layout composable
  const { layoutState, toggleMenu } = useLayout()

  // Computed
  const isAuthenticated = computed(() => {
    return localStorage.getItem('penguin-pool-user') !== null
  })

  const containerClass = computed(() => {
    return {
      'layout-static': true,
      'layout-static-inactive': layoutState.staticMenuDesktopInactive,
      'layout-mobile-active': layoutState.staticMenuMobileActive,
    }
  })

  // Handle window resize
  const handleResize = () => {
    if (window.innerWidth >= 1024) {
      layoutState.staticMenuDesktopInactive = false
      layoutState.staticMenuMobileActive = false
    }
  }

  // Handle mask click to close sidebar
  const handleMaskClick = () => {
    if (layoutState.overlayMenuActive || layoutState.staticMenuMobileActive) {
      toggleMenu()
    }
  }

  // Lifecycle
  onMounted(() => {
    // Check authentication
    if (!isAuthenticated.value) {
      router.push('/auth')
      return
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Watch for route changes to close sidebar on mobile
    watch(
      () => route.path,
      () => {
        if (window.innerWidth < 1024) {
          layoutState.staticMenuMobileActive = false
          layoutState.overlayMenuActive = false
        }
      }
    )
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
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
    @apply fixed inset-0 z-50 bg-black bg-opacity-50;
    display: none;
  }

  /* Layout modes */
  .layout-overlay .layout-mask {
    display: block;
  }

  .layout-overlay-active .layout-mask {
    display: block;
  }

  .layout-mobile-active .layout-mask {
    display: block;
  }

  /* Responsive adjustments */
  @media (max-width: 1023px) {
    .layout-main-container {
      padding: 6rem 1rem 0 1rem;
    }
  }

  @media (max-width: 768px) {
    .layout-main-container {
      padding: 6rem 0.5rem 0 0.5rem;
    }
  }
</style>
