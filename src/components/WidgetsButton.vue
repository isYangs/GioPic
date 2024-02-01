<script setup lang="ts">
defineProps<{ ic: string }>()
</script>

<template>
  <n-button ghost block class="my2 max-w10 min-h10 rounded-2 text-white">
    <div class="min-h5 min-w5" :class="ic" />
  </n-button>
</template>

<style scoped>
:deep(.n-button__content) {
  --uno: flex-center flex-wrap min-w-none;
}
</style>
