import { useFeatureFlagsStore } from '@/stores/featureFlags'
import { computed, ref } from 'vue'
import { useThemeStore } from '../store/themeStore'
import { logger } from '@/shared/services/logger'

export const useThemeManagement = () => {
  const themeStore = useThemeStore()
  const featureFlags = useFeatureFlagsStore()

  const exportThemeId = ref('')
  const importFile = ref<File | null>(null)
  const primaryColor = ref(themeStore.currentPrimaryColor)
  const surfaceColor = ref(themeStore.currentSurfaceColor)

  const currentTheme = computed(() => themeStore.currentTheme)
  const hasCustomTheme = computed(() => themeStore.hasCustomTheme)
  const isPrimeUI = computed(() => themeStore.isPrimeUI)
  const currentCustomTheme = computed(() => themeStore.currentCustomTheme)
  const currentPrimeUITheme = computed(() => themeStore.currentPrimeUITheme)
  const currentThemeVariant = computed(() => themeStore.currentThemeVariant)
  const availableCustomThemes = computed(() => themeStore.availableCustomThemes)
  const primaryColorEnabled = computed(() => featureFlags.isUIFeatureEnabled('primaryColor'))

  const applyCustomTheme = async (themeId: string) => {
    try {
      await themeStore.setCustomTheme(themeId)
    } catch (error) {
      logger.error('Failed to apply custom theme', error as Error)
    }
  }

  const switchToVariant = async (variant: 'light' | 'dark') => {
    try {
      if (isPrimeUI.value && currentPrimeUITheme.value) {
        await themeStore.setPrimeUITheme(currentPrimeUITheme.value, variant)
      } else if (hasCustomTheme.value) {
        await themeStore.switchThemeVariant(variant)
      }
    } catch (error) {
      logger.error('Failed to switch theme variant', error as Error)
    }
  }

  const updatePrimaryColor = async () => {
    try {
      await themeStore.updatePrimeUIColors(primaryColor.value, surfaceColor.value)
    } catch (error) {
      logger.error('Failed to update primary color', error as Error)
    }
  }

  const updateSurfaceColor = async () => {
    try {
      await themeStore.updatePrimeUIColors(primaryColor.value, surfaceColor.value)
    } catch (error) {
      logger.error('Failed to update surface color', error as Error)
    }
  }

  const exportTheme = () => {
    if (!exportThemeId.value) return

    try {
      const themeJson = themeStore.exportTheme(exportThemeId.value)
      const blob = new Blob([themeJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportThemeId.value}-theme.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Failed to export theme', error as Error)
    }
  }

  const triggerImport = () => {
    const input = document.getElementById('import-theme') as HTMLInputElement
    input?.click()
  }

  const importTheme = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    try {
      const text = await file.text()
      await themeStore.importTheme(text)
      importFile.value = file
    } catch (error) {
      logger.error('Failed to import theme', error as Error)
    }
  }

  return {
    exportThemeId,
    importFile,
    primaryColor,
    surfaceColor,
    currentTheme,
    hasCustomTheme,
    isPrimeUI,
    currentCustomTheme,
    currentPrimeUITheme,
    currentThemeVariant,
    availableCustomThemes,
    primaryColorEnabled,
    applyCustomTheme,
    switchToVariant,
    updatePrimaryColor,
    updateSurfaceColor,
    exportTheme,
    triggerImport,
    importTheme,
  }
}
