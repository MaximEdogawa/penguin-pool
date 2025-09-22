<template>
  <IOSWalletModal
    v-if="isIOS && isModalVisible"
    :is-visible="isModalVisible"
    :uri="modalUri"
    @close="closeModal"
  />
</template>

<script setup lang="ts">
  import { useIOSModal } from '../hooks/useIOSModal'
  import IOSWalletModal from './IOSWalletModal.vue'

  const { isModalVisible, modalUri, closeModal, isIOS } = useIOSModal()
</script>
