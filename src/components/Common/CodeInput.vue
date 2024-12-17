<script setup lang="ts">
defineProps<{
  type?: string
}>()
</script>

<template>
  <n-input :input-props="{ spellcheck: false, type }" class="font-mono" />
</template>
