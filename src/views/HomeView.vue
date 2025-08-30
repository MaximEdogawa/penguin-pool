<script setup lang="ts">
  // Simple welcome component
</script>

<template>
  <main class="home-view">
    <div class="welcome-container">
      <h1 class="welcome-title">Welcome to Penguin Pool</h1>
      <p class="welcome-subtitle">Your decentralized lending platform on the Chia Network</p>
      <div class="welcome-features">
        <div class="feature">
          <i class="pi pi-shield text-2xl text-primary-500"></i>
          <h3>Secure</h3>
          <p>Built on blockchain technology for maximum security</p>
        </div>
        <div class="feature">
          <i class="pi pi-chart-line text-2xl text-primary-500"></i>
          <h3>Transparent</h3>
          <p>All transactions are visible on the blockchain</p>
        </div>
        <div class="feature">
          <i class="pi pi-globe text-2xl text-primary-500"></i>
          <h3>Decentralized</h3>
          <p>No central authority, powered by smart contracts</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
  .home-view {
    @apply min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800;
  }

  .welcome-container {
    @apply max-w-4xl mx-auto px-6 py-16 text-center;
  }

  .welcome-title {
    @apply text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6;
  }

  .welcome-subtitle {
    @apply text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12;
  }

  .welcome-features {
    @apply grid grid-cols-1 md:grid-cols-3 gap-8;
  }

  .feature {
    @apply bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700;
  }

  .feature h3 {
    @apply text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2;
  }

  .feature p {
    @apply text-gray-600 dark:text-gray-400;
  }
</style>
