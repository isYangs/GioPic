<script setup lang="ts">
defineProps<{ ic: string }>()
</script>

<template>
  <n-button ghost block class="my2 max-w10 min-h10 text-white rounded-2">
    <div class="min-w5 min-h5" :class="ic" />
  </n-button>
</template>

<style scoped>
:deep(.n-button__content) {
  @apply flex-center flex-wrap min-w-none;
}
</style>
