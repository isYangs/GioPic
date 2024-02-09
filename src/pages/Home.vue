<script setup lang="ts">
import { definePage } from 'vue-router/auto'

definePage({
  name: 'Home',
  path: '/',
})
</script>

<template>
  <h1>首页</h1>
</template>

<style scoped>
h1 {
  --uno: text-2xl;
}
</style>
