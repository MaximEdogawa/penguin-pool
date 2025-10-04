<template>
  <div>
    <label for="memo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Memo (Optional)
    </label>
    <textarea
      id="memo"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement)?.value || '')"
      rows="3"
      placeholder="Add a note to this transaction..."
      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: string
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
  }

  defineProps<Props>()
  defineEmits<Emits>()
</script>
