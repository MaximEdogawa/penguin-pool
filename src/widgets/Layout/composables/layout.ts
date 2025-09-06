import { computed, onMounted, onUnmounted, reactive } from 'vue'

const layoutConfig = reactive({
  preset: 'Aura',
  primary: 'emerald',
  surface: null as string | null,
  darkTheme: false,
})

const layoutState = reactive({
  staticMenuDesktopInactive: false,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null as string | null,
  isMobile: false,
})

export function useLayout() {
  const setActiveMenuItem = (item: string | { value: string }) => {
    const itemValue = typeof item === 'string' ? item : item.value
    layoutState.activeMenuItem = itemValue
  }

  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle()
      return
    }

    document.startViewTransition(() => executeDarkModeToggle())
  }

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme
    document.documentElement.classList.toggle('app-dark')
  }

  const toggleMenu = () => {
    if (layoutState.isMobile) {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive
    } else {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive
    }
  }

  const closeMobileMenu = () => {
    if (layoutState.isMobile) {
      layoutState.staticMenuMobileActive = false
    }
  }

  const handleResize = () => {
    const wasMobile = layoutState.isMobile
    layoutState.isMobile = window.innerWidth < 1024

    if (wasMobile && !layoutState.isMobile) {
      layoutState.staticMenuMobileActive = false
    }

    if (!wasMobile && layoutState.isMobile) {
      layoutState.staticMenuDesktopInactive = false
    }
  }

  const isSidebarActive = computed(
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive
  )

  const isDarkTheme = computed(() => layoutConfig.darkTheme)

  const getPrimary = computed(() => layoutConfig.primary)

  const getSurface = computed(() => layoutConfig.surface)

  // Initialize on mount
  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    layoutConfig,
    layoutState,
    toggleMenu,
    closeMobileMenu,
    isSidebarActive,
    isDarkTheme,
    getPrimary,
    getSurface,
    setActiveMenuItem,
    toggleDarkMode,
    handleResize,
  }
}
