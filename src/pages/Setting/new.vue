<script setup lang="ts">
const programStore = useProgramStore()
const router = useRouter()

function create() {
  const id = programStore.createProgram()
  router.push(`/Setting/${id}`)
}
</script>

<template>
  <n-empty description="无存储配置" class="mt30vh">
    <template #extra>
      <n-button @click="create">
        创建存储
      </n-button>
    </template>
  </n-empty>
</template>
