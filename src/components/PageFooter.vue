<template>
  <div class="content-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="footer-text"> © {{ currentYear }} Penguin Pool. All rights reserved. </span>
      </div>
      <div class="footer-right">
        <span class="footer-version"> v{{ appVersion }} </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const currentYear = computed(() => new Date().getFullYear())
  const appVersion = computed(() => '1.0.0')
</script>
