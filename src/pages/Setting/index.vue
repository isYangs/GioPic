<script setup lang="ts">
const showCreateProgram = ref(false)
</script>

<template>
  <div>
    <CreateProgram v-model="showCreateProgram" />
    <n-empty description="无存储配置" class="mt30vh">
      <template #extra>
        <n-button @click="showCreateProgram = true">
          创建存储
        </n-button>
      </template>
    </n-empty>
  </div>
</template>
