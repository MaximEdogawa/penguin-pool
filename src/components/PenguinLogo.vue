<template>
  <img :src="logoPath" :width="size" :height="size" :class="className" alt="Penguin Pool Logo" />
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import penguinLogo from '@/assets/penguin-pool.svg'

  interface Props {
    size?: number | string
    className?: string
  }

  withDefaults(defineProps<Props>(), {
    size: 32,
    className: '',
  })

  // Computed logo path
  const logoPath = computed(() => penguinLogo)
</script>

<!--
OLD LOGO (KEPT FOR REFERENCE):
<svg
  :width="size"
  :height="size"
  viewBox="0 0 64 64"
  :class="className"
  xmlns="http://www.w3.org/2000/svg"
>
  Background Circle
  <circle cx="32" cy="32" r="30" fill="#E0F2FE" stroke="#0EA5E9" stroke-width="2" />

  Pool Water Effect
  <ellipse cx="32" cy="45" rx="20" ry="8" fill="#0EA5E9" opacity="0.8" />
  <ellipse cx="32" cy="48" rx="16" ry="4" fill="#38BDF8" opacity="0.6" />

  Penguin Body (Main)
  <ellipse cx="32" cy="38" rx="12" ry="16" fill="#1F2937" />

  Penguin Belly (White)
  <ellipse cx="32" cy="38" rx="8" ry="12" fill="#F8FAFC" />

  Penguin Head
  <circle cx="32" cy="22" r="10" fill="#1F2937" />

  Penguin Eyes
  <circle cx="28" cy="20" r="2.5" fill="#FEF3C7" />
  <circle cx="36" cy="20" r="2.5" fill="#FEF3C7" />
  <circle cx="28" cy="20" r="1.2" fill="#1F2937" />
  <circle cx="36" cy="20" r="1.2" fill="#1F2937" />
  <circle cx="28.5" cy="19.5" r="0.4" fill="#FFFFFF" />
  <circle cx="36.5" cy="19.5" r="0.4" fill="#FFFFFF" />

  Penguin Beak
  <path d="M32 26 L29 28 L35 28 Z" fill="#F59E0B" />
  <path d="M32 26 L29 28 L35 28 Z" fill="#F59E0B" opacity="0.8" />

  Penguin Wings
  <ellipse cx="18" cy="38" rx="3" ry="8" fill="#374151" />
  <ellipse cx="46" cy="38" rx="3" ry="8" fill="#374151" />

  Penguin Feet
  <ellipse cx="26" cy="52" rx="2.5" ry="1" fill="#F59E0B" />
  <ellipse cx="38" cy="52" rx="2.5" ry="1" fill="#F59E0B" />

  Water Droplets/Splash
  <circle cx="20" cy="18" r="1.5" fill="#0EA5E9" opacity="0.7" />
  <circle cx="44" cy="18" r="1.2" fill="#0EA5E9" opacity="0.6" />
  <circle cx="16" cy="24" r="1" fill="#38BDF8" opacity="0.8" />
  <circle cx="48" cy="24" r="0.8" fill="#38BDF8" opacity="0.7" />

  Pool Bubbles
  <circle cx="24" cy="42" r="1.2" fill="#FFFFFF" opacity="0.9" />
  <circle cx="40" cy="42" r="0.8" fill="#FFFFFF" opacity="0.8" />
  <circle cx="28" cy="46" r="0.6" fill="#FFFFFF" opacity="0.7" />
  <circle cx="36" cy="46" r="0.7" fill="#FFFFFF" opacity="0.6" />

  Decorative Elements
  <circle cx="32" cy="12" r="1" fill="#0EA5E9" opacity="0.5" />
  <circle cx="32" cy="14" r="0.8" fill="#38BDF8" opacity="0.4" />
</svg>
-->
