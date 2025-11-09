<template>
  <div
    ref="filterPanelRef"
    class="fixed z-50 cursor-move select-none"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      width: '320px',
    }"
    @mousedown="startDrag"
  >
    <Panel
      header="Asset Pairs"
      :toggleable="true"
      :collapsed="collapsed"
      @update:collapsed="collapsed = $event"
      class="glass-panel"
    >
      <!-- Filter Chips -->
      <div v-if="hasActiveFilters" class="space-y-3">
        <div
          v-for="(values, column) in sharedFilters"
          :key="column"
          v-show="values && values.length > 0"
          class="flex flex-col gap-2"
        >
          <div
            class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide"
          >
            {{
              column === 'buyAsset'
                ? 'Buy Assets'
                : column === 'sellAsset'
                  ? 'Sell Assets'
                  : 'Status'
            }}
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="value in values"
              :key="value"
              :class="[
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs',
                column === 'buyAsset'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : column === 'sellAsset'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
              ]"
            >
              {{ value }}
              <button
                @click="removeSharedFilter(column as keyof FilterState, value)"
                class="hover:opacity-70 ml-1"
              >
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- Clear All Button -->
      <div v-if="hasActiveFilters" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <button
          @click="clearAllSharedFilters"
          class="w-full text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 py-0.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </Panel>
  </div>
</template>

<script setup lang="ts">
  import type { FilterState } from '@/pages/Trading/types'
  import Panel from 'primevue/panel'
  import { onMounted, reactive, ref } from 'vue'

  interface Props {
    hasActiveFilters: boolean
    sharedFilters: FilterState
  }

  interface Emits {
    (e: 'removeSharedFilter', column: keyof FilterState, value: string): void
    (e: 'clearAllSharedFilters'): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const filterPanelRef = ref<HTMLElement>()
  const position = reactive({ x: 0, y: 60 })
  const collapsed = ref(false)
  const isDragging = ref(false)
  const dragStart = reactive({ x: 0, y: 0 })
  const lastPosition = reactive({ x: 0, y: 60 })

  // Calculate right position on mount
  const calculateRightPosition = () => {
    const rightPosition = (typeof window !== 'undefined' ? window.innerWidth : 1200) - 340
    position.x = rightPosition
    lastPosition.x = rightPosition
  }

  const startDrag = (event: MouseEvent) => {
    // Don't drag if clicking on buttons or interactive elements
    if (event.target instanceof HTMLElement && event.target.closest('button')) {
      return
    }

    isDragging.value = true
    dragStart.x = event.clientX - position.x
    dragStart.y = event.clientY - position.y

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
    event.preventDefault()
  }

  const handleDrag = (event: MouseEvent) => {
    if (!isDragging.value) return

    position.x = event.clientX - dragStart.x
    position.y = event.clientY - dragStart.y

    // Keep within viewport bounds
    const maxX = window.innerWidth - 320
    const maxY = window.innerHeight - 200

    position.x = Math.max(0, Math.min(position.x, maxX))
    position.y = Math.max(0, Math.min(position.y, maxY))
  }

  const stopDrag = () => {
    isDragging.value = false
    // Save the current position as the last position
    lastPosition.x = position.x
    lastPosition.y = position.y
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  const removeSharedFilter = (column: keyof FilterState, value: string) => {
    emit('removeSharedFilter', column, value)
  }

  const clearAllSharedFilters = () => {
    emit('clearAllSharedFilters')
  }

  // Method to restore last position (called when panel is toggled)
  const restoreLastPosition = () => {
    position.x = lastPosition.x
    position.y = lastPosition.y
  }

  // Expose method to parent component
  defineExpose({
    restoreLastPosition,
  })

  // Set initial position on mount
  onMounted(() => {
    calculateRightPosition()
  })
</script>

<style scoped>
  .cursor-move {
    cursor: move;
  }

  .cursor-move:active {
    cursor: grabbing;
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  }

  .glass-panel :deep(.p-panel-header) {
    background: rgba(255, 255, 255, 0.6) !important;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
    color: rgba(0, 0, 0, 0.8) !important;
    padding: 0.25rem 0.75rem !important;
    min-height: 1.5rem !important;
  }

  .glass-panel :deep(.p-panel-content) {
    background: rgba(255, 255, 255, 0.4) !important;
    backdrop-filter: blur(10px);
  }

  .glass-panel :deep(.p-panel-header .p-panel-header-icon) {
    color: rgba(0, 0, 0, 0.6) !important;
    font-size: 0.625rem !important;
    width: 0.75rem !important;
    height: 0.75rem !important;
    padding: 0.125rem !important;
    margin: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .glass-panel :deep(.p-panel-header .p-panel-header-icon:hover) {
    color: rgba(0, 0, 0, 0.8) !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .glass-panel :deep(.p-panel-header .p-panel-header-icon:focus) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    outline: none !important;
  }

  .glass-panel :deep(.p-panel-header .p-panel-header-icon:active) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .glass-panel :deep(.p-panel-header .p-panel-title) {
    color: rgba(0, 0, 0, 0.8) !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
  }

  /* Dark mode adjustments */
  .dark .glass-panel {
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  .dark .glass-panel :deep(.p-panel-header) {
    background: rgba(0, 0, 0, 0.2) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    padding: 0.25rem 0.75rem !important;
    min-height: 1.5rem !important;
  }

  .dark .glass-panel :deep(.p-panel-content) {
    background: rgba(0, 0, 0, 0.1) !important;
  }

  .dark .glass-panel :deep(.p-panel-header .p-panel-header-icon) {
    color: rgba(255, 255, 255, 0.8) !important;
  }

  .dark .glass-panel :deep(.p-panel-header .p-panel-header-icon:hover) {
    color: rgba(255, 255, 255, 1) !important;
    background: rgba(255, 255, 255, 0.1) !important;
  }

  .dark .glass-panel :deep(.p-panel-header .p-panel-title) {
    color: rgba(255, 255, 255, 0.9) !important;
  }
</style>
