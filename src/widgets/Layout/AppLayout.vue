<template>
  <div
    v-if="isAuthenticated"
    class="app-layout"
    :class="{ 'sidebar-open': isSidebarOpen, 'sidebar-collapsed': isSidebarCollapsed }"
  >
    <!-- Sidebar -->
    <AppSidebar
      :is-open="isSidebarOpen"
      :is-collapsed="isSidebarCollapsed"
      @toggle-collapse="toggleSidebarCollapse"
      @close="closeSidebar"
    />

    <!-- Main Content Area - Positioned next to sidebar -->
    <div class="main-content">
      <!-- Header - Full width and sticky -->
      <AppHeader :is-sidebar-open="isSidebarOpen" @toggle-sidebar="toggleSidebar" />

      <!-- Page Content - Full width -->
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import AppHeader from '@/widgets/Header/AppHeader.vue'
  import AppSidebar from '@/widgets/Sidebar/AppSidebar.vue'

  // Router
  const router = useRouter()
  const route = useRoute()

  // State
  const isSidebarOpen = ref(false)
  const isSidebarCollapsed = ref(false)

  // Computed
  const isAuthenticated = computed(() => {
    return localStorage.getItem('penguin-pool-user') !== null
  })

  // Methods
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const toggleSidebarCollapse = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  const closeSidebar = () => {
    isSidebarOpen.value = false
  }

  // Handle window resize
  const handleResize = () => {
    if (window.innerWidth >= 1024) {
      isSidebarOpen.value = true
      isSidebarCollapsed.value = false
    } else {
      isSidebarOpen.value = false
      isSidebarCollapsed.value = false
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
          isSidebarOpen.value = false
        }
      }
    )
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>

<style scoped>
  .app-layout {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900;
  }

  .main-content {
    @apply flex flex-col min-h-screen transition-all duration-300 ease-in-out;
    position: absolute;
    left: 20%; /* Sidebar takes 20% of viewport width */
    right: 0; /* Extend to right edge */
    top: 8vh; /* Start below the fixed header */
    bottom: 0;
  }

  .page-content {
    @apply flex-1 p-6;
    width: 100%;
    min-width: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }

  /* Sidebar open state */
  .sidebar-open .main-content {
    left: 20%; /* 20% of viewport width */
    right: 0;
  }

  /* Sidebar collapsed state */
  .sidebar-collapsed .main-content {
    left: 5%; /* 5% of viewport width when collapsed */
    right: 0;
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .main-content {
      left: 25% !important; /* Slightly wider sidebar on medium screens */
      right: 0 !important;
    }

    .sidebar-open .main-content {
      left: 25% !important; /* Slightly wider sidebar on medium screens */
      right: 0 !important;
    }

    .sidebar-collapsed .main-content {
      left: 8% !important; /* 8% when collapsed on medium screens */
      right: 0 !important;
    }
  }

  @media (max-width: 1023px) {
    .main-content {
      left: 0 !important; /* Full width on small screens - no sidebar push */
      right: 0 !important;
      top: 8vh !important; /* Start below the fixed header */
    }

    .sidebar-open .main-content {
      left: 0 !important; /* Content stays full width, sidebar overlays */
      right: 0 !important;
      top: 8vh !important; /* Start below the fixed header */
    }

    .sidebar-collapsed .main-content {
      left: 0 !important; /* Content stays full width, sidebar overlays */
      right: 0 !important;
      top: 8vh !important; /* Start below the fixed header */
    }

    .page-content {
      @apply p-4;
    }
  }

  @media (max-width: 768px) {
    .main-content {
      left: 0 !important; /* Full width on mobile */
      right: 0 !important;
      top: 8vh !important; /* Start below the fixed header */
    }

    .sidebar-open .main-content {
      left: 0 !important; /* Content stays full width, sidebar overlays */
      right: 0 !important;
      top: 8vh !important; /* Start below the fixed header */
    }

    .sidebar-collapsed .main-content {
      left: 0 !important; /* Content stays full width, sidebar overlays */
      right: 0 !important;
      top: 8vh !important; /* Start below the fixed header */
    }

    .page-content {
      @apply p-3;
    }
  }

  /* Smooth transitions */
  .app-layout * {
    transition-property: left, right, transform;
    transition-duration: 300ms;
    transition-timing-function: ease-in-out;
  }
</style>
