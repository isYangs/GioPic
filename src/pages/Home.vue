<script setup lang="ts">
import { definePage } from 'vue-router/auto'

definePage({
  name: 'Home',
  path: '/',
})
</script>

<template>
  <div>
    <Upload />
  </div>
</template>

<style scoped>
</style>
