<template>
  <div class="layout-footer">
    <div class="layout-footer-content">
      <div class="layout-footer-left">
        <span class="layout-footer-text">
          © {{ currentYear }} Penguin Pool. All rights reserved.
        </span>
      </div>
      <div class="layout-footer-right">
        <span class="layout-footer-version"> v{{ appVersion }} </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const currentYear = computed(() => new Date().getFullYear())
  const appVersion = computed(() => '1.0.0') // TODO: Get from package.json
</script>

<style scoped>
  .layout-footer {
    @apply bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
    padding: 1rem 0;
  }

  .layout-footer-content {
    @apply flex items-center justify-between px-6;
  }

  .layout-footer-text {
    @apply text-sm text-gray-600 dark:text-gray-400;
  }

  .layout-footer-version {
    @apply text-sm text-gray-500 dark:text-gray-500 font-mono;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .layout-footer-content {
      @apply flex-col gap-2 text-center;
    }
  }
</style>
