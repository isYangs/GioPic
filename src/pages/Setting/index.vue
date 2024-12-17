<script setup lang="ts">
import { openCreateProgram } from '~/utils/modal'
</script>

<template>
  <div>
    <n-empty description="无存储配置" class="mt30vh">
      <template #extra>
        <n-button @click="openCreateProgram">
          创建存储
        </n-button>
      </template>
    </n-empty>
  </div>
</template>
